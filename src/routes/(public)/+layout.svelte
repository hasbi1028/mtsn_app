<script lang="ts">
	import { onMount } from 'svelte';
	import { setMode } from 'mode-watcher';
	import PublicNavbar from '$lib/components/navigation/public-navbar.svelte';
	import PublicFooter from '$lib/components/navigation/public-footer.svelte';

	let { children, data } = $props();
	const user = $derived(data?.user);

	// Paksa mode terang di halaman publik — tidak terpengaruh state dark mode admin.
	// HARUS di onMount, BUKAN di $effect: setMode() di dalam $effect memicu
	// effect_update_depth_exceeded (loop) sehingga seluruh halaman publik error.
	onMount(() => {
		setMode('light');
	});
</script>

<svelte:head>
	<meta name="color-scheme" content="light" />
</svelte:head>

<PublicNavbar {user} />

<main class="min-h-[calc(100vh-3.5rem)]">
	{@render children?.()}
</main>

<PublicFooter />
