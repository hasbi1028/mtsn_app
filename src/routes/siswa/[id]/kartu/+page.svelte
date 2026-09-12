<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Download from '@lucide/svelte/icons/download';
	import Printer from '@lucide/svelte/icons/printer';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { notify } from '$lib/toast';

	let { data } = $props();
	let siswa = $derived(data.siswa);

	let pageTitle = $state('Kartu Siswa');
	let cardEl = $state<HTMLDivElement>();
	let fotoPreview = $state<string | null>(null);
	let downloading = $state(false);
	let showBack = $state(false);
	let regenerating = $state(false);
	let cacheBust = $state(Date.now());

	$effect(() => {
		if (siswa?.nama) pageTitle = `Kartu Siswa — ${siswa.nama}`;
		setFotoPreview(siswa?.fotoPath ?? null);
	});

	function setFotoPreview(path: string | null) {
		if (path) {
			fotoPreview = path.startsWith('/') ? path : `/${path}`;
		}
	}

	function initials(name = '') {
		return name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || '?';
	}

	function birth(v: string | null) {
		if (!v) return '—';
		const d = new Date(v);
		return isNaN(d.getTime()) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function gender(v: string | null) {
		return v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : '—';
	}

	function className(k: string | null, r: string | null) {
		return k ? `${k}${r ? ` ${r}` : ''}` : '—';
	}

	function cardFrontUrl(siswa: any) {
		return `/api/siswa/${siswa.id}/kartu-front?t=${cacheBust}`;
	}

	function cardBackUrl(siswa: any) {
		return `/api/siswa/${siswa.id}/kartu-back?t=${cacheBust}`;
	}

	function safeName(siswa: any) {
		return siswa.nama?.replace(/\s+/g, '-').toLowerCase() || 'siswa';
	}

	async function downloadFile(url: string, filename: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function handleDownload(siswa: any) {
		downloading = true;
		try {
			await downloadFile(cardFrontUrl(siswa).split('?')[0], `kartu-${safeName(siswa)}-depan.png`);
			await new Promise(r => setTimeout(r, 500));
			await downloadFile(cardBackUrl(siswa).split('?')[0], `kartu-${safeName(siswa)}-belakang.png`);
			notify.success('Kartu depan & belakang berhasil diunduh.');
		} catch (err) {
			console.error('Download kartu gagal:', err);
			notify.error('Gagal mengunduh kartu. Coba gunakan Cetak.');
		} finally {
			downloading = false;
		}
	}

	async function handleRegenerate(siswa: any) {
		regenerating = true;
		try {
			const res = await fetch(`/api/siswa/${siswa.id}/kartu-regenerate`, { method: 'POST', credentials: 'include' });
			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: 'Gagal regenerate' }));
				throw new Error(err.error || 'Gagal regenerate');
			}
			const d = await res.json();

			// Poll until done
			if (d.batch_id) {
				let tries = 0;
				const poll = setInterval(async () => {
					tries++;
					try {
						const sRes = await fetch(`/api/kartu/queue/${d.batch_id}`, { credentials: 'include' });
						const sData = await sRes.json();
						if (sData.status === 'completed' || tries > 60) {
							clearInterval(poll);
							regenerating = false;
							cacheBust = Date.now();
							if (sData.failed > 0) {
								notify.error('Gagal regenerate kartu.');
							} else {
								notify.success('Kartu berhasil digenerate ulang.');
							}
						}
					} catch {
						if (tries > 60) {
							clearInterval(poll);
							regenerating = false;
						}
					}
				}, 1000);
			} else {
				cacheBust = Date.now();
				regenerating = false;
				notify.success('Kartu berhasil digenerate ulang.');
			}
		} catch (err: any) {
			console.error('Regenerate gagal:', err);
			notify.error('Gagal regenerate kartu: ' + (err.message || ''));
			regenerating = false;
		}
	}
</script>

<svelte:head><title>{pageTitle} — SIMAD</title></svelte:head>

