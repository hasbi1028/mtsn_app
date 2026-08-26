<script lang="ts">
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";

	const sidebar = useSidebar();

	const modules = [
		{ name: "Dashboard", icon: LayoutDashboardIcon, description: "Ringkasan & Statistik", active: true, url: "/" },
		{ name: "Kepegawaian", icon: UsersIcon, description: "Data PTK", active: true, url: "/ptk" },
		{ name: "Kesiswaan", icon: GraduationCapIcon, description: "Data Siswa & Kelas", active: true, url: "/siswa" },
		{ name: "Perpustakaan", icon: BookOpenIcon, description: "Buku & Peminjaman", active: false },
		{ name: "Sarana & Prasarana", icon: BuildingIcon, description: "Inventaris Sekolah", active: false },
		{ name: "Jadwal", icon: CalendarIcon, description: "Roster & Kalender", active: true, url: "/roster" },
		{ name: "Dokumen", icon: ClipboardListIcon, description: "SKMT, SKBK, SKAKPT", active: true, url: "/skmt" },
		{ name: "Pengaturan", icon: SettingsIcon, description: "Konfigurasi Sistem", active: false },
	];

	let activeModules = $derived(modules.filter(m => m.active));
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
						<div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<span class="text-xs font-bold">MTsN</span>
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">SIMAD</span>
							<span class="truncate text-xs">MTsN 2 Kolaka Utara</span>
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
					<DropdownMenu.Item class="gap-2 p-2">
						{#snippet child({ props })}
							<a {...props} href={mod.url} class="flex w-full items-center gap-2">
								<div class="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
									<mod.icon class="size-3.5 shrink-0" />
								</div>
								<div class="flex flex-col">
									<span class="font-medium">{mod.name}</span>
									<span class="text-xs text-muted-foreground">{mod.description}</span>
								</div>
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
