<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { getSkbkListQ } from '$modules/dokumen/dokumen.remote';
	
	const rowsQuery = getSkbkListQ() as Promise<any[]>;
	
	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'jtmTotal', label: 'JTM' },
		{ key: 'status', label: 'Status' },
	];
</script>

<PageLayout title="SKBK" description="Status SKBK PTK (TA 2026/S1)">
	{#await rowsQuery}
		<p class="text-sm text-muted-foreground">Memuat data...</p>
	{:then rows}
		{@const belum = rows.filter((r: any) => r.status === 'Belum Diajukan').length}
		{@const sudah = rows.filter((r: any) => r.status === 'Sudah Diajukan').length}
		<div class="flex gap-2 mb-3">
			<div class="bg-muted rounded-lg px-3 py-2 text-sm">
				Belum diajukan: <strong>{belum}</strong>
			</div>
			<div class="bg-muted rounded-lg px-3 py-2 text-sm">
				Sudah diajukan: <strong>{sudah}</strong>
			</div>
		</div>
		
		<DataTable {columns} data={rows} emptyMessage="Tidak ada data SKBK">
			{#snippet children({ row, column })}
				{#if column.key === 'nama'}
					<a href="/ptk/{row.ptkId}" class="font-medium text-sm hover:underline">{row.nama}</a>
				{:else if column.key === 'status'}
					<Badge variant={row.status === 'Disetujui' ? 'default' : row.status === 'Sudah Diajukan' ? 'secondary' : 'destructive'} class="text-[10px]">
						{row.status}
					</Badge>
				{:else}
					{row[column.key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
		
		<p class="mt-2 text-xs text-muted-foreground">{rows.length} PTK bersertifikasi</p>
	{/await}
</PageLayout>
