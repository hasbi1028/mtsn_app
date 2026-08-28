<script lang="ts">
	import PrinterIcon from '@lucide/svelte/icons/printer';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();
	const siswa = $derived(data.siswa as any);
	const ortu = $derived(data.ortu as any);

	const now = new Date();
	const tanggalCetak = now.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	function isLayak(val: any): boolean {
		return val && val !== 'TIDAK' && val !== '';
	}

	function desilLabel(d: string | null): string {
		if (!d || d === '') return 'Belum Dicek';
		if (d === 'TIDAK DITEMUKAN') return 'Tidak Ditemukan di DTSEN';
		if (d === 'BELUM ADA DESIL') return 'Belum Ada Desil';
		return `Desil ${d}`;
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Bukti Cek Bansos — {siswa?.nama || 'SIMAD'}</title>
</svelte:head>

<!-- Screen-only controls -->
<div class="no-print flex items-center justify-between border-b bg-background px-4 py-2">
	<a
		href="/ortu/bansos"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
	>
		<ArrowLeftIcon class="size-4" />
		Kembali
	</a>
	<button
		onclick={handlePrint}
		class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
	>
		<PrinterIcon class="size-4" />
		Cetak PDF
	</button>
</div>

<!-- Print document -->
<div class="print-document">
	<!-- Kop Surat -->
	<header class="kop-surat">
		<div class="kop-line">
			<div class="kop-left">
				<div class="kop-logo">🏫</div>
			</div>
			<div class="kop-center">
				<p class="kop-title">PEMERINTAH KABUPATEN KOLAKA UTARA</p>
				<p class="kop-subtitle">DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
				<p class="kop-school">MTsN 2 KOLAKA UTARA</p>
				<p class="kop-address">Alamat: Jl. Pendidikan, Lasusua, Kolaka Utara, Sulawesi Tenggara</p>
			</div>
			<div class="kop-right"></div>
		</div>
		<div class="kop-garis"></div>
	</header>

	<!-- Title -->
	<div class="title-section">
		<h1>BUKTI CEK BANSOS DTSEN</h1>
		<p class="title-sub">Bantuan Sosial Data Terpadu Kesejahteraan Sosial</p>
	</div>

	<!-- Student & Parent Info -->
	{#if siswa}
		{#if ortu}
			<div class="info-section">
				<h2>Informasi Orang Tua/Wali</h2>
				<table class="info-table">
					<tbody>
						<tr>
							<td class="label">Nama Orang Tua/Wali</td>
							<td class="colon">:</td>
							<td class="value">{ortu.nama || '—'}</td>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}

		<div class="info-section">
			<h2>Informasi Siswa</h2>
			<table class="info-table">
				<tbody>
					<tr>
						<td class="label">Nama Siswa</td>
						<td class="colon">:</td>
						<td class="value">{siswa.nama || '—'}</td>
					</tr>
					<tr>
						<td class="label">NISN</td>
						<td class="colon">:</td>
						<td class="value">{siswa.nisn || '—'}</td>
					</tr>
					<tr>
						<td class="label">NIK</td>
						<td class="colon">:</td>
						<td class="value font-mono">{siswa.nik || '—'}</td>
					</tr>
					<tr>
						<td class="label">Kelas</td>
						<td class="colon">:</td>
						<td class="value">{siswa.kelas || '—'} {siswa.rombel || ''}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Bansos Data Table -->
		<div class="table-section">
			<h2>Data Bansos DTSEN</h2>
			<table class="bansos-table">
				<thead>
					<tr>
						<th class="th-no">No</th>
						<th class="th-program">Program Bansos</th>
						<th class="th-status">Status</th>
						<th class="th-keterangan">Keterangan</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="td-center">1</td>
						<td>Desil</td>
						<td class="td-center">{desilLabel(siswa.bansos_desil)}</td>
						<td>{siswa.bansos_desil || '—'}</td>
					</tr>
					<tr>
						<td class="td-center">2</td>
						<td>Sembako</td>
						<td class="td-center">
							{#if isLayak(siswa.bansos_sembako)}
								<span class="status-ya">YA</span>
							{:else}
								<span class="status-tidak">TIDAK</span>
							{/if}
						</td>
						<td>{siswa.bansos_sembako || '—'}</td>
					</tr>
					<tr>
						<td class="td-center">3</td>
						<td>PKH</td>
						<td class="td-center">
							{#if isLayak(siswa.bansos_pkh)}
								<span class="status-ya">YA</span>
							{:else}
								<span class="status-tidak">TIDAK</span>
							{/if}
						</td>
						<td>{siswa.bansos_pkh || '—'}</td>
					</tr>
					<tr>
						<td class="td-center">4</td>
						<td>PBI-JK</td>
						<td class="td-center">
							{#if isLayak(siswa.bansos_pbijk)}
								<span class="status-ya">YA</span>
							{:else}
								<span class="status-tidak">TIDAK</span>
							{/if}
						</td>
						<td>{siswa.bansos_pbijk || '—'}</td>
					</tr>
					<tr>
						<td class="td-center">5</td>
						<td>KPD</td>
						<td class="td-center">
							{#if isLayak(siswa.bansos_kpd)}
								<span class="status-ya">YA</span>
							{:else}
								<span class="status-tidak">TIDAK</span>
							{/if}
						</td>
						<td>{siswa.bansos_kpd || '—'}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Interpretasi -->
		<div class="interpretasi-section">
			<h2>Interpretasi Status</h2>
			<table class="info-table">
				<tbody>
					<tr>
						<td class="label">Layak PKH / Sembako</td>
						<td class="colon">:</td>
						<td class="value">
							{#if isLayak(siswa.bansos_pkh) || isLayak(siswa.bansos_sembako)}
								<strong>YA</strong> — Siswa terdaftar sebagai penerima PKH atau Sembako
							{:else}
								TIDAK — Siswa tidak terdaftar sebagai penerima PKH/Sembako
							{/if}
						</td>
					</tr>
					<tr>
						<td class="label">Layak PBI-JK</td>
						<td class="colon">:</td>
						<td class="value">
							{#if isLayak(siswa.bansos_pbijk)}
								<strong>YA</strong> — Siswa terdaftar sebagai peserta PBI-JK
							{:else}
								TIDAK — Siswa tidak terdaftar sebagai peserta PBI-JK
							{/if}
						</td>
					</tr>
					{#if siswa.bansos_cek_at}
						{@const cekDate = new Date(siswa.bansos_cek_at)}
						{@const diffDays = Math.floor((now.getTime() - cekDate.getTime()) / (1000 * 60 * 60 * 24))}
						<tr>
							<td class="label">Terakhir Diperiksa</td>
							<td class="colon">:</td>
							<td class="value">
								{cekDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
								{#if diffDays > 90}
									<br /><span class="peringatan">⚠ Data sudah lebih dari 90 hari belum diperiksa</span>
								{/if}
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Keterangan -->
		<div class="keterangan-section">
			<p>Keterangan:</p>
			<ol>
				<li>Dokumen ini merupakan bukti cek data bansos DTSEN untuk siswa yang bersangkutan.</li>
				<li>Data bersumber dari sistem DTSEN (Data Terpadu Kesejahteraan Sosial) Kementerian Sosial RI.</li>
				<li>Status "YA" menunjukkan siswa terdaftar sebagai penerima program bansos terkait.</li>
				<li>Status "TIDAK" menunjukkan siswa tidak terdaftar dalam program bansos terkait.</li>
				<li>Disarankan untuk melakukan pengecekan ulang setiap 90 hari.</li>
			</ol>
		</div>

		<!-- Footer / Tanda Tangan -->
		<footer class="signature-section">
			<div class="sig-left">
				<p class="sig-title">Mengetahui,</p>
				<p class="sig-role">Kepala MTsN 2 Kolaka Utara</p>
				<div class="sig-space"></div>
				<div class="sig-line"></div>
			</div>
			<div class="sig-right">
				<p class="sig-title">Lasusua, {tanggalCetak}</p>
				<p class="sig-role">Operator Kesiswaan</p>
				<div class="sig-space"></div>
				<div class="sig-line"></div>
			</div>
		</footer>

		<!-- Footer Note -->
		<div class="footer-note">
			<p>Dokumen ini dicetak secara otomatis dari Sistem Informasi Manajemen Madrasah (SIMAD)</p>
			<p>MTsN 2 Kolaka Utara — {tanggalCetak}</p>
		</div>
	{:else}
		<div class="no-data">
			<p>Data anak tidak ditemukan.</p>
		</div>
	{/if}
</div>

<style>
	/* Screen styles */
	.no-print {
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}

	/* Print Document Container */
	.print-document {
		max-width: 210mm;
		margin: 0 auto;
		padding: 15mm 20mm;
		font-family: 'Times New Roman', Times, serif;
		font-size: 12pt;
		line-height: 1.5;
		color: #000;
		background: #fff;
	}

	/* Kop Surat */
	.kop-surat {
		margin-bottom: 20pt;
	}

	.kop-line {
		display: flex;
		align-items: flex-start;
		gap: 12pt;
	}

	.kop-left {
		flex-shrink: 0;
	}

	.kop-logo {
		font-size: 36pt;
		line-height: 1;
	}

	.kop-center {
		flex: 1;
		text-align: center;
	}

	.kop-title {
		font-size: 13pt;
		font-weight: bold;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.5pt;
	}

	.kop-subtitle {
		font-size: 11pt;
		font-weight: bold;
		margin: 2pt 0 0 0;
		text-transform: uppercase;
	}

	.kop-school {
		font-size: 14pt;
		font-weight: bold;
		margin: 4pt 0 0 0;
		text-transform: uppercase;
		color: #000;
	}

	.kop-address {
		font-size: 9pt;
		margin: 4pt 0 0 0;
		color: #333;
	}

	.kop-right {
		flex-shrink: 0;
		width: 60pt;
	}

	.kop-garis {
		border-top: 3pt double #000;
		margin-top: 8pt;
	}

	/* Title */
	.title-section {
		text-align: center;
		margin: 20pt 0;
	}

	.title-section h1 {
		font-size: 14pt;
		font-weight: bold;
		margin: 0;
		text-transform: uppercase;
		text-decoration: underline;
	}

	.title-sub {
		font-size: 11pt;
		margin: 4pt 0 0 0;
		color: #333;
	}

	/* Info Section */
	.info-section {
		margin: 16pt 0;
	}

	.info-section h2 {
		font-size: 12pt;
		font-weight: bold;
		margin: 0 0 6pt 0;
		text-decoration: underline;
	}

	.info-table {
		width: 100%;
		border-collapse: collapse;
	}

	.info-table .label {
		width: 160pt;
		vertical-align: top;
		padding: 2pt 0;
		font-size: 12pt;
	}

	.info-table .colon {
		width: 12pt;
		vertical-align: top;
		padding: 2pt 0;
		text-align: center;
	}

	.info-table .value {
		vertical-align: top;
		padding: 2pt 0;
		font-size: 12pt;
	}

	.font-mono {
		font-family: 'Courier New', monospace;
	}

	/* Bansos Table */
	.table-section {
		margin: 20pt 0;
	}

	.table-section h2 {
		font-size: 12pt;
		font-weight: bold;
		margin: 0 0 8pt 0;
		text-decoration: underline;
	}

	.bansos-table {
		width: 100%;
		border-collapse: collapse;
		border: 1pt solid #000;
		font-size: 11pt;
	}

	.bansos-table th,
	.bansos-table td {
		border: 1pt solid #000;
		padding: 5pt 8pt;
	}

	.bansos-table th {
		background-color: #e8e8e8;
		font-weight: bold;
		text-align: center;
	}

	.th-no {
		width: 30pt;
	}

	.th-program {
		width: 100pt;
	}

	.th-status {
		width: 80pt;
	}

	.th-keterangan {
		width: auto;
	}

	.td-center {
		text-align: center;
	}

	.status-ya {
		display: inline-block;
		background: #16a34a;
		color: #fff;
		padding: 1pt 6pt;
		border-radius: 2pt;
		font-weight: bold;
		font-size: 10pt;
	}

	.status-tidak {
		display: inline-block;
		background: #dc2626;
		color: #fff;
		padding: 1pt 6pt;
		border-radius: 2pt;
		font-weight: bold;
		font-size: 10pt;
	}

	/* Interpretasi */
	.interpretasi-section {
		margin: 20pt 0;
	}

	.interpretasi-section h2 {
		font-size: 12pt;
		font-weight: bold;
		margin: 0 0 8pt 0;
		text-decoration: underline;
	}

	.peringatan {
		color: #dc2626;
		font-weight: bold;
		font-size: 10pt;
	}

	/* Keterangan */
	.keterangan-section {
		margin: 20pt 0;
		font-size: 10pt;
		line-height: 1.6;
	}

	.keterangan-section p {
		margin: 0 0 4pt 0;
		font-weight: bold;
	}

	.keterangan-section ol {
		margin: 4pt 0 0 16pt;
		padding: 0;
	}

	.keterangan-section li {
		margin-bottom: 2pt;
	}

	/* Signature */
	.signature-section {
		display: flex;
		justify-content: space-between;
		margin-top: 30pt;
		padding: 0 20pt;
	}

	.sig-left,
	.sig-right {
		width: 45%;
		text-align: center;
	}

	.sig-title {
		font-size: 12pt;
		margin: 0;
	}

	.sig-role {
		font-size: 11pt;
		margin: 2pt 0 0 0;
		text-decoration: underline;
	}

	.sig-space {
		height: 60pt;
	}

	.sig-line {
		border-top: 1pt solid #000;
		margin-top: 0;
	}

	/* Footer Note */
	.footer-note {
		margin-top: 20pt;
		padding-top: 8pt;
		border-top: 1pt solid #999;
		text-align: center;
		font-size: 8pt;
		color: #666;
	}

	.footer-note p {
		margin: 2pt 0;
	}

	/* No data */
	.no-data {
		text-align: center;
		padding: 40pt;
		color: #666;
	}

	/* Print Styles */
	@media print {
		@page {
			size: A4 portrait;
			margin: 15mm 20mm;
		}

		.no-print {
			display: none !important;
		}

		.print-document {
			padding: 0;
			margin: 0;
			max-width: none;
			box-shadow: none;
			border: none;
		}

		body {
			background: #fff;
			margin: 0;
			padding: 0;
		}

		.status-ya,
		.status-tidak {
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		.bansos-table th {
			background-color: #e8e8e8 !important;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		.peringatan {
			color: #dc2626 !important;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}
</style>