{#if siswa}
	<div class="no-print toolbar">
		<a href="/siswa/{siswa.id}/profil" class="back"><ArrowLeft class="size-4"/> Kembali ke profil</a>
		<div class="actions">
			<Button variant="outline" size="sm" onclick={() => handleRegenerate(siswa!)} disabled={regenerating}>
				<RefreshCw class="size-4 {regenerating ? 'animate-spin' : ''}"/> {regenerating ? 'Generate Ulang...' : 'Generate Ulang'}
			</Button>
			<Button variant="outline" size="sm" onclick={() => showBack = !showBack}>
				<RotateCw class="size-4"/> {showBack ? 'Lihat Depan' : 'Lihat Belakang'}
			</Button>
			<Button variant="outline" size="sm" onclick={() => window.print()}>
				<Printer class="size-4"/> Cetak
			</Button>
			<Button size="sm" onclick={() => handleDownload(siswa)} disabled={downloading}>
				<Download class="size-4"/> {downloading ? 'Menyiapkan...' : 'Download PNG'}
			</Button>
		</div>
	</div>

	<main class="preview">
		<div class="heading">
			<p class="eyebrow">DOKUMEN IDENTITAS</p>
			<h1>Preview Kartu Siswa</h1>
			<p>{showBack ? 'Bagian belakang kartu — alamat, QR code, dan ketentuan.' : 'Pastikan foto dan data siswa sudah sesuai sebelum dicetak.'}</p>
		</div>

		<div class="stage">
			{#if !showBack}
				<!-- FRONT CARD -->
				<div bind:this={cardEl} class="card">
					<div class="orbit"></div>
					<header>
						<img src="/uploads/logo-kemenag.png" alt="Logo Kementerian Agama"/>
						<div>
							<p class="kicker">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
							<p class="school">MTsN 2 KOLAKA UTARA</p>
							<p class="meta">NSM 121174080002 · NPSN 40406031</p>
						</div>
					</header>
					<div class="rule"></div>
					<section>
						<div class="photo">
							{#if fotoPreview}
							<img src={fotoPreview} alt="Foto {siswa.nama}"/>
						{:else}
							<span>{initials(siswa.nama)}</span>
							{/if}
						</div>
						<div class="data">
						<p class="name">{siswa.nama || 'Nama siswa'}</p>
						<div><span>NISN</span><strong>{siswa.nisn || '—'}</strong></div>
						<div><span>KELAS</span><strong>{className(siswa.kelas, siswa.rombel)}</strong></div>
						<div><span>JENIS KELAMIN</span><strong>{gender(siswa.jk)}</strong></div>
						<div class="birth"><span>LAHIR</span><strong>{siswa.tempatLahir || '—'}, {birth(siswa.tglLahir)}</strong></div>
						</div>
					</section>
					<footer>
						<span><ShieldCheck class="size-3"/> BERLAKU SELAMA TERDAFTAR</span>
						<strong>TA 2026 / 2027</strong>
					</footer>
				</div>
			{:else}
				<!-- BACK CARD (server-rendered PNG) -->
				<div class="card-back-wrapper">
					<img src={cardBackUrl(siswa)} alt="Kartu Belakang {siswa.nama}" class="card-back-img"/>
				</div>
			{/if}
		</div>

		<p class="note">Ukuran kartu standar 85 × 55 mm · Gunakan kertas PVC untuk hasil terbaik.</p>

		<!-- Print: both sides -->
		<div class="print-only">
			<img src={cardFrontUrl(siswa)} alt="Kartu Depan" class="print-card"/>
			<img src={cardBackUrl(siswa)} alt="Kartu Belakang" class="print-card"/>
		</div>
	</main>
{/if}

<style>
	:global(body) { background: #f5f7f5; }

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid #dde5df;
		background: #fff;
	}
	.back {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		color: #64736a;
		font-size: 0.8rem;
		text-decoration: none;
	}
	.actions { display: flex; gap: 0.5rem; }
	.actions :global(button) { gap: 0.35rem; }

	.preview {
		min-height: calc(100vh - 57px);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		background: radial-gradient(circle at 15% 10%, #e6f1e8, transparent 35%), #f5f7f5;
	}
	.heading { text-align: center; margin-bottom: 2rem; }
	.eyebrow { color: #b38732; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.18em; margin: 0 0 0.5rem; }
	.heading h1 { color: #173d2b; font-size: 1.45rem; margin: 0; }
	.heading p:last-child { color: #718078; font-size: 0.82rem; margin: 0.5rem 0 0; }

	.stage {
		padding: 2rem;
		background: #ffffffa8;
		border: 1px solid #e0e9e1;
		border-radius: 1.25rem;
		box-shadow: 0 18px 45px #173d4314;
	}

	/* Front card (same as original) */
	.card {
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
		width: 85mm;
		height: 55mm;
		padding: 4mm;
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 3mm;
		border: 1px solid #d1b56a;
		box-shadow: 0 10px 25px #173d432e;
		color: #173d2b;
	}
	.orbit { position: absolute; width: 34mm; height: 34mm; right: -15mm; top: -17mm; border-radius: 50%; background: #e8f1e9; border: 5mm solid #f5ead0; }
	header { display: flex; align-items: center; gap: 3mm; z-index: 1; }
	header img { width: 11mm; height: 11mm; object-fit: contain; }
	header div { flex: 1; }
	.kicker { font-size: 5.3pt; letter-spacing: 0.55pt; margin: 0; font-weight: 700; }
	.school { font-size: 10pt; letter-spacing: 0.2pt; font-weight: 900; margin: 1pt 0; }
	.meta { font-size: 5pt; color: #6b786f; letter-spacing: 0.35pt; margin: 0; }
	.rule { height: 1.2pt; margin: 2.5mm 0 2.8mm; background: linear-gradient(90deg, #b38732, #e5cc8b, transparent); }
	section { display: flex; gap: 3mm; flex: 1; z-index: 1; }
	.photo { width: 22mm; height: 27mm; flex-shrink: 0; border-radius: 1.5mm; border: 1pt solid #c9ae62; box-sizing: border-box; overflow: hidden; display: grid; place-items: center; background: linear-gradient(145deg, #dbeadf, #f3f7ee); }
	.photo img { width: 100%; height: 100%; object-fit: cover; }
	.photo :global(span) { font-size: 16pt; font-weight: 900; color: #276044; }
	.data { flex: 1; min-width: 0; }
	.name { font-size: 11pt; line-height: 1.05; font-weight: 900; text-transform: uppercase; margin: 0 0 2.5mm; max-width: 48mm; overflow: hidden; }
	.data > div { display: flex; gap: 2mm; align-items: baseline; margin: 1.1mm 0; font-size: 6.2pt; }
	.data span { width: 20mm; flex-shrink: 0; color: #77857b; font-size: 5.2pt; letter-spacing: 0.35pt; font-weight: 700; }
	.data strong { font-size: 6.8pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.data .birth strong { font-size: 5.7pt; }
	footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e1d6b8; padding-top: 1.7mm; color: #758078; font-size: 4.8pt; letter-spacing: 0.2pt; z-index: 1; }
	footer strong { color: #b38732; font-size: 5pt; }

	/* Back card wrapper */
	.card-back-wrapper {
		width: 85mm;
		height: 55mm;
		border-radius: 3mm;
		overflow: hidden;
		border: 1px solid #d1b56a;
		box-shadow: 0 10px 25px #173d432e;
	}
	.card-back-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.note { color: #718078; font-size: 0.78rem; margin-top: 1.5rem; }

	/* Print-only section */
	.print-only { display: none; }

	@media print {
		.no-print { display: none !important; }
		.preview { padding: 0 !important; background: none !important; min-height: auto !important; }
		.heading, .stage, .note { display: none !important; }
		.print-only {
			display: flex !important;
			flex-direction: column;
			align-items: center;
			gap: 5mm;
			padding: 5mm;
		}
		.print-card {
			width: 85mm;
			height: 55mm;
			object-fit: contain;
			border: 0.5pt solid #ccc;
			page-break-inside: avoid;
			break-inside: avoid;
		}
	}
</style>
