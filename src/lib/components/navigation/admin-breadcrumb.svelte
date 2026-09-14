<script lang="ts">
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	const pathname = $derived(page?.url?.pathname ?? '');

	// segmen 'admin' disembunyikan — crumb "Home" sudah menunjuk ke /admin/dashboard
	const segments = $derived(
		pathname.split('/').filter(Boolean).filter((s) => s !== 'admin')
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
		'new': 'Tambah',
		'edit': 'Ubah',
	};

	const listRoutes = ['ptk', 'siswa', 'rombel', 'berita', 'agenda', 'galeri', 'prestasi', 'ekskul', 'pengumuman'];

	function getSegmentLabel(segment: string): string {
		if (breadcrumbMap[segment]) return breadcrumbMap[segment];
		// id teknis (public_id SIS-xxxx / id angka) jangan ditampilkan mentah
		if (/^SIS-/.test(segment) || /^\d+$/.test(segment)) return 'Detail';
		return segment;
	}

	/**
	 * URL crumb harus menunjuk rute yang benar-benar ada.
	 * - /admin/ortu tidak punya halaman index → jadikan teks biasa (null)
	 * - /admin/<list>/<id> untuk siswa|ortu tidak punya rute sendiri → tambah /profil
	 * - /admin/<list>/<id> halaman konten (berita, agenda, ...) → kembali ke daftar
	 */
	function getSegmentUrl(index: number): string | null {
		const path = '/admin/' + segments.slice(0, index + 1).join('/');
		if (path === '/admin/ortu') return null;
		const match = path.match(/^\/admin\/([^/]+)\/[^/]+$/);
		if (match) {
			const list = match[1];
			if (list === 'siswa' || list === 'ortu') return `${path}/profil`;
			if (listRoutes.includes(list)) return `/admin/${list}`;
		}
		return path;
	}
</script>

{#if segments.length > 0}
	<nav aria-label="breadcrumb" class="flex items-center gap-1 text-xs text-muted-foreground">
		<a href="/admin/dashboard" class="hover:text-foreground transition-colors">
			Home
		</a>
		{#each segments as segment, i}
			<ChevronRight class="size-3" />
			{#if i < segments.length - 1 && getSegmentUrl(i)}
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
