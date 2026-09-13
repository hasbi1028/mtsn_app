<script lang="ts">
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { getActiveModule, setActiveModule } from './module-active.svelte.js';
	import { page } from "$app/state";

	const sidebar = useSidebar();

	const pengaturan = $derived((page.data as any)?.pengaturan ?? {});
	const logoUrl = $derived(pengaturan.logoUrl ?? '/uploads/logo-kemenag.png');
	const appName = $derived(pengaturan.appName ?? 'SIMAD');
	const appSubtitle = $derived(pengaturan.appSubtitle ?? 'MTsN 2 Kolaka Utara');

	const modules = [
		{ name: "Semua", icon: LayoutDashboardIcon, description: "Tampilkan semua menu", key: "semua", active: true, url: "/" },
		{ name: "PTK", icon: UsersIcon, description: "Data PTK & Tendik", key: "PTK", active: true, url: "/ptk" },
		{ name: "Kesiswaan", icon: GraduationCapIcon, description: "Data Siswa & Kelas", key: "Kesiswaan", active: true, url: "/siswa" },
		{ name: "Jadwal", icon: CalendarIcon, description: "Roster & Kalender", key: "Jadwal", active: true, url: "/roster" },
		{ name: "Dokumen", icon: ClipboardListIcon, description: "SKMT, SKBK, SKAKPT", key: "Dokumen", active: true, url: "/skmt" },
		{ name: "Bel", icon: BellRingIcon, description: "Monitoring & Kontrol", key: "Bel", active: true, url: "/bel" },
		{ name: "Perpustakaan", icon: BookOpenIcon, description: "Buku & Peminjaman", active: false },
		{ name: "Sarana & Prasarana", icon: BuildingIcon, description: "Inventaris Sekolah", active: false },
		{ name: "Pengaturan", icon: SettingsIcon, description: "Konfigurasi Sistem", active: false },
	];

	let activeModules = $derived(modules.filter(m => m.active));
	let activeKey = $derived(getActiveModule());
	let inactiveModules = $derived(modules.filter(m => !m.active));
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
				side={sidebar.isMobile ? "bottom" : "right"}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Modul Aktif</DropdownMenu.Label>
				{#each activeModules as mod (mod.name)}
					<DropdownMenu.Item class="gap-2 p-2" data-active={activeKey === (mod.key ?? '')}>
						{#snippet child({ props })}
							<a {...props} href={mod.url} onclick={() => setActiveModule(mod.key ?? 'semua')} class="flex w-full items-center gap-2">
								<div class="flex size-6 items-center justify-center rounded-md {activeKey === (mod.key ?? '') ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-sidebar-accent text-sidebar-accent-foreground'}">
									<mod.icon class="size-3.5 shrink-0" />
								</div>
								<div class="flex flex-col">
									<span class="font-medium">{mod.name}</span>
									<span class="text-xs text-muted-foreground">{mod.description}</span>
								</div>
								{#if activeKey === (mod.key ?? '')}<span class="ms-auto text-primary">✓</span>{/if}
							</a>
						{/snippet}
					</DropdownMenu.Item>
				{/each}
				
				{#if inactiveModules.length > 0}
					<DropdownMenu.Separator />
					<DropdownMenu.Label class="text-xs text-muted-foreground">Modul Mendatang</DropdownMenu.Label>
					{#each inactiveModules as mod (mod.name)}
						<DropdownMenu.Item class="gap-2 p-2 opacity-50">
							<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<mod.icon class="size-3.5 shrink-0" />
							</div>
							<div class="flex flex-col">
								<span class="font-medium">{mod.name}</span>
								<span class="text-xs text-muted-foreground">{mod.description}</span>
							</div>
						</DropdownMenu.Item>
					{/each}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
