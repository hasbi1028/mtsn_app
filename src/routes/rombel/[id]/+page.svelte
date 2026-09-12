<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { notify } from '$lib/toast';
	import { getRombelDetailQ, getAvailableSiswaQ, getAllPtkQ, allocateSiswaC, removeSiswaC, setWaliKelasC } from '$modules/rombel/rombel.remote';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const rombelId = $derived(Number(page.params.id));
	const detailQuery = $derived(getRombelDetailQ(rombelId));
	const availableQuery = $derived(getAvailableSiswaQ());
	const ptkQuery = $derived(getAllPtkQ());

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nis', label: 'NIS', hideOnMobile: true },
		{ key: 'nisn', label: 'NISN', hideOnMobile: true },
		{ key: 'jk', label: 'L/P' },
		{ key: 'aksi', label: 'Aksi' },
	];

	let addOpen = $state(false);
	let q = $state('');
	const checked = $state<Set<number>>(new Set());

	function filterKandidat(list: any[]) {
		if (!q) return list;
		return list.filter((s: any) => (s.nama || '').toLowerCase().includes(q.toLowerCase()));
	}

	function toggle(sid: number) {
		if (checked.has(sid)) checked.delete(sid);
		else checked.add(sid);
	}
	function bukaAlokasi() {
		q = '';
		checked.clear();
		addOpen = true;
	}

	async function handleAllocate() {
		const ids = [...checked];
		if (ids.length === 0) return;
		const result = await allocateSiswaC({ rombelId, siswaIds: ids }) as any;
		if (result?.ok) {
			notify.success(result.pesan);
			addOpen = false;
			detailQuery.refresh();
			availableQuery.refresh();
		} else {
			notify.error(result?.error || 'Gagal alokasi');
		}
	}

	async function handleRemove(siswaId: number) {
		const result = await removeSiswaC({ rombelId, siswaId }) as any;
		if (result?.ok) {
			notify.success(result.pesan);
			detailQuery.refresh();
			availableQuery.refresh();
		} else {
			notify.error(result?.error || 'Gagal keluarkan siswa');
		}
	}

	let waliOpen = $state(false);
	let selectedPtkId = $state(0);

	async function handleAssignWali() {
		if (!selectedPtkId) return;
		const result = await setWaliKelasC({ rombelId, ptkId: selectedPtkId }) as any;
		if (result?.ok) {
			notify.success(result.pesan);
			waliOpen = false;
			detailQuery.refresh();
		} else {
			notify.error(result?.error || 'Gagal set wali');
		}
	}
</script>

<svelte:head><title>Rombel — MTsN App</title></svelte:head>

<a href={resolve('/rombel')} class="text-sm text-muted-foreground hover:underline mb-2 inline-block">
	← Kembali
</a>

