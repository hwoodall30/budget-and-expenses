<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { categories } from '#lib/prototype/budget.ts';
	import { cn } from '#lib/utils.js';
	type Row = { category: string; amount: string };
	let {
		rows = $bindable<Row[]>([]),
		categoryLabel = 'Category',
		amountLabel = 'Amount',
		invalid = false,
		children,
		class: className,
		...rest
	}: HTMLAttributes<HTMLDivElement> & {
		rows: Row[];
		categoryLabel?: string;
		amountLabel?: string;
		invalid?: boolean;
	} = $props();
	const id = $props.id();
</script>

<Field.FieldGroup class={cn('min-w-0', className)} {...rest}>
	{#each rows as row, i (row)}
		<Field.FieldGroup class="gap-3 sm:flex-row sm:items-end">
			<Field.Field data-invalid={invalid} class="min-w-0 sm:flex-2">
				<Field.FieldLabel for={`${id}-category-${i}`}>{categoryLabel} {i + 1}</Field.FieldLabel>
				<NativeSelect.Root
					id={`${id}-category-${i}`}
					class="w-full"
					bind:value={row.category}
					aria-invalid={invalid}
				>
					{#each categories as category (category)}<NativeSelect.Option value={category}
							>{category}</NativeSelect.Option
						>{/each}
				</NativeSelect.Root>
			</Field.Field>
			{#if rows.length > 1}
				<Field.Field data-invalid={invalid} class="min-w-0 sm:flex-1">
					<Field.FieldLabel for={`${id}-amount-${i}`}>{amountLabel} {i + 1} (USD)</Field.FieldLabel>
					<Input
						id={`${id}-amount-${i}`}
						required
						inputmode="decimal"
						bind:value={row.amount}
						aria-invalid={invalid}
					/>
				</Field.Field>
				<Button
					variant="outline"
					type="button"
					aria-label={`Remove ${categoryLabel.toLowerCase()} ${i + 1}`}
					onclick={() => (rows = rows.filter((_, index) => index !== i))}>Remove</Button
				>
			{/if}
		</Field.FieldGroup>
	{/each}
	{@render children?.()}
</Field.FieldGroup>
