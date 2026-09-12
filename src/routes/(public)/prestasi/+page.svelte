<script lang="ts">
	import { getPrestasiListQ } from '$modules/prestasi/prestasi.remote';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Medal from '@lucide/svelte/icons/medal';

	let tingkat = $state('');
	let page = $state(1);
	const perPage = 12;

	const tingkatOptions = [
		{ value: '', label: 'Semua Tingkat' },
		{ value: 'nasional', label: 'Nasional' },
		{ value: 'provinsi', label: 'Provinsi' },
		{ value: 'kabupaten', label: 'Kabupaten' },
		{ value: 'sekolah', label: 'Sekolah' },
	];

	let listQ = $derived(getPrestasiListQ({ q: '', tingkat, page, perPage }));

	function selectTingkat(val: string) {
		tingkat = val;
		page = 1;
	}

	function getTingkatBadge(tingkat: string | null) {
		const map: Record<string, string> = {
			nasional: 'bg-red-100 text-red-700 border-red-200',
			provinsi: 'bg-purple-100 text-purple-700 border-purple-200',
			kabupaten: 'bg-sky-100 text-sky-700 border-sky-200',
			sekolah: 'bg-gray-100 text-gray-700 border-gray-200',
		};
		return map[tingkat ?? ''] ?? 'bg-gray-100 text-gray-700';
	}
</script>

<svelte:head>
	<title>Prestasi — MTsN 2 Kolaka Utara</title>
	<meta name="description" content="Prestasi siswa dan sekolah MTsN 2 Kolaka Utara" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<PublicPageHeader icon={Medal} title="Prestasi" subtitle="Pencapaian terbaik siswa dan madrasah" accent="amber" />

	<!-- Filter -->
	<section class="py-6 border-b bg-muted/30">
		<div class="max-w-5xl mx-auto px-4">
			<div class="flex flex-wrap gap-2 justify-center">
				{#each tingkatOptions as opt (opt.value)}
					<button
						class="px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer
							{tingkat === opt.value ? 'bg-amber-600 text-white' : 'bg-card border hover:bg-muted'}"
						onclick={() => selectTingkat(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Prestasi Grid -->
	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			{#await listQ}
				<p class="text-center text-muted-foreground py-12">Memuat data prestasi...</p>
			{:then data}
				{#if data.items.length > 0}
					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each data.items as p (p.id)}
							<Card class="gap-0 py-0 overflow-hidden hover:shadow-lg transition-shadow">
								{#if p.gambar}
									<div class="aspect-[16/9] bg-muted overflow-hidden">
										<img src={p.gambar} alt={p.judul} class="w-full h-full object-cover" />
									</div>
								{:else}
									<div class="aspect-[16/9] bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center">
										<Medal class="size-12 text-amber-300" />
									</div>
								{/if}
								<CardContent class="p-4">
									<div class="flex items-center gap-2 mb-2">
										<Badge class="text-[10px] {getTingkatBadge(p.tingkat)}">{p.tingkat}</Badge>
										{#if p.tahun}<span class="text-xs text-muted-foreground">{p.tahun}</span>{/if}
									</div>
									<h3 class="font-semibold text-sm mb-1">{p.judul}</h3>
									{#if p.pemenang}
										<p class="text-xs text-muted-foreground">{p.pemenang}</p>
									{/if}
									{#if p.deskripsi}
										<p class="text-xs text-muted-foreground mt-2 line-clamp-2">{p.deskripsi}</p>
									{/if}
								</CardContent>
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
						<Medal class="size-12 mx-auto text-muted-foreground/40 mb-3" />
						<p class="text-muted-foreground">Belum ada data prestasi</p>
					</div>
				{/if}
			{/await}
		</div>
	</section>
</div>
