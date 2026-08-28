<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { goto, invalidateAll } from '$app/navigation';

const API = process.env.API_BASE || 'http://localhost:3730';

	let { data } = $props();
	const rekap = $derived(data.rekap as any[]);
	// rows bisa di-override hasil live search (tanpa reload)
	let rows = $state(data.rows as any[]);
	let totalLocal = $state(data.total as number);
	let pageLocal = $state(data.page as number);

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
		{ key: 'bansos_desil', label: 'Desil', hideOnMobile: true },
		{ key: 'bansos_sembako', label: 'Sembako', hideOnMobile: true },
		{ key: 'bansos_pkh', label: 'PKH', hideOnMobile: true },
		{ key: 'bansos_pbijk', label: 'PBI-JK', hideOnMobile: true },
		{ key: 'status_emis', label: 'Status' },
	];

	// State pencarian (live, debounce server)
	let q = $state(data.q || '');
	let nisn = $state(data.nisn || '');
	let ortu = $state(data.ortu || '');
	let searching = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function buildHref(extra: Record<string, string> = {}): string {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (nisn) params.set('nisn', nisn);
		if (ortu) params.set('ortu', ortu);
		if (data.kelas) params.set('kelas', data.kelas);
		if (data.rombel) params.set('rombel', data.rombel);
		if (data.status) params.set('status', data.status);
		Object.entries(extra).forEach(([k, v]) => {
			if (v) params.set(k, v);
			else params.delete(k);
		});
		const s = params.toString();
		return `/siswa${s ? '?' + s : ''}`;
	}

	async function doSearch() {
		searching = true;
		try {
			const params = new URLSearchParams();
			if (q) params.set('q', q);
			if (nisn) params.set('nisn', nisn);
			if (ortu) params.set('ortu', ortu);
			if (data.kelas) params.set('kelas', data.kelas);
			if (data.rombel) params.set('rombel', data.rombel);
			if (data.status) params.set('status', data.status);
			params.set('page', '1');
			const token = document.cookie.split('; ').find(c => c.startsWith('mtsn_session='))?.split('=')[1];
			const res = await fetch(`${API}/api/siswa?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
			if (res.ok) {
				const d = await res.json();
				rows = d.rows || [];
				totalLocal = d.total || 0;
				pageLocal = 1;
			}
		} finally {
			searching = false;
		}
	}

	// Debounce: setiap ketik -> tunggu 350ms -> fetch live
	function onSearch() {
		clearTimeout(timer);
		timer = setTimeout(() => { doSearch(); }, 350);
	}

	function submitNow(e: Event) {
		e.preventDefault();
		clearTimeout(timer);
		doSearch();
	}

	function onKelas(k: string) {
		clearTimeout(timer);
		data.kelas = k; // trigger derived tidak cukup, pakai invalidate
		invalidateAll();
	}
	function onStatus(st: string) {
		clearTimeout(timer);
		invalidateAll();
	}
	function resetSearch() {
		q = '';
		nisn = '';
		ortu = '';
		goto('/siswa' + (data.kelas ? `?kelas=${data.kelas}` : ''), { noScroll: true });
	}

	const totalPages = $derived(Math.ceil(totalLocal / data.perPage));

	function qs(p: number) {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (nisn) params.set('nisn', nisn);
		if (ortu) params.set('ortu', ortu);
		if (data.kelas) params.set('kelas', data.kelas);
		if (data.rombel) params.set('rombel', data.rombel);
		if (data.status) params.set('status', data.status);
		if (p > 1) params.set('page', String(p));
		const s = params.toString();
		return `/siswa${s ? '?' + s : ''}`;
	}

	function desilBadgeClass(desil: string | null): string {
		if (!desil || desil === '' || desil === 'TIDAK DITEMUKAN' || desil === 'BELUM ADA DESIL') {
			return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
		}
		const num = parseInt(desil);
		if (num >= 1 && num <= 4) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
		if (num === 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
		if (num >= 6 && num <= 10) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
		return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
	}

	function yesNoBadge(val: string | null): { text: string; class: string } {
		if (!val || val === '' || val === 'TIDAK') return { text: '—', class: 'bg-gray-100 text-gray-500' };
		if (val === 'YA' || val.startsWith('YA')) return { text: 'YA', class: 'bg-green-100 text-green-700' };
		return { text: val.substring(0, 10), class: 'bg-blue-100 text-blue-700' };
	}

	const activeSearch = $derived(q || nisn || ortu);
</script>

<PageLayout title="Data Siswa" description="Kesiswaan MTsN 2 Kolaka Utara — TA 2026/2027 Ganjil · sinkron EMIS 26-08-2026">
	{#snippet actions()}
		<form onsubmit={submitNow} class="flex flex-col gap-1.5 w-full sm:w-72">
			<div class="flex gap-1.5">
				<Input name="q" bind:value={q} oninput={onSearch} placeholder="Cari nama..." class="h-8 text-xs" />
				<Input name="nisn" bind:value={nisn} oninput={onSearch} placeholder="NISN" class="h-8 w-24 text-xs" />
			</div>
			<div class="flex gap-1.5">
				<Input name="ortu" bind:value={ortu} oninput={onSearch} placeholder="Nama ortu" class="h-8 text-xs flex-1" />
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
					<button onclick={() => onKelas(f)} class="cursor-pointer">
						<Badge variant={data.kelas === f ? 'default' : 'outline'} class="whitespace-nowrap text-xs">{label}</Badge>
					</button>
				{/each}
			</div>
			<span class="text-xs text-muted-foreground">|</span>
			<div class="flex flex-wrap gap-1.5">
				{#each statusFilters as [f, label]}
					<button onclick={() => onStatus(f)} class="cursor-pointer">
						<Badge variant={data.status === f ? 'default' : 'outline'} class="whitespace-nowrap text-xs">{label}</Badge>
					</button>
				{/each}
			</div>
			{#if searching}<span class="text-xs text-muted-foreground animate-pulse">mencari…</span>{/if}
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
				<p class="text-xl font-bold">{data.total}</p>
				<p class="text-[11px] text-muted-foreground">12 rombel</p>
			</div>
		</div>
	{/if}

	<DataTable {columns} data={rows} emptyMessage="Tidak ada data siswa">
		{#snippet children({ row, column })}
			{#if column.key === 'nama'}
				<a href="/siswa/{row.id}/profil" class="block hover:underline">
					<div>
						<span class="font-medium text-sm">{row.nama}</span>
						{#if !row.nis}<Badge variant="outline" class="ms-1 text-[10px] px-1 py-0">NIS?</Badge>{/if}
						<div class="text-[11px] text-muted-foreground">{row.ayah || '—'}{#if row.ibu} / {row.ibu}{/if}</div>
					</div>
				</a>
			{:else if column.key === 'nisn'}
				<span class="text-xs {!row.nisn ? 'text-destructive font-medium' : ''}">{row.nisn ?? 'kosong'}</span>
			{:else if column.key === 'jk'}
				<Badge variant={row.jk === 'L' ? 'secondary' : 'outline'} class="text-[10px] px-1.5 py-0">{row.jk ?? '?'}</Badge>
			{:else if column.key === 'kelas'}
				<span class="font-medium">{row.kelas}</span>
			{:else if column.key === 'rombel'}
				<span class="text-xs {(!row.rombel || row.rombel === '') ? 'text-destructive font-medium' : ''}">{row.rombel || '—'}</span>
			{:else if column.key === 'bansos_desil'}
				<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {desilBadgeClass(row.bansos_desil)}">
					{row.bansos_desil || '—'}
				</span>
			{:else if column.key === 'bansos_sembako'}
				{@const badge = yesNoBadge(row.bansos_sembako)}
				<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {badge.class}">
					{badge.text}
				</span>
			{:else if column.key === 'bansos_pkh'}
				{@const badge = yesNoBadge(row.bansos_pkh)}
				<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {badge.class}">
					{badge.text}
				</span>
			{:else if column.key === 'bansos_pbijk'}
				{@const badge = yesNoBadge(row.bansos_pbijk)}
				<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {badge.class}">
					{badge.text}
				</span>
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
			{(pageLocal - 1) * data.perPage + 1}–{Math.min(pageLocal * data.perPage, totalLocal)} dari {totalLocal} siswa
		</p>

		{#if totalPages > 1}
			<Pagination.Root count={totalLocal} perPage={data.perPage} page={pageLocal}>
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