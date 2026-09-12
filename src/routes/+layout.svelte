<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<ModeWatcher />

<svelte:head>
	<meta name="color-scheme" content="light dark" />
</svelte:head>

{@render children?.()}

<Toaster />
