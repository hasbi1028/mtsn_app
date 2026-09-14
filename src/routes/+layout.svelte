<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import FlashToast from '$lib/components/flash-toast.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const pengaturan = $derived((page.data as any)?.pengaturan);
	const faviconUrl = $derived(pengaturan?.faviconUrl ?? '/uploads/logo-kemenag.png');
</script>

<ModeWatcher />

<svelte:head>
	<meta name="color-scheme" content="light dark" />
	<link rel="icon" href={faviconUrl} />
	<link rel="apple-touch-icon" href={faviconUrl} />
</svelte:head>

{@render children?.()}

<FlashToast />
<Toaster />
