<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';
	import Menu from '@lucide/svelte/icons/menu';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import { publicNavItems } from '$lib/config/public-nav.js';
	import type { UserSession } from '$modules/auth/auth.validation';

	let { user }: { user?: UserSession | null } = $props();

	const pengaturan = $derived((page.data as any)?.pengaturan ?? {});
	const logoUrl = $derived(pengaturan.logoUrl ?? '/uploads/logo-kemenag.png');
	const appName = $derived(pengaturan.appName ?? 'SIMAD');
	const appSubtitle = $derived(pengaturan.appSubtitle ?? 'MTsN 2 Kolaka Utara');

	const pathname = $derived(page?.url?.pathname ?? '');
	let mobileOpen = $state(false);
	let profilOpen = $state(false);

	function isActive(href: string) {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(href + '/');
	}

	// Buka submenu Profil otomatis saat berada di rutenya.
	$effect(() => {
		if (mobileOpen && isActive('/profil')) profilOpen = true;
	});

	function tutup() {
		mobileOpen = false;
	}
</script>

<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 font-bold text-lg">
			<span class="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground text-xs font-bold">
				<img src={logoUrl} alt="Logo" class="size-full object-contain p-0.5" />
			</span>
			<span class="hidden sm:inline">{appSubtitle}</span>
			<span class="sm:hidden">{appName}</span>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden md:flex items-center gap-0.5" aria-label="Menu utama">
			{#each publicNavItems as item}
				{#if item.children}
					<div class="relative group">
						<button
							class="px-3 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer
								{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
						>
							{item.label}
							<ChevronDown class="size-3.5" />
						</button>
						<div class="absolute left-0 top-full z-50 hidden group-hover:block group-focus-within:block pt-1">
							<div class="rounded-lg border bg-popover p-1 shadow-md min-w-[180px]">
								{#each item.children as child}
									<a
										href={child.href}
										aria-current={pathname === child.href ? 'page' : undefined}
										class="block px-3 py-1.5 text-sm rounded-md transition-colors
											{pathname === child.href ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}"
									>
										{child.label}
									</a>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class="px-3 py-1.5 text-sm rounded-md transition-colors
							{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
					>
						{item.label}
					</a>
				{/if}
			{/each}
			{#if user}
				<a href="/admin/dashboard" class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
					<LayoutDashboard class="size-4" />
					Dashboard
				</a>
			{:else}
				<a href="/login" class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
					<LogIn class="size-4" />
					Login
				</a>
			{/if}
		</nav>

		<!-- Mobile hamburger -->
		<Sheet.Root bind:open={mobileOpen}>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="icon" class="md:hidden size-8 cursor-pointer" aria-label="Buka menu">
						<Menu class="size-5" />
						<span class="sr-only">Menu</span>
					</Button>
				{/snippet}
			</Sheet.Trigger>
			<Sheet.Content
				side="right"
				class="gap-0 p-0 data-[side=right]:w-[85vw] data-[side=right]:max-w-xs"
			>
				<!-- Identitas madrasah -->
				<Sheet.Header class="flex-row items-center gap-3 border-b p-4 pr-12">
					<span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
						<img src={logoUrl} alt="Logo" class="size-full object-contain p-0.5" />
					</span>
					<div class="min-w-0">
						<Sheet.Title class="truncate text-base">{appName}</Sheet.Title>
						<p class="truncate text-xs text-muted-foreground">{appSubtitle}</p>
					</div>
				</Sheet.Header>

				<!-- Menu -->
				<nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Menu utama">
					<ul class="flex flex-col gap-0.5">
						{#each publicNavItems as item}
							<li>
								{#if item.children}
									{@const aktif = isActive(item.href)}
									<button
										type="button"
										aria-expanded={profilOpen}
										aria-controls="submenu-profil"
										onclick={() => (profilOpen = !profilOpen)}
										class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors
											{aktif ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
									>
										<item.icon class="size-4 shrink-0" />
										<span class="flex-1">{item.label}</span>
										<ChevronDown class="size-4 shrink-0 transition-transform {profilOpen ? 'rotate-180' : ''}" />
									</button>
									{#if profilOpen}
										<ul id="submenu-profil" class="mt-0.5 flex flex-col gap-0.5 border-l pl-3 ml-4">
											{#each item.children as child}
												<li>
													<a
														href={child.href}
														aria-current={pathname === child.href ? 'page' : undefined}
														onclick={tutup}
														class="block rounded-md px-3 py-1.5 text-sm transition-colors
															{pathname === child.href ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
													>
														{child.label}
													</a>
												</li>
											{/each}
										</ul>
									{/if}
								{:else}
									{@const aktif = isActive(item.href)}
									<a
										href={item.href}
										aria-current={aktif ? 'page' : undefined}
										onclick={tutup}
										class="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
											{aktif ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
									>
										{#if aktif}
											<span class="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"></span>
										{/if}
										<item.icon class="size-4 shrink-0" />
										<span>{item.label}</span>
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</nav>

				<!-- Aksi akun (pinned) -->
				<div class="border-t p-3">
					{#if user}
						<a
							href="/admin/dashboard"
							onclick={tutup}
							class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<LayoutDashboard class="size-4" />
							Dashboard
						</a>
					{:else}
						<a
							href="/login"
							onclick={tutup}
							class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<LogIn class="size-4" />
							Login
						</a>
					{/if}
				</div>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</header>
