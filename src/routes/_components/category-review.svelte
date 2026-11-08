<script lang="ts">
	import { categoryStyle } from '#lib/helpers/category-color.ts';
	import { formatMoney } from '#lib/helpers/money.ts';
	import { categories, type Purchase } from '#lib/prototype/budget.ts';

	let { purchases }: { purchases: Purchase[] } = $props();

	const statuses = [
		{ kind: 'actual', label: 'Actual', tone: 'bg-category', legend: 'bg-foreground' },
		{ kind: 'committed', label: 'Committed', tone: 'bg-category/55', legend: 'bg-foreground/55' },
		{ kind: 'expected', label: 'Expected', tone: 'bg-category/25', legend: 'bg-foreground/25' }
	] as const;

	const rows = $derived.by(() => {
		const totals = categories.map((category) => {
			const byKind = { actual: 0, committed: 0, expected: 0 };
			for (const purchase of purchases)
				for (const allocation of purchase.allocations)
					if (allocation.category === category) byKind[purchase.kind] += allocation.amount;
			return { category, byKind, total: byKind.actual + byKind.committed + byKind.expected };
		});
		return totals.filter((row) => row.total > 0).sort((a, b) => b.total - a.total);
	});
	const largest = $derived(Math.max(1, ...rows.map((row) => row.total)));
</script>

{#if rows.length}
	<div class="flex flex-col gap-5">
		<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
			{#each statuses as status (status.kind)}
				<li class="flex items-center gap-1.5">
					<span class={['size-2.5 rounded-full', status.legend]}></span>{status.label}
				</li>
			{/each}
		</ul>
		<ul class="flex flex-col gap-4">
			{#each rows as row (row.category)}
				<li class="flex flex-col gap-1.5 category-tone" style={categoryStyle(row.category)}>
					<div class="flex items-center justify-between gap-3 text-sm">
						<h3 class="flex min-w-0 items-center gap-2 font-medium">
							<span class="size-2.5 shrink-0 rounded-full bg-category"></span>
							<span class="truncate">{row.category}</span>
						</h3>
						<strong class="tabular-nums">{formatMoney(row.total)}</strong>
					</div>
					<div
						class="flex h-2 overflow-hidden rounded-full bg-muted"
						role="img"
						aria-label={statuses
							.map((s) => `${s.label} ${formatMoney(row.byKind[s.kind])}`)
							.join(', ')}
					>
						{#each statuses as status (status.kind)}
							<div
								class={status.tone}
								style:width={`${(row.byKind[status.kind] / largest) * 100}%`}
							></div>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground tabular-nums">
						{statuses.map((s) => `${s.label} ${formatMoney(row.byKind[s.kind])}`).join(' · ')}
					</p>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="text-sm text-muted-foreground">No category spending or plans yet.</p>
{/if}
