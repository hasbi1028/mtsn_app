<script lang="ts">
	import { page } from '$app/state';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { notify } from '$lib/toast';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import {
		getBackupStateQ,
		createBackupC,
		deleteBackupC,
		uploadRestoreForm,
		inspectRestoreC,
		prepareRestoreC,
		hapusUnggahanC
	} from '$modules/backup/backup.remote';

	const user = $derived((page.data as any)?.user);
	const isAdmin = $derived(user?.role === 'admin');

	const stateQ = $derived(getBackupStateQ());
	const state = $derived(stateQ.current as any);
	const items = $derived((state?.items ?? []) as any[]);
	const lastResult = $derived(state?.lastResult as any);
	const pending = $derived(state?.pending as any);
	const meta = $derived(state?.meta as any);
	const totalBytes = $derived(items.reduce((a: number, i: any) => a + (i.bytes ?? 0), 0));
	const arsipCron = $derived(items.filter((i: any) => i.source === 'cron').length);

	let busy = $state(false);
	let hapusOpen = $state(false);
	let hapusTarget = $state('');
	let inspeksi = $state(null as any);
	let terakhirDiunggah = $state('');
	let lastUploadResult: any = null;

	const perintahRestore =
		'pm2 stop simad-bel mtsn-app-bff\nnode --import tsx scripts/restore-apply.ts\npm2 start ecosystem.config.cjs';

	function fmtBytes(n: number) {
		if (!Number.isFinite(n) || n < 0) return '-';
		if (n < 1024) return `${n} B`;
		const u = ['KB', 'MB', 'GB', 'TB'];
		let v = n / 1024;
		let i = 0;
		while (v >= 1024 && i < u.length - 1) {
			v /= 1024;
			i++;
		}
		return `${v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)} ${u[i]}`;
	}
	const fmtAngka = (n: number) => new Intl.NumberFormat('id-ID').format(n ?? 0);
	function fmtWaktu(ms: number) {
		if (!ms) return '-';
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
	}

	async function handleBuat() {
		busy = true;
		try {
			const r: any = await createBackupC({});
			if (r?.ok) {
				notify.success(r.pesan);
				stateQ.refresh();
			} else {
				notify.error(r?.error || 'Backup gagal.');
			}
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Backup gagal.');
		} finally {
			busy = false;
		}
	}

	async function handleHapus() {
		const name = hapusTarget;
		hapusOpen = false;
		try {
			const r: any = await deleteBackupC(name);
			notify.success(r?.pesan || 'Arsip dihapus.');
			stateQ.refresh();
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Gagal menghapus arsip.');
		}
	}

	async function handleValidasiUlang(staged: string) {
		busy = true;
		try {
			const r: any = await inspectRestoreC({ staged });
			if (r?.ok) {
				inspeksi = r.inspeksi;
				terakhirDiunggah = staged;
				notify.success('Arsip tervalidasi.');
			}
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Arsip tidak bisa divalidasi.');
		} finally {
			busy = false;
		}
	}

	async function handleSiapkan() {
		if (!inspeksi?.stagedName) return;
		busy = true;
		try {
			const r: any = await prepareRestoreC({ staged: inspeksi.stagedName });
			if (r?.ok) {
				notify.success(r.pesan);
				stateQ.refresh();
			}
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Gagal menyiapkan restore.');
		} finally {
			busy = false;
		}
	}

	async function handleBersihkan(staged: string) {
		try {
			const r: any = await hapusUnggahanC({ staged });
			notify.success(r?.pesan || 'Berkas dibersihkan.');
			if (inspeksi?.stagedName === staged) inspeksi = null;
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Gagal membersihkan berkas.');
		}
	}

	async function handleSalin() {
		try {
			await navigator.clipboard.writeText(perintahRestore);
			notify.success('Perintah disalin.');
		} catch {
			notify.warning('Salin manual dari kotak perintah di bawah.');
		}
	}

	$effect(() => {
		const r: any = uploadRestoreForm.result;
		if (!r || r === lastUploadResult) return;
		lastUploadResult = r;
		if (r.ok) {
			inspeksi = r.inspeksi;
			terakhirDiunggah = r.staged;
			notify.success(r.pesan || 'Arsip terunggah.');
			stateQ.refresh();
		} else {
			notify.error(r.error || 'Arsip tidak bisa divalidasi.');
		}
	});

	const selisihKelas = (n: number) => (n > 0 ? 'text-primary' : n < 0 ? 'text-destructive' : 'text-muted-foreground');
