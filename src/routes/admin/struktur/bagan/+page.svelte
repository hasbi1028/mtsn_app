<script lang="ts">
	import { resolve } from '$app/paths';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { notify } from '$lib/toast';
	import Bagan from '$modules/struktur/components/bagan.svelte';
	import {
		bolehUbahStrukturQ,
		getRekapStrukturQ,
		simpanPengaturanBaganF
	} from '$modules/struktur/struktur.remote';

	const [bagan, bolehUbah] = $derived(
		await Promise.all([getRekapStrukturQ(), bolehUbahStrukturQ()])
	);

	const data = $derived((bagan ?? {}) as any);
	const pengaturan = $derived((data.pengaturan ?? {}) as any);
	const kolom = $derived((data.kolom ?? []) as any[]);
	const rekap = $derived((data.rekap ?? {}) as any);

	const presets = [
		{ kode: 'spanduk-2x1', label: 'Spanduk 2:1 — 2000×1000 px (500×264 mm)' },
		{ kode: 'a2', label: 'PDF A2 landscape (594×420 mm)' },
		{ kode: 'a3', label: 'PDF A3 landscape (420×297 mm)' },
		{ kode: 'a4', label: 'PDF A4 landscape (297×210 mm)' }
	];
	let preset = $state('spanduk-2x1');
	let pakaiNip = $state(false);
	let lastHasil: unknown = null;

	// Ikuti pengaturan: sekali data pengaturan termuat, samakan saklar NIP & preset.
	$effect(() => {
		if (pengaturan && typeof pengaturan.tampilNip === 'boolean') pakaiNip = pengaturan.tampilNip;
	});

	$effect(() => {
		const r: any = simpanPengaturanBaganF.result;
		if (!r || r === lastHasil) return;
		lastHasil = r;
		if (r.ok) {
			notify.success(r.pesan || 'Pengaturan disimpan.');
			void getRekapStrukturQ().refresh();
		} else {
			notify.error(r.error || 'Pengaturan gagal disimpan.');
		}
	});

	const urlPng = $derived(`/api/struktur/bagan.png?preset=${preset}&nip=${pakaiNip ? '1' : '0'}`);
	const urlCetak = $derived(
		resolve(`/admin/struktur/bagan/cetak/${preset}?nip=${pakaiNip ? '1' : '0'}`)
	);
</script>

<svelte:head><title>Bagan &amp; Cetak — Struktur Organisasi</title></svelte:head>

<PageLayout
	title="Bagan &amp; Cetak"
	description="Pratinjau bagan, pengaturan judul/kop, dan ekspor (PNG spanduk atau PDF siap cetak)"
