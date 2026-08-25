<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	
	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	
	function fmtAction(a: string) {
		if (a === 'login') return 'Login';
		if (a === 'submit_skakpt') return 'Submit SKAKPT';
		if (a === 'approve_skbk') return 'Approve SKBK';
		return a;
	}
	
	const columns = [
		{ key: 'createdAt', label: 'Waktu' },
		{ key: 'user', label: 'User' },
		{ key: 'action', label: 'Aksi' },
		{ key: 'detail', label: 'Detail' },
	];
</script>

<PageLayout title="Riwayat Aktivitas" description="Log aktivitas pengguna">
	<DataTable {columns} data={rows} emptyMessage="Tidak ada aktivitas">
		{#snippet children({ row, column })}
			{#if column.key === 'createdAt'}
				<span class="text-xs">{new Date(row.createdAt).toLocaleString('id-ID')}</span>
			{:else if column.key === 'action'}
				<Badge variant="outline" class="text-[10px]">{fmtAction(row.action)}</Badge>
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>
	
	<p class="mt-2 text-xs text-muted-foreground">{rows.length} aktivitas tercatat</p>
</PageLayout>
