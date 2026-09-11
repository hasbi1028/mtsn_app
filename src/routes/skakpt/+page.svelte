<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { notify } from '$lib/toast';
	import { enhance } from '$app/forms';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileText from '@lucide/svelte/icons/file-text';
	import Eye from '@lucide/svelte/icons/eye';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	const bulanActive = $derived(data.bulan || '');
	const allMonths = $derived((data.allMonths as string[]) || []);

	const bulanOptions = $derived(allMonths.length > 0 ? allMonths : [...new Set(rows.map((r) => r.bulan).filter(Boolean))]);

	const layakCount = $derived(rows.filter((r) => r.status === 'Sudah Terbit').length);
	const indikatorLengkapCount = $derived(rows.filter((r) => r.status === 'Indikator Lengkap').length);
	const belumCount = $derived(rows.filter((r) => r.status === 'Belum Terbit').length);
	const tidakLayakCount = $derived(rows.filter((r) => r.status === 'Belum Layak').length);
	const detailCount = $derived(rows.filter((r) => r.detail).length);

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nuptk', label: 'NUPTK', hideOnMobile: true },
		{ key: 'syarat', label: 'Syarat' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', hideOnMobile: true },
	];

	function getPdfUrl(row: any): string {
			// Samakan dengan konvensi backend (main.go): spasi→_, koma dibuang, titik dipertahankan
			const nama = String(row.nama || '').replace(/ /g, '_').replace(/,/g, '');
			const bln = (row.bulan || 'Juli 2026').replace(/\s+/g, '');
			return `/uploads/skakpt/SKAKPT_${nama}_${bln}.pdf`;
		}
	function getPdfTitle(row: any): string {
		return `SKAKPT ${row.nama} — ${row.bulan || 'Juli 2026'}`;
	}

	function getBuktiUrl(row: any): string {
		const detail = row.detail as any;
		const rel = detail?.bukti || '';
		if (!rel) return '';
		const name = rel.split('/').pop() || rel;
		return name ? `/api/skakpt/bukti/${encodeURIComponent(name)}` : '';
	}

	// Modal bukti
	let buktiOpen = $state(false);
	let buktiUrl = $state('');
	let buktiNama = $state('');
	function lihatBukti(row: any) {
		const url = getBuktiUrl(row);
		if (!url) {
			notify.warning('Belum ada bukti screenshot untuk PTK ini');
			return;
		}
		buktiUrl = url;
		buktiNama = row.nama;
		buktiOpen = true;
	}

	// Modal detail 11 indikator
	let detailOpen = $state(false);
	let detailRow = $state<any>(null);
	function lihatDetail(row: any) {
		detailRow = row;
		detailOpen = true;
	}
	const detailIndikator = $derived((detailRow?.detail?.indikator as any[]) || []);
	const detailUnmet = $derived((detailRow?.detail?.indikator_unmet as any[]) || []);

	function switchBulan(b: string) {
		goto(`/skakpt?bulan=${encodeURIComponent(b)}`, { noScroll: true });
	}
</script>

