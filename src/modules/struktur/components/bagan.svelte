<script lang="ts">
	/**
	 * Bagan struktur organisasi — SATU komponen untuk tiga tempat:
	 *  - mode="web"   : tampilan responsif (admin & halaman publik)
	 *  - mode="cetak" : kanvas tetap 2000×1000 (2:1) untuk spanduk/PDF/PNG
	 *
	 * Layout cetak mengikuti acuan `struktur-foto-v4-nip.html`: logo Kemenag kiri,
	 * badge jumlah pegawai kanan, baris puncak (Ketua Komite putus-putus + Kepala
	 * Madrasah), lima kolom dengan KEPALA UNIT sebagai header kotak (foto + nama +
	 * NIP), lalu isi kotak: bar judul + kartu orang (foto 3:4 + nama + NIP + mapel),
	 * grid 3 sub-kolom untuk daftar panjang (guru & wali kelas), kotak catatan untuk
	 * unit tanpa daftar orang (mis. Wakamad Humas), band SISWA, dan blok tanda tangan.
	 */
	import type { BaganKolom } from '../struktur-bagan.util';

	type Anggota = BaganKolom['kotak'][number]['anggota'][number];
	type Kotak = BaganKolom['kotak'][number];

	let {
		kolom,
		judul = 'STRUKTUR ORGANISASI',
		tahun = '',
		kop = '',
		badge = '',
		sk = '',
		logo = '/uploads/logo-kemenag.png',
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
		sk?: string;
		logo?: string;
		mode?: 'web' | 'cetak';
		publik?: boolean;
		catatanKaki?: string;
		tempatTgl?: string;
		ttdNama?: string;
		ttdNip?: string;
	} = $props();

	const kolomTerisi = $derived(kolom.filter((k) => k.kotak.length > 0));
	const barisAtas = $derived(kolomTerisi.filter((k) => k.kolom <= 0).flatMap((k) => k.kotak));
	const kolomBawah = $derived(kolomTerisi.filter((k) => k.kolom > 0));
	const jumlahKolom = $derived(Math.max(1, kolomTerisi.length));

	/** Kepala unit = anggota dengan flag `kepala` (tampil sebagai header kotak). */
	function kepalaDari(k: Kotak): Anggota | null {
		return k.anggota.find((a) => a.kepala) ?? null;
	}

	/** Anggota yang tampil di badan kotak (kepala unit sudah naik ke header). */
	function isiKotak(k: Kotak): Anggota[] {
		return k.anggota.filter((a) => !a.kepala);
	}

	/** Lebar kolom proporsional dengan isinya supaya tinggi tiap kolom seimbang. */
	function bobot(k: BaganKolom): number {
		return Math.max(1, k.kotak.reduce((n, x) => n + Math.max(1, isiKotak(x).length), 0));
	}

	/** "VII-A" / "IX.B" → kode kelas (ditampilkan di baris pertama kartu wali). */
	function adalahKelas(s: string): boolean {
		return /^(VII|VIII|IX)\s*[.\-\s]?\s*[A-Z]$/i.test((s ?? '').trim());
	}

	function inisial(nama: string): string {
		const bersih = (nama ?? '').replace(/[^A-Za-z\u00C0-\u024F ]/g, ' ').trim();
		if (!bersih) return '?';
		return bersih
			.split(/\s+/)
			.slice(0, 2)
			.map((t) => t[0]?.toUpperCase() ?? '')
			.join('');
	}

	function pakaiFoto(foto?: string): boolean {
		return !!foto && (foto.startsWith('/') || foto.startsWith('http'));
	}

	/** Teks kotak catatan: pakai `catatan` unit, atau rangkum "keterangan/label: nama" anggotanya. */
	function teksCatatan(k: Kotak): string {
		if (k.catatan) return k.catatan;
		return isiKotak(k)
			.map((a) => {
				const kunci = (a.keterangan || a.label || '').trim();
				return kunci ? `${kunci}: ${a.nama}` : a.nama;
			})
			.join(' • ');
	}
</script>

