<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Printer from '@lucide/svelte/icons/printer';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import X from '@lucide/svelte/icons/x';
	import { notify } from '$lib/toast';
	import { getKartuListQ } from '$modules/siswa/siswa.remote';
	import {
		generateAllKartu,
		regenerateKartuCmd,
		getBatchStatusQ,
		cancelBatchC
	} from '$modules/kartu/kartu.remote';

	const listQuery = getKartuListQ() as Promise<any[]>;

	let generating = $state(false);
	let regeneratingId = $state<number | null>(null);

	// Queue progress
	let batchId = $state<string | null>(null);
	let batchTotal = $state(0);
	let batchDone = $state(0);
	let batchFailed = $state(0);
	let batchStatus = $state<string>('');
	let pollTimer = $state<ReturnType<typeof setInterval> | null>(null);

	function cardUrl(id: number | string, bust?: number) {
		return `/api/siswa/${id}/kartu-front${bust ? '?t=' + bust : ''}`;
	}

	function cardBackUrl(id: number | string, bust?: number) {
		return `/api/siswa/${id}/kartu-back${bust ? '?t=' + bust : ''}`;
	}

	function roman(k: string) {
		return k || '—';
	}

	function progressPercent() {
		if (batchTotal === 0) return 0;
		return Math.round(((batchDone + batchFailed) / batchTotal) * 100);
	}

	async function generateAll() {
		generating = true;
		try {
			const d = await generateAllKartu();
			if ('error' in d) {
				notify.error(d.error ?? 'Gagal generate');
				generating = false;
				return;
			}
			batchId = d.batch_id;
			batchTotal = d.total;
			batchDone = 0;
			batchFailed = 0;
			batchStatus = 'processing';
			startPolling();
			notify.success(`${d.total} kartu masuk antrian generate.`);
		} catch (err: any) {
			notify.error('Generate gagal: ' + (err.message || ''));
			generating = false;
		}
	}

	function startPolling() {
		if (pollTimer) clearInterval(pollTimer);
		pollTimer = setInterval(pollStatus, 2000);
		pollStatus();
	}

	async function pollStatus() {
		if (!batchId) return;
		try {
			const q = getBatchStatusQ(batchId);
			await q.refresh();
			const d = q.current;
			if (!d) return;
			batchDone = d.done;
			batchFailed = d.failed;
			batchStatus = d.status;

			if (d.status === 'completed') {
				stopPolling();
				generating = false;
				if (d.failed > 0) {
					notify.success(`Generate selesai: ${d.done} berhasil, ${d.failed} gagal.`);
				} else {
					notify.success(`Semua ${d.done} kartu berhasil digenerate.`);
				}
				void getKartuListQ().refresh();
			}
		} catch {
			// ignore poll errors
		}
	}

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	async function cancelBatch() {
		if (!batchId) return;
		try {
			await cancelBatchC(batchId);
			stopPolling();
			batchStatus = 'completed';
			generating = false;
			notify.info('Generate dibatalkan.');
			void getKartuListQ().refresh();
		} catch {
			notify.error('Gagal membatalkan.');
		}
	}

	let cacheBusts = $state<Record<number, number>>({});

	async function handleRegenerateOne(id: number) {
		regeneratingId = id;
		try {
			const d = await regenerateKartuCmd(String(id));

			// Poll single job until done
			if (d.batch_id) {
				let tries = 0;
				const poll = setInterval(async () => {
					tries++;
					try {
						const q = getBatchStatusQ(d.batch_id);
						await q.refresh();
						const sData = q.current;
						if (sData?.status === 'completed' || tries > 60) {
							clearInterval(poll);
							regeneratingId = null;
							cacheBusts = { ...cacheBusts, [id]: Date.now() };
							if (sData && sData.failed > 0) {
								notify.error('Gagal regenerate kartu.');
							} else {
								notify.success('Kartu berhasil digenerate ulang.');
							}
						}
					} catch {
						if (tries > 60) {
							clearInterval(poll);
							regeneratingId = null;
						}
					}
				}, 1000);
			} else {
				regeneratingId = null;
				notify.success('Kartu berhasil digenerate ulang.');
			}
		} catch (err: any) {
			notify.error('Gagal regenerate: ' + (err.message || ''));
			regeneratingId = null;
		}
	}

	function printAll() {
		window.print();
	}
</script>

<svelte:head>
	<title>Cetak Kartu Siswa — SIMAD</title>
</svelte:head>

