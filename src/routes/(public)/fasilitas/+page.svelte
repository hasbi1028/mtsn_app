<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import School from '@lucide/svelte/icons/school';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Church from '@lucide/svelte/icons/church';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Monitor from '@lucide/svelte/icons/monitor';

	const fasilitas = [
		{ icon: School, name: 'Ruang Kelas', desc: 'Ruang kelas nyaman dengan ventilasi dan pencahayaan yang baik' },
		{ icon: FlaskConical, name: 'Laboratorium', desc: 'Lab IPA, Komputer, dan Bahasa' },
		{ icon: BookOpen, name: 'Perpustakaan', desc: 'Koleksi buku pelajaran dan referensi yang lengkap' },
		{ icon: Church, name: 'Masjid', desc: 'Tempat ibadah dan kegiatan keagamaan' },
		{ icon: Trophy, name: 'Lapangan', desc: 'Lapangan olahraga untuk kegiatan fisik' },
		{ icon: Monitor, name: 'Lab Komputer', desc: 'Perangkat komputer modern untuk pembelajaran' },
	];
</script>

<svelte:head>
	<title>Fasilitas — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={School} title="Fasilitas" subtitle="Sarana dan prasarana MTsN 2 Kolaka Utara" accent="teal" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each fasilitas as fas}
					<Card>
						<CardContent class="p-5 text-center">
							<div class="flex justify-center mb-3">
								<div class="p-3 rounded-full bg-primary/10">
									<fas.icon class="size-6 text-primary" />
								</div>
							</div>
							<h3 class="font-semibold text-sm mb-1">{fas.name}</h3>
							<p class="text-xs text-muted-foreground">{fas.desc}</p>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	</section>
</div>
