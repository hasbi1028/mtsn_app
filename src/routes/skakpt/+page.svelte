<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	
	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	const menunggu = rows.filter((r: any) => r.status === 'Menunggu Verifikasi').length;
	const disetujui = rows.filter((r: any) => r.status === 'Disetujui').length;
	
	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'bulan', label: 'Bulan' },
		{ key: 'status', label: 'Status' },
		{ key: 'tglAjuan', label: 'Tgl Ajuan' },
	];
</script>

<PageLayout title="SKAKPT" description="Status SKAKPT (TA 2026/S1)">
	<div class="flex gap-2 mb-3 flex-wrap">
		<div class="bg-muted rounded-lg px-3 py-2 text-sm">Menunggu: <strong>{menunggu}</strong></div>
		<div class="bg-muted rounded-lg px-3 py-2 text-sm">Disetujui: <strong>{disetujui}</strong></div>
		<div class="bg-muted rounded-lg px-3 py-2 text-sm">Total: <strong>{rows.length}</strong></div>
	</div>
	
	<DataTable {columns} data={rows} emptyMessage="Tidak ada data SKAKPT">
		{#snippet children({ row, column })}
			{#if column.key === 'nama'}
				<a href="/ptk/{row.ptkId}" class="font-medium text-sm hover:underline">{row.nama}</a>
			{:else if column.key === 'status'}
				<Badge variant={row.status === 'Disetujui' ? 'default' : 'secondary'} class="text-[10px]">
					{row.status}
				</Badge>
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>
	
	<p class="mt-2 text-xs text-muted-foreground">{rows.length} PTK bersertifikasi</p>
</PageLayout>
