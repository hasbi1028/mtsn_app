<script lang="ts">
	import type { Component } from 'svelte';

	type Accent =
		| 'primary'
		| 'emerald'
		| 'blue'
		| 'sky'
		| 'amber'
		| 'purple'
		| 'orange'
		| 'teal'
		| 'rose';

	let {
		icon: Icon,
		title,
		subtitle,
		accent = 'primary',
	}: {
		icon: Component;
		title: string;
		subtitle?: string;
		accent?: Accent;
	} = $props();

	const accents: Record<Accent, { bg: string; soft: string }> = {
		primary: { bg: 'from-primary to-primary/70', soft: 'text-primary-foreground/70' },
		emerald: { bg: 'from-emerald-600 to-emerald-800', soft: 'text-emerald-200' },
		blue: { bg: 'from-blue-600 to-blue-800', soft: 'text-blue-200' },
		sky: { bg: 'from-sky-600 to-sky-800', soft: 'text-sky-200' },
		amber: { bg: 'from-amber-500 to-amber-700', soft: 'text-amber-200' },
		purple: { bg: 'from-purple-600 to-purple-800', soft: 'text-purple-200' },
		orange: { bg: 'from-orange-500 to-orange-700', soft: 'text-orange-200' },
		teal: { bg: 'from-teal-600 to-teal-800', soft: 'text-teal-200' },
		rose: { bg: 'from-rose-600 to-rose-800', soft: 'text-rose-200' },
	};

	const a = $derived(accents[accent]);
</script>

<section class="bg-gradient-to-br {a.bg} text-white py-10">
	<div class="max-w-5xl mx-auto px-4 text-center">
		<Icon class="size-10 mx-auto mb-3 {a.soft}" />
		<h1 class="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
		{#if subtitle}
			<p class="{a.soft} text-sm">{subtitle}</p>
		{/if}
	</div>
</section>
