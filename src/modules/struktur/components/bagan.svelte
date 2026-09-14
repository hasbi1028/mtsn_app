<script lang="ts">
	/**
	 * Bagan struktur organisasi — SATU komponen untuk tiga tempat:
	 *  - mode="web"   : tampilan responsif (admin & halaman publik)
	 *  - mode="cetak" : kanvas tetap 2000×1000 (2:1) untuk spanduk/A2 + PNG
	 *
	 * Padanan visual: struktur-foto-v2-premium.html (premium hijau-emas, latar krem,
	 * foto placeholder 3:4, tanpa foto asli → inisial). Agar 71 entri tetap muat di
	 * kanvas 1000 px, kotak dengan >8 anggota mengalir ke DUA sub-kolom dan kartu
	 * dibuat rapat (tinggi 22 px).
	 */
	import type { BaganKolom } from '../struktur-bagan.util';

	let {
		kolom,
		judul = 'STRUKTUR ORGANISASI',
		tahun = '',
		kop = '',
		badge = '',
		mode = 'web',
		publik = false,
		catatanKaki = '',
		tempatTgl = '',
		ttdNama = '',
		ttdNip = ''
	}: {
		kolom: BaganKolom[];
		judul?: string;
		tahun?: string;
		kop?: string;
		badge?: string;
		mode?: 'web' | 'cetak';
		publik?: boolean;
		catatanKaki?: string;
		tempatTgl?: string;
		ttdNama?: string;
		ttdNip?: string;
	} = $props();

	const kolomTerisi = $derived(kolom.filter((k) => k.kotak.length > 0));
	const jumlahKolom = $derived(Math.max(1, kolomTerisi.length));

	/** Lebar kolom cetak proporsional dengan banyaknya entri (biar seimbang). */
	function bobot(k: BaganKolom): number {
		return Math.max(1, k.kotak.reduce((n, x) => n + Math.max(1, x.anggota.length), 0));
	}

	/** Ambang entri untuk mengalir jadi dua sub-kolom (biar tidak terpotong). */
	const AMBANG_DUA_KOLOM = 8;

	/** Inisial untuk placeholder foto (mis. "Abdillah, S.Pd" → "AS" → "A"). */
	function inisial(nama: string): string {
		const bersih = (nama ?? '').replace(/[^A-Za-z\u00C0-\u024F ]/g, ' ').trim();
		if (!bersih) return '?';
		return bersih
			.split(/\s+/)
			.slice(0, 2)
			.map((t) => t[0]?.toUpperCase() ?? '')
			.join('');
	}

	type Anggota = BaganKolom['kotak'][number]['anggota'][number];

	function pakaiFoto(foto?: string): boolean {
		return !!foto && (foto.startsWith('/') || foto.startsWith('http'));
	}
</script>

