<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';
	import Menu from '@lucide/svelte/icons/menu';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { user } = $props<{ user?: any }>();

	const navItems = [
		{ href: '/', label: 'Beranda' },
		{ href: '/profil', label: 'Profil', children: [
			{ href: '/profil', label: 'Tentang Kami' },
			{ href: '/profil/visi-misi', label: 'Visi & Misi' },
		]},
		{ href: '/ppdb', label: 'PPDB' },
		{ href: '/berita', label: 'Berita' },
		{ href: '/kalender', label: 'Kalender' },
		{ href: '/ekskul', label: 'Ekskul' },
		{ href: '/galeri', label: 'Galeri' },
		{ href: '/prestasi', label: 'Prestasi' },
		{ href: '/guru', label: 'Guru' },
		{ href: '/kontak', label: 'Kontak' },
	];

	const pathname = $derived(page?.url?.pathname ?? '');
	let mobileOpen = $state(false);
	let profilOpen = $state(false);

	function isActive(href: string) {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 font-bold text-lg">
			<span class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">MT</span>
			<span class="hidden sm:inline">MTsN 2 Kolaka Utara</span>
			<span class="sm:hidden">MTsN 2 Kolut</span>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden md:flex items-center gap-0.5">
			{#each navItems as item}
				{#if item.children}
					<div class="relative group">
						<button
							class="px-3 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer
								{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
						>
							{item.label}
							<ChevronDown class="size-3.5" />
						</button>
						<div class="absolute left-0 top-full z-50 hidden group-hover:block pt-1">
							<div class="rounded-lg border bg-popover p-1 shadow-md min-w-[160px]">
								{#each item.children as child}
									<a
										href={child.href}
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
						class="px-3 py-1.5 text-sm rounded-md transition-colors
							{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
					>
						{item.label}
					</a>
				{/if}
			{/each}
			{#if user}
				<a href="/admin/dashboard" class="ml-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
					Dashboard
				</a>
			{:else}
				<a href="/login" class="ml-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
					Login
				</a>
			{/if}
		</nav>

		<!-- Mobile hamburger -->
		<Sheet.Root bind:open={mobileOpen}>
			<Sheet.Trigger>
				<Button variant="ghost" size="icon" class="md:hidden size-8 cursor-pointer">
					<Menu class="size-5" />
					<span class="sr-only">Menu</span>
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="right" class="w-[280px]">
				<Sheet.Header>
					<Sheet.Title>Menu</Sheet.Title>
				</Sheet.Header>
				<nav class="flex flex-col gap-1 mt-4">
					{#each navItems as item}
						{#if item.children}
							<button
								class="px-3 py-2 text-sm rounded-md transition-colors text-left inline-flex items-center justify-between cursor-pointer
									{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}"
								onclick={() => profilOpen = !profilOpen}
							>
								{item.label}
								<ChevronDown class="size-3.5 {profilOpen ? 'rotate-180' : ''} transition-transform" />
							</button>
							{#if profilOpen}
								<div class="pl-4">
									{#each item.children as child}
										<a
											href={child.href}
											class="block px-3 py-2 text-sm rounded-md transition-colors
												{pathname === child.href ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}"
											onclick={() => mobileOpen = false}
										>
											{child.label}
										</a>
									{/each}
								</div>
							{/if}
						{:else}
							<a
								href={item.href}
								class="px-3 py-2 text-sm rounded-md transition-colors
									{isActive(item.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}"
								onclick={() => mobileOpen = false}
							>
								{item.label}
							</a>
						{/if}
					{/each}
					<div class="mt-4 pt-4 border-t">
						{#if user}
							<a href="/admin/dashboard" class="block px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground text-center">
								Dashboard
							</a>
						{:else}
							<a href="/login" class="block px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground text-center">
								Login
							</a>
						{/if}
					</div>
				</nav>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</header>