</script>

<PageLayout title="Backup & Restore" description="Arsip database + seluruh file unggahan SIMAD">
	<div class="mx-auto w-full max-w-[480px] space-y-4 md:max-w-3xl">
		{#if !isAdmin}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<ShieldAlertIcon class="size-4" /> Akses ditolak
					</CardTitle>
				</CardHeader>
				<CardContent class="text-sm text-muted-foreground">
					Menu Backup &amp; Restore hanya untuk <b>admin</b>. Hubungi operator madrasah.
				</CardContent>
			</Card>
		{:else}
			<!-- Ringkasan + aksi utama -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<DatabaseIcon class="size-4" /> Backup Database &amp; File
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3 text-sm">
					<p class="text-muted-foreground">
						Arsip memuat <b>local.db</b> (snapshot konsisten), seluruh berkas <code>uploads/</code>, dan
						manifest bersha256. Berkas <code>data/kartu</code> tidak diikutkan (bisa dibuat ulang).
					</p>
					<div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
						<div class="rounded-lg border p-2">
							<p class="text-muted-foreground">Jumlah arsip</p>
							<p class="font-semibold">{fmtAngka(items.length)}</p>
						</div>
						<div class="rounded-lg border p-2">
							<p class="text-muted-foreground">Arsip otomatis</p>
							<p class="font-semibold">{fmtAngka(arsipCron)}</p>
						</div>
						<div class="rounded-lg border p-2">
							<p class="text-muted-foreground">Total ukuran</p>
							<p class="font-semibold">{fmtBytes(totalBytes)}</p>
						</div>
						<div class="rounded-lg border p-2">
							<p class="text-muted-foreground">File upload</p>
							<p class="font-semibold">{fmtAngka(state?.uploads?.filesTotal ?? 0)}</p>
						</div>
					</div>
					<div class="flex flex-wrap gap-2">
						<Button size="sm" class="cursor-pointer" disabled={busy} onclick={handleBuat}>
							<ArchiveRestore class="mr-1 size-4" />
							{busy ? 'Memproses…' : 'Buat Backup Sekarang'}
						</Button>
						<Button size="sm" variant="outline" class="cursor-pointer" onclick={() => stateQ.refresh()}>
							<RefreshCwIcon class="mr-1 size-4" /> Muat ulang
						</Button>
					</div>
					{#if meta}
						<p class="text-[11px] text-muted-foreground">
							Folder arsip: <code>{meta.backupDir}</code> · aplikasi {meta.appVersion} · commit {meta.gitCommit}
						</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Daftar arsip -->
			<Card>
				<CardHeader>
					<CardTitle class="text-base">Daftar Arsip ({fmtAngka(items.length)})</CardTitle>
				</CardHeader>
				<CardContent class="px-0">
					{#if items.length === 0}
						<p class="px-6 text-sm text-muted-foreground">
							Belum ada arsip. Klik <b>Buat Backup Sekarang</b> untuk membuat arsip pertama.
						</p>
					{:else}
						<div class="overflow-x-auto">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Nama arsip</Table.Head>
										<Table.Head>Waktu</Table.Head>
										<Table.Head>Ukuran</Table.Head>
										<Table.Head>Isi</Table.Head>
										<Table.Head class="text-right">Aksi</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each items as it (it.name)}
										<Table.Row>
											<Table.Cell>
												<p class="font-medium break-all text-xs sm:text-sm">{it.name}</p>
												<div class="mt-1 flex flex-wrap gap-1">
													<Badge variant="secondary" class="text-[10px]">{it.source}</Badge>
													{#if it.broken}
														<Badge variant="destructive" class="text-[10px]">rusak</Badge>
													{/if}
												</div>
											</Table.Cell>
											<Table.Cell class="whitespace-nowrap text-xs">{fmtWaktu(it.mtime)}</Table.Cell>
											<Table.Cell class="whitespace-nowrap text-xs">{fmtBytes(it.bytes)}</Table.Cell>
											<Table.Cell class="text-xs">
												{#if it.manifest}
													{fmtAngka(it.manifest.filesTotal)} file ·
													{fmtAngka(it.manifest.dbRowCounts?.siswa ?? 0)} siswa ·
													{fmtAngka(it.manifest.dbRowCounts?.ptk ?? 0)} PTK
												{:else}
													<span class="text-destructive">manifest tidak terbaca</span>
												{/if}
											</Table.Cell>
											<Table.Cell class="text-right">
												<div class="flex justify-end gap-1">
													<a href="/api/backup/{it.name}/download" download>
														<Button size="sm" variant="outline" class="h-8 cursor-pointer" title="Unduh">
															<DownloadIcon class="size-4" />
														</Button>
													</a>
													<Button
														size="sm"
														variant="outline"
														class="h-8 cursor-pointer text-destructive"
														title="Hapus"
														onclick={() => {
															hapusTarget = it.name;
															hapusOpen = true;
														}}
													>
														<Trash2Icon class="size-4" />
													</Button>
												</div>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
						<p class="mt-2 px-6 text-xs text-muted-foreground">
							Retensi otomatis: 30 arsip otomatis (cron) + 5 snapshot pengaman. Arsip buatan manual tidak
							dihapus otomatis.
						</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Restore -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<ShieldAlertIcon class="size-4" /> Restore dari Arsip
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3 text-sm">
					<div class="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
						<b>Perhatian.</b> Restore mengganti database &amp; seluruh file unggahan dengan isi arsip.
						Semua sesi login lain akan logout. Server wajib berhenti saat langkah eksekusi.
					</div>

					<form {...uploadRestoreForm} enctype="multipart/form-data" class="space-y-2">
						<label class="block text-xs text-muted-foreground" for="file-arsip">Berkas arsip (.zip)</label>
						<input
							id="file-arsip"
							type="file"
							name="file"
							accept=".zip,application/zip"
							required
							class="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
						/>
						<Button type="submit" size="sm" class="cursor-pointer" disabled={uploadRestoreForm.pending > 0}>
							<UploadIcon class="mr-1 size-4" />
							{uploadRestoreForm.pending > 0 ? 'Mengunggah & memvalidasi…' : 'Unggah & Validasi'}
						</Button>
						{#if uploadRestoreForm.pending > 0}
							<p class="text-xs text-muted-foreground">Memeriksa sha256 seluruh isi arsip…</p>
						{/if}
					</form>

					{#if inspeksi}
						<div class="space-y-2 rounded-lg border p-3">
							<p class="flex items-center gap-2 text-sm font-medium">
								<CheckCircleIcon class="size-4 text-primary" /> Arsip tervalidasi
							</p>
							<p class="text-xs text-muted-foreground">
								{inspeksi.stagedName} · dibuat {inspeksi.manifest.createdAtLocal} · {inspeksi.manifest.filesTotal} file
								· {fmtBytes(inspeksi.manifest.filesBytes)}
							</p>
							<div class="overflow-x-auto">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Tabel</Table.Head>
											<Table.Head class="text-right">Sekarang</Table.Head>
											<Table.Head class="text-right">Di arsip</Table.Head>
											<Table.Head class="text-right">Selisih</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each Object.keys(inspeksi.preview.deltas).sort() as t (t)}
											<Table.Row>
												<Table.Cell class="text-xs">{t}</Table.Cell>
												<Table.Cell class="text-right text-xs"
													>{fmtAngka(inspeksi.preview.current.dbRowCounts[t] ?? 0)}</Table.Cell
												>
												<Table.Cell class="text-right text-xs"
													>{fmtAngka(inspeksi.preview.archive.dbRowCounts[t] ?? 0)}</Table.Cell
												>
												<Table.Cell class="text-right text-xs {selisihKelas(inspeksi.preview.deltas[t])}">
													{inspeksi.preview.deltas[t] > 0 ? '+' : ''}{fmtAngka(inspeksi.preview.deltas[t])}
												</Table.Cell>
											</Table.Row>
										{/each}
										<Table.Row>
											<Table.Cell class="text-xs font-medium">file uploads</Table.Cell>
											<Table.Cell class="text-right text-xs">{fmtAngka(inspeksi.preview.current.filesTotal)}</Table.Cell>
											<Table.Cell class="text-right text-xs">{fmtAngka(inspeksi.preview.archive.filesTotal)}</Table.Cell>
											<Table.Cell class="text-right text-xs {selisihKelas(inspeksi.preview.filesDelta)}">
												{inspeksi.preview.filesDelta > 0 ? '+' : ''}{fmtAngka(inspeksi.preview.filesDelta)}
											</Table.Cell>
										</Table.Row>
									</Table.Body>
								</Table.Root>
							</div>
							<div class="flex flex-wrap gap-2">
								<Button size="sm" class="cursor-pointer" disabled={busy} onclick={handleSiapkan}>
									Siapkan Restore (buat snapshot pengaman)
								</Button>
								<Button
									size="sm"
									variant="outline"
									class="cursor-pointer"
									onclick={() => handleValidasiUlang(inspeksi.stagedName)}
								>
									Validasi ulang
								</Button>
								<Button
									size="sm"
									variant="ghost"
									class="cursor-pointer text-destructive"
									onclick={() => handleBersihkan(inspeksi.stagedName)}
								>
									Batalkan
								</Button>
							</div>
						</div>
					{/if}

					{#if pending}
						<div class="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
							<p class="text-sm font-medium">Rencana restore siap dieksekusi</p>
							<ul class="list-inside list-disc text-xs text-muted-foreground">
								<li>Arsip: <code>{pending.stagedName}</code></li>
								<li>Snapshot pengaman: <code>{pending.preRestoreName}</code></li>
								<li>Disiapkan oleh {pending.actor} pada {pending.createdAtLocal}</li>
								<li>
									Isi arsip: {fmtAngka(pending.manifestSummary.filesTotal)} file ·
									{fmtAngka(pending.manifestSummary.dbRowCounts?.siswa ?? 0)} siswa ·
									{fmtAngka(pending.manifestSummary.dbRowCounts?.ptk ?? 0)} PTK
								</li>
							</ul>
							<p class="text-xs font-medium">Jalankan perintah berikut di terminal (server akan berhenti):</p>
							<pre class="overflow-x-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">{perintahRestore}</pre>
							<Button size="sm" variant="outline" class="cursor-pointer" onclick={handleSalin}>
								<CopyIcon class="mr-1 size-4" /> Salin perintah
							</Button>
							<p class="text-[11px] text-muted-foreground">
								Setelah selesai, buka kembali halaman ini — hasilnya muncul di panel bawah.
							</p>
						</div>
					{/if}

					{#if terakhirDiunggah && !inspeksi}
						<p class="text-xs text-muted-foreground">
							Berkas terakhir diunggah: <code>{terakhirDiunggah}</code>.
							<button class="cursor-pointer text-primary underline" onclick={() => handleValidasiUlang(terakhirDiunggah)}>
								Validasi ulang
							</button>
						</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Hasil restore terakhir -->
			{#if lastResult}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-base">
							{#if lastResult.ok}
								<CheckCircleIcon class="size-4 text-primary" /> Hasil restore terakhir: BERHASIL
							{:else}
								<XCircleIcon class="size-4 text-destructive" /> Hasil restore terakhir: GAGAL
							{/if}
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-1 text-xs">
						<p>Waktu: {lastResult.restoredAtLocal} · oleh {lastResult.actor}</p>
						<p>Arsip: <code>{lastResult.stagedName}</code></p>
						<p>Snapshot pengaman: <code>{lastResult.preRestoreName}</code></p>
						{#if lastResult.ok}
							<p>
								Terpulihkan: {fmtAngka(lastResult.filesTotal ?? 0)} file ·
								{fmtAngka(lastResult.dbRowCounts?.siswa ?? 0)} siswa ·
								{fmtAngka(lastResult.dbRowCounts?.ptk ?? 0)} PTK
							</p>
						{/if}
						{#if lastResult.rolledBack}
							<p class="text-destructive">
								Verifikasi gagal — data lama dipulihkan otomatis (rollback).
							</p>
						{/if}
						{#if lastResult.error}
							<p class="text-destructive">Kesalahan: {lastResult.error}</p>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<AlertDialog.Root bind:open={hapusOpen}>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Hapus arsip backup?</AlertDialog.Title>
						<AlertDialog.Description>
							Arsip <code>{hapusTarget}</code> akan dihapus permanen dari folder backup. Tindakan ini tidak bisa
							dibatalkan.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
						<AlertDialog.Action onclick={handleHapus}>Hapus</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{/if}
	</div>
</PageLayout>
