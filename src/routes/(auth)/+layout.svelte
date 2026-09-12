<script lang="ts">
	import PublicNavbar from '$lib/components/navigation/public-navbar.svelte';

	let { children, data } = $props();
	const user = $derived(data?.user);
</script>

<PublicNavbar {user} />

<main class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-muted px-4 py-6">
	<div class="w-full max-w-5xl">
		{@render children?.()}
	</div>
</main>
