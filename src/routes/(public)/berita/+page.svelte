<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Newspaper from '@lucide/svelte/icons/newspaper';
</script>

<svelte:head>
	<title>Berita — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={Newspaper} title="Berita" subtitle="Informasi dan pengumuman terbaru" accent="blue" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<Card>
				<CardContent class="p-12 text-center">
					<div class="flex justify-center mb-4">
						<div class="p-4 rounded-full bg-muted">
							<Newspaper class="size-8 text-muted-foreground" />
						</div>
					</div>
					<h2 class="font-semibold mb-1">Belum Ada Berita</h2>
					<p class="text-sm text-muted-foreground">Berita dan pengumuman akan ditampilkan di sini.</p>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
