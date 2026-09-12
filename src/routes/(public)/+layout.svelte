<script lang="ts">
	import PublicNavbar from '$lib/components/navigation/public-navbar.svelte';
	import PublicFooter from '$lib/components/navigation/public-footer.svelte';

	let { children, data } = $props();
	const user = $derived(data?.user);
</script>

<PublicNavbar {user} />

<main class="min-h-[calc(100vh-3.5rem)]">
	{@render children?.()}
</main>

<PublicFooter />
