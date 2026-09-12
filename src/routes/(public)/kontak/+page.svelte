<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import Clock from '@lucide/svelte/icons/clock';
</script>

<svelte:head>
	<title>Kontak — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={Phone} title="Kontak" subtitle="Hubungi kami untuk informasi lebih lanjut" accent="rose" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardContent class="p-6">
						<div class="flex items-center gap-2 mb-4">
							<div class="p-2 rounded-full bg-primary/10">
								<MapPin class="size-4 text-primary" />
							</div>
							<h2 class="text-lg font-semibold">Alamat</h2>
						</div>
						<dl class="space-y-3 text-sm">
							<div>
								<dt class="text-muted-foreground mb-1">Sekolah</dt>
								<dd class="font-medium">MTsN 2 Kolaka Utara</dd>
							</div>
							<div>
								<dt class="text-muted-foreground mb-1">Alamat Lengkap</dt>
								<dd>Jl. Pendidikan No. 1, Kabupaten Kolaka Utara, Sulawesi Tenggara, Indonesia</dd>
							</div>
							<div class="flex items-center gap-2">
								<Mail class="size-4 text-muted-foreground" />
								<div>
									<dt class="text-muted-foreground">Email</dt>
									<dd>info@mtsn2kolut.sch.id</dd>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Phone class="size-4 text-muted-foreground" />
								<div>
									<dt class="text-muted-foreground">Telepon</dt>
									<dd>—</dd>
								</div>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center gap-2 mb-4">
							<div class="p-2 rounded-full bg-primary/10">
								<Clock class="size-4 text-primary" />
							</div>
							<h2 class="text-lg font-semibold">Jam Kerja</h2>
						</div>
						<dl class="space-y-2 text-sm">
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Senin — Kamis</dt>
								<dd>07:00 — 15:00 WITA</dd>
							</div>
							<div class="flex justify-between border-b pb-1">
								<dt class="text-muted-foreground">Jumat</dt>
								<dd>07:00 — 11:30 WITA</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-muted-foreground">Sabtu</dt>
								<dd>07:00 — 12:00 WITA</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			</div>

			<Card class="mt-6">
				<CardContent class="p-6">
					<div class="flex items-center gap-2 mb-4">
						<div class="p-2 rounded-full bg-primary/10">
							<MapPin class="size-4 text-primary" />
						</div>
						<h2 class="text-lg font-semibold">Lokasi</h2>
					</div>
					<div class="aspect-video w-full rounded-lg overflow-hidden border">
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127672.65295815774!2d121.4!3d-3.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2d9b1495b7e5d7b7%3A0x7c7c7c7c7c7c7c7c!2sKolaka%20Utara%2C%20Sulawesi%20Tenggara!5e0!3m2!1sid!2sid!4v1"
							width="100%"
							height="100%"
							style="border:0;"
							allowfullscreen
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							title="Lokasi MTsN 2 Kolaka Utara"
						></iframe>
					</div>
					<p class="mt-3 text-xs text-muted-foreground text-center">Klik peta untuk membuka di Google Maps</p>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
