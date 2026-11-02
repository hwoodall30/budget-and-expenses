<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { PurchaseAllocationRows } from '#lib/components/app/purchase-allocations/index.js';

	import { attempt } from '#lib/helpers/attempt.ts';
	import {
		balances,
		categories,
		createSampleBudget,
		editPurchase,
		deletePurchase,
		recordPurchase,
		settlePlan,
		type Allocation,
		type Purchase,
		type PurchaseInput
	} from '#lib/prototype/budget.ts';
	let budget = $state(createSampleBudget());
	const totals = $derived(balances(budget));
	const money = (cents: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
	const today = () => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	};
	let description = $state('');
	let date = $state(today());
	let amount = $state('');
	let kind = $state<PurchaseInput['kind']>('actual');
	let rows = $state([{ category: categories[0], amount: '' }]);
	let mode = $state<'add' | 'edit' | 'settle'>('add');
	let selected = $state<number | null>(null);
	let keep = $state(false);
	let remaining = $state('');
	let remainingRows = $state([{ category: categories[0], amount: '' }]);
	let error = $state('');
	let notice = $state('');
	const editingActual = $derived(
		mode === 'edit' && budget.purchases.find((p) => p.id === selected)?.kind === 'actual'
	);
	function cents(value: string) {
		if (!/^\d+(\.\d{1,2})?$/.test(value))
			throw new Error('Enter positive USD amounts with at most two decimal places.');
		const [whole, fraction = ''] = value.split('.');
		return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
	}
	function allocations(items: typeof rows, total: string): Allocation[] {
		return items.map((r) => ({
			category: r.category,
			amount: cents(items.length === 1 ? total : r.amount)
		}));
	}
	function splitRows(items: typeof rows, total: string) {
		const existing = items.length === 1 ? [{ ...items[0], amount: total }] : items;
		return [...existing, { category: categories[0], amount: '' }];
	}

	function resetForm() {
		description = '';
		date = today();
		amount = '';
		kind = 'actual';
		rows = [{ category: categories[0], amount: '' }];
		mode = 'add';
		selected = null;
		keep = false;
		remaining = '';
		error = '';
	}
	function open(plan: Purchase, next: 'edit' | 'settle') {
		selected = plan.id;
		mode = next;
		description = plan.description;
		date = plan.date;
		amount = (plan.amount / 100).toFixed(2);
		kind = next === 'settle' ? 'actual' : plan.kind;
		rows = plan.allocations.map((a) => ({
			category: a.category,
			amount: (a.amount / 100).toFixed(2)
		}));
		keep = false;
		remaining = '';
		remainingRows = plan.allocations.map((a) => ({ category: a.category, amount: '' }));
		error = '';
		notice = '';
		document.getElementById('entry-title')?.focus();
	}
	function save(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		notice = '';
		const result = attempt<string, typeof budget>(() => {
			const input: PurchaseInput = {
				description: description.trim(),
				date,
				amount: cents(amount),
				kind,
				allocations: allocations(rows, amount)
			};
			if (mode === 'edit' && selected !== null) return editPurchase(budget, selected, input);
			if (mode === 'settle' && selected !== null)
				return settlePlan(
					budget,
					selected,
					input,
					keep
						? { amount: cents(remaining), allocations: allocations(remainingRows, remaining) }
						: undefined
				);
			return recordPurchase(budget, input);
		});
		if (result.error !== null) {
			error = result.error;
			return;
		}
		budget = result.data;
		notice =
			mode === 'settle'
				? 'Settlement recorded in sample data.'
				: mode === 'edit'
					? kind === 'actual'
						? 'Purchase updated in sample data.'
						: 'Plan updated in sample data.'
					: 'Added to sample data.';
		resetForm();
	}

	function remove(id: number) {
		const result = attempt<string, typeof budget>(() => deletePurchase(budget, id));
		if (result.error !== null) {
			error = result.error;
			return;
		}
		budget = result.data;
		if (selected === id) resetForm();
		notice = 'Deleted from sample data.';
	}
</script>

