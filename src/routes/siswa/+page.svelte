<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';

	let { data } = $props();
	const rows = $derived(data.rows as any[]);
	const rekap = $derived(data.rekap as any[]);

	const kelasFilters = [['', 'Semua'], ['7', 'Kelas VII'], ['8', 'Kelas VIII'], ['9', 'Kelas IX']];
	const statusFilters = [
		['', 'Semua Status'],
		['aktif', 'Aktif'],
		['nonaktif', 'Tidak Aktif'],
		['tanpa_rombel', 'Tanpa Rombel'],
	];

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nisn', label: 'NISN', hideOnMobile: true },
		{ key: 'jk', label: 'L/P' },
		{ key: 'kelas', label: 'Kls' },
		{ key: 'rombel', label: 'Rombel' },
		{ key: 'nik', label: 'NIK', hideOnMobile: true },
		{ key: 'status_emis', label: 'Status' },
	];

	const totalPages = $derived(Math.ceil(data.total / data.perPage));

	function qs(p: number) {
		const params = new URLSearchParams();
		if (data.kelas) params.set('kelas', data.kelas);
		if (data.q) params.set('q', data.q);
		if (data.rombel) params.set('rombel', data.rombel);
		if (data.status) params.set('status', data.status);
		if (p > 1) params.set('page', String(p));
		const s = params.toString();
		return `/siswa${s ? '?' + s : ''}`;
	}
</script>

<PageLayout title="Data Siswa" description="Kesiswaan MTsN 2 Kolaka Utara — TA 2026/2027 Ganjil · sinkron EMIS 26-08-2026">
	{#snippet actions()}
		<form method="GET" class="flex gap-1.5">
			{#if data.kelas}<input type="hidden" name="kelas" value={data.kelas} />{/if}
			{#if data.rombel}<input type="hidden" name="rombel" value={data.rombel} />{/if}
			{#if data.status}<input type="hidden" name="status" value={data.status} />{/if}
			<Input name="q" value={data.q} placeholder="Cari nama/NISN..." class="h-8 w-40 text-xs" />
			<Button type="submit" size="sm" class="h-8 cursor-pointer">Cari</Button>
		</form>
	{/snippet}

	{#snippet filters()}
		<div class="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
			<div class="flex flex-wrap gap-1.5">
				{#each kelasFilters as [f, label]}
					<a href="/siswa?kelas={f}{data.q ? `&q=${data.q}` : ''}{data.status ? `&status=${data.status}` : ''}">
						<Badge variant={data.kelas === f ? 'default' : 'outline'} class="cursor-pointer whitespace-nowrap text-xs">{label}</Badge>
					</a>
				{/each}
			</div>
			<span class="text-xs text-muted-foreground">|</span>
			<div class="flex flex-wrap gap-1.5">
				{#each statusFilters as [f, label]}
					<a href="/siswa?status={f}{data.kelas ? `&kelas=${data.kelas}` : ''}{data.q ? `&q=${data.q}` : ''}">
						<Badge variant={data.status === f ? 'default' : 'outline'} class="cursor-pointer whitespace-nowrap text-xs">{label}</Badge>
					</a>
				{/each}
			</div>
		</div>
	{/snippet}

	{#if rekap.length}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			{#each rekap as r}
				<div class="rounded-lg border p-3">
					<p class="text-xs text-muted-foreground">Kelas {r.kelas}</p>
					<p class="text-xl font-bold">{r.total}</p>
					<p class="text-[11px] text-muted-foreground">L {r.l} · P {r.p}</p>
				</div>
			{/each}
			<div class="rounded-lg border border-primary/40 bg-primary/5 p-3">
				<p class="text-xs text-muted-foreground">Total</p>
				<p class="text-xl font-bold">{data.total}</p>
				<p class="text-[11px] text-muted-foreground">12 rombel</p>
			</div>
		</div>
	{/if}

	<DataTable {columns} data={rows} emptyMessage="Tidak ada data siswa">
		{#snippet children({ row, column })}
			{#if column.key === 'nama'}
				<div>
					<span class="font-medium text-sm">{row.nama}</span>
					{#if !row.nis}<Badge variant="outline" class="ms-1 text-[10px] px-1 py-0">NIS?</Badge>{/if}
					<div class="text-[11px] text-muted-foreground">{row.ayah || '—'}{#if row.ibu} / {row.ibu}{/if}</div>
				</div>
			{:else if column.key === 'nisn'}
				<span class="text-xs {!row.nisn ? 'text-destructive font-medium' : ''}">{row.nisn ?? 'kosong'}</span>
			{:else if column.key === 'jk'}
				<Badge variant={row.jk === 'L' ? 'secondary' : 'outline'} class="text-[10px] px-1.5 py-0">{row.jk ?? '?'}</Badge>
			{:else if column.key === 'kelas'}
				<span class="font-medium">{row.kelas}</span>
			{:else if column.key === 'rombel'}
				<span class="text-xs {(!row.rombel || row.rombel === '') ? 'text-destructive font-medium' : ''}">{row.rombel || '—'}</span>
			{:else if column.key === 'nik'}
				<span class="text-xs font-mono">{row.nik || '—'}</span>
			{:else if column.key === 'status_emis'}
				{#if row.status_emis === 'Tidak Aktif'}
					<Badge variant="destructive" class="text-[10px] px-1.5 py-0">Non-Aktif</Badge>
				{:else if row.status_emis === 'Aktif Tanpa Rombel' || !row.rombel}
					<Badge variant="outline" class="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600">Tanpa Rombel</Badge>
				{:else}
					<Badge variant="outline" class="text-[10px] px-1.5 py-0 border-green-600 text-green-700">Aktif</Badge>
				{/if}
			{:else}
				{row[column.key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	<div class="flex items-center justify-between mt-3">
		<p class="text-xs text-muted-foreground">
			{(data.page - 1) * data.perPage + 1}–{Math.min(data.page * data.perPage, data.total)} dari {data.total} siswa
		</p>

		{#if totalPages > 1}
			<Pagination.Root count={data.total} perPage={data.perPage} page={data.page}>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<a href={qs(Math.max(1, currentPage - 1))}>
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
									<a href={qs(pg.value)}>
										<Pagination.Link page={pg} isActive={currentPage === pg.value}>
											{pg.value}
										</Pagination.Link>
									</a>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<a href={qs(Math.min(totalPages, currentPage + 1))}>
								<Pagination.Next />
							</a>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{/if}
	</div>
</PageLayout>
