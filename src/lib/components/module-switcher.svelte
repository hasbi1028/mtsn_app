<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { navItems, filterNavByRole } from '$lib/config/navigation.js';
	import {
		getActiveModule,
		setActiveModule,
		hydrateActiveModule
	} from './module-active.svelte.js';

	let { user }: { user?: { role: string } | null } = $props();

	const sidebar = useSidebar();

	const pengaturan = $derived((page.data as any)?.pengaturan ?? {});
	const logoUrl = $derived(pengaturan.logoUrl ?? '/uploads/logo-kemenag.png');
	const appName = $derived(pengaturan.appName ?? 'SIMAD');
	const appSubtitle = $derived(pengaturan.appSubtitle ?? 'MTsN 2 Kolaka Utara');

	const DESKRIPSI: Record<string, string> = {
		PTK: 'Data PTK & Tendik',
		Kesiswaan: 'Data Siswa & Kelas',
		Jadwal: 'Roster & Kalender',
		Dokumen: 'SKMT, SKBK, SKAKPT',
		Konten: 'Berita & Pengumuman',
		Bel: 'Monitoring & Kontrol',
		Sistem: 'Pengaturan & Backup'
	};

	const items = $derived(user?.role ? filterNavByRole(navItems, user.role) : navItems);

	// Turunkan modul dari grup navItems (satu sumber kebenaran), bukan daftar hardcoded.
	const activeModules = $derived.by(() => {
		const groups: { name: string; icon: any; url: string; urls: string[] }[] = [];
		for (const it of items) {
			if (it.group === 'semua') continue;
			const urls = [it.url, ...(it.children?.map((c) => c.url) ?? [])];
			const existing = groups.find((g) => g.name === it.group);
			if (existing) existing.urls.push(...urls);
			else groups.push({ name: it.group, icon: it.icon, url: it.url, urls });
		}
		return groups.map((g) => ({
			key: g.name,
			name: g.name,
			icon: g.icon,
			url: g.url,
			urls: g.urls,
			description: DESKRIPSI[g.name] ?? ''
		}));
	});

	const modules = $derived([
		{
			key: 'semua',
			name: 'Semua',
			icon: LayoutDashboardIcon,
			url: '/admin/dashboard',
			urls: [] as string[],
			description: 'Tampilkan semua menu'
		},
		...activeModules
	]);

	const activeKey = $derived(getActiveModule());

	const modulMendatang = [
		{ name: 'Perpustakaan', icon: BookOpenIcon, description: 'Buku & Peminjaman' },
		{ name: 'Sarana & Prasarana', icon: BuildingIcon, description: 'Inventaris Sekolah' }
	];

	onMount(() => {
		hydrateActiveModule();
		sinkronDariUrl();
	});

	function cariModul(pathname: string) {
		return modules.find(
			(m) => m.key !== 'semua' && m.urls.some((u) => pathname === u || pathname.startsWith(u + '/'))
		);
	}

	function sinkronDariUrl() {
		const found = cariModul(page.url.pathname);
		if (found) setActiveModule(found.key);
	}

	// Sinkronkan modul aktif dengan URL & validasi hak akses.
	$effect(() => {
		const pathname = page.url.pathname;
		const found = cariModul(pathname);
		if (found) {
			if (getActiveModule() !== found.key) setActiveModule(found.key);
			return;
		}
		const current = getActiveModule();
		const valid = current === 'semua' || activeModules.some((m) => m.key === current);
		if (!valid) setActiveModule('semua');
	});
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div class="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<img src={logoUrl} alt="Logo" class="size-full object-contain p-0.5" />
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{activeKey === 'semua' ? appName : activeKey}</span>
							<span class="truncate text-xs">{appSubtitle}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Modul</DropdownMenu.Label>
				{#each modules as mod (mod.key)}
					<DropdownMenu.Item class="gap-2 p-2" data-active={activeKey === mod.key}>
						{#snippet child({ props })}
							<a
								{...props}
								href={resolve(mod.url as '/admin/dashboard')}
								onclick={() => setActiveModule(mod.key)}
								class="flex w-full items-center gap-2"
							>
								<div
									class="flex size-6 items-center justify-center rounded-md {activeKey === mod.key
										? 'bg-sidebar-primary text-sidebar-primary-foreground'
										: 'bg-sidebar-accent text-sidebar-accent-foreground'}"
								>
									<mod.icon class="size-3.5 shrink-0" />
								</div>
								<div class="flex flex-col">
									<span class="font-medium">{mod.name}</span>
									<span class="text-xs text-muted-foreground">{mod.description}</span>
								</div>
								{#if activeKey === mod.key}<span class="ms-auto text-primary">✓</span>{/if}
							</a>
						{/snippet}
					</DropdownMenu.Item>
				{/each}

				<DropdownMenu.Separator />
				<DropdownMenu.Label class="text-xs text-muted-foreground">Modul Mendatang</DropdownMenu.Label>
				{#each modulMendatang as mod (mod.name)}
					<DropdownMenu.Item class="gap-2 p-2 opacity-50" disabled>
						<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
							<mod.icon class="size-3.5 shrink-0" />
						</div>
						<div class="flex flex-col">
							<span class="font-medium">{mod.name}</span>
							<span class="text-xs text-muted-foreground">{mod.description}</span>
						</div>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
