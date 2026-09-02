<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import { notify } from '$lib/toast';
	import { enhance } from '$app/forms';

	let { data } = $props();
	const rows = $derived(data.rows as any[]);

	// Filter status
	const terbit = $derived(rows.filter((r: any) => r.status === 'Sudah Terbit' || r.download));
	const belum = $derived(rows.filter((r: any) => r.status !== 'Sudah Terbit' && !r.download));

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nuptk', label: 'NUPTK', hideOnMobile: true },
		{ key: 'syarat', label: 'Syarat' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', hideOnMobile: true },
	];

	function getPdfUrl(row: any): string {
		const nama = row.nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
		return `/uploads/skakpt/SKAKPT_${nama}_Juli2026.pdf`;
	}

	function getPdfTitle(row: any): string {
		return `SKAKPT ${row.nama} — Juli 2026`;
	}
</script>

<PageLayout title="SKAKPT" description="Surat Keputusan Administrasi Keuangan Penerima Tunjangan — TA 2026/S1 Bulan Juli 2026">
	{#snippet actions()}
		<div class="flex gap-2">
			<div class="bg-green-100 dark:bg-green-900 rounded-lg px-3 py-2 text-sm">
				Sudah Terbit: <strong class="text-green-700 dark:text-green-300">{terbit.length}</strong>
			</div>
			<div class="bg-yellow-100 dark:bg-yellow-900 rounded-lg px-3 py-2 text-sm">
				Belum: <strong class="text-yellow-700 dark:text-yellow-300">{belum.length}</strong>
			</div>
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
				<Badge variant={row.syarat === '11/11' ? 'default' : 'secondary'} class="text-[10px]">
					{row.syarat}
				</Badge>
			{:else if column.key === 'status'}
				{#if row.status === 'Sudah Terbit' || row.download}
					<Badge variant="default" class="text-[10px]">
						✓ Sudah Terbit
					</Badge>
				{:else}
					<Badge variant="secondary" class="text-[10px]">
						Belum Terbit
					</Badge>
				{/if}
			{:else if column.key === 'aksi'}
				{#if row.status === 'Sudah Terbit' || row.download}
					<div class="flex gap-1">
						<!-- Lihat PDF -->
						<PdfViewer src={getPdfUrl(row)} title={getPdfTitle(row)} />
						<!-- Download PDF -->
						<form method="POST" action="?/download" use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' && result.data?.ok) {
									const a = document.createElement('a');
									a.href = getPdfUrl(row);
									a.download = String(result.data.filename || `SKAKPT_${row.nama.replace(/[^a-zA-Z0-9]/g, '_')}_Juli2026.pdf`);
									a.click();
									notify.success('Download SKAKPT ' + row.nama);
								}
							};
						}}>
							<input type="hidden" name="filename" value="SKAKPT_{row.nama.replace(/[^a-zA-Z0-9]/g, '_')}_Juli2026.pdf" />
							<Button type="submit" size="sm" variant="outline" class="h-7 text-[10px] cursor-pointer">
								↓
							</Button>
						</form>
					</div>
				{:else}
					<span class="text-xs text-muted-foreground">—</span>
				{/if}
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	<p class="mt-2 text-xs text-muted-foreground">
		{rows.length} PTK bersertifikasi · {terbit.length} SKAKPT sudah terbit bulan Juli 2026
	</p>
</PageLayout>
