<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions,
		filters,
		children,
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
		filters?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<svelte:head><title>{title} — MTsN App</title></svelte:head>

<div class="space-y-4">
	<div class="flex flex-wrap items-start justify-between gap-2">
		<div>
			<h1 class="text-lg font-semibold">{title}</h1>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
		{#if actions}
			<div class="shrink-0">{@render actions()}</div>
		{/if}
	</div>

	{#if filters}
		<div class="rounded-lg border bg-card/60 px-3 py-2">
			{@render filters()}
		</div>
	{/if}

	{@render children?.()}
</div>
