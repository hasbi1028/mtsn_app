<script lang="ts">
	import PublicNavbar from '$lib/components/navigation/public-navbar.svelte';

	let { children, data } = $props();
	const user = $derived(data?.user);
</script>

<PublicNavbar {user} />

<main class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-8">
	<div class="w-full max-w-lg md:max-w-2xl lg:max-w-3xl">
		{@render children?.()}
	</div>
</main>
