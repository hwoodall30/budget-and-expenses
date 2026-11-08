<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { categoryStyle } from '#lib/helpers/category-color.ts';

	let {
		category,
		children,
		style,
		...rest
	}: Omit<ComponentProps<typeof Badge>, 'variant'> & { category: string } = $props();
</script>

<Badge
	variant="category"
	style={[categoryStyle(category), style].filter(Boolean).join('; ')}
	{...rest}
>
	{#if children}{@render children()}{:else}{category}{/if}
</Badge>
