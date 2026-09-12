<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import UsersIcon from '@lucide/svelte/icons/users';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let { open = $bindable(false) } = $props<{ open?: boolean }>();

	let searchQuery = $state('');
	let selectedIndex = $state(0);

	const quickLinks = [
		{ label: 'Dashboard', href: '/admin/dashboard', icon: FileTextIcon },
		{ label: 'Data PTK', href: '/admin/ptk', icon: UsersIcon },
		{ label: 'Data Siswa', href: '/admin/siswa', icon: GraduationCapIcon },
		{ label: 'Roster', href: '/admin/roster', icon: CalendarIcon },
		{ label: 'SKMT', href: '/admin/skmt', icon: FileTextIcon },
		{ label: 'SKBK', href: '/admin/skbk', icon: FileTextIcon },
		{ label: 'SKAKPT', href: '/admin/skakpt', icon: FileTextIcon },
		{ label: 'Rombel', href: '/admin/rombel', icon: UsersIcon },
	];

	const filteredLinks = $derived(
		searchQuery
			? quickLinks.filter(link =>
				link.label.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: quickLinks
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredLinks.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && filteredLinks[selectedIndex]) {
			window.location.href = filteredLinks[selectedIndex].href;
		}
	}

	function handleOpenChange(newState: boolean) {
		open = newState;
		if (newState) {
			searchQuery = '';
			selectedIndex = 0;
		}
	}
</script>

<svelte:window onkeydown={(e) => {
	if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
		e.preventDefault();
		open = !open;
	}
}} />

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[425px] p-0">
		<Dialog.Header class="px-4 pt-4 pb-0">
			<Dialog.Title class="text-sm">Cari</Dialog.Title>
		</Dialog.Header>
		<div class="px-4 pb-4">
			<!-- Search input -->
			<div class="relative">
				<SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					bind:value={searchQuery}
					placeholder="Ketik untuk mencari..."
					class="pl-9"
					onkeydown={handleKeydown}
				/>
			</div>

			<!-- Quick links -->
			<div class="mt-3">
				<p class="text-xs text-muted-foreground mb-2">Akses Cepat</p>
				<div class="space-y-1">
					{#each filteredLinks as link, i}
						<a
							href={link.href}
							class="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors
								{i === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}"
							onmouseenter={() => selectedIndex = i}
						>
							<link.icon class="size-4" />
							<span>{link.label}</span>
						</a>
					{/each}
					{#if filteredLinks.length === 0}
						<p class="text-xs text-muted-foreground text-center py-4">Tidak ditemukan</p>
					{/if}
				</div>
			</div>

			<!-- Keyboard shortcuts -->
			<div class="mt-3 pt-3 border-t flex gap-4 text-[10px] text-muted-foreground">
				<span><kbd class="px-1 py-0.5 bg-muted rounded">↑↓</kbd> Navigasi</span>
				<span><kbd class="px-1 py-0.5 bg-muted rounded">↵</kbd> Pilih</span>
				<span><kbd class="px-1 py-0.5 bg-muted rounded">Esc</kbd> Tutup</span>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
