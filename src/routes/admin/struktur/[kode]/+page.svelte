<script lang="ts">
	import { resolve } from '$app/paths';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { notify } from '$lib/toast';
	import { namaTampil } from '$modules/struktur/struktur-bagan.util';
	import {
		bolehUbahStrukturQ,
		getDaftarPtkQ,
		getStrukturQ,
		hapusAnggotaC,
		simpanAnggotaF,
		urutkanAnggotaC
	} from '$modules/struktur/struktur.remote';

	let { params } = $props();

	const [tree, ptk, bolehUbah] = $derived(
		await Promise.all([getStrukturQ(), getDaftarPtkQ(), bolehUbahStrukturQ()])
	);

	const kode = $derived(String(params.kode ?? '').toLowerCase());
	const units = $derived(((tree as any)?.units ?? []) as any[]);
	const semuaAnggota = $derived(((tree as any)?.anggota ?? []) as any[]);
	const unit = $derived(units.find((u: any) => u.kode === kode));
	const anggota = $derived(
		semuaAnggota
			.filter((a: any) => a.unitKode === kode)
			.slice()
			.sort((a: any, b: any) => a.urutan - b.urutan || String(a.id).localeCompare(String(b.id)))
	);
	const daftarPtk = $derived((ptk ?? []) as any[]);

	let formOpen = $state(false);
	let edit = $state<any>(null);
	let formKey = $state(0);
	let lastHasil: unknown = null;

	function bukaTambah() {
		edit = null;
		formKey++;
		formOpen = true;
	}

	function bukaEdit(a: any) {
		edit = a;
		formKey++;
		formOpen = true;
	}

	$effect(() => {
		const r: any = simpanAnggotaF.result;
		if (!r || r === lastHasil) return;
		lastHasil = r;
		if (r.ok) {
			notify.success(r.pesan || 'Anggota disimpan.');
			formOpen = false;
			edit = null;
			void getStrukturQ().refresh();
		} else {
			notify.error(r.error || 'Anggota gagal disimpan.');
		}
	});

	async function hapus(a: any) {
		const nama = a.namaPtk ?? a.namaManual ?? 'anggota ini';
		if (!confirm(`Hapus ${nama} dari unit ini?`)) return;
		const r: any = await hapusAnggotaC(a.id);
		if (r?.ok) {
			notify.success(r.pesan || 'Anggota dihapus.');
			void getStrukturQ().refresh();
		} else {
			notify.error(r?.error || 'Anggota gagal dihapus.');
		}
	}

	async function geser(index: number, arah: -1 | 1) {
		const tujuan = index + arah;
		if (tujuan < 0 || tujuan >= anggota.length) return;
		const urutan = anggota.map((a: any) => a.id);
		[urutan[index], urutan[tujuan]] = [urutan[tujuan], urutan[index]];
		const r: any = await urutkanAnggotaC({ unitKode: kode, urutan });
		if (r?.ok) void getStrukturQ().refresh();
		else notify.error(r?.error || 'Urutan gagal disimpan.');
	}

	function labelAnggota(a: any) {
		return namaTampil(a);
	}
</script>

<svelte:head><title>{unit?.nama ?? 'Unit'} — Struktur Organisasi</title></svelte:head>

<PageLayout
	title={unit?.nama ?? kode}
	description={`${anggota.length} entri anggota · bagan ${unit?.tampilBagan === 1 ? 'ditampilkan' : 'disembunyikan'}`}
