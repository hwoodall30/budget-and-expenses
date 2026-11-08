<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Pagination from '#lib/components/ui/pagination/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { CategoryBadge } from '#lib/components/app/category-badge/index.js';
	import { formatMoney } from '#lib/helpers/money.ts';
	import type { Purchase } from '#lib/prototype/budget.ts';

	let {
		purchases,
		onedit,
		onsettle,
		ondelete
	}: {
		purchases: Purchase[];
		onedit: (purchase: Purchase) => void;
		onsettle: (purchase: Purchase) => void;
		ondelete: (purchase: Purchase) => void;
	} = $props();

	const pageSizes = [10, 25, 50];
	const kindVariant: Record<Purchase['kind'], BadgeVariant> = {
		actual: 'default',
		committed: 'secondary',
		expected: 'outline'
	};

	let query = $state('');
	let page = $state(1);
	let perPage = $state(10);
	let historyOpen = $state(false);
	let historyFor = $state<Purchase | null>(null);

	const sorted = $derived(
		[...purchases].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
	);
	const filtered = $derived.by(() => {
		const term = query.trim().toLowerCase();
		if (!term) return sorted;
		return sorted.filter(
			(p) =>
				p.description.toLowerCase().includes(term) ||
				p.kind.includes(term) ||
				p.allocations.some((a) => a.category.toLowerCase().includes(term))
		);
	});
	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));
	// Clamp so deleting the last row on the final page never strands the view on an empty page.
	const currentPage = $derived(Math.min(page, pageCount));
	const start = $derived((currentPage - 1) * perPage);
	const visible = $derived(filtered.slice(start, start + perPage));

	function showHistory(purchase: Purchase) {
		historyFor = purchase;
		historyOpen = true;
	}
</script>

<div class="flex flex-col gap-4">
	{#if purchases.length}
		<Field.FieldGroup class="gap-3 sm:flex-row sm:items-end sm:justify-between">
			<Field.Field class="sm:max-w-xs">
				<Field.FieldLabel for="purchase-search" class="sr-only">Search records</Field.FieldLabel>
				<InputGroup.Root>
					<InputGroup.Input
						id="purchase-search"
						type="search"
						placeholder="Search description, category, status"
						bind:value={query}
						oninput={() => (page = 1)}
					/>
					<InputGroup.Addon><SearchIcon /></InputGroup.Addon>
				</InputGroup.Root>
			</Field.Field>
			<Field.Field orientation="horizontal" class="w-auto">
				<Field.FieldLabel for="page-size" class="whitespace-nowrap">Rows per page</Field.FieldLabel>
				<NativeSelect.Root
					id="page-size"
					bind:value={() => String(perPage), (v) => ((perPage = Number(v)), (page = 1))}
				>
					{#each pageSizes as size (size)}
						<NativeSelect.Option value={String(size)}>{size}</NativeSelect.Option>
					{/each}
				</NativeSelect.Root>
			</Field.Field>
		</Field.FieldGroup>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Date</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head>Categories</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Amount</Table.Head>
					<Table.Head><span class="sr-only">Actions</span></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each visible as purchase (purchase.id)}
					<Table.Row>
						<Table.Cell class="text-muted-foreground tabular-nums">{purchase.date}</Table.Cell>
						<Table.Cell class="min-w-48 font-medium break-words whitespace-normal"
							>{purchase.description}</Table.Cell
						>
						<Table.Cell>
							<div class="flex flex-wrap gap-1">
								{#each purchase.allocations as allocation, i (i)}
									<CategoryBadge category={allocation.category}>
										{purchase.allocations.length > 1
											? `${allocation.category} · ${formatMoney(allocation.amount)}`
											: allocation.category}
									</CategoryBadge>
								{/each}
							</div>
						</Table.Cell>
						<Table.Cell
							><Badge variant={kindVariant[purchase.kind]}>{purchase.kind}</Badge></Table.Cell
						>
						<Table.Cell class="text-right font-medium tabular-nums"
							>{formatMoney(purchase.amount)}</Table.Cell
						>
						<Table.Cell class="text-right">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
									aria-label={`Actions for ${purchase.description}`}
								>
									<EllipsisIcon />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Group>
										<DropdownMenu.Item onSelect={() => onedit(purchase)}>
											<PencilIcon />
											{purchase.kind === 'actual' ? 'Edit purchase' : 'Edit plan'}
										</DropdownMenu.Item>
										{#if purchase.kind !== 'actual'}
											<DropdownMenu.Item onSelect={() => onsettle(purchase)}>
												<ReceiptIcon />
												Settle as actual
											</DropdownMenu.Item>
										{/if}
										<DropdownMenu.Item onSelect={() => showHistory(purchase)}>
											<HistoryIcon />
											Details & history
										</DropdownMenu.Item>
									</DropdownMenu.Group>
									<DropdownMenu.Separator />
									<DropdownMenu.Group>
										<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(purchase)}>
											<TrashIcon />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Group>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={6} class="h-24 text-center text-muted-foreground"
							>No records match “{query}”.</Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
			<p class="text-sm text-muted-foreground" aria-live="polite">
				{#if filtered.length}
					Showing {start + 1}–{Math.min(start + perPage, filtered.length)} of {filtered.length}
				{:else}
					No matching records
				{/if}
			</p>
			{#if pageCount > 1}
				<Pagination.Root
					count={filtered.length}
					{perPage}
					bind:page={() => currentPage, (v) => (page = v)}
					class="mx-0 w-auto"
				>
					{#snippet children({ pages, currentPage: active })}
						<Pagination.Content>
							<Pagination.Item><Pagination.Previous /></Pagination.Item>
							{#each pages as p (p.key)}
								{#if p.type === 'ellipsis'}
									<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link page={p} isActive={active === p.value}
											>{p.value}</Pagination.Link
										>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item><Pagination.Next /></Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			{/if}
		</div>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No purchases or plans</Empty.Title>
				<Empty.Description
					>Add a purchase or plan using the entry form, or reset the sample data.</Empty.Description
				>
			</Empty.Header>
		</Empty.Root>
	{/if}
</div>

<Dialog.Root bind:open={historyOpen}>
	<Dialog.Content>
		{#if historyFor}
			<Dialog.Header>
				<Dialog.Title>{historyFor.description}</Dialog.Title>
				<Dialog.Description>
					{historyFor.date} · {historyFor.kind} · {formatMoney(historyFor.amount)}
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex flex-col gap-3 text-sm">
				<div class="flex flex-wrap gap-1">
					{#each historyFor.allocations as allocation, i (i)}
						<CategoryBadge category={allocation.category}
							>{allocation.category} · {formatMoney(allocation.amount)}</CategoryBadge
						>
					{/each}
				</div>
				<p class="text-muted-foreground">
					Original amount / estimate: {formatMoney(historyFor.originalEstimate)}
				</p>
				<ol class="flex flex-col gap-2 text-muted-foreground">
					{#each historyFor.history as revision, index (index)}<li>{revision}</li>{:else}<li>
							No revisions yet.
						</li>{/each}
				</ol>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
