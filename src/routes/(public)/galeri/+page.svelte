<script lang="ts">
	import { getGaleriListQ } from '$modules/galeri/galeri.remote';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Images from '@lucide/svelte/icons/images';

	let kategori = $state('');
	let page = $state(1);
	const perPage = 12;

	const kategoriOptions = [
		{ value: '', label: 'Semua' },
		{ value: 'kegiatan', label: 'Kegiatan' },
		{ value: 'wisata', label: 'Wisata' },
		{ value: 'olahraga', label: 'Olahraga' },
		{ value: 'lainnya', label: 'Lainnya' },
	];

	let listQ = $derived(getGaleriListQ({ q: '', kategori, page, perPage }));

	function selectKategori(val: string) {
		kategori = val;
		page = 1;
	}
</script>

<svelte:head>
	<title>Galeri — MTsN 2 Kolaka Utara</title>
	<meta name="description" content="Galeri foto kegiatan MTsN 2 Kolaka Utara" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<PublicPageHeader icon={Images} title="Galeri Foto" subtitle="Dokumentasi kegiatan MTsN 2 Kolaka Utara" accent="purple" />

	<!-- Filter -->
	<section class="py-6 border-b bg-muted/30">
		<div class="max-w-5xl mx-auto px-4">
			<div class="flex flex-wrap gap-2 justify-center">
				{#each kategoriOptions as opt (opt.value)}
					<button
						class="px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer
							{kategori === opt.value ? 'bg-purple-600 text-white' : 'bg-card border hover:bg-muted'}"
						onclick={() => selectKategori(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Gallery Grid -->
	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			{#await listQ}
				<p class="text-center text-muted-foreground py-12">Memuat galeri...</p>
			{:then data}
				{#if data.items.length > 0}
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each data.items as g (g.id)}
							<Card class="group relative aspect-square gap-0 py-0 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
								<img src={g.gambar} alt={g.judul} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
								<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-4">
									<Badge class="mb-2 text-[10px] bg-white/20 backdrop-blur border-0 text-white">{g.kategori}</Badge>
									<span class="text-white text-sm font-medium text-center">{g.judul}</span>
								</div>
							</Card>
						{/each}
					</div>

					{#if data.total > perPage}
						<div class="flex justify-center gap-2 mt-8">
							<button
								class="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
								disabled={page <= 1}
								onclick={() => page--}
							>Sebelumnya</button>
							<span class="flex items-center px-4 text-sm text-muted-foreground">Hal {page} / {Math.ceil(data.total / perPage)}</span>
							<button
								class="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
								disabled={page * perPage >= data.total}
								onclick={() => page++}
							>Selanjutnya</button>
						</div>
					{/if}
				{:else}
					<div class="text-center py-16">
						<Images class="size-12 mx-auto text-muted-foreground/40 mb-3" />
						<p class="text-muted-foreground">Belum ada foto galeri</p>
					</div>
				{/if}
			{/await}
		</div>
	</section>
</div>