<PageLayout title="SKAKPT" description="Surat Keputusan Administrasi Keuangan Penerima Tunjangan — 11 indikator kelayakan TPG per PTK">
	{#snippet actions()}
		<div class="flex flex-wrap items-center gap-2">
			{#if bulanOptions.length > 1}
				<select
					class="h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
					value={bulanActive}
					onchange={(e) => switchBulan((e.target as HTMLSelectElement).value)}
				>
					{#each bulanOptions as b}
						<option value={b}>{b}</option>
					{/each}
				</select>
			{/if}
			<div class="bg-green-100 dark:bg-green-900 rounded-lg px-3 py-2 text-sm">
				Sudah Terbit: <strong class="text-green-700 dark:text-green-300">{layakCount}</strong>
			</div>
			{#if indikatorLengkapCount > 0}
				<div class="bg-emerald-100 dark:bg-emerald-900 rounded-lg px-3 py-2 text-sm">
					Indikator Hijau: <strong class="text-emerald-700 dark:text-emerald-300">{indikatorLengkapCount}</strong>
				</div>
			{/if}
			<div class="bg-yellow-100 dark:bg-yellow-900 rounded-lg px-3 py-2 text-sm">
				Belum: <strong class="text-yellow-700 dark:text-yellow-300">{belumCount}</strong>
			</div>
			{#if tidakLayakCount > 0}
				<div class="bg-red-100 dark:bg-red-900 rounded-lg px-3 py-2 text-sm">
					Belum Layak: <strong class="text-red-700 dark:text-red-300">{tidakLayakCount}</strong>
				</div>
			{/if}
			<div class="bg-muted rounded-lg px-3 py-2 text-sm">
				Total: <strong>{rows.length}</strong>
			</div>
		</div>
	{/snippet}

	<DataTable {columns} data={rows} emptyMessage="Tidak ada data SKAKPT">
		{#snippet children({ row, column })}
			{#if column.key === 'nama'}
				<span class="font-medium text-sm">{row.nama}</span>
			{:else if column.key === 'nuptk'}
				<span class="text-xs text-muted-foreground">{row.nuptk ?? '—'}</span>
			{:else if column.key === 'syarat'}
				{#if row.detail}
					{@const totalOk = Number(row.detail?.totalOk ?? 0)}
					{@const total = Number(row.detail?.total ?? 11)}
					<Badge variant={totalOk === total ? 'default' : 'destructive'} class="text-[10px]">
						{totalOk}/{total}
					</Badge>
				{:else}
					<span class="text-xs text-muted-foreground">—</span>
				{/if}
			{:else if column.key === 'status'}
				{#if row.status === 'Sudah Terbit'}
					<Badge variant="default" class="text-[10px]">✓ Sudah Terbit</Badge>
				{:else if row.status === 'Indikator Lengkap'}
					<Badge class="text-[10px] bg-emerald-600 hover:bg-emerald-600 text-white">
						✓ Indikator Hijau (SKAKPT belum terbit)
					</Badge>
				{:else if row.status === 'Belum Layak'}
					<Badge variant="destructive" class="text-[10px]">Belum Layak</Badge>
				{:else}
					<Badge variant="secondary" class="text-[10px]">{row.status}</Badge>
				{/if}
			{:else if column.key === 'aksi'}
				<div class="flex flex-wrap gap-1.5">
					{#if row.detail}
						<Button size="sm" variant="outline" class="h-7 text-[10px] cursor-pointer" onclick={() => lihatDetail(row)}>
							<Eye class="size-3" /> 11 Indikator
						</Button>
						<Button size="sm" variant="outline" class="h-7 text-[10px] cursor-pointer" onclick={() => lihatBukti(row)}>
							<ImageIcon class="size-3" /> Bukti
						</Button>
					{/if}
					{#if row.status === 'Sudah Terbit'}
						<PdfViewer src={getPdfUrl(row)} title={getPdfTitle(row)} />
						<form method="POST" action="?/download" use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' && result.data?.ok) {
									const a = document.createElement('a');
									a.href = getPdfUrl(row);
									a.download = String(result.data.filename || row.filename);
									a.click();
									notify.success('Download SKAKPT ' + row.nama);
								}
							};
						}}>
							<input type="hidden" name="filename" value={row.filename} />
							<Button type="submit" size="sm" variant="outline" class="h-7 text-[10px] cursor-pointer" title="Download PDF">
								<FileText class="size-3" /> PDF
							</Button>
						</form>
					{/if}
				</div>
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	<p class="mt-2 text-xs text-muted-foreground">
		{rows.length} PTK bersertifikasi {bulanActive ? `· bulan ${bulanActive}` : ''} · {detailCount} dengan detail indikator
	</p>
</PageLayout>

<!-- Modal: 11 indikator kelayakan -->
<Dialog.Root bind:open={detailOpen}>
	<Dialog.Content class="max-w-2xl p-0 gap-0">
		<Dialog.Header class="px-4 py-3 border-b">
			<Dialog.Title class="text-sm">11 Indikator Kelayakan TPG — {detailRow?.nama}</Dialog.Title>
			<div class="flex items-center gap-2 mt-1">
				<Badge variant={detailUnmet.length === 0 ? 'default' : 'destructive'} class="text-[10px]">
					{detailRow?.detail?.totalOk}/{detailRow?.detail?.total} terpenuhi
				</Badge>
				{#if detailUnmet.length > 0}
					<span class="text-xs text-destructive">{detailUnmet.length} indikator merah</span>
				{:else}
					<span class="text-xs text-green-600">Semua terpenuhi</span>
				{/if}
			</div>
		</Dialog.Header>
		<div class="max-h-[65vh] overflow-auto px-4 py-3">
			{#if detailIndikator.length === 0}
				<p class="text-sm text-muted-foreground py-4 text-center">Belum ada detail indikator.</p>
			{:else}
				<ul class="space-y-2">
					{#each detailIndikator as ind (ind.no)}
						<li class="flex items-start gap-2 rounded-lg border p-2.5 {ind.ok ? 'border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20' : 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'}">
							{#if ind.ok}
								<CheckCircle class="size-4 mt-0.5 shrink-0 text-green-600" />
							{:else}
								<XCircle class="size-4 mt-0.5 shrink-0 text-red-600" />
							{/if}
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-xs font-medium">{ind.no}. {ind.nama}</span>
									<Badge variant={ind.ok ? 'secondary' : 'destructive'} class="text-[9px]">
										{ind.ok ? 'OK' : 'Belum'}
									</Badge>
								</div>
								{#if ind.keterangan}
									<p class="text-[11px] text-muted-foreground mt-0.5">{ind.keterangan}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Modal: bukti screenshot -->
<Dialog.Root bind:open={buktiOpen}>
	<Dialog.Content class="max-w-4xl p-0 gap-0">
		<Dialog.Header class="px-4 py-3 border-b">
			<Dialog.Title class="text-sm">Bukti SKAKPT — {buktiNama}</Dialog.Title>
			<a href={buktiUrl} target="_blank" class="text-xs text-primary hover:underline">
				Buka gambar di tab baru
			</a>
		</Dialog.Header>
		<div class="max-h-[75vh] overflow-auto bg-muted/30">
			{#if buktiUrl}
				<img src={buktiUrl} alt="Bukti SKAKPT {buktiNama}" class="w-full max-w-3xl mx-auto" />
			{:else}
				<p class="p-8 text-center text-sm text-muted-foreground">Belum ada bukti</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
