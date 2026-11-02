## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: prettier, tailwindcss, vitest, eslint, playwright, experimental

---

## Agent skills

### Issue tracker

Issues live in local Markdown under `.scratch/`. Before reading or writing tickets, read `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage roles. Before triaging, read `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context layout. Before exploring the codebase, read `docs/agents/domain.md`.

## Architecture

**SvelteKit 2 + Svelte 5** full-stack app. Uses Svelte 5 runes (`$state`, `$derived`, `$effect`) — not legacy stores syntax.

### Remote Functions (Server RPC)

Files in `/src/lib/remote-functions/*.remote.ts` use the experimental SvelteKit Remote Functions feature. These run server-side only and are called from components like regular functions. Enabled in `svelte.config.js` under `experimental.remoteFunctions`.

### Component Structure

- `/src/lib/components/ui/` — shadcn-svelte base components (Bits UI based)
- `/src/lib/components/app/` — domain-specific components (sidebar, page wrappers, data tables)

## Feature Pattern

Every feature is built from the same four layers. Follow them in order when you add a page; the worked example below shows each one for a made-up `widgets` feature.

1. **Remote functions** fetch and mutate data on the server and return `{ data, error }`.
2. **A thin route page** (`+page.svelte`) wraps the feature in a `<svelte:boundary>` that owns loading and error UI.
3. **A page component** (`_components/<feature>-page.svelte`) `await`s the remote functions at the top level and seeds a store.
4. **A store** (`_store/<feature>.svelte.ts`) holds the page's state; child components read and bind to it through context.

Route `load` functions are reserved for the auth layout. Page data flows through remote functions and stores, which keeps `+page.svelte` files free of data plumbing.

