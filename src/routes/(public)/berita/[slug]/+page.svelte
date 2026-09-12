<script lang="ts">
	import { page } from '$app/state';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Berita — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={Newspaper} title="Detail Berita" subtitle="Baca selengkapnya" accent="blue" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<a href="/berita" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
				<ArrowLeft class="size-4" />
				Kembali ke Berita
			</a>

			<Card>
				<CardContent class="p-12 text-center">
					<div class="flex justify-center mb-4">
						<div class="p-4 rounded-full bg-muted">
							<Newspaper class="size-8 text-muted-foreground" />
						</div>
					</div>
					<h2 class="font-semibold mb-1">Artikel Tidak Ditemukan</h2>
					<p class="text-sm text-muted-foreground">Berita dengan slug "{page.params.slug}" tidak tersedia.</p>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
