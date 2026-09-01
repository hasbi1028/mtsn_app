<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	const filterOptions = [['', 'Semua'], ['wali', 'Wali Kelas'], ['belum-sertifikasi', 'Belum Sertifikasi'], ['jtm-rendah', 'JTM < 24']];

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'waliKelas', label: 'Wali', hideOnMobile: true },
		{ key: 'sertifikasi', label: 'Sert' },
		{ key: 'totalJtm', label: 'JTM' },
		{ key: 'kelengkapan', label: 'Kelengkapan' },
	];

	const totalPages = $derived(Math.ceil(data.total / data.perPage));

	function pageUrl(p: number) {
		const params = new URLSearchParams();
		if (data.q) params.set('q', data.q);
		if (data.filter) params.set('filter', data.filter);
		if (p > 1) params.set('page', String(p));
		const qs = params.toString();
		return `/ptk${qs ? '?' + qs : ''}`;
	}
</script>

<PageLayout title="Data PTK" description="Daftar pegawai/tendik">
	{#snippet actions()}
		<form method="GET" class="flex gap-1.5">
			{#if data.filter}<input type="hidden" name="filter" value={data.filter} />{/if}
			<Input name="q" value={data.q} placeholder="Cari nama..." class="h-8 w-40 text-xs" />
			<Button type="submit" size="sm" class="h-8 cursor-pointer">Cari</Button>
		</form>
	{/snippet}

	{#snippet filters()}
		<div class="flex gap-1.5 overflow-x-auto pb-1">
			{#each filterOptions as [f, label]}
				<a href="/ptk?filter={f}{data.q ? `&q=${data.q}` : ''}">
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

	<div class="flex items-center justify-between mt-3">
		<p class="text-xs text-muted-foreground">
			{(data.page - 1) * data.perPage + 1}–{Math.min(data.page * data.perPage, data.total)} dari {data.total} PTK
		</p>

		{#if totalPages > 1}
			<Pagination.Root count={data.total} perPage={data.perPage} page={data.page}>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<a href={pageUrl(Math.max(1, currentPage - 1))}>
								<Pagination.Previous />
							</a>
						</Pagination.Item>
						{#each pages as pg (pg.key)}
							{#if pg.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<a href={pageUrl(pg.value)}>
										<Pagination.Link page={pg} isActive={currentPage === pg.value}>
											{pg.value}
										</Pagination.Link>
									</a>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<a href={pageUrl(Math.min(totalPages, currentPage + 1))}>
								<Pagination.Next />
							</a>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{/if}
	</div>
</PageLayout>
