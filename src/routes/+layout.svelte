<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { siswaNavItems, ortuNavItems } from '$lib/config/navigation.js';
	import { page } from '$app/state';
	import { notify } from '$lib/toast';

	let { children, data } = $props();

	const user = $derived(data.user);
	const role = $derived(user?.role ?? '');
	const isLogin = $derived(data.isLogin);

	// Determine which nav items to show for siswa/ortu
	const mobileNavItems = $derived(
		role === 'siswa' ? siswaNavItems :
		role === 'ortu' ? ortuNavItems :
		[]
	);

	const userInitials = $derived(user?.username ? user.username.slice(0, 2).toUpperCase() : 'U');
	const userRoleLabel = $derived(role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User');
</script>

<ModeWatcher />

<svelte:head>
	<meta name="color-scheme" content="light dark" />
</svelte:head>

{#if isLogin}
	<main>{@render children?.()}</main>
{:else if role === 'siswa' || role === 'ortu'}
	<!-- Mobile-first layout for siswa/ortu (no sidebar) -->
	<div class="flex min-h-screen flex-col max-w-[480px] mx-auto bg-background">
		<!-- Header -->
		<header class="flex h-14 shrink-0 items-center justify-between border-b px-4">
			<div class="flex items-center gap-2">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium">
					{userInitials}
				</div>
				<div>
					<h1 class="text-sm font-semibold leading-tight">SIMAD</h1>
					<p class="text-[11px] text-muted-foreground leading-tight">{userRoleLabel}</p>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<Button onclick={toggleMode} variant="ghost" size="icon" class="size-8 cursor-pointer" title="Ganti tema">
					<Sun class="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon class="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span class="sr-only">Toggle theme</span>
				</Button>
				<form method="POST" action="/logout">
					<Button variant="ghost" size="icon" type="submit" class="size-8 cursor-pointer" title="Keluar">
						<LogOutIcon class="size-4" />
					</Button>
				</form>
			</div>
		</header>

		<!-- Content -->
		<main class="flex-1 px-4 py-4">
			{@render children?.()}
		</main>

		<!-- Bottom navigation bar for siswa/ortu -->
		<nav class="flex items-center justify-around border-t px-2 py-2 bg-background">
			{#each mobileNavItems as item}
				<a
					href={item.url}
					class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors
						{page.url.pathname.startsWith(item.url) ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}"
				>
					<item.icon class="size-5" />
					<span>{item.title}</span>
				</a>
			{/each}
		</nav>
	</div>
{:else}
	<!-- Sidebar layout for admin/kepsek/guru/staf -->
	<Sidebar.Provider>
		<AppSidebar {user} />
		<Sidebar.Inset>
			<SiteHeader {user} />
			<main class="mx-auto w-full max-w-5xl px-4 py-4">
				{@render children?.()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}

<Toaster />
