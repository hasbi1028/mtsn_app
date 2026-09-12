<script lang="ts">
	import { getEkskulListQ } from '$modules/ekskul/ekskul.remote';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Star from '@lucide/svelte/icons/star';
	import Clock from '@lucide/svelte/icons/clock';
	import User from '@lucide/svelte/icons/user';
</script>

<svelte:head>
	<title>Ekstrakurikuler — MTsN 2 Kolaka Utara</title>
	<meta name="description" content="Kegiatan ekstrakurikuler MTsN 2 Kolaka Utara" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<PublicPageHeader icon={Star} title="Ekstrakurikuler" subtitle="Pengembangan bakat dan minat siswa di luar jam pelajaran" accent="orange" />

	<!-- Ekskul List -->
	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			{#await getEkskulListQ({ q: '', page: 1, perPage: 50 })}
				<p class="text-center text-muted-foreground py-12">Memuat data ekskul...</p>
			{:then data}
				{#if data.items.length > 0}
					<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each data.items as e (e.id)}
							<Card class="gap-0 py-0 overflow-hidden hover:shadow-lg transition-shadow">
								{#if e.gambar}
									<div class="aspect-[16/9] bg-muted overflow-hidden">
										<img src={e.gambar} alt={e.nama} class="w-full h-full object-cover" />
									</div>
								{:else}
									<div class="aspect-[16/9] bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center">
										<Star class="size-12 text-orange-300" />
									</div>
								{/if}
								<CardContent class="p-4">
									<h3 class="font-semibold text-base mb-2">{e.nama}</h3>
									{#if e.deskripsi}
										<p class="text-sm text-muted-foreground mb-3 line-clamp-3">{e.deskripsi}</p>
									{/if}
									<div class="space-y-1.5">
										{#if e.pembina}
											<div class="flex items-center gap-2 text-xs text-muted-foreground">
												<User class="size-3.5" />
												<span>Pembina: {e.pembina}</span>
											</div>
										{/if}
										{#if e.jadwal}
											<div class="flex items-center gap-2 text-xs text-muted-foreground">
												<Clock class="size-3.5" />
												<span>{e.jadwal}</span>
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else}
					<div class="text-center py-16">
						<Star class="size-12 mx-auto text-muted-foreground/40 mb-3" />
						<p class="text-muted-foreground">Belum ada data ekstrakurikuler</p>
					</div>
				{/if}
			{/await}
		</div>
	</section>
</div>
