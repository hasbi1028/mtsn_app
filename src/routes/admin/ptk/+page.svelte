<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { getPtkListQ } from '$modules/ptk/ptk.remote';
	import { page } from '$app/state';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';

	let q = $derived(page.url.searchParams.get('q') || '');
	let filter = $derived(page.url.searchParams.get('filter') || '');
	let pg = $derived(parseInt(page.url.searchParams.get('page') || '1', 10) || 1);
	let sortBy = $derived(page.url.searchParams.get('sortBy') || 'nama');
	let sortDir = $derived(page.url.searchParams.get('sortDir') || 'asc');

	const resultQ = $derived(getPtkListQ({ q, filter, page: pg, perPage: 20, sortBy, sortDir: sortDir as 'asc' | 'desc' }));
	const filterOptions = [['', 'Semua'], ['wali', 'Wali Kelas'], ['belum-sertifikasi', 'Belum Sertifikasi'], ['jtm-rendah', 'JTM < 24']];

	const columns = [
		{ key: 'nama', label: 'Nama', sortable: true },
		{ key: 'nuptk', label: 'NUPTK', sortable: true, hideOnMobile: true },
		{ key: 'fungsi', label: 'Bidang', sortable: true },
		{ key: 'waliKelas', label: 'Wali', sortable: true, hideOnMobile: true },
		{ key: 'jabatanStruktural', label: 'Jabatan', sortable: true, hideOnMobile: true },
		{ key: 'sertifikasi', label: 'Sertif.', sortable: true },
		{ key: 'kelengkapan', label: 'Kelengkapan', sortable: true, hideOnMobile: true }
	];

	function sortUrl(col: string) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (filter) params.set('filter', filter);
		if (pg > 1) params.set('page', String(pg));
		if (sortBy === col) {
			params.set('sortBy', col);
			params.set('sortDir', sortDir === 'asc' ? 'desc' : 'asc');
		} else {
			params.set('sortBy', col);
			params.set('sortDir', 'asc');
		}
		return `/ptk?${params.toString()}`;
	}

	function pageUrl(searchQ: string, searchFilter: string, p: number) {
		const params = new URLSearchParams();
		if (searchQ) params.set('q', searchQ);
		if (searchFilter) params.set('filter', searchFilter);
		if (p > 1) params.set('page', String(p));
		if (sortBy !== 'nama') params.set('sortBy', sortBy);
		if (sortDir !== 'asc') params.set('sortDir', sortDir);
		const s = params.toString();
		return `/ptk${s ? '?' + s : ''}`;
	}
</script>

{#await resultQ}
	<p class="text-muted-foreground">Memuat data...</p>
{:then data}
	{@const rows = data.rows as any[]}
	{@const totalPages = Math.ceil(data.total / data.perPage)}

	<PageLayout title="Data PTK" description="Daftar pegawai/tendik">
		{#snippet actions()}
			<form method="GET" class="flex gap-1.5">
				{#if filter}<input type="hidden" name="filter" value={filter} />{/if}
				{#if sortBy !== 'nama'}<input type="hidden" name="sortBy" value={sortBy} />{/if}
				{#if sortDir !== 'asc'}<input type="hidden" name="sortDir" value={sortDir} />{/if}
				<Input name="q" value={q} placeholder="Cari nama..." class="h-8 w-40 text-xs" />
				<Button type="submit" size="sm" class="h-8 cursor-pointer">Cari</Button>
			</form>
		{/snippet}

		{#snippet filters()}
			<div class="flex gap-1.5 overflow-x-auto pb-1">
				{#each filterOptions as [f, label]}
					<a href="/admin/ptk?filter={f}{q ? `&q=${q}` : ''}{sortBy !== 'nama' ? `&sortBy=${sortBy}` : ''}{sortDir !== 'asc' ? `&sortDir=${sortDir}` : ''}">
						<Badge variant={filter === f ? 'default' : 'outline'} class="cursor-pointer whitespace-nowrap text-xs">{label}</Badge>
					</a>
				{/each}
			</div>
		{/snippet}

		<div class="rounded-md border">
			<table class="w-full caption-bottom text-sm">
				<thead class="[&_tr]:border-b">
					<tr class="border-b transition-colors hover:bg-muted/50">
						{#each columns as col}
							<th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
								{#if col.sortable}
									<a href={sortUrl(col.key)} class="flex items-center gap-1 hover:text-foreground cursor-pointer">
										{col.label}
										{#if sortBy === col.key}
											{#if sortDir === 'asc'}
												<ArrowUp class="size-3" />
											{:else}
												<ArrowDown class="size-3" />
											{/if}
										{:else}
											<ArrowUpDown class="size-3 opacity-50" />
										{/if}
									</a>
								{:else}
									{col.label}
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="[&_tr:last-child]:border-0">
					{#if rows.length === 0}
						<tr>
							<td colspan={columns.length} class="text-center text-muted-foreground py-8">
								Tidak ada data PTK
							</td>
						</tr>
					{:else}
						{#each rows as row}
							<tr class="border-b transition-colors hover:bg-muted/40">
								{#each columns as col}
									<td class="p-2 align-middle {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
										{#if col.key === 'nama'}
											<div>
												<a href="/admin/ptk/{row.publicId}" class="font-medium text-sm hover:underline">{row.nama}</a>
												<div class="text-[11px] text-muted-foreground">{row.fungsi}{#if row.kepegawaian} · {row.kepegawaian}{/if}</div>
											</div>
										{:else if col.key === 'waliKelas'}
											{row.waliKelas || '—'}
										{:else if col.key === 'sertifikasi'}
											{#if row.sertifikasi}
												<Badge variant="default" class="text-[10px] px-1.5 py-0">Ya</Badge>
											{:else}
												<Badge variant="outline" class="text-[10px] px-1.5 py-0">Belum</Badge>
											{/if}
										{:else if col.key === 'kelengkapan'}
											<div class="flex items-center gap-2">
												<div class="w-12 bg-secondary rounded-full h-1.5">
													<div class="bg-primary h-1.5 rounded-full" style="width: {row.kelengkapan ?? 0}%"></div>
												</div>
												<span class="text-xs">{row.kelengkapan ?? 0}%</span>
											</div>
										{:else if col.key === 'jabatanStruktural'}
											{row.jabatanStruktural || '—'}
										{:else}
											{row[col.key] ?? '—'}
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="flex items-center justify-between mt-3">
			<p class="text-xs text-muted-foreground">
				{(data.page - 1) * data.perPage + 1}–{Math.min(data.page * data.perPage, data.total)} dari {data.total} PTK
			</p>

			{#if totalPages > 1}
				<Pagination.Root count={data.total} perPage={data.perPage} page={data.page}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<a href={pageUrl(q, filter, Math.max(1, currentPage - 1))}>
									<Pagination.Previous />
								</a>
							</Pagination.Item>
							{#each pages as pgi (pgi.key)}
								{#if pgi.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<a href={pageUrl(q, filter, pgi.value)}>
											<Pagination.Link page={pgi} isActive={currentPage === pgi.value}>
												{pgi.value}
											</Pagination.Link>
										</a>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<a href={pageUrl(q, filter, Math.min(totalPages, currentPage + 1))}>
									<Pagination.Next />
								</a>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			{/if}
		</div>
	</PageLayout>
{/await}