{#await Promise.all([detailQuery, availableQuery, ptkQuery])}
	<p class="text-sm text-muted-foreground text-center py-8">Memuat data rombel...</p>
{:then [rombelRaw, availableSiswaRaw, allPtkRaw]}
	{@const rombel = rombelRaw as any}
	{@const availableSiswa = availableSiswaRaw as any[]}
	{@const allPtk = allPtkRaw as any[]}
	{@const siswas = (rombel?.siswa as any[]) || []}
	{@const kapasitasSisa = (rombel?.kapasitas || 40) - (rombel?.jml_siswa || 0)}

	{#if !rombel}
		<PageLayout title="Rombel tidak ditemukan" description="Data rombel ini tidak ada.">
			<p class="text-sm text-muted-foreground">Periksa kembali URL atau kembali ke daftar rombel.</p>
			<a href={resolve('/rombel')} class="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
				<ArrowLeft class="size-4" /> Daftar Rombel
			</a>
		</PageLayout>
	{:else}
		<PageLayout
			title={`Rombel ${rombel.nama}`}
			description={`Kelas ${rombel.kelas}${rombel.label ? ' · ' + rombel.label : ''} — ${rombel.jml_siswa}/${rombel.kapasitas} siswa`}
		>
			{#snippet actions()}
				<div class="flex flex-wrap gap-2">
					{#if kapasitasSisa > 0}
						<Button size="sm" class="cursor-pointer" onclick={bukaAlokasi}>
							<UserPlus class="size-4" /> Alokasikan Siswa
						</Button>
					{/if}
					<Button size="sm" variant="outline" class="cursor-pointer" onclick={() => { selectedPtkId = rombel.wali_ptk_id || 0; waliOpen = true; }}>
						<UserCheck class="size-4" /> {rombel.wali_nama ? 'Ganti Wali' : 'Set Wali'}
					</Button>
				</div>
			{/snippet}

			{#snippet filters()}
				<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					<Badge class="text-[10px]">Wali: {rombel.wali_nama || 'Belum ada'}</Badge>
					<Badge variant="outline" class="text-[10px]">
						{rombel.jml_siswa}/{rombel.kapasitas} siswa ({Math.max(0, kapasitasSisa)} slot sisa)
					</Badge>
					<span class="text-[11px]">{siswas.length} siswa terdaftar di {rombel.nama}</span>
				</div>
			{/snippet}

			<DataTable {columns} data={siswas} emptyMessage="Belum ada siswa di rombel ini">
				{#snippet children({ row, column })}
					{#if column.key === 'nama'}
						<a href={resolve(`/siswa/${row.id}/profil`)} class="font-medium text-sm hover:underline">{row.nama}</a>
					{:else if column.key === 'aksi'}
						<Button size="sm" variant="ghost" class="h-6 text-[10px] text-destructive cursor-pointer" title="Keluarkan" onclick={() => handleRemove(row.id)}>
							<Trash2 class="size-3" /> Keluar
						</Button>
					{:else}
						{row[column.key] ?? '—'}
					{/if}
				{/snippet}
			</DataTable>

			{#if kapasitasSisa > 0 && availableSiswa.length === 0}
				<p class="mt-3 text-xs text-muted-foreground">
					Belum ada siswa tanpa rombel untuk dialokasikan.
				</p>
			{/if}
		</PageLayout>

		<!-- Dialog Alokasi Siswa -->
		<Dialog.Root bind:open={addOpen}>
			<Dialog.Content class="max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Alokasikan Siswa — {rombel.nama}</Dialog.Title>
					<Dialog.Description>
						{availableSiswa.length} siswa belum punya rombel · {kapasitasSisa} slot tersisa
					</Dialog.Description>
				</Dialog.Header>
				<div class="px-2 pb-2">
					<Input bind:value={q} placeholder="Cari nama siswa..." class="h-8 mb-2 text-xs" />
					<div class="max-h-64 overflow-y-auto border rounded-lg divide-y">
						{#if filterKandidat(availableSiswa).length === 0}
							<p class="p-4 text-center text-xs text-muted-foreground">Tidak ada siswa.</p>
						{:else}
							{#each filterKandidat(availableSiswa) as s (s.id)}
								<label class="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
									<input type="checkbox" class="size-4" checked={checked.has(s.id)} onchange={() => toggle(s.id)} />
									<div class="min-w-0 flex-1">
										<span class="block truncate font-medium">{s.nama}</span>
										<span class="block text-[11px] text-muted-foreground">
											{s.kelas ? `Kelas ${s.kelas}` : ''} {s.nisn ? `· ${s.nisn}` : ''}
										</span>
									</div>
								</label>
							{/each}
						{/if}
					</div>
					<div class="flex items-center justify-between mt-3">
						<span class="text-xs text-muted-foreground">{checked.size} dipilih</span>
						<div class="flex gap-2">
							<Button type="button" variant="outline" size="sm" onclick={() => (addOpen = false)}>Batal</Button>
							<Button type="button" size="sm" class="cursor-pointer" disabled={checked.size === 0} onclick={handleAllocate}>
								Alokasikan ({checked.size})
							</Button>
						</div>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Dialog Assign Wali -->
		<Dialog.Root bind:open={waliOpen}>
			<Dialog.Content class="max-w-md">
				<Dialog.Header>
					<Dialog.Title>Assign Wali Kelas — {rombel.nama}</Dialog.Title>
					<Dialog.Description>Pilih PTK yang menjadi wali kelas</Dialog.Description>
				</Dialog.Header>
				<div class="flex flex-col gap-3">
					<select bind:value={selectedPtkId} class="h-9 rounded-md border border-input bg-background px-3 text-sm">
						<option value={0}>— Pilih wali —</option>
						{#each allPtk as p (p.id)}
							<option value={p.id} selected={p.id === rombel.wali_ptk_id}>
								{p.nama}
							</option>
						{/each}
					</select>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" size="sm" onclick={() => (waliOpen = false)}>Batal</Button>
						<Button type="button" size="sm" class="cursor-pointer" onclick={handleAssignWali}>Simpan</Button>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{:catch err}
	<p class="text-sm text-destructive text-center py-8">Gagal memuat data rombel: {err.message}</p>
{/await}
