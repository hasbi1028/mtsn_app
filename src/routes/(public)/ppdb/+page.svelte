<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
</script>

<svelte:head>
	<title>PPDB — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader icon={GraduationCap} title="Penerimaan Peserta Didik Baru" subtitle="PPDB MTsN 2 Kolaka Utara Tahun Ajaran 2026/2027" accent="emerald" />

	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			<Card class="mb-6 border-primary/20 bg-primary/5">
				<CardContent class="p-6 text-center">
					<Badge class="text-sm mb-2">Dibuka</Badge>
					<h2 class="text-lg font-semibold">PPDB 2026/2027</h2>
					<p class="text-sm text-muted-foreground">Pendaftaran dibuka mulai 1 Juli — 31 Agustus 2026</p>
				</CardContent>
			</Card>

			<div class="grid md:grid-cols-2 gap-6">
				<Card>
					<CardContent class="p-6">
						<h2 class="text-lg font-semibold mb-4">Alur Pendaftaran</h2>
						<ol class="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
							<li><strong class="text-foreground">Datang ke sekolah</strong> — Bawa berkas persyaratan ke ruang PPDB</li>
							<li><strong class="text-foreground">Isi formulir</strong> — Isi formulir pendaftaran secara lengkap</li>
							<li><strong class="text-foreground">Serahkan berkas</strong> — Serahkan berkas persyaratan kepada panitia</li>
							<li><strong class="text-foreground">Verifikasi</strong> — Panitia memverifikasi berkas yang diterima</li>
							<li><strong class="text-foreground">Pengumuman</strong> — Hasil pengumuman dapat diambil di sekolah</li>
						</ol>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<h2 class="text-lg font-semibold mb-4">Persyaratan</h2>
						<ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground">
							<li>Fotokopi Ijazah SD/MI (legalisir)</li>
							<li>Fotokopi SKHUN SD/MI (legalisir)</li>
							<li>Fotokopi Akta Kelahiran</li>
							<li>Fotokopi Kartu Keluarga (KK)</li>
							<li>Fotokopi NISN</li>
							<li>Pas foto 3x4 (4 lembar)</li>
							<li>Surat Keterangan Sehat dari Dokter</li>
							<li>Surat Keterangan Lulus dari Sekolah Asal</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card class="mt-6">
				<CardContent class="p-6">
					<h2 class="text-lg font-semibold mb-4">Jadwal</h2>
					<dl class="space-y-2 text-sm">
						<div class="flex justify-between border-b pb-1">
							<dt class="text-muted-foreground">Pendaftaran</dt>
							<dd>1 Juli — 31 Agustus 2026</dd>
						</div>
						<div class="flex justify-between border-b pb-1">
							<dt class="text-muted-foreground">Verifikasi Berkas</dt>
							<dd>1 — 15 September 2026</dd>
						</div>
						<div class="flex justify-between border-b pb-1">
							<dt class="text-muted-foreground">Pengumuman</dt>
							<dd>20 September 2026</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Daftar Ulang</dt>
							<dd>21 — 30 September 2026</dd>
						</div>
					</dl>
				</CardContent>
			</Card>

			<Card class="mt-6">
				<CardContent class="p-6 text-center">
					<p class="text-sm text-muted-foreground mb-3">Informasi lebih lanjut hubungi:</p>
					<p class="font-semibold">Sekretariat PPDB MTsN 2 Kolaka Utara</p>
					<p class="text-sm text-muted-foreground">Jl. Pendidikan No. 1, Kolaka Utara</p>
				</CardContent>
			</Card>
		</div>
	</section>
</div>
