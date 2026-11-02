<script lang="ts">
	import { attempt } from '#lib/helpers/attempt.ts';
	import {
		balances,
		categories,
		createSampleBudget,
		editPlan,
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
			if (mode === 'edit' && selected !== null) return editPlan(budget, selected, input);
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
					? 'Plan updated in sample data.'
					: 'Added to sample data.';
		resetForm();
	}
</script>

<div class="prototype">
	<header>
		<div class="brand">MINISTRY / STEWARDSHIP</div>
		<span class="badge">Sample data only</span>
	</header>
	<main>
		<div class="intro">
			<div>
				<p class="eyebrow">WORKFLOW PROTOTYPE</p>
				<h1>A little clarity for<br />every ministry dollar.</h1>
				<p>Plan thoughtfully. Record simply. See what’s available.</p>
			</div>
			<div class="sample-note">
				<strong>Try it freely.</strong>
				<p>
					Fictional USD data · Calendar year 2026.<br />Changes stay in this page only. Refreshing
					discards them.
				</p>
				<button
					class="secondary"
					onclick={() => {
						budget = createSampleBudget();
						resetForm();
						notice = 'Sample data reset.';
					}}>Reset sample data</button
				>
			</div>
		</div>
		<section aria-label="Annual budget summary" class="summary">
			<article>
				<p>Annual budget · 2026</p>
				<strong>{money(budget.annual)}</strong><small>Actual spending {money(totals.actual)}</small>
			</article>
			<article class="highlight">
				<p>Available to spend</p>
				<strong data-testid="available">{money(totals.available)}</strong><small
					>Budget − actual − committed</small
				>
			</article>
			<article>
				<p>Projected balance</p>
				<strong>{money(totals.projected)}</strong><small
					>Available − expected {money(totals.expected)}</small
				>
			</article>
		</section>
		<div class="workspace">
			<section class="panel entry">
				<p class="eyebrow">
					{mode === 'settle' ? 'TURN A PLAN INTO A PURCHASE' : 'KEEP THE DETAILS SIMPLE'}
				</p>
				<h2 id="entry-title" tabindex="-1">
					{mode === 'settle'
						? 'Settle a plan'
						: mode === 'edit'
							? 'Edit a plan'
							: 'Add a purchase or plan'}
				</h2>
				<form onsubmit={save}>
					{#if mode !== 'settle'}<label
							>Record type<select bind:value={kind}
								><option value="actual" disabled={mode === 'edit'}>Actual purchase</option><option
									value="expected">Expected · tentative</option
								><option value="committed">Committed · agreed or ordered</option></select
							></label
						>{:else}<p>
							Actual purchase · review final details below. The original plan will close.
						</p>{/if}
					<label
						>Description<input
							required
							bind:value={description}
							placeholder="What is this for?"
						/></label
					>
					<div class="pair">
						<label
							>Total (USD)<input
								required
								inputmode="decimal"
								bind:value={amount}
								placeholder="0.00"
							/></label
						><label
							>{kind === 'actual' ? 'Purchase date' : 'Anticipated date'}<input
								required
								type="date"
								min="2026-01-01"
								max="2026-12-31"
								bind:value={date}
							/></label
						>
					</div>
					<fieldset>
						<legend>Category allocations</legend>
						{#each rows as row, i (row)}<div class="allocation">
								<label
									>Category {i + 1}<select bind:value={row.category}
										>{#each categories as category (category)}<option>{category}</option
											>{/each}</select
									></label
								>{#if rows.length > 1}<label
										>Amount {i + 1} (USD)<input
											required
											inputmode="decimal"
											bind:value={row.amount}
										/></label
									><button
										class="secondary"
										type="button"
										aria-label={`Remove category ${i + 1}`}
										onclick={() => (rows = rows.filter((_, index) => index !== i))}>Remove</button
									>{/if}
							</div>{/each}
						<button
							class="text-button"
							type="button"
							onclick={() => {
								if (rows.length === 1) rows[0].amount = amount;
								rows = [...rows, { category: categories[0], amount: '' }];
							}}>+ Split across categories</button
						><small>Split amounts must equal the total.</small>
					</fieldset>
					{#if mode === 'settle'}
						<label class="check"
							><input type="checkbox" bind:checked={keep} />Keep a planned remainder</label
						>
						{#if keep}<fieldset>
								<legend>Review the remaining plan</legend>
								<p>
									The remainder keeps the original plan’s expected or committed status. Enter its
									amount and allocations explicitly.
								</p>
								<label
									>Remaining total (USD)<input
										required
										inputmode="decimal"
										bind:value={remaining}
									/></label
								>
								{#each remainingRows as row, i (row)}<div class="allocation">
										<label
											>Remaining category {i + 1}<select bind:value={row.category}
												>{#each categories as category (category)}<option>{category}</option
													>{/each}</select
											></label
										>{#if remainingRows.length > 1}<label
												>Remaining amount {i + 1} (USD)<input
													required
													inputmode="decimal"
													bind:value={row.amount}
												/></label
											><button
												type="button"
												class="secondary"
												onclick={() =>
													(remainingRows = remainingRows.filter((_, index) => index !== i))}
												>Remove</button
											>{/if}
									</div>{/each}
								<button
									class="text-button"
									type="button"
									onclick={() => {
										if (remainingRows.length === 1) remainingRows[0].amount = remaining;
										remainingRows = [...remainingRows, { category: categories[0], amount: '' }];
									}}>+ Split remaining amount</button
								>
							</fieldset>{/if}
					{/if}
					{#if error}<p role="alert" class="error">{error}</p>{/if}
					<div class="actions">
						<button type="submit"
							>{mode === 'settle'
								? 'Record settlement'
								: mode === 'edit'
									? 'Update plan'
									: kind === 'actual'
										? 'Add purchase'
										: 'Add plan'}</button
						>{#if mode !== 'add'}<button type="button" class="secondary" onclick={resetForm}
								>Cancel</button
							>{/if}
					</div>
				</form>
				<p role="status" aria-live="polite">{notice}</p>
			</section>
			<section class="panel">
				<div class="section-title">
					<div>
						<p class="eyebrow">ACTUALS & WHAT’S AHEAD</p>
						<h2>Purchases & plans</h2>
					</div>
					<span>{budget.purchases.length} records</span>
				</div>
				<p>Committed {money(totals.committed)} · Expected {money(totals.expected)}</p>
				{#each budget.purchases as purchase (purchase.id)}<article class="record">
						<div class="record-heading">
							<span class="badge {purchase.kind}">{purchase.kind}</span><strong
								>{money(purchase.amount)}</strong
							>
						</div>
						<h3>{purchase.description}</h3>
						<p>
							{purchase.date} · {purchase.allocations
								.map((a) => `${a.category} ${money(a.amount)}`)
								.join(' / ')}
						</p>
						{#if purchase.kind !== 'actual'}<div class="actions">
								<button
									class="secondary"
									aria-label={`Edit ${purchase.description}`}
									onclick={() => open(purchase, 'edit')}>Edit plan</button
								><button
									class="secondary"
									aria-label={`Settle ${purchase.description}`}
									onclick={() => open(purchase, 'settle')}>Settle as actual</button
								>
							</div>{/if}
						<details>
							<summary>Details & history</summary>
							<p>Original amount / estimate: {money(purchase.originalEstimate)}</p>
							{#each purchase.history as revision, index (index)}<p>{revision}</p>{:else}<p>
									No revisions yet.
								</p>{/each}
						</details>
					</article>{/each}
			</section>
		</div>
		<section class="panel category-review">
			<p class="eyebrow">ANNUAL CATEGORY REVIEW · 2026</p>
			<h2>Where the money goes</h2>
			<p>Spending and outstanding plans, without category budget limits.</p>
			<div class="category-grid">
				{#each categories as category (category)}{@const entries = budget.purchases.flatMap((p) =>
						p.allocations
							.filter((a) => a.category === category)
							.map((a) => ({ ...a, kind: p.kind }))
					)}{#if entries.length}<article>
							<h3>{category}</h3>
							{#each ['actual', 'committed', 'expected'] as status (status)}<p>
									{status}<strong
										>{money(
											entries.filter((e) => e.kind === status).reduce((sum, e) => sum + e.amount, 0)
										)}</strong
									>
								</p>{/each}
						</article>{/if}{/each}
			</div>
		</section>
		<footer>Prototype for owner testing · No production records are saved.</footer>
	</main>
</div>

<style>
	:global(body) {
		background: #f5f6f2;
		color: #203e35;
	}
	.prototype {
		max-width: 1400px;
		margin: auto;
		padding: 0 4vw;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26px 0;
		border-bottom: 1px solid #d9e0d7;
		gap: 12px;
	}
	.brand,
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
	}
	.badge {
		font-size: 0.73rem;
		background: #e7ecdf;
		border-radius: 20px;
		padding: 5px 10px;
		white-space: nowrap;
	}
	.intro {
		display: flex;
		justify-content: space-between;
		gap: 30px;
		margin: 48px 0 32px;
	}
	h1 {
		font-size: clamp(2rem, 4vw, 3.4rem);
		line-height: 1.12;
		letter-spacing: -0.045em;
		margin: 10px 0 20px;
	}
	p {
		font-size: 0.9rem;
		line-height: 1.6;
		color: #52665d;
	}
	.sample-note {
		max-width: 330px;
		padding-top: 20px;
	}
	.summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
		margin-bottom: 28px;
	}
	.summary article,
	.panel {
		background: white;
		border: 1px solid #dbe2d8;
		border-radius: 16px;
		padding: 24px;
	}
	.summary p {
		margin: 0 0 12px;
	}
	.summary strong {
		display: block;
		font-size: 2rem;
		letter-spacing: -0.04em;
	}
	.summary small {
		display: block;
		margin-top: 14px;
	}
	.summary .highlight {
		background: #234b3c;
		color: white;
	}
	.highlight p,
	.highlight small {
		color: #d5e4d8;
	}
	small {
		font-size: 0.76rem;
		color: #67776d;
	}
	.workspace {
		display: grid;
		grid-template-columns: 1fr 1.15fr;
		gap: 24px;
		align-items: start;
	}
	h2 {
		font-size: 1.3rem;
		letter-spacing: -0.025em;
		margin: 8px 0 20px;
	}
	h3 {
		font-size: 1rem;
		font-weight: 650;
		margin: 10px 0 4px;
	}
	form,
	label {
		display: grid;
		gap: 7px;
	}
	form {
		gap: 18px;
	}
	label {
		font-size: 0.8rem;
		font-weight: 600;
	}
	input,
	select {
		width: 100%;
		min-width: 0;
		border: 1px solid #cbd6ca;
		border-radius: 7px;
		background: #fff;
		padding: 10px;
		color: #203e35;
		font-size: 0.9rem;
	}
	input:focus,
	select:focus {
		outline: 2px solid #6b8a62;
		outline-offset: 2px;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	button {
		background: #284d3c;
		color: white;
		border-radius: 7px;
		padding: 10px 15px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
	}
	button:hover {
		filter: brightness(0.94);
	}
	button:focus-visible {
		outline: 3px solid #92a26c;
		outline-offset: 2px;
	}
	.secondary {
		background: #f0f3eb;
		color: #284d3c;
		border: 1px solid #d5ddcf;
	}
	.text-button {
		background: transparent;
		color: #365c43;
		padding: 10px 0;
		text-align: left;
	}
	fieldset {
		border: 1px solid #dbe2d8;
		border-radius: 9px;
		padding: 14px;
		min-width: 0;
	}
	legend {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0 5px;
	}
	.allocation {
		display: flex;
		gap: 8px;
		align-items: end;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}
	.allocation label {
		flex: 1;
		min-width: 100px;
	}
	.allocation label:first-child {
		flex: 2;
	}
	fieldset small {
		display: block;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.check input {
		width: 18px;
		height: 18px;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.error {
		background: #fff0e9;
		color: #8c3221;
		padding: 12px;
		border-radius: 7px;
	}
	.section-title,
	.record-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.section-title span {
		font-size: 0.76rem;
	}
	.record {
		border-top: 1px solid #e0e6dc;
		padding: 20px 0;
	}
	.record p {
		font-size: 0.8rem;
	}
	.record .actions {
		margin: 12px 0;
	}
	details {
		font-size: 0.75rem;
		color: #5b6d60;
		margin-top: 12px;
	}
	summary {
		cursor: pointer;
	}
	.actual {
		background: #e5efe8;
	}
	.expected {
		background: #f8efd7;
	}
	.committed {
		background: #e6eaf5;
	}
	.category-review {
		margin-top: 24px;
	}
	.category-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}
	.category-grid article {
		border-top: 1px solid #dbe2d8;
		padding-top: 8px;
	}
	.category-grid p {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin: 6px 0;
	}
	footer {
		padding: 30px 0;
		font-size: 0.75rem;
		color: #67776d;
	}
	@media (max-width: 760px) {
		.intro {
			display: block;
			margin: 28px 0;
		}
		.sample-note {
			max-width: none;
		}
		.summary {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.summary article {
			padding: 18px;
		}
		.workspace {
			grid-template-columns: 1fr;
		}
		.panel {
			padding: 18px;
		}
		.category-grid {
			grid-template-columns: 1fr;
		}
		.pair {
			grid-template-columns: 1fr;
		}
		.brand {
			font-size: 0.6rem;
		}
		.record-heading strong {
			font-size: 1.15rem;
		}
	}
</style>