<div class="mx-auto max-w-7xl px-4 sm:px-8">
	<header class="flex flex-wrap items-center justify-between gap-3 border-b py-6">
		<p class="text-xs font-semibold tracking-widest">MINISTRY / STEWARDSHIP</p>
		<Badge variant="secondary">Sample data only</Badge>
	</header>
	<main class="flex flex-col gap-6 py-8 sm:py-12">
		<div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
			<div class="flex flex-col gap-4">
				<p class="text-xs font-semibold tracking-widest text-muted-foreground">
					WORKFLOW PROTOTYPE
				</p>
				<h1 class="text-3xl font-semibold tracking-tight sm:text-5xl">
					A little clarity for<br />every ministry dollar.
				</h1>
				<p class="text-muted-foreground">Plan thoughtfully. Record simply. See what’s available.</p>
			</div>
			<Card.Root class="md:max-w-sm">
				<Card.Header
					><Card.Title>Try it freely.</Card.Title><Card.Description
						>Fictional USD data · Calendar year 2026. Changes stay in this page only. Refreshing
						discards them.</Card.Description
					></Card.Header
				>
				<Card.Footer
					><Button
						variant="outline"
						onclick={() => {
							budget = createSampleBudget();
							resetForm();
							notice = 'Sample data reset.';
						}}>Reset sample data</Button
					></Card.Footer
				>
			</Card.Root>
		</div>
		<section aria-label="Annual budget summary" class="grid gap-4 md:grid-cols-3">
			<Card.Root
				><Card.Header><Card.Description>Annual budget · 2026</Card.Description></Card.Header
				><Card.Content
					><strong class="text-3xl tracking-tight">{money(budget.annual)}</strong></Card.Content
				><Card.Footer
					><p class="text-sm text-muted-foreground">
						Actual spending {money(totals.actual)}
					</p></Card.Footer
				></Card.Root
			>
			<Card.Root
				><Card.Header><Card.Description>Available to spend</Card.Description></Card.Header
				><Card.Content
					><strong class="text-3xl tracking-tight" data-testid="available"
						>{money(totals.available)}</strong
					></Card.Content
				><Card.Footer
					><p class="text-sm text-muted-foreground">Budget − actual − committed</p></Card.Footer
				></Card.Root
			>
			<Card.Root
				><Card.Header><Card.Description>Projected balance</Card.Description></Card.Header
				><Card.Content
					><strong class="text-3xl tracking-tight">{money(totals.projected)}</strong></Card.Content
				><Card.Footer
					><p class="text-sm text-muted-foreground">
						Available − expected {money(totals.expected)}
					</p></Card.Footer
				></Card.Root
			>
		</section>
		<div class="grid items-start gap-6 lg:grid-cols-2">
			<Card.Root class="min-w-0">
				<Card.Header
					><Card.Description
						>{mode === 'settle'
							? 'TURN A PLAN INTO A PURCHASE'
							: 'KEEP THE DETAILS SIMPLE'}</Card.Description
					><Card.Title
						><h2 id="entry-title" tabindex="-1">
							{mode === 'settle'
								? 'Settle a plan'
								: mode === 'edit'
									? editingActual
										? 'Edit a purchase'
										: 'Edit a plan'
									: 'Add a purchase or plan'}
						</h2></Card.Title
					></Card.Header
				>
				<Card.Content>
					<form onsubmit={save}>
						<Field.FieldGroup>
							{#if mode !== 'settle' && !editingActual}
								<Field.Field>
									<Field.FieldLabel for="record-type">Record type</Field.FieldLabel>
									<NativeSelect.Root id="record-type" class="w-full" bind:value={kind}>
										<NativeSelect.Option value="actual" disabled={mode === 'edit'}
											>Actual purchase</NativeSelect.Option
										>
										<NativeSelect.Option value="expected">Expected · tentative</NativeSelect.Option>
										<NativeSelect.Option value="committed"
											>Committed · agreed or ordered</NativeSelect.Option
										>
									</NativeSelect.Root>
								</Field.Field>
							{:else}<Field.FieldDescription
									>{mode === 'settle'
										? 'Actual purchase · review final details below. The original plan will close.'
										: 'Edit the recorded purchase. It remains actual spending.'}</Field.FieldDescription
								>{/if}
							<Field.Field data-invalid={!!error}>
								<Field.FieldLabel for="description">Description</Field.FieldLabel>
								<Input
									id="description"
									required
									bind:value={description}
									placeholder="What is this for?"
									aria-invalid={!!error}
								/>
							</Field.Field>
							<Field.FieldGroup class="sm:flex-row">
								<Field.Field data-invalid={!!error}
									><Field.FieldLabel for="amount">Total (USD)</Field.FieldLabel><Input
										id="amount"
										required
										inputmode="decimal"
										bind:value={amount}
										placeholder="0.00"
										aria-invalid={!!error}
									/></Field.Field
								>
								<Field.Field data-invalid={!!error}
									><Field.FieldLabel for="date"
										>{kind === 'actual' ? 'Purchase date' : 'Anticipated date'}</Field.FieldLabel
									><Input
										id="date"
										required
										type="date"
										min="2026-01-01"
										max="2026-12-31"
										bind:value={date}
										aria-invalid={!!error}
									/></Field.Field
								>
							</Field.FieldGroup>
							<Field.FieldSet>
								<Field.FieldLegend variant="label">Category allocations</Field.FieldLegend>
								<PurchaseAllocationRows bind:rows invalid={!!error}>
									<Button
										class="self-start"
										variant="ghost"
										type="button"
										onclick={() => (rows = splitRows(rows, amount))}
										>+ Split across categories</Button
									>
								</PurchaseAllocationRows>
								<Field.FieldDescription>Split amounts must equal the total.</Field.FieldDescription>
							</Field.FieldSet>
							{#if mode === 'settle'}
								<Field.Field orientation="horizontal"
									><Checkbox id="keep-remainder" bind:checked={keep} /><Field.FieldLabel
										for="keep-remainder">Keep a planned remainder</Field.FieldLabel
									></Field.Field
								>
								{#if keep}
									<Field.FieldSet>
										<Field.FieldLegend>Review the remaining plan</Field.FieldLegend>
										<Field.FieldDescription
											>The remainder keeps the original plan’s expected or committed status. Enter
											its amount and allocations explicitly.</Field.FieldDescription
										>
										<Field.FieldGroup>
											<Field.Field data-invalid={!!error}
												><Field.FieldLabel for="remaining">Remaining total (USD)</Field.FieldLabel
												><Input
													id="remaining"
													required
													inputmode="decimal"
													bind:value={remaining}
													aria-invalid={!!error}
												/></Field.Field
											>
											<Field.FieldSet>
												<Field.FieldLegend variant="label">Remaining allocations</Field.FieldLegend>
												<PurchaseAllocationRows
													bind:rows={remainingRows}
													categoryLabel="Remaining category"
													amountLabel="Remaining amount"
													invalid={!!error}
												>
													<Button
														class="self-start"
														variant="ghost"
														type="button"
														onclick={() => (remainingRows = splitRows(remainingRows, remaining))}
														>+ Split remaining amount</Button
													>
												</PurchaseAllocationRows>
												<Field.FieldDescription
													>Remaining allocations must equal the remaining total.</Field.FieldDescription
												>
											</Field.FieldSet>
										</Field.FieldGroup>
									</Field.FieldSet>
								{/if}
							{/if}
							{#if error}<Alert.Root variant="destructive"
									><Alert.Title>Check this entry</Alert.Title><Alert.Description
										>{error}</Alert.Description
									></Alert.Root
								>{/if}
							<Field.Field orientation="horizontal" class="flex-wrap">
								<Button type="submit"
									>{mode === 'settle'
										? 'Record settlement'
										: mode === 'edit'
											? editingActual
												? 'Update purchase'
												: 'Update plan'
											: kind === 'actual'
												? 'Add purchase'
												: 'Add plan'}</Button
								>
								{#if mode !== 'add'}<Button type="button" variant="outline" onclick={resetForm}
										>Cancel</Button
									>{/if}
							</Field.Field>
						</Field.FieldGroup>
					</form>
				</Card.Content>
				<Card.Footer
					><p role="status" aria-live="polite" class="text-sm text-muted-foreground">
						{notice}
					</p></Card.Footer
				>
			</Card.Root>
			<Card.Root class="min-w-0">
				<Card.Header
					><Card.Description>ACTUALS & WHAT’S AHEAD</Card.Description><Card.Title
						><h2>Purchases & plans</h2></Card.Title
					><Card.Description
						>{budget.purchases.length} records · Committed {money(totals.committed)} · Expected {money(
							totals.expected
						)}</Card.Description
					></Card.Header
				>
				<Card.Content class="flex flex-col gap-4">
					{#each budget.purchases as purchase (purchase.id)}
						<Card.Root>
							<Card.Header
								><div class="flex items-center justify-between gap-3">
									<Badge
										variant={purchase.kind === 'actual'
											? 'default'
											: purchase.kind === 'committed'
												? 'secondary'
												: 'outline'}>{purchase.kind}</Badge
									><strong>{money(purchase.amount)}</strong>
								</div>
								<Card.Title><h3 class="break-words">{purchase.description}</h3></Card.Title
								><Card.Description
									>{purchase.date} · {purchase.allocations
										.map((a) => `${a.category} ${money(a.amount)}`)
										.join(' / ')}</Card.Description
								></Card.Header
							>
							<Card.Content
								><details class="text-sm text-muted-foreground">
									<summary class="cursor-pointer">Details & history</summary>
									<div class="mt-3 flex flex-col gap-2">
										<p>Original amount / estimate: {money(purchase.originalEstimate)}</p>
										{#each purchase.history as revision, index (index)}<p>{revision}</p>{:else}<p>
												No revisions yet.
											</p>{/each}
									</div>
								</details></Card.Content
							>
							<Card.Footer class="flex-wrap gap-2">
								<Button
									variant="outline"
									aria-label={`Edit ${purchase.description}`}
									onclick={() => open(purchase, 'edit')}
									>{purchase.kind === 'actual' ? 'Edit purchase' : 'Edit plan'}</Button
								>
								{#if purchase.kind !== 'actual'}<Button
										variant="outline"
										aria-label={`Settle ${purchase.description}`}
										onclick={() => open(purchase, 'settle')}>Settle as actual</Button
									>{/if}
								<Button
									variant="destructive"
									aria-label={`Delete ${purchase.description}`}
									onclick={() => remove(purchase.id)}>Delete</Button
								>
							</Card.Footer>
						</Card.Root>
					{:else}
						<Empty.Root
							><Empty.Header
								><Empty.Title>No purchases or plans</Empty.Title><Empty.Description
									>Add a purchase or plan using the entry form, or reset the sample data.</Empty.Description
								></Empty.Header
							></Empty.Root
						>
					{/each}
				</Card.Content>
			</Card.Root>
		</div>
		<Card.Root>
			<Card.Header
				><Card.Description>ANNUAL CATEGORY REVIEW · 2026</Card.Description><Card.Title
					><h2>Where the money goes</h2></Card.Title
				><Card.Description
					>Spending and outstanding plans, without category budget limits.</Card.Description
				></Card.Header
			>
			<Card.Content class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each categories as category (category)}
					{@const entries = budget.purchases.flatMap((p) =>
						p.allocations
							.filter((a) => a.category === category)
							.map((a) => ({ ...a, kind: p.kind }))
					)}
					{#if entries.length}<Card.Root
							><Card.Header><Card.Title><h3>{category}</h3></Card.Title></Card.Header><Card.Content
								class="flex flex-col gap-2"
								>{#each ['actual', 'committed', 'expected'] as status (status)}<p
										class="flex justify-between gap-2 text-sm"
									>
										<span class="text-muted-foreground">{status}</span><strong
											>{money(
												entries
													.filter((e) => e.kind === status)
													.reduce((sum, e) => sum + e.amount, 0)
											)}</strong
										>
									</p>{/each}</Card.Content
							></Card.Root
						>{/if}
				{/each}
				{#if !budget.purchases.length}<p class="text-sm text-muted-foreground">
						No category spending or plans yet.
					</p>{/if}
			</Card.Content>
		</Card.Root>
		<footer class="text-xs text-muted-foreground">
			Prototype for owner testing · No production records are saved.
		</footer>
	</main>
</div>
