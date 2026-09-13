<script lang="ts">
	import { setMode } from 'mode-watcher';
	import PublicNavbar from '$lib/components/navigation/public-navbar.svelte';
	import PublicFooter from '$lib/components/navigation/public-footer.svelte';

	let { children, data } = $props();
	const user = $derived(data?.user);

	// Force light mode on public pages —不受 admin dark mode state
	$effect(() => {
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