<!-- Screen-only toolbar -->
<div class="no-print toolbar">
	<a href="/siswa" class="back">
		<ArrowLeft class="size-4" /> Kembali
	</a>
	<div class="actions">
		{#if batchStatus === 'processing'}
			<Button variant="destructive" size="sm" onclick={cancelBatch}>
				<X class="size-4" /> Batalkan
			</Button>
		{:else}
			<Button variant="outline" size="sm" onclick={generateAll} disabled={generating}>
				<RefreshCw class="size-4" />
				{generating ? 'Generating...' : 'Generate Semua Kartu'}
			</Button>
		{/if}
		<Button size="sm" onclick={printAll} disabled={batchStatus === 'processing'}>
			<Printer class="size-4" /> Print Semua Kartu
		</Button>
	</div>
</div>

<!-- Progress bar -->
{#if batchStatus === 'processing'}
	<div class="no-print progress-bar">
		<div class="progress-text">
			<span>Generate: {batchDone + batchFailed} / {batchTotal} kartu</span>
			{#if batchFailed > 0}<span class="text-destructive">{batchFailed} gagal</span>{/if}
		</div>
		<div class="progress-track">
			<div class="progress-fill" style="width: {progressPercent()}%"></div>
		</div>
	</div>
{/if}

{#await listQuery}
	<p class="text-sm text-muted-foreground text-center py-8">Memuat daftar kartu...</p>
{:then list}
	<div class="page-heading no-print">
		<h1>Kartu Siswa</h1>
		<p>{list.length} siswa dengan foto • depan + belakang • kartu disimpan sebagai cache privat</p>
	</div>

	{#if list.length}
		<div class="kartu-grid">
			{#each list as row (row.id)}
				<div class="kartu-item print-item">
					<div class="kartu-pair">
						<div class="kartu-side">
							<span class="side-label no-print">Depan</span>
							<img src={cardUrl(row.id, cacheBusts[row.id])} alt="Kartu Depan {row.nama}" class="kartu-img" loading="lazy" />
						</div>
						<div class="kartu-side">
							<span class="side-label no-print">Belakang</span>
							<img src={cardBackUrl(row.id, cacheBusts[row.id])} alt="Kartu Belakang {row.nama}" class="kartu-img" loading="lazy" />
						</div>
					</div>
					<div class="caption no-print">
						<span class="name">{row.nama}</span>
						<span class="sub">Kls {roman(row.kelas)}{row.rombel ? ' · ' + row.rombel : ''}</span>
						<Button variant="ghost" size="sm" class="mt-1 h-7 text-xs" onclick={() => handleRegenerateOne(row.id)} disabled={regeneratingId === row.id || batchStatus === 'processing'}>
							<RotateCw class="size-3 {regeneratingId === row.id ? 'animate-spin' : ''}"/>
							{regeneratingId === row.id ? 'Generating...' : 'Regenerate'}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty no-print">
			<p>Belum ada siswa yang mengupload foto.</p>
			<p class="hint">Upload foto siswa dulu di halaman profil/kartu siswa, lalu kembali ke sini.</p>
		</div>
	{/if}
{/await}

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
		background: #fff;
	}
	.back {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		color: #64748b;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.actions { display: flex; gap: 0.5rem; }
	.page-heading { padding: 1.25rem 1.5rem 0; }
	.page-heading h1 { font-size: 1.3rem; margin: 0; color: #173d2b; }
	.page-heading p { color: #6b7280; font-size: 0.8rem; margin: 0.3rem 0 0; }

	/* Progress bar */
	.progress-bar {
		padding: 0.75rem 1.5rem;
		background: #f0fdf4;
		border-bottom: 1px solid #bbf7d0;
	}
	.progress-text {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		margin-bottom: 0.4rem;
		color: #166534;
		font-weight: 500;
	}
	.progress-track {
		height: 6px;
		background: #dcfce7;
		border-radius: 3px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #22c55e, #16a34a);
		border-radius: 3px;
		transition: width 0.3s ease;
	}
	:global(.text-destructive) { color: #ef4444; }

	.kartu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(540px, 1fr));
		gap: 1.5rem;
		padding: 1.5rem;
	}
	.kartu-item { text-align: center; }
	.kartu-pair {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
	.kartu-side { position: relative; }
	.side-label {
		position: absolute;
		top: -0.4rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.6rem;
		font-weight: 700;
		color: #9ca3af;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: #f9fafb;
		padding: 0 0.4rem;
		z-index: 1;
	}
	.kartu-img {
		width: 260px;
		object-fit: contain;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
	}
	.caption { margin-top: 0.5rem; }
	.caption .name { font-weight: 600; font-size: 0.85rem; display: block; }
	.caption .sub { color: #6b7280; font-size: 0.75rem; }

	.empty { padding: 3rem; text-align: center; color: #6b7280; }
	.empty .hint { font-size: 0.8rem; margin-top: 0.4rem; }

	@media print {
		.no-print, .page-heading { display: none !important; }
		.progress-bar { display: none !important; }
		.kartu-grid {
			display: grid !important;
			grid-template-columns: 1fr !important;
			gap: 4mm !important;
			padding: 5mm !important;
		}
		.kartu-item { break-inside: avoid; page-break-inside: avoid; }
		.kartu-pair {
			display: flex !important;
			gap: 5mm !important;
			justify-content: center !important;
		}
		.kartu-img {
			width: 85mm !important;
			height: 55mm !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			border: 0.5pt solid #ccc !important;
		}
	}
</style>
