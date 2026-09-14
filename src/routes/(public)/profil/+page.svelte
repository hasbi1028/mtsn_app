<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import School from '@lucide/svelte/icons/school';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Network from '@lucide/svelte/icons/network';
</script>

<svelte:head>
	<title>Profil — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={School} title="Profil Sekolah" subtitle="Mengenal lebih dekat MTsN 2 Kolaka Utara" accent="sky" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<Card class="mb-6">
				<CardContent class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-3 rounded-full bg-primary/10">
							<School class="size-6 text-primary" />
						</div>
						<h2 class="text-lg font-semibold">Tentang MTsN 2 Kolaka Utara</h2>
					</div>
					<p class="text-sm text-muted-foreground leading-relaxed mb-4">
						Madrasah Tsanawiyah Negeri 2 Kolaka Utara merupakan salah satu lembaga pendidikan menengah pertama
						yang berada di bawah naungan Kementerian Agama Republik Indonesia. Berlokasi di Kabupaten Kolaka Utara,
						Sulawesi Tenggara, madrasah ini berkomitmen untuk menghasilkan lulusan yang unggul dalam bidang akademik
						dan berakhlak mulia.
					</p>
					<p class="text-sm text-muted-foreground leading-relaxed">
						Dengan tenaga pendidik yang profesional dan berdedikasi, MTsN 2 Kolaka Utara terus berupaya
						meningkatkan kualitas pendidikan guna membentuk generasi muslim yang cerdas, kreatif, dan bertakwa.
					</p>
				</CardContent>
			</Card>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardContent class="p-6">
						<h3 class="font-semibold mb-3">Data Sekolah</h3>
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Nama</dt>
								<dd class="font-medium">MTsN 2 Kolaka Utara</dd>
							</div>
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">NPSN</dt>
								<dd>—</dd>
							</div>
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">NSM</dt>
								<dd>—</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-muted-foreground">Status</dt>
								<dd class="font-medium">Negeri</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
				<Card>
					<CardContent class="p-6">
						<h3 class="font-semibold mb-3">Identitas</h3>
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Kementerian</dt>
								<dd>Kementerian Agama</dd>
							</div>
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Provinsi</dt>
								<dd>Sulawesi Tenggara</dd>
							</div>
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Kabupaten</dt>
								<dd>Kolaka Utara</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-muted-foreground">Tahun Berdiri</dt>
								<dd>—</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			</div>

			<Card class="mt-4">
				<CardContent class="p-6">
					<div class="flex items-center gap-2 mb-3">
						<MapPin class="size-4 text-primary" />
						<h3 class="font-semibold">Lokasi</h3>
					</div>
					<p class="text-sm text-muted-foreground">Jl. Pendidikan No. 1, Kabupaten Kolaka Utara, Sulawesi Tenggara, Indonesia</p>
				</CardContent>
			</Card>

			<Card class="mt-4">
				<CardContent class="p-6">
					<div class="flex items-center gap-2 mb-3">
						<Network class="size-4 text-primary" />
						<h3 class="font-semibold">Struktur Organisasi</h3>
					</div>
					<p class="text-sm text-muted-foreground mb-3">
						Susunan pimpinan, tenaga kependidikan, guru, dan wali kelas MTsN 2 Kolaka Utara.
					</p>
					<a
						href="/profil/struktur"
						class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
					>
						Lihat bagan struktur organisasi →
					</a>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
