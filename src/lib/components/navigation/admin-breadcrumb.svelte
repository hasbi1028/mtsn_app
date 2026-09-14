<script lang="ts">
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	const pathname = $derived(page?.url?.pathname ?? '');

	const segments = $derived(
		pathname.split('/').filter(Boolean)
	);

	const breadcrumbMap: Record<string, string> = {
		'dashboard': 'Dashboard',
		'ptk': 'PTK',
		'siswa': 'Siswa',
		'rombel': 'Rombel',
		'roster': 'Roster',
		'skmt': 'SKMT',
		'skbk': 'SKBK',
		'skakpt': 'SKAKPT',
		'bel': 'Bel',
		'activity': 'Aktivitas',
		'approval': 'Persetujuan',
		'ortu': 'Orang Tua',
		'profil': 'Profil',
		'visi-misi': 'Visi & Misi',
		'guru': 'Guru',
		'ppdb': 'PPDB',
		'berita': 'Berita',
		'fasilitas': 'Fasilitas',
		'kontak': 'Kontak',
		'kartu': 'Kartu',
		'suara': 'Suara',
		'bansos': 'Bansos',
	};

	function getSegmentLabel(segment: string): string {
		return breadcrumbMap[segment] || segment;
	}

	function getSegmentUrl(index: number): string {
		return '/' + segments.slice(0, index + 1).join('/');
	}
</script>

{#if segments.length > 0}
	<nav aria-label="breadcrumb" class="flex items-center gap-1 text-xs text-muted-foreground">
		<a href="/admin/dashboard" class="hover:text-foreground transition-colors">
			Home
		</a>
		{#each segments as segment, i}
			<ChevronRight class="size-3" />
			{#if i < segments.length - 1}
				<a href={getSegmentUrl(i)} class="hover:text-foreground transition-colors">
					{getSegmentLabel(segment)}
				</a>
			{:else}
				<span class="font-medium text-foreground">
					{getSegmentLabel(segment)}
				</span>
			{/if}
		{/each}
	</nav>
{/if}