Both experimental flags in `svelte.config.js` are required: `kit.experimental.remoteFunctions` (remote functions) and `compilerOptions.experimental.async` (top-level `await` in components, which drives the boundary's `pending` state).

### File layout

```
src/lib/
  remote-functions/widgets.remote.ts      # all server calls for the domain
  types/widget.ts                         # Widget type + createDefaultWidget()
  stores/                                 # app-wide stores only (user, tokens, customer)
src/routes/(authenticated)/widgets/
  +page.svelte                            # list: header + boundary
  _components/widgets-page.svelte         # list: awaits getWidgets, renders table
  _components/a-component-used-in-the-page.svelte
  [id]/
    +page.svelte                          # detail: boundary only
    _store/widget.svelte.ts               # route-scoped store
    _components/widget-details-page.svelte # awaits data, creates + seeds store, saves
    _components/widget-information.svelte  # a section that binds to the store
```

The `_` prefix marks folders that are private to the route.

### 1. Remote functions

One `<domain>.remote.ts` per domain in `src/lib/remote-functions/`. Each export follows the same shape:

- A valibot schema plus `v.InferOutput` type, declared directly above the function.
- `query` for reads, `command` for mutations called from code, `form` for mutations bound to a `<form>` (see `sign-in.remote.ts` / `login-form.svelte` for `.enhance` and `.fields`).
- The body is wrapped in `attempt()` from `$lib/helpers/try`, so it always resolves to `{ data, error }` and never throws across the wire. Inside `attempt`, `throw` freely; the throw becomes `error`.
- Auth and tenant come from other remote queries (`getSession`, `getIdToken` in `session-info.remote.ts`, `getCustomerToken` in `customers.remote.ts`), which read cookies via `getRequestEvent()`. `customerId` is an optional param that defaults to the customer token.

```ts
// src/lib/remote-functions/widgets.remote.ts
import * as v from 'valibot';
import { env } from '$env/dynamic/public';
import { command, query } from '$app/server';
import { attempt } from '$lib/helpers/try';
import { createCommonHeaders } from '$lib/helpers/headers';
import { getIdToken } from './session-info.remote';
import { getCustomerToken } from './customers.remote';
import type { Widget } from '$lib/types/widget';

const URL_BASE = `${env.PUBLIC_APP_API}`;

// Get Widget
const GetWidgetParamsSchema = v.object({
	customerId: v.optional(v.pipe(v.string(), v.nonEmpty())),
	widgetId: v.pipe(v.string(), v.nonEmpty())
});

type GetWidgetParams = v.InferOutput<typeof GetWidgetParamsSchema>;

export const getWidget = query(GetWidgetParamsSchema, (params: GetWidgetParams) => {
	return attempt(async () => {
		const idToken = await getIdToken();
		if (!idToken) throw new Error('No id token found');

		let customerId = params.customerId;
		if (!customerId) {
			const { data: customer } = await getCustomerToken();
			if (!customer) throw new Error('No customer token found');
			customerId = customer.customer_id;
		}

		const response = await fetch(`${URL_BASE}/widgets/${params.widgetId}?cstid=${customerId}`, {
			headers: {
				'Content-Type': 'application/json',
				access_token: idToken,
				...createCommonHeaders()
			}
		});
		if (!response.ok) throw new Error('Failed to fetch widget');

		return (await response.json()) as Widget;
	});
});

// Update Widget
const UpdateWidgetParamsSchema = v.object({
	widgetId: v.pipe(v.string(), v.nonEmpty()),
	body: v.string()
});

type UpdateWidgetParams = v.InferOutput<typeof UpdateWidgetParamsSchema>;

export const updateWidget = command(UpdateWidgetParamsSchema, (params: UpdateWidgetParams) => {
	return attempt(async () => {
		// same auth/customer resolution as above, then PUT params.body
	});
});
```

### 2. Route page + boundary

`+page.svelte` contains no data logic. It renders the page header (list pages) and a `<svelte:boundary>` around the page component, with a skeleton for `pending` and a retry for `failed`:

```svelte
<!-- src/routes/(authenticated)/widgets/[id]/+page.svelte -->
<script lang="ts">
	import ConfigSkeleton from '$lib/components/app/config-skeleton.svelte';
	import { Button } from '$lib/components/ui/button';
	import WidgetDetailsPage from './_components/widget-details-page.svelte';
</script>

<svelte:boundary>
	<WidgetDetailsPage />

	{#snippet pending()}
		<ConfigSkeleton />
	{/snippet}

	{#snippet failed(error, reset)}
		<div class="flex flex-col items-center justify-center gap-2">
			<p class="text-red-500">Something went wrong: {(error as Error)?.message}</p>
			<Button class="w-fit" onclick={reset}>Try again</Button>
		</div>
	{/snippet}
</svelte:boundary>
```

The boundary only catches what its _children_ await or throw, which is why the `await` lives in a separate page component rather than in `+page.svelte`. Use `TableSkeleton` for list pages and `ConfigSkeleton` for detail pages.

### 3. Page component

The page component awaits remote functions at the top level of `<script>`. While they resolve, the boundary shows `pending`; rethrowing an `error` sends it to `failed`. Fetch independent data in parallel with `Promise.all`.

```svelte
<!-- src/routes/(authenticated)/widgets/[id]/_components/widget-details-page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { getFilters } from '$lib/remote-functions/filters.remote';
	import { getWidget, updateWidget } from '$lib/remote-functions/widgets.remote';
	import { setWidgetStoreContext } from '../_store/widget.svelte';
	import WidgetInformation from './widget-information.svelte';

	// setContext must run before the first await
	const widgetStore = setWidgetStoreContext();

	const [{ data: widget, error: widgetError }, { data: filters, error: filtersError }] =
		await Promise.all([getWidget({ widgetId: page.params.id || '' }), getFilters({})]);
	if (widgetError || filtersError) throw new Error(widgetError || filtersError);

	widgetStore.setWidget(widget);
	widgetStore.setFilters(filters);

	let saving = $state(false);

	async function handleSave() {
		saving = true;
		const { error } = await updateWidget({
			widgetId: widgetStore.id || '',
			body: JSON.stringify(widgetStore.widget)
		});
		saving = false;
		if (error) toast.error('Failed to save widget');
		else toast.success('Widget saved');
	}
</script>

<Button onclick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
<div class="grid gap-5">
	<WidgetInformation />
</div>
```

`attempt` turns errors into strings so they survive serialization; wrap them in `new Error(...)` before throwing so the `failed` snippet's `error.message` is populated.

List pages are the same minus the store: `const { data, error } = await getWidgets({}); if (error) throw new Error(error);` then render an empty state or the data table.

### 4. Stores

A store is a class in a `*.svelte.ts` file with three sections, plus a pair of context helpers:

- **State**: `$state` fields, initialised from a `createDefault<Type>()` factory in `$lib/types` so children never see `undefined`.
- **Derived**: `$derived` fields for anything computed from state (ids, names, the selected item in a list).
- **Methods**: `set<Field>()` setters and any domain mutations that touch several fields.
- `set<Name>StoreContext()` creates the instance and calls `setContext`; `get<Name>StoreContext()` reads it. The context key is a `Symbol`, so two stores can never collide.

```ts
// src/routes/(authenticated)/widgets/[id]/_store/widget.svelte.ts
import { getContext, setContext } from 'svelte';
import type { FilterType } from '$lib/types/filter';
import { createDefaultWidget, type Widget } from '$lib/types/widget';

const DEFAULT_KEY = Symbol('widget-store');

export class WidgetStore {
	// State
	widget = $state<Widget>(createDefaultWidget());
	filters = $state<FilterType[]>([]);

	// Derived
	id = $derived(this.widget?.id);
	name = $derived(this.widget?.name);
	selectedFilter = $derived(this.filters.find((f) => f.id === this.widget.filter_id));

	// Methods
	setWidget(widget: Widget) {
		this.widget = widget;
	}

	setFilters(filters: FilterType[]) {
		this.filters = filters;
	}
}

export function getWidgetStoreContext(key = DEFAULT_KEY) {
	return getContext<WidgetStore>(key);
}

export function setWidgetStoreContext(key = DEFAULT_KEY) {
	return setContext(key, new WidgetStore());
}
```

Child sections take no props. They get the store from context and bind straight to its state, so the page component's save handler always sends the latest edits:

```svelte
<!-- src/routes/(authenticated)/widgets/[id]/_components/widget-information.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { getWidgetStoreContext } from '../_store/widget.svelte';

	const widgetStore = getWidgetStoreContext();
</script>

<Input bind:value={widgetStore.widget.name} />
```

**Where a store lives** depends on its scope:

- **Route-scoped** (`[id]/_store/`): created by that route's page component, as above. One per editable entity page.
- **App-wide** (`src/lib/stores/`: `UserStore`, `TokenStore`, `CustomerStore`): created in `(authenticated)/+layout.svelte` and seeded from `(authenticated)/+layout.server.ts`, which reads the session, tokens and customer token. Any component under the layout reads them with `getUserStoreContext()` etc.

## Key Config

- **TypeScript**: strict mode, `moduleResolution: bundler`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **Prettier**: tabs, single quotes, no trailing commas, print width 100
- **ESLint 9** flat config with TypeScript + Svelte rules
- **Adapter**: `@sveltejs/adapter-auto`