{#snippet fotoAnggota(a: Anggota, kelas: string)}
	{#if pakaiFoto(a.foto)}
		<img class={kelas} src={a.foto} alt={a.nama} loading="lazy" />
	{:else}
		<div class={kelas + ' sp-placeholder'}>{inisial(a.nama)}</div>
	{/if}
{/snippet}

{#snippet kartuWeb(a: Anggota)}
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

{#snippet kotakWeb(k: Kotak)}
	<div class="rounded-lg border-2 border-primary/40 bg-background">
		<div class="rounded-t-md bg-primary px-2 py-1 text-center text-white">
			<p class="text-[11px] font-bold uppercase tracking-wide">{k.judul}</p>
		</div>
		<div class="space-y-1 p-1.5">
			{#each k.anggota as a (a.nama + a.keterangan + a.label)}
				{@render kartuWeb(a)}
			{:else}
				<p class="py-1 text-center text-[10px] text-muted-foreground">—</p>
			{/each}
		</div>
	</div>
{/snippet}

<!-- ── Kartu orang pada kanvas cetak: foto 3:4 + nama + NIP + keterangan ── -->
{#snippet kartuCetak(a: Anggota, wajibLabel: boolean)}
	<div class="sp-kartu">
		{@render fotoAnggota(a, 'sp-foto')}
		<div class="sp-teks">
			{#if a.label && (wajibLabel || !adalahKelas(a.keterangan))}<div class="sp-label">{a.label}</div>{/if}
			{#if adalahKelas(a.keterangan)}<div class="sp-kelas">{a.keterangan.replace(/[.\-]/, ' ')}</div>{/if}
			<div class="sp-nama">{a.nama}</div>
			{#if !publik && a.nip}<div class="sp-nip">NIP. {a.nip}</div>{/if}
			{#if a.keterangan && !adalahKelas(a.keterangan)}<div class="sp-ket">{a.keterangan}</div>{/if}
		</div>
	</div>
{/snippet}

{#snippet kotakPuncak(k: Kotak)}
	{@const orang = kepalaDari(k) ?? isiKotak(k)[0]}
	{#if orang}
		<div class="sp-box" class:sp-mitra={k.kelompok.toUpperCase() === 'MITRA'} class:sp-utama={k.kelompok.toUpperCase() !== 'MITRA'}>
			{@render fotoAnggota(orang, 'sp-foto-puncak')}
			<div class="sp-teks">
				<div class="sp-jab">{orang.label || k.judul}</div>
				<div class="sp-nama-puncak">{orang.nama}</div>
				{#if !publik && orang.nip}<div class="sp-nip">NIP. {orang.nip}</div>{/if}
			</div>
		</div>
	{/if}
{/snippet}

{#if mode === 'cetak'}
	<!-- KANVAS CETAK: 2000×1000 px (2:1) — 1 px = 0,26458 mm @96dpi -->
	<div class="struktur-page">
		<div class="sp-header">
			<img class="sp-logo" src={logo} alt="Logo Kemenag" />
			<div class="sp-kemenag">{kop}</div>
			<h1>{judul}</h1>
			<h2>MTsN 2 KOLAKA UTARA</h2>
			<div class="sp-sub">
				{#if tahun}Tahun Pelajaran {tahun}{/if}{#if tahun && sk}&nbsp;•&nbsp;{/if}{#if sk}{sk}{/if}
			</div>
			{#if badge}<div class="sp-badge"><small>JUMLAH PEGAWAI</small>{badge} ORANG</div>{/if}
		</div>

		<div class="sp-row1">
			{#each barisAtas as kotak (kotak.kode)}
				{@render kotakPuncak(kotak)}
			{/each}
		</div>
		<div class="sp-ctop"></div>

		<div class="sp-cols">
			{#each kolomBawah as k (k.kolom)}
				{@const kepalaKotak = k.kotak.find((x) => kepalaDari(x)) ?? null}
				{@const kepala = kepalaKotak ? kepalaDari(kepalaKotak) : null}
				<div class="sp-col" style="flex-grow:{Math.max(3, bobot(k))}">
					{#if kepala && kepalaKotak}
						<div class="sp-head">
							{@render fotoAnggota(kepala, 'sp-foto-head')}
							<div class="sp-teks">
								<div class="sp-jab">{kepala.label || kepalaKotak.judul}</div>
								<div class="sp-nama-head">{kepala.nama}</div>
								{#if !publik && kepala.nip}<div class="sp-nip">NIP. {kepala.nip}</div>{/if}
							</div>
						</div>
					{/if}

					<div class="sp-body">
						{#each k.kotak as kotak (kotak.kode)}
							{#if isiKotak(kotak).length === 0 && !kotak.catatan}
								<!-- kotak kepala tanpa isi: tidak perlu badan -->
							{:else if kotak.tipe === 'catatan'}
								<div class="sp-note">
									<b>{kotak.judul}:</b>
									{teksCatatan(kotak)}
								</div>
							{:else if isiKotak(kotak).length === 1 && kotak.tipe !== 'grid'}
								{@render kartuCetak(isiKotak(kotak)[0], true)}
							{:else}
								<div class="sp-subbar">
									{kotak.judul}{#if kotak.tipe === 'grid' && isiKotak(kotak).length > 1}&nbsp;({isiKotak(kotak).length}){/if}
								</div>
								{#if kotak.tipe === 'grid'}
									<div class="sp-grid">
										{#each isiKotak(kotak) as a (a.nama + a.keterangan + a.label)}
											{@render kartuCetak(a, false)}
										{/each}
									</div>
								{:else}
									{#each isiKotak(kotak) as a (a.nama + a.keterangan + a.label)}
										{@render kartuCetak(a, true)}
									{/each}
								{/if}
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="sp-siswa">S I S W A</div>

		<div class="sp-footer">
			<div class="sp-catatan">{catatanKaki}</div>
			{#if ttdNama}
				<div class="sp-ttd">
					{#if tempatTgl}<div>Ditetapkan di : {tempatTgl}</div>{/if}
					<div class="sp-ttd-ruang"></div>
					<div class="sp-ttd-nama">{ttdNama}</div>
					<div>{ttdNip ? `Kepala Madrasah — NIP. ${ttdNip}` : 'Kepala Madrasah'}</div>
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
						{@render kotakWeb(kotak)}
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
	/* ── Kanvas cetak 2000×1000 (rasio spanduk 2:1) ── */
	.struktur-page {
		width: 2000px;
		height: 1000px;
		background: #fff;
		color: #1b2a22;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: 'Segoe UI', Calibri, Arial, sans-serif;
	}

	/* Header */
	.sp-header {
		position: relative;
		background: linear-gradient(180deg, #0f7a49 0%, #0a5c36 60%, #074a2b 100%);
		color: #fff;
		text-align: center;
		padding: 8px 210px 7px;
		flex: 0 0 auto;
	}
	.sp-logo {
		position: absolute;
		left: 26px;
		top: 50%;
		transform: translateY(-50%);
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #fff;
		object-fit: contain;
		padding: 3px;
	}
	.sp-kemenag {
		font-size: 13px;
		letter-spacing: 3px;
		font-weight: 600;
		color: #f4d47a;
	}
	.sp-header h1 {
		font-size: 42px;
		font-weight: 800;
		letter-spacing: 3px;
		margin: 0;
		line-height: 1.05;
	}
	.sp-header h2 {
		font-size: 26px;
		font-weight: 700;
		letter-spacing: 1.5px;
		margin: 0;
		line-height: 1.15;
		color: #f2fbf5;
	}
	.sp-sub {
		font-size: 13px;
		color: #cfe8d9;
		margin-top: 1px;
	}
	.sp-badge {
		position: absolute;
		right: 26px;
		top: 50%;
		transform: translateY(-50%);
		background: #fff;
		color: #063f25;
		border: 3px solid #c9a227;
		border-radius: 12px;
		padding: 5px 16px;
		text-align: center;
		font-weight: 800;
		font-size: 19px;
		line-height: 1.15;
	}
	.sp-badge small {
		display: block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1px;
		color: #555;
	}

	/* Baris puncak */
	.sp-row1 {
		position: relative;
		flex: 0 0 auto;
		display: flex;
		justify-content: center;
		gap: 150px;
		padding: 10px 34px 0;
	}
	.sp-box {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border: 2.5px solid #0a5c36;
		border-radius: 10px;
		padding: 6px 16px;
	}
	.sp-box.sp-mitra {
		border-style: dashed;
		border-color: #8a8a8a;
		background: #fafafa;
		min-width: 250px;
	}
	.sp-box.sp-mitra .sp-jab {
		color: #555;
	}
	.sp-box.sp-utama {
		border-width: 3.5px;
		background: #e8f3ec;
		min-width: 400px;
		padding: 8px 30px;
	}
	.sp-foto-puncak {
		width: 50px;
		height: 60px;
		object-fit: cover;
		border-radius: 6px;
		border: 2px solid #0a5c36;
		background: #f1f5f9;
		flex: 0 0 auto;
	}
	.sp-jab {
		font-size: 13px;
		font-weight: 800;
		color: #063f25;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}
	.sp-box.sp-utama .sp-jab {
		font-size: 17px;
	}
	.sp-nama-puncak {
		font-size: 19px;
		font-weight: 700;
		line-height: 1.1;
	}
	.sp-box.sp-utama .sp-nama-puncak {
		font-size: 21px;
	}
	.sp-ctop {
		width: 3px;
		height: 12px;
		background: #0a5c36;
		margin: 0 auto;
		flex: 0 0 auto;
	}

	/* Kolom */
	.sp-cols {
		position: relative;
		display: flex;
		gap: 9px;
		padding: 0 20px;
		flex: 1 1 auto;
		min-height: 0;
		/* garis komando horizontal dari Kepala Madrasah ke tiap kolom */
		border-top: 2.5px solid #0a5c36;
		padding-top: 8px;
		margin-top: 4px;
	}
	.sp-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
		/* lebar dasar + pembagian sisa proporsional (min. 3 bagian agar kolom
		   berisi sedikit orang — mis. Wakamad Humas — tidak menjadi terlalu sempit) */
		flex: 1 1 90px;
	}
	.sp-head {
		display: flex;
		align-items: center;
		gap: 6px;
		background: linear-gradient(180deg, #0f7a49, #0a5c36);
		color: #fff;
		border-radius: 8px 8px 0 0;
		padding: 4px 6px;
		flex: 0 0 auto;
	}
	.sp-foto-head {
		width: 30px;
		height: 36px;
		object-fit: cover;
		border-radius: 4px;
		border: 1.5px solid #fff;
		background: #f1f5f9;
		flex: 0 0 auto;
	}
	.sp-head .sp-jab {
		color: #fff;
		font-size: 11px;
	}
	.sp-nama-head {
		font-size: 11.5px;
		font-weight: 700;
		line-height: 1.1;
	}
	.sp-head .sp-nip {
		color: #d8ece0;
	}
	.sp-body {
		flex: 1 1 auto;
		border: 2px solid #0a5c36;
		border-top: none;
		border-radius: 0 0 8px 8px;
		background: #fbfdfb;
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-height: 0;
		overflow: hidden;
	}
	.sp-subbar {
		background: #e8f3ec;
		color: #063f25;
		text-align: center;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.3px;
		text-transform: uppercase;
		border-radius: 5px;
		padding: 2px;
		flex: 0 0 auto;
	}
	.sp-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 3px;
	}

	/* Kartu orang */
	.sp-kartu {
		border: 1.3px solid #0a5c36;
		border-radius: 5px;
		padding: 1.5px 3px;
		background: #fff;
		display: flex;
		align-items: center;
		gap: 5px;
		min-height: 0;
		overflow: hidden;
	}
	.sp-foto {
		width: 28px;
		height: 34px;
		object-fit: cover;
		border-radius: 3px;
		border: 1.3px solid #0a5c36;
		background: #f1f5f9;
		flex: 0 0 auto;
	}
	.sp-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 800;
		color: #0a5c36;
		background: #eef5f0;
	}
	.sp-teks {
		min-width: 0;
		text-align: left;
	}
	.sp-label {
		font-size: 8.5px;
		font-weight: 800;
		color: #063f25;
		text-transform: uppercase;
		letter-spacing: 0.2px;
		line-height: 1.1;
	}
	.sp-kelas {
		font-size: 10.5px;
		font-weight: 800;
		color: #063f25;
		line-height: 1.1;
	}
	.sp-nama {
		font-size: 10px;
		font-weight: 700;
		line-height: 1.12;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-nip {
		font-size: 8px;
		color: #555;
		letter-spacing: 0;
		line-height: 1.1;
		white-space: nowrap;
	}
	.sp-ket {
		font-size: 8.5px;
		font-weight: 600;
		color: #666;
		line-height: 1.05;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sp-note {
		border: 1.5px solid #0a5c36;
		border-radius: 6px;
		padding: 3px 5px;
		background: #fff;
		font-size: 9px;
		line-height: 1.45;
		text-align: center;
		color: #1b2a22;
	}
	.sp-siswa {
		flex: 0 0 auto;
		margin: 6px 20px 0;
		background: #074a2b;
		color: #fff;
		text-align: center;
		font-size: 24px;
		font-weight: 900;
		letter-spacing: 12px;
		padding: 3px 0;
		border-radius: 8px;
	}
	.sp-footer {
		flex: 0 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 30px;
		padding: 5px 34px 8px;
		font-size: 10.5px;
		color: #444;
	}
	.sp-catatan {
		line-height: 1.55;
		max-width: 1280px;
	}
	.sp-ttd {
		text-align: center;
		line-height: 1.5;
		flex: 0 0 auto;
		min-width: 260px;
	}
	.sp-ttd-ruang {
		height: 26px;
	}
	.sp-ttd-nama {
		font-weight: 700;
	}
</style>
