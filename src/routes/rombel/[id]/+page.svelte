<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import DataTable from '$lib/components/data-table.svelte';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { notify } from '$lib/toast';
	import { enhance } from '$app/forms';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let { data, form } = $props();
	const rombel = $derived(data.rombel as any);
	const siswas = $derived((rombel?.siswa as any[]) || []);
	const selectedSiswa = $derived((data.selectedSiswa as any[]) || []);
	const allPtk = $derived((data.allPtk as any[]) || []);

	// Toast dari hasil aksi
	$effect(() => {
		notify.fromForm(form, 'Aksi berhasil');
	});

	const columns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nis', label: 'NIS', hideOnMobile: true },
		{ key: 'nisn', label: 'NISN', hideOnMobile: true },
		{ key: 'jk', label: 'L/P' },
		{ key: 'aksi', label: 'Aksi' },
	];

	// Dialog alokasi
	let addOpen = $state(false);
	let q = $state('');
	const filteredKandidat = $derived(
		q
			? selectedSiswa.filter((s: any) => (s.nama || '').toLowerCase().includes(q.toLowerCase()))
			: selectedSiswa
	);
	const checked = $state<Set<number>>(new Set());
	function toggle(sid: number) {
		if (checked.has(sid)) checked.delete(sid);
		else checked.add(sid);
	}
	function bukaAlokasi() {
		q = '';
		checked.clear();
		addOpen = true;
	}
	const kapasitasSisa = $derived((rombel?.kapasitas || 40) - (rombel?.jml_siswa || 0));
</script>

<svelte:head><title>{rombel?.nama || 'Rombel'} — MTsN App</title></svelte:head>

<a href="/rombel" class="text-sm text-muted-foreground hover:underline mb-2 inline-block">
	← Kembali
</a>

{#if !data.notFound}
	<PageLayout
		title={`Rombel ${rombel?.nama}`}
		description={`Kelas ${rombel?.kelas}${rombel?.label ? ' · ' + rombel.label : ''} — ${rombel?.jml_siswa}/${rombel?.kapasitas} siswa`}
	>
		{#snippet actions()}
			<div class="flex flex-wrap gap-2">
				{#if kapasitasSisa > 0}
					<Button size="sm" class="cursor-pointer" onclick={bukaAlokasi}>
						<UserPlus class="size-4" /> Alokasikan Siswa
					</Button>
				{/if}
				<!-- Assign wali -->
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button size="sm" variant="outline" class="cursor-pointer" {...props}>
								<UserCheck class="size-4" /> {rombel?.wali_nama ? 'Ganti Wali' : 'Set Wali'}
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-w-md">
						<Dialog.Header>
							<Dialog.Title>Assign Wali Kelas — {rombel?.nama}</Dialog.Title>
							<Dialog.Description>Pilih PTK yang menjadi wali kelas</Dialog.Description>
						</Dialog.Header>
						<form method="POST" action="?/assignWali" use:enhance class="flex flex-col gap-3">
							<select name="ptk_id" class="h-9 rounded-md border border-input bg-background px-3 text-sm">
								<option value="">— Pilih wali —</option>
								{#each allPtk as p (p.ptkId ?? p.id)}
									<option value={p.ptkId ?? p.id} selected={p.ptkId === rombel?.wali_ptk_id}>
										{p.nama}{p.waliKelas ? ` (wali ${p.waliKelas})` : ''}
									</option>
								{/each}
							</select>
							<div class="flex justify-end gap-2">
								<Dialog.Close>
									{#snippet child({ props })}
										<Button type="button" variant="outline" size="sm" {...props}>Batal</Button>
									{/snippet}
								</Dialog.Close>
								<Button type="submit" size="sm" class="cursor-pointer">Simpan</Button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		{/snippet}

		{#snippet filters()}
			<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<Badge class="text-[10px]">Wali: {rombel?.wali_nama || 'Belum ada'}</Badge>
				<Badge variant="outline" class="text-[10px]">
					{rombel?.jml_siswa}/{rombel?.kapasitas} siswa ({Math.max(0, kapasitasSisa)} slot sisa)
				</Badge>
				<span class="text-[11px]">{siswas.length} siswa terdaftar di {rombel?.nama}</span>
			</div>
		{/snippet}

		<DataTable {columns} data={siswas} emptyMessage="Belum ada siswa di rombel ini">
			{#snippet children({ row, column })}
				{#if column.key === 'nama'}
					<a href="/siswa/{row.id}/profil" class="font-medium text-sm hover:underline">{row.nama}</a>
				{:else if column.key === 'aksi'}
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="siswa_id" value={row.id} />
						<Button type="submit" size="sm" variant="ghost" class="h-6 text-[10px] text-destructive cursor-pointer" title="Keluarkan">
							<Trash2 class="size-3" /> Keluar
						</Button>
					</form>
				{:else}
					{row[column.key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>

		{#if kapasitasSisa > 0 && selectedSiswa.length === 0}
			<p class="mt-3 text-xs text-muted-foreground">
				Belum ada siswa tanpa rombel untuk dialokasikan.
			</p>
		{/if}
	</PageLayout>

	<!-- Dialog Alokasi Siswa -->
	<Dialog.Root bind:open={addOpen}>
		<Dialog.Content class="max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Alokasikan Siswa — {rombel?.nama}</Dialog.Title>
				<Dialog.Description>
					{selectedSiswa.length} siswa belum punya rombel · {kapasitasSisa} slot tersisa
				</Dialog.Description>
			</Dialog.Header>
			<div class="px-2 pb-2">
				<Input bind:value={q} placeholder="Cari nama siswa..." class="h-8 mb-2 text-xs" />
				<form method="POST" action="?/allocate" use:enhance>
					<input type="hidden" name="siswa_ids" value={JSON.stringify([...checked])} />
					<div class="max-h-64 overflow-y-auto border rounded-lg divide-y">
						{#if filteredKandidat.length === 0}
							<p class="p-4 text-center text-xs text-muted-foreground">Tidak ada siswa.</p>
						{:else}
							{#each filteredKandidat as s (s.id)}
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
							<Button type="submit" size="sm" class="cursor-pointer" disabled={checked.size === 0}>
								Alokasikan ({checked.size})
							</Button>
						</div>
					</div>
				</form>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<PageLayout title="Rombel tidak ditemukan" description="Data rombel ini tidak ada.">
		<p class="text-sm text-muted-foreground">Periksa kembali URL atau kembali ke daftar rombel.</p>
		<a href="/rombel" class="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
			<ArrowLeft class="size-4" /> Daftar Rombel
		</a>
	</PageLayout>
{/if}