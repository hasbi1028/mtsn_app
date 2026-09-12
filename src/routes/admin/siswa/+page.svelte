<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import { getSiswaListQ, getRekapQ } from '$modules/siswa/siswa.remote';
	import { page } from '$app/state';

	let qParam = $derived(page.url.searchParams.get('q') || '');
	let kelasParam = $derived(page.url.searchParams.get('kelas') || '');
	let nisnParam = $derived(page.url.searchParams.get('nisn') || '');
	let ortuParam = $derived(page.url.searchParams.get('ortu') || '');
	let rombelParam = $derived(page.url.searchParams.get('rombel') || '');
	let statusParam = $derived(page.url.searchParams.get('status') || '');
	let pageParam = $derived(parseInt(page.url.searchParams.get('page') || '1', 10) || 1);

	const rekapQ = getRekapQ();
	const listQ = $derived(getSiswaListQ({ q: qParam, kelas: kelasParam, nisn: nisnParam, ortu: ortuParam, rombel: rombelParam, status: statusParam, page: pageParam, perPage: 20 }));

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
		{ key: 'nik', label: 'NIK', hideOnMobile: true },
		{ key: 'nis', label: 'NIS Lokal', hideOnMobile: true },
		{ key: 'jk', label: 'L/P' },
		{ key: 'kelas', label: 'Kls' },
		{ key: 'rombel', label: 'Rombel' },
		{ key: 'status_emis', label: 'Status' },
	];

	let q = $state('');

	$effect(() => {
		q = qParam || '';
	});

	function buildHref(extra: Record<string, string> = {}): string {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (kelasParam) params.set('kelas', kelasParam);
		if (rombelParam) params.set('rombel', rombelParam);
		if (statusParam) params.set('status', statusParam);
		Object.entries(extra).forEach(([k, v]) => {
			if (v) params.set(k, v);
			else params.delete(k);
		});
		const s = params.toString();
		return `/siswa${s ? '?' + s : ''}`;
	}

	function onKelas(k: string) {
		goto(buildHref({ kelas: k, page: '' }), { noScroll: true });
	}

	function onStatus(st: string) {
		goto(buildHref({ status: st, page: '' }), { noScroll: true });
	}

	function resetFilters() {
		goto('/siswa', { noScroll: true });
	}

	function resetSearch() {
		q = '';
		goto(buildHref({ q: '', page: '' }), { noScroll: true });
	}

	const perPage = 20;

	function qs(p: number) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (kelasParam) params.set('kelas', kelasParam);
		if (rombelParam) params.set('rombel', rombelParam);
		if (statusParam) params.set('status', statusParam);
		if (p > 1) params.set('page', String(p));
		const s = params.toString();
		return `/siswa${s ? '?' + s : ''}`;
	}

	const activeSearch = $derived(Boolean(q));
	const activeFilters = $derived(Boolean(kelasParam || statusParam || rombelParam));
</script>

{#await Promise.all([rekapQ, listQ])}
	<p class="text-muted-foreground">Memuat data...</p>
{:then [rekap, listResult]}
	{@const rows = listResult.rows as any[]}
	{@const totalLocal = listResult.total as number}
	{@const pageLocal = listResult.page as number}
	{@const totalPages = Math.ceil(totalLocal / perPage)}

	<PageLayout title="Data Siswa" description="Kesiswaan MTsN 2 Kolaka Utara — TA 2026/2027 Ganjil · sinkron EMIS 26-08-2026">
		{#snippet actions()}
			<form method="GET" action="/siswa" class="flex flex-col gap-1.5 w-full sm:w-72">
				<div class="flex gap-1.5">
					<Input name="q" bind:value={q} placeholder="Cari nama..." class="h-8 text-xs" />
					<Button type="submit" size="sm" class="h-8 px-2" aria-label="Cari siswa"><Search class="size-4" /></Button>
				</div>
				<div class="flex gap-1.5">
					<input type="hidden" name="kelas" value={kelasParam || ''} />
					<input type="hidden" name="rombel" value={rombelParam || ''} />
					<input type="hidden" name="status" value={statusParam || ''} />
					{#if activeSearch}
						<Button type="button" variant="outline" size="sm" class="h-8 cursor-pointer" onclick={resetSearch}>Reset</Button>
					{/if}
				</div>
			</form>
		{/snippet}

		{#snippet filters()}
			<div class="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
				<div class="flex flex-wrap gap-1.5">
					{#each kelasFilters as [f, label]}
						<button type="button" onclick={() => onKelas(f)} class="cursor-pointer">
							<Badge variant={kelasParam === f ? 'default' : 'outline'} class="whitespace-nowrap text-xs">{label}</Badge>
						</button>
					{/each}
				</div>
				<span class="text-xs text-muted-foreground">|</span>
				<div class="flex flex-wrap gap-1.5">
					{#each statusFilters as [f, label]}
						<button type="button" onclick={() => onStatus(f)} class="cursor-pointer">
							<Badge variant={statusParam === f ? 'default' : 'outline'} class="whitespace-nowrap text-xs">{label}</Badge>
						</button>
					{/each}
				</div>
				{#if activeFilters}
					<Button type="button" variant="ghost" size="sm" class="h-7 text-xs cursor-pointer" onclick={resetFilters}>Reset filter</Button>
				{/if}
			</div>
		{/snippet}

		{#if rekap.length && !activeSearch}
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
					<p class="text-xl font-bold">{totalLocal}</p>
					<p class="text-[11px] text-muted-foreground">{rekap.length} kelas</p>
				</div>
			</div>
		{/if}

		<DataTable {columns} data={rows} emptyMessage="Tidak ada data siswa">
			{#snippet children({ row, column })}
				{#if column.key === 'nama'}
					<a href="/admin/siswa/{row.publicId}/profil" class="block hover:underline">
						<div>
							<span class="font-medium text-sm">{row.nama}</span>
							{#if !row.nis}<Badge variant="outline" class="ms-1 text-[10px] px-1 py-0">NIS?</Badge>{/if}
							<div class="text-[11px] text-muted-foreground">{row.ayah || '—'}{#if row.ibu} / {row.ibu}{/if}</div>
						</div>
					</a>
				{:else if column.key === 'nisn'}
					<span class="text-xs {!row.nisn ? 'text-destructive font-medium' : ''}">{row.nisn ?? 'kosong'}</span>
				{:else if column.key === 'nik'}
					<span class="text-xs {(!row.nik || row.nik === '') ? 'text-muted-foreground' : ''}">{row.nik || '—'}</span>
				{:else if column.key === 'nis'}
					<span class="text-xs {(!row.nis || row.nis === '') ? 'text-muted-foreground' : ''}">{row.nis || '—'}</span>
				{:else if column.key === 'jk'}
					<Badge variant={row.jk === 'L' ? 'secondary' : 'outline'} class="text-[10px] px-1.5 py-0">{row.jk ?? '?'}</Badge>
				{:else if column.key === 'kelas'}
					<span class="font-medium">{row.kelas}</span>
				{:else if column.key === 'rombel'}
					<span class="text-xs {(!row.rombel || row.rombel === '') ? 'text-destructive font-medium' : ''}">{row.rombel || '—'}</span>
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
				{(pageLocal - 1) * perPage + 1}–{Math.min(pageLocal * perPage, totalLocal)} dari {totalLocal} siswa
			</p>

			{#if totalPages > 1}
				<Pagination.Root count={totalLocal} perPage={perPage} page={pageLocal}>
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
{/await}
