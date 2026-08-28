<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions,
		children,
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
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

	{@render children?.()}
</div>
