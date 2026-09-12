<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import AdminHeader from '$lib/components/navigation/admin-header.svelte';
	import AdminBreadcrumb from '$lib/components/navigation/admin-breadcrumb.svelte';
	import MobileNav from '$lib/components/navigation/mobile-nav.svelte';
	import SearchDialog from '$lib/components/navigation/search-dialog.svelte';
	import { logoutForm } from '$modules/auth/auth.remote';

	let { children, data } = $props();

	const user = $derived(data?.user);
	const role = $derived(user?.role ?? '');

	let searchOpen = $state(false);
</script>

{#if role === 'siswa' || role === 'ortu'}
	<!-- Mobile-first layout for siswa/ortu (no sidebar) -->
	<div class="flex min-h-screen flex-col max-w-[480px] mx-auto bg-background">
		<!-- Header -->
		<header class="flex h-14 shrink-0 items-center justify-between border-b px-4">
			<div class="flex items-center gap-2">
				<a href="/" class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
					MT
				</a>
				<div>
					<h1 class="text-sm font-semibold leading-tight">SIMAD</h1>
					<p class="text-[11px] text-muted-foreground leading-tight">{role === 'siswa' ? 'Siswa' : 'Orang Tua'}</p>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<a href="/" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
					Situs Web
				</a>
				<form {...logoutForm}>
					<button type="submit" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
						Keluar
					</button>
				</form>
			</div>
		</header>

		<!-- Content -->
		<main class="flex-1 px-4 py-4">
			{@render children?.()}
		</main>

		<!-- Bottom navigation bar -->
		<MobileNav {role} />
	</div>
{:else}
	<!-- Sidebar layout for admin/kepsek/guru/staf -->
	<Sidebar.Provider>
		<AppSidebar {user} />
		<Sidebar.Inset>
			<AdminHeader {user} onSearch={() => searchOpen = true} />
			<div class="px-4 pt-2">
				<AdminBreadcrumb />
			</div>
			<main class="mx-auto w-full max-w-5xl px-4 py-4">
				{@render children?.()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>

	<!-- Search dialog -->
	<SearchDialog bind:open={searchOpen} />
{/if}
