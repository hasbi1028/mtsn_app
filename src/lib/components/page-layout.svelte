<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children,
	}: {
		title: string;
		description?: string;
		children?: Snippet;
	} = $props();
</script>

<svelte:head><title>{title} — MTsN App</title></svelte:head>

<div class="space-y-4">
	<div>
		<h1 class="text-lg font-semibold">{title}</h1>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	
	{@render children?.()}
</div>
