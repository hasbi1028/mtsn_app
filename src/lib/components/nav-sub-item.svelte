<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let {
		url,
		label,
	}: { url: string; label: string; icon?: any } = $props();

	// Dibaca di top-level komponen (bukan dalam #each) → hydration-safe
	const pathname = $derived(page?.url?.pathname ?? '');

	function isActive(u: string): boolean {
		if (u === '/') return pathname === '/';
		return pathname === u || pathname.startsWith(u + '/');
	}
</script>

<Sidebar.MenuSubItem>
	<Sidebar.MenuSubButton isActive={isActive(url)}>
		{#snippet child({ props })}
			<a href={url} {...props}>
				<span>{label}</span>
			</a>
		{/snippet}
	</Sidebar.MenuSubButton>
</Sidebar.MenuSubItem>