{#snippet fotoAnggota(a: Anggota, kelas: string)}
	{#if pakaiFoto(a.foto)}
		<img class={kelas} src={a.foto} alt={a.nama} loading="lazy" />
	{:else}
		<div class={kelas + ' flex items-center justify-center bg-[#e7efe9] font-bold text-[#0a5c36]'}>
			{inisial(a.nama)}
		</div>
	{/if}
{/snippet}

{#snippet kartuAnggotaWeb(a: Anggota)}
	<div class="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-left leading-tight">
		{@render fotoAnggota(a, 'h-9 w-7 shrink-0 rounded border object-cover text-[10px]')}
		<div class="min-w-0">
			{#if a.label}<p class="text-[10px] font-semibold text-primary uppercase">{a.label}</p>{/if}
			<p class="text-xs font-semibold">{a.nama}</p>
			{#if a.keterangan}<p class="text-[10px] text-muted-foreground">{a.keterangan}</p>{/if}
			{#if !publik && a.nip}<p class="text-[9px] text-muted-foreground">NIP. {a.nip}</p>{/if}
		</div>
	</div>
{/snippet}

{#snippet kotakUnitWeb(k: BaganKolom['kotak'][number])}
	<div class="rounded-lg border-2 border-primary/40 bg-background">
		<div class="rounded-t-md bg-primary px-2 py-1 text-center text-white">
			<p class="text-[11px] font-bold uppercase tracking-wide">{k.judul}</p>
		</div>
		<div class="space-y-1 p-1.5">
			{#each k.anggota as a (a.nama + a.keterangan + a.label)}
				{@render kartuAnggotaWeb(a)}
			{:else}
				<p class="py-1 text-center text-[10px] text-muted-foreground">—</p>
			{/each}
		</div>
	</div>
{/snippet}

{#if mode === 'cetak'}
	<!-- KANVAS CETAK: 2000×1000 px (2:1) — 1 px = 0,26458 mm @96dpi -->
	<div class="struktur-page">
		<div class="sp-header">
			<div class="sp-kop">{kop}</div>
			<h1>{judul}</h1>
			<h2>MTsN 2 KOLAKA UTARA</h2>
			{#if tahun}<div class="sp-sub">Tahun Pelajaran {tahun}</div>{/if}
			{#if badge}<div class="sp-badge"><small>JUMLAH PEGAWAI</small>{badge} ORANG</div>{/if}
		</div>

		<div class="sp-body">
			{#each kolomTerisi as k (k.kolom)}
				<div class="sp-kolom" style="flex-grow:{bobot(k)}">
					{#each k.kotak as kotak (kotak.kode)}
						<div class="sp-kotak">
							<div class="sp-kotak-judul">
								{kotak.judul}{kotak.anggota.length > 1 ? ` (${kotak.anggota.length})` : ''}
							</div>
							<div class="sp-kotak-isi" class:sp-dua-kolom={kotak.anggota.length > AMBANG_DUA_KOLOM}>
								{#each kotak.anggota as a (a.nama + a.keterangan + a.label)}
									<div class="sp-kartu">
										{#if pakaiFoto(a.foto)}
											<img class="sp-foto" src={a.foto} alt={a.nama} />
										{:else}
											<div class="sp-foto sp-inisial">{inisial(a.nama)}</div>
										{/if}
										<div class="sp-teks">
											{#if a.label}<div class="sp-label">{a.label}</div>{/if}
											<div class="sp-nama">{a.nama}</div>
											{#if a.keterangan}<div class="sp-ket">{a.keterangan}</div>{/if}
											{#if !publik && a.nip}<div class="sp-nip">NIP. {a.nip}</div>{/if}
										</div>
									</div>
								{:else}
									<div class="sp-kartu sp-kosong">—</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<div class="sp-siswa">S I S W A</div>
		<div class="sp-kaki">
			<div class="sp-catatan">{catatanKaki}</div>
			{#if ttdNama}
				<div class="sp-ttd">
					{#if tempatTgl}<div class="sp-ttd-tempat">{tempatTgl}</div>{/if}
					<div>Kepala Madrasah</div>
					<div class="sp-ttd-nama">{ttdNama}</div>
					<div>{ttdNip ? `NIP. ${ttdNip}` : ''}</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="space-y-3">
		<div class="rounded-lg border bg-card p-3 text-center">
			{#if kop}<p class="text-[11px] font-medium tracking-wide text-muted-foreground">{kop}</p>{/if}
			<h2 class="text-base font-bold">{judul}</h2>
			<p class="text-xs text-muted-foreground">
				MTsN 2 Kolaka Utara{#if tahun} · TP {tahun}{/if}{#if badge} · {badge} pegawai{/if}
			</p>
		</div>

		<div class="grid gap-3" style="grid-template-columns: repeat({jumlahKolom}, minmax(0, 1fr));">
			{#each kolomTerisi as k (k.kolom)}
				<div class="space-y-3">
					{#each k.kotak as kotak (kotak.kode)}
						{@render kotakUnitWeb(kotak)}
					{/each}
				</div>
			{/each}
		</div>
		{#if kolomTerisi.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">Belum ada unit yang tampil di bagan.</p>
		{/if}
	</div>
{/if}

<style>
	/* ── Kanvas cetak: ukuran tetap supaya rasio spanduk 2:1 tidak melar ── */
	.struktur-page {
		width: 2000px;
		height: 1000px;
		background: #fdfcf7;
		color: #1b2a22;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: 'Segoe UI', Calibri, Arial, sans-serif;
	}
	.sp-header {
		position: relative;
		background: linear-gradient(180deg, #0d7a48 0%, #0a5c36 55%, #063f25 100%);
		color: #fff;
		text-align: center;
		padding: 9px 200px 8px;
		flex: 0 0 auto;
		border-bottom: 4px solid #c9a227;
	}
	.sp-kop {
		font-size: 12px;
		letter-spacing: 2px;
		font-weight: 600;
		color: #f4d47a;
	}
	.sp-header h1 {
		font-size: 33px;
		font-weight: 800;
		letter-spacing: 2px;
		margin: 1px 0;
		line-height: 1.1;
	}
	.sp-header h2 {
		font-size: 19px;
		font-weight: 600;
		letter-spacing: 1px;
		color: #eaf6ef;
		line-height: 1.1;
	}
	.sp-sub {
		font-size: 11px;
		color: #cfe8d9;
		margin-top: 1px;
	}
	.sp-badge {
		position: absolute;
		right: 22px;
		top: 50%;
		transform: translateY(-50%);
		background: #fff;
		color: #0a5c36;
		border: 3px solid #c9a227;
		border-radius: 10px;
		padding: 4px 14px;
		font-weight: 800;
		font-size: 15px;
		line-height: 1.1;
	}
	.sp-badge small {
		display: block;
		font-size: 8px;
		font-weight: 600;
		letter-spacing: 1px;
		color: #555;
	}
	.sp-body {
		flex: 1 1 auto;
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px 16px 0;
		min-height: 0;
		overflow: hidden;
	}
	.sp-kolom {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}
	.sp-kotak {
		border: 2px solid #0a5c36;
		border-radius: 6px;
		overflow: hidden;
		background: #fff;
		flex: 0 0 auto;
	}
	.sp-kotak-judul {
		background: linear-gradient(180deg, #0a5c36, #063f25);
		color: #fff;
		text-align: center;
		font-size: 10.5px;
		font-weight: 800;
		letter-spacing: 0.3px;
		padding: 2px 4px;
		border-bottom: 2px solid #c9a227;
		line-height: 1.2;
	}
	.sp-kotak-isi {
		padding: 2px;
		display: flex;
		flex-direction: column;
		gap: 1.5px;
	}
	/* Kotak dengan banyak anggota: alirkan ke dua sub-kolom */
	.sp-dua-kolom {
		display: block;
		columns: 2;
		column-gap: 3px;
	}
	.sp-dua-kolom > .sp-kartu {
		break-inside: avoid;
		margin-bottom: 1.5px;
	}
	.sp-kartu {
		height: 22px;
		border: 1px solid rgba(10, 92, 54, 0.4);
		border-radius: 3px;
		padding: 1px 2px;
		background: #fff;
		display: flex;
		align-items: center;
		gap: 3px;
		overflow: hidden;
	}
	.sp-foto {
		width: 15px;
		height: 20px;
		object-fit: cover;
		border-radius: 2px;
		border: 1px solid rgba(10, 92, 54, 0.3);
		flex: 0 0 auto;
		display: block;
	}
	.sp-inisial {
		background: #e7efe9;
		color: #0a5c36;
		font-size: 8px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sp-teks {
		min-width: 0;
		text-align: left;
		line-height: 1.05;
	}
	.sp-label {
		font-size: 7.5px;
		font-weight: 800;
		color: #063f25;
		text-transform: uppercase;
		letter-spacing: 0.2px;
	}
	.sp-nama {
		font-size: 8.5px;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-ket {
		font-size: 7.5px;
		color: #555;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-nip {
		font-size: 7px;
		color: #888;
	}
	.sp-kosong {
		justify-content: center;
		font-size: 10px;
		color: #999;
	}
	.sp-siswa {
		flex: 0 0 auto;
		margin: 6px 16px 0;
		background: linear-gradient(90deg, #063f25, #0a5c36);
		color: #fff;
		text-align: center;
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 12px;
		padding: 3px 0;
		border-radius: 6px;
		border-bottom: 3px solid #c9a227;
	}
	.sp-kaki {
		flex: 0 0 auto;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		padding: 3px 16px 8px;
	}
	.sp-catatan {
		font-size: 8px;
		color: #444;
		line-height: 1.35;
		max-width: 1300px;
	}
	.sp-ttd {
		text-align: center;
		font-size: 8.5px;
		color: #1b2a22;
		line-height: 1.35;
		min-width: 240px;
		flex: 0 0 auto;
	}
	.sp-ttd-tempat {
		margin-bottom: 2px;
	}
	.sp-ttd-nama {
		font-weight: 800;
		text-decoration: underline;
		margin-top: 14px;
	}
</style>