>
	{#snippet actions()}
		<div class="flex flex-wrap gap-2">
			<a href={resolve('/admin/struktur')} class="inline-flex">
				<Button size="sm" variant="outline" class="h-8 cursor-pointer">Daftar Unit</Button>
			</a>
			<Button
				size="sm"
				variant="outline"
				class="h-8 cursor-pointer"
				onclick={async () => {
					const p = window.open(urlPng, '_blank');
					if (p) notify.info('PNG dibuat di server — tunggu beberapa detik.');
				}}
			>
				Buat PNG
			</Button>
			<a href={urlPng} download={`bagan-struktur-${preset}.png`} class="inline-flex">
				<Button size="sm" variant="outline" class="h-8 cursor-pointer">Unduh PNG</Button>
			</a>
			<a href={urlCetak} target="_blank" rel="noopener" class="inline-flex">
				<Button size="sm" class="h-8 cursor-pointer">Cetak / PDF</Button>
			</a>
		</div>
	{/snippet}

	<div class="flex flex-wrap items-center gap-2 rounded-lg border p-3">
		<div class="space-y-1">
			<label class="text-xs text-muted-foreground" for="preset">Ukuran</label>
			<select id="preset" bind:value={preset} class="h-8 rounded-md border bg-background px-2 text-xs">
				{#each presets as p (p.kode)}
					<option value={p.kode}>{p.label}</option>
				{/each}
			</select>
		</div>
		<label class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
			<input type="checkbox" bind:checked={pakaiNip} /> Sertakan NIP (hanya untuk dokumen internal)
		</label>
		<div class="mt-4 flex flex-wrap items-center gap-2">
			<Badge variant="outline" class="text-[10px]">{rekap.pegawaiUnik ?? 0} pegawai</Badge>
			<Badge variant="outline" class="text-[10px]">{rekap.anggotaAktif ?? 0} entri</Badge>
			<Badge variant="outline" class="text-[10px]">{kolom.length} kolom</Badge>
			{#if pengaturan.publikAktif}
				<Badge variant="secondary" class="text-[10px]">publik aktif</Badge>
			{:else}
				<Badge variant="destructive" class="text-[10px]">publik nonaktif</Badge>
			{/if}
		</div>
	</div>

	<!-- Pratinjau -->
	<div class="rounded-lg border p-3">
		<p class="mb-2 text-sm font-semibold">Pratinjau bagan</p>
		<Bagan
			{kolom}
			judul={pengaturan.judul}
			tahun={pengaturan.tahun}
			kop={pengaturan.kop}
			badge={data.badge}
			mode="web"
			publik={!pakaiNip}
		/>
		{#if kolom.length === 0}
			<p class="mt-2 text-xs text-muted-foreground">
				Bagan kosong — tambahkan unit &amp; anggota di <a class="underline" href={resolve('/admin/struktur')}>Daftar Unit</a>.
			</p>
		{/if}
	</div>

	<!-- Pengaturan -->
	{#if bolehUbah}
		<form {...simpanPengaturanBaganF} class="space-y-3 rounded-lg border p-3">
			<p class="text-sm font-semibold">Pengaturan bagan</p>
			<div class="grid gap-2 md:grid-cols-2">
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_kop">Kop</label>
					<Input id="struktur_kop" name="struktur_kop" value={pengaturan.kop ?? ''} class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_judul">Judul</label>
					<Input id="struktur_judul" name="struktur_judul" value={pengaturan.judul ?? ''} class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_tahun">Tahun pelajaran</label>
					<Input id="struktur_tahun" name="struktur_tahun" value={pengaturan.tahun ?? ''} class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_sk">Nomor SK (baris sub judul)</label>
					<Input
						id="struktur_sk"
						name="struktur_sk"
						value={pengaturan.sk ?? ''}
						placeholder="SK No. 023 Tahun 2026"
						class="h-8 text-xs"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_badge">
						Badge jumlah orang (kosong = otomatis)
					</label>
					<Input
						id="struktur_badge"
						name="struktur_badge"
						value={pengaturan.badge ?? ''}
						placeholder="44"
						class="h-8 text-xs"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_kamad_nama">Nama Kepala Madrasah</label>
					<Input
						id="struktur_kamad_nama"
						name="struktur_kamad_nama"
						value={pengaturan.kamadNama ?? ''}
						class="h-8 text-xs"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_kamad_nip">NIP Kepala Madrasah</label>
					<Input
						id="struktur_kamad_nip"
						name="struktur_kamad_nip"
						value={pengaturan.kamadNip ?? ''}
						class="h-8 text-xs"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="struktur_tempat_tgl">Tempat &amp; tanggal penetapan</label>
					<Input
						id="struktur_tempat_tgl"
						name="struktur_tempat_tgl"
						value={pengaturan.tempatTgl ?? ''}
						placeholder="Kolaka Utara, 13 Juli 2026"
						class="h-8 text-xs"
					/>
				</div>
			</div>
			<div class="flex flex-wrap gap-4">
				<label class="flex items-center gap-2 text-xs text-muted-foreground">
					<input type="checkbox" name="struktur_tampil_nip" checked={pengaturan.tampilNip} />
					Tampilkan NIP di bagan (internal)
				</label>
				<label class="flex items-center gap-2 text-xs text-muted-foreground">
					<input type="checkbox" name="struktur_publik_aktif" checked={pengaturan.publikAktif} />
					Tayangkan di halaman publik /profil/struktur
				</label>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm" class="h-8 cursor-pointer" disabled={simpanPengaturanBaganF.pending > 0}>
					Simpan pengaturan
				</Button>
				<a href="/profil/struktur" target="_blank" rel="noopener" class="inline-flex">
					<Button type="button" size="sm" variant="outline" class="h-8 cursor-pointer">Lihat halaman publik</Button>
				</a>
			</div>
		</form>
	{/if}
</PageLayout>
