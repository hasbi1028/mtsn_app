<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Target from '@lucide/svelte/icons/target';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Flag from '@lucide/svelte/icons/flag';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Visi & Misi — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={Target} title="Visi & Misi" subtitle="Arah dan tujuan pendidikan MTsN 2 Kolaka Utara" accent="sky" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<a href="/profil" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
				<ArrowLeft class="size-4" />
				Kembali
			</a>

			<Card class="mb-6">
				<CardContent class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 rounded-full bg-primary/10">
							<Target class="size-5 text-primary" />
						</div>
						<h2 class="text-lg font-semibold">Visi</h2>
					</div>
					<p class="text-sm leading-relaxed italic pl-11">
						"Terwujudnya Peserta Didik yang Cerdas, Kreatif, Berakhlak Mulia, dan Berdaya Saing Global"
					</p>
				</CardContent>
			</Card>

			<Card class="mb-6">
				<CardContent class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 rounded-full bg-primary/10">
							<Rocket class="size-5 text-primary" />
						</div>
						<h2 class="text-lg font-semibold">Misi</h2>
					</div>
					<ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground pl-11">
						<li>Menyelenggarakan pendidikan yang berkualitas berdasarkan kurikulum nasional dan nilai-nilai Islam</li>
						<li>Mengembangkan potensi peserta didik secara optimal melalui kegiatan akademik dan non-akademik</li>
						<li>Menanamkan nilai-nilai akhlakul karimah dalam kegiatan belajar mengajar</li>
						<li>Menyiapkan peserta didik yang mampu bersaing di tingkat nasional dan global</li>
						<li>Memberdayakan seluruh sumber daya madrasah untuk mencapai keunggulan</li>
					</ol>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 rounded-full bg-primary/10">
							<Flag class="size-5 text-primary" />
						</div>
						<h2 class="text-lg font-semibold">Tujuan</h2>
					</div>
					<ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground pl-11">
						<li>Meningkatkan prestasi akademik peserta didik</li>
						<li>Mengembangkan karakter peserta didik yang berakhlak mulia</li>
						<li>Meningkatkan kompetensi guru dan tenaga kependidikan</li>
						<li>Mewujudkan sarana dan prasarana yang memadai</li>
						<li>Memperluas kerjasama dengan berbagai pihak</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
