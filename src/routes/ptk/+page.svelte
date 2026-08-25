<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	
	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	const filters = [['', 'Semua'], ['wali', 'Wali Kelas'], ['belum-sertifikasi', 'Belum Sertifikasi'], ['jtm-rendah', 'JTM < 24']];
	
	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'waliKelas', label: 'Wali', hideOnMobile: true },
		{ key: 'sertifikasi', label: 'Sert' },
		{ key: 'totalJtm', label: 'JTM' },
		{ key: 'kelengkapan', label: 'Kelengkapan' },
	];
</script>

<PageLayout title="Data PTK" description="Daftar pegawai/tendik">
	{#snippet actions()}
		<form method="GET" class="flex gap-1.5">
			<Input name="q" value={data.q} placeholder="Cari nama..." class="h-8 w-40 text-xs" />
			<Button type="submit" size="sm" class="h-8 cursor-pointer">Cari</Button>
		</form>
	{/snippet}
	
	{#snippet filters()}
		<div class="flex gap-1.5 overflow-x-auto pb-1">
			{#each filters as [f, label]}
				<a href="/ptk?filter={f}">
					<Badge variant={data.filter === f ? 'default' : 'outline'} class="cursor-pointer whitespace-nowrap text-xs">{label}</Badge>
				</a>
			{/each}
		</div>
	{/snippet}
	
	<DataTable {columns} data={rows} emptyMessage="Tidak ada data PTK">
		{#snippet children({ row, column })}
			{#if column.key === 'nama'}
				<div>
					<a href="/ptk/{row.id}" class="font-medium text-sm hover:underline">{row.nama}</a>
					<div class="text-[11px] text-muted-foreground">{row.fungsi}{#if row.kepegawaian} · {row.kepegawaian}{/if}</div>
				</div>
			{:else if column.key === 'waliKelas'}
				{row.waliKelas || '—'}
			{:else if column.key === 'sertifikasi'}
				{#if row.sertifikasi}
					<Badge variant="default" class="text-[10px] px-1.5 py-0">Ya</Badge>
				{:else}
					<Badge variant="outline" class="text-[10px] px-1.5 py-0">Belum</Badge>
				{/if}
			{:else if column.key === 'totalJtm'}
				<span class={row.totalJtm != null && row.totalJtm < 24 ? 'font-bold text-destructive' : ''}>
					{row.totalJtm ?? '—'}
				</span>
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>
	
	<p class="mt-2 text-xs text-muted-foreground">{rows.length} PTK</p>
</PageLayout>
