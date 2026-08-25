<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions,
		filters,
		stats,
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
		filters?: Snippet;
		stats?: Snippet;
	} = $props();
</script>

<div class="mb-6">
	<div class="flex items-center justify-between mb-2">
		<div>
			<h1 class="text-lg font-semibold">{title}</h1>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
	
	{#if filters}
		<div class="mb-3">
			{@render filters()}
		</div>
	{/if}
	
	{#if stats}
		<div class="mb-3">
			{@render stats()}
		</div>
	{/if}
</div>
