<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { getSkmtListQ } from '$modules/dokumen/dokumen.remote';
	
	const rowsQuery = getSkmtListQ() as Promise<any[]>;
	
	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'instansi', label: 'Instansi' },
		{ key: 'status', label: 'Status' },
		{ key: 'nilai', label: 'Nilai', hideOnMobile: true },
	];
</script>

<PageLayout title="SKMT" description="Status SKMT PTK (TA 2026/S1)">
	{#await rowsQuery}
		<p class="text-sm text-muted-foreground">Memuat data...</p>
	{:then rows}
		<DataTable {columns} data={rows} emptyMessage="Tidak ada data SKMT">
			{#snippet children({ row, column })}
				{#if column.key === 'nama'}
					<a href="/ptk/{row.ptkId}" class="font-medium text-sm hover:underline">{row.nama}</a>
				{:else if column.key === 'status'}
					<Badge variant={row.status?.startsWith('Disetujui') ? 'default' : (row.status === 'Menunggu' ? 'secondary' : 'outline')} class="text-[10px]">
						{row.status}
					</Badge>
				{:else if column.key === 'nilai'}
					{#if row.nilaiPembelajaran != null}
						{row.nilaiPembelajaran}/{row.nilaiBimbingan}
					{:else}-{/if}
				{:else}
					{row[column.key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
		
		<p class="mt-2 text-xs text-muted-foreground">{rows.length} ajuan tercatat</p>
	{/await}
</PageLayout>
