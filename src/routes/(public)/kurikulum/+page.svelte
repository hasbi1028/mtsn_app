<script lang="ts">
	import { Card } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Target from '@lucide/svelte/icons/target';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';

	const kurikulum = [
		{
			name: 'Kurikulum Merdeka',
			description: 'Kurikulum yang diterapkan oleh Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi dengan fokus pada profil pelajar Pancasila.',
			icon: Target,
			points: [
				'Projek Penguatan Profil Pelajar Pancasila (P5)',
				'Bebas memilih muatan lokal sesuai kebutuhan',
				'Assesmen formatif dan sumatif berbasis kompetensi',
				'Pembelajaran berdiferensiasi',
			]
		},
		{
			name: 'Muatan Lokal',
			description: 'Mata pelajaran muatan lokal yang memperkuat karakter dan keterampilan siswa sesuai kearifan lokal.',
			icon: Lightbulb,
			points: [
				'Baca Tulis Al-Qur\'an (BTQ)',
				'Bahasa Arab',
				'Akhlak dan Adab',
				'Praktik Ibadah',
			]
		}
	];

	const programUnggulan = [
		'Tahfidz Al-Qur\'an',
		'Bahasa Inggris & Arab',
		'Literasi & Numerasi',
		'Projek P5',
		'Leadership & Public Speaking',
		'IT & Digital Literacy',
	];
</script>

<svelte:head>
	<title>Kurikulum — MTsN 2 Kolaka Utara</title>
	<meta name="description" content="Kurikulum pembelajaran MTsN 2 Kolaka Utara" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<PublicPageHeader icon={BookOpen} title="Kurikulum" subtitle="Kurikulum Merdeka untuk pembelajaran yang bermakna" accent="emerald" />

	<!-- Kurikulum Overview -->
	<section class="py-10">
		<div class="max-w-5xl mx-auto px-4">
			<div class="text-center mb-10">
				<h2 class="text-xl font-bold mb-3">Kurikulum yang Diterapkan</h2>
				<p class="text-muted-foreground max-w-2xl mx-auto">
					MTsN 2 Kolaka Utara menerapkan Kurikulum Merdeka dengan pendekatan pembelajaran yang berpusat pada siswa, mengembangkan potensi, bakat, serta minat sesuai dengan Profil Pelajar Pancasila.
				</p>
			</div>

			<div class="grid md:grid-cols-2 gap-6">
				{#each kurikulum as k (k.name)}
					<Card class="p-6 hover:shadow-md transition-shadow">
						<div class="flex items-center gap-3 mb-4">
							<div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
								<k.icon class="size-6 text-emerald-600" />
							</div>
							<h3 class="font-semibold text-lg">{k.name}</h3>
						</div>
						<p class="text-sm text-muted-foreground mb-4">{k.description}</p>
						<ul class="space-y-2">
							{#each k.points as point (point)}
								<li class="flex items-start gap-2 text-sm">
									<CheckCircle class="size-4 text-emerald-500 mt-0.5 shrink-0" />
									<span>{point}</span>
								</li>
							{/each}
						</ul>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Program Unggulan -->
	<section class="py-10 bg-muted/30 border-y">
		<div class="max-w-5xl mx-auto px-4">
			<h2 class="text-xl font-bold text-center mb-8">Program Unggulan</h2>
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each programUnggulan as program (program)}
					<Card class="p-4 flex-row items-center gap-3 hover:shadow-sm transition-shadow">
						<div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<CheckCircle class="size-4 text-emerald-600" />
						</div>
						<span class="text-sm font-medium">{program}</span>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Jam Pelajaran -->
	<section class="py-10">
		<div class="max-w-5xl mx-auto px-4">
			<h2 class="text-xl font-bold text-center mb-8">Struktur Jam Pelajaran</h2>
			<div class="rounded-xl border bg-card overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b bg-muted/50">
								<th class="px-4 py-3 text-left font-medium">Kelas</th>
								<th class="px-4 py-3 text-center font-medium">JP / Minggu</th>
								<th class="px-4 py-3 text-center font-medium">Jam / Minggu</th>
								<th class="px-4 py-3 text-left font-medium">Keterangan</th>
							</tr>
						</thead>
						<tbody>
							<tr class="border-b">
								<td class="px-4 py-3 font-medium">VII</td>
								<td class="px-4 py-3 text-center">36</td>
								<td class="px-4 py-3 text-center">27</td>
								<td class="px-4 py-3 text-muted-foreground">Fase E - Kelas 7</td>
							</tr>
							<tr class="border-b">
								<td class="px-4 py-3 font-medium">VIII</td>
								<td class="px-4 py-3 text-center">38</td>
								<td class="px-4 py-3 text-center">28,5</td>
								<td class="px-4 py-3 text-muted-foreground">Fase F - Kelas 8</td>
							</tr>
							<tr>
								<td class="px-4 py-3 font-medium">IX</td>
								<td class="px-4 py-3 text-center">38</td>
								<td class="px-4 py-3 text-center">28,5</td>
								<td class="px-4 py-3 text-muted-foreground">Fase F - Kelas 9</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</section>
</div>