>
	{#snippet actions()}
		<div class="flex flex-wrap gap-2">
			<a href={resolve('/admin/struktur')} class="inline-flex">
				<Button size="sm" variant="outline" class="h-8 cursor-pointer">Daftar Unit</Button>
			</a>
			{#if bolehUbah}
				<Button size="sm" class="h-8 cursor-pointer" onclick={bukaTambah}>Tambah Anggota</Button>
			{/if}
		</div>
	{/snippet}

	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="outline" class="text-[10px]">{kode}</Badge>
		{#if unit?.kelompok}<Badge variant="secondary" class="text-[10px]">{unit.kelompok}</Badge>{/if}
		<Badge variant="outline" class="text-[10px]">kolom {unit?.kolom ?? '-'} · urut {unit?.urutan ?? '-'}</Badge>
		{#if !unit}
			<Badge variant="destructive" class="text-[10px]">unit tidak ditemukan</Badge>
		{/if}
	</div>

	{#if formOpen && bolehUbah}
		{#key formKey}
			<form {...simpanAnggotaF} class="space-y-3 rounded-lg border p-3">
				<p class="text-sm font-semibold">{edit ? 'Ubah anggota' : 'Anggota baru'}</p>
				<input type="hidden" name="unitKode" value={kode} />
				{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}

				<div class="grid gap-2 md:grid-cols-2">
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="ptkId">PTK (pegawai)</label>
						<select
							id="ptkId"
							name="ptkId"
							class="h-8 w-full rounded-md border bg-background px-2 text-xs"
						>
							<option value="">— entri luar / manual —</option>
							{#each daftarPtk as p (p.id)}
								<option value={p.id} selected={edit?.ptkId === p.id}>
									{p.nama}{p.waliKelas ? ` (${p.waliKelas})` : ''}
								</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="namaManual">Nama manual</label>
						<Input
							id="namaManual"
							name="namaManual"
							value={edit?.namaManual ?? ''}
							placeholder="Kosongkan bila pakai PTK"
							class="h-8 text-xs"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="gelar">Gelar</label>
						<Input
							id="gelar"
							name="gelar"
							value={edit?.gelar ?? ''}
							placeholder="S.Pd"
							class="h-8 text-xs"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="jabatanTampil">Jabatan tampil</label>
						<Input
							id="jabatanTampil"
							name="jabatanTampil"
							value={edit?.jabatanTampil ?? ''}
							placeholder="Wakamad Kurikulum"
							class="h-8 text-xs"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="keterangan">Keterangan / mapel</label>
						<Input
							id="keterangan"
							name="keterangan"
							value={edit?.keterangan ?? ''}
							placeholder="Bahasa Inggris"
							class="h-8 text-xs"
						/>
					</div>
					<div class="space-y-1">
						<label class="text-xs text-muted-foreground" for="urutan">Urutan</label>
						<Input
							id="urutan"
							name="urutan"
							type="number"
							value={edit?.urutan ?? anggota.length + 1}
							min="0"
							class="h-8 text-xs"
						/>
					</div>
				</div>

				<label class="flex items-center gap-2 text-xs text-muted-foreground">
					<input type="checkbox" name="tampilBagan" checked={edit ? edit.tampilBagan === 1 : true} />
					Tampilkan di bagan
				</label>

				<div class="flex gap-2">
					<Button type="submit" size="sm" class="h-8 cursor-pointer" disabled={simpanAnggotaF.pending > 0}>
						Simpan
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						class="h-8 cursor-pointer"
						onclick={() => {
							formOpen = false;
							edit = null;
						}}
					>
						Batal
					</Button>
				</div>
			</form>
		{/key}
	{/if}

	<div class="space-y-2">
		{#each anggota as a, i (a.id)}
			<div class="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-semibold">{labelAnggota(a)}</span>
						{#if a.jabatanTampil}<Badge variant="secondary" class="text-[10px]">{a.jabatanTampil}</Badge>{/if}
						{#if a.tampilBagan !== 1}
							<Badge variant="destructive" class="text-[10px]">tidak tampil</Badge>
						{/if}
					</div>
					<p class="mt-1 text-xs text-muted-foreground">
						{#if a.keterangan}{a.keterangan} · {/if}
						{#if a.nipPtk}NIP. {a.nipPtk} · {/if}
						urutan {a.urutan} · {a.ptkId ? `PTK #${a.ptkId}` : 'entri luar'}
					</p>
				</div>
				{#if bolehUbah}
					<div class="flex shrink-0 items-center gap-1">
						<Button
							size="sm"
							variant="outline"
							class="h-7 w-7 cursor-pointer p-0 text-xs"
							title="Naikkan"
							onclick={() => geser(i, -1)}
						>
							▲
						</Button>
						<Button
							size="sm"
							variant="outline"
							class="h-7 w-7 cursor-pointer p-0 text-xs"
							title="Turunkan"
							onclick={() => geser(i, 1)}
						>
							▼
						</Button>
						<Button size="sm" variant="outline" class="h-7 cursor-pointer text-xs" onclick={() => bukaEdit(a)}>
							Ubah
						</Button>
						<Button
							size="sm"
							variant="outline"
							class="h-7 cursor-pointer text-xs text-destructive"
							onclick={() => hapus(a)}
						>
							Hapus
						</Button>
					</div>
				{/if}
			</div>
		{:else}
			<p class="rounded-lg border p-6 text-center text-sm text-muted-foreground">
				Belum ada anggota di unit ini.
			</p>
		{/each}
	</div>
</PageLayout>
