<script lang="ts">
	import { page } from '$app/state';
	import UserIcon from '@lucide/svelte/icons/user';
	import BellIcon from '@lucide/svelte/icons/bell';
	import HomeIcon from '@lucide/svelte/icons/home';

	let { role } = $props<{ role?: string }>();

	const pathname = $derived(page?.url?.pathname ?? '');

	const navItems = $derived(
		role === 'siswa' ? [
			{ url: '/siswa/profil', label: 'Profil', icon: UserIcon },
			{ url: '/siswa/bansos', label: 'Bansos', icon: BellIcon },
		] : role === 'ortu' ? [
			{ url: '/ortu/profil', label: 'Profil', icon: UserIcon },
			{ url: '/ortu/bansos', label: 'Bansos', icon: BellIcon },
		] : []
	);
</script>

{#if navItems.length > 0}
	<nav class="flex items-center justify-around border-t px-2 py-2 bg-background">
		{#each navItems as item}
			<a
				href={item.url}
				class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors
					{pathname.startsWith(item.url) ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}"
			>
				<item.icon class="size-5" />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>
{/if}
