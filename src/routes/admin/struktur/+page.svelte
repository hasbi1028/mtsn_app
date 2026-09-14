<script lang="ts">
	import { resolve } from '$app/paths';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { notify } from '$lib/toast';
	import {
		bolehUbahStrukturQ,
		getRekapStrukturQ,
		getStrukturQ,
		hapusUnitC,
		simpanUnitF
	} from '$modules/struktur/struktur.remote';

	const [tree, bagan, bolehUbah] = $derived(
		await Promise.all([getStrukturQ(), getRekapStrukturQ(), bolehUbahStrukturQ()])
	);

	const units = $derived(((tree as any)?.units ?? []) as any[]);
	const anggota = $derived(((tree as any)?.anggota ?? []) as any[]);
	const rekap = $derived((bagan as any)?.rekap as any);
	const kolomPreview = $derived(((bagan as any)?.kolom ?? []) as any[]);

	let formOpen = $state(false);
	let lastUnit: unknown = null;

	$effect(() => {
		const r: any = simpanUnitF.result;
		if (!r || r === lastUnit) return;
		lastUnit = r;
		if (r.ok) {
			notify.success(r.pesan || 'Unit disimpan.');
			formOpen = false;
			void getStrukturQ().refresh();
			void getRekapStrukturQ().refresh();
		} else {
			notify.error(r.error || 'Unit gagal disimpan.');
		}
	});

	function daftarAnggota(kode: string) {
		return anggota.filter((a: any) => a.unitKode === kode && a.aktif === 1);
	}

	async function hapus(kode: string, nama: string) {
		if (!confirm(`Hapus unit "${nama}"?`)) return;
		const r: any = await hapusUnitC(kode);
		if (r?.ok) {
			notify.success(r.pesan || 'Unit dihapus.');
			void getStrukturQ().refresh();
			void getRekapStrukturQ().refresh();
		} else {
			notify.error(r?.error || 'Unit gagal dihapus.');
		}
	}

	const labelSelisih = $derived(
		rekap ? (rekap.selisihWali === 0 ? 'sesuai' : `${rekap.selisihWali > 0 ? '+' : ''}${rekap.selisihWali}`) : '-'
	);
</script>

<svelte:head><title>Struktur Organisasi — MTsN App</title></svelte:head>

<PageLayout
	title="Struktur Organisasi"
	description="Kelola unit/jabatan dan penugasan pegawai — bagan dipakai untuk SK, spanduk, dan website"
>
	{#snippet actions()}
		<div class="flex flex-wrap gap-2">
			<a href={resolve('/admin/struktur/bagan')} class="inline-flex">
				<Button size="sm" variant="outline" class="cursor-pointer h-8">Bagan &amp; Cetak</Button>
			</a>
			{#if bolehUbah}
				<Button size="sm" class="h-8 cursor-pointer" onclick={() => (formOpen = !formOpen)}>
					Tambah Unit
				</Button>
			{/if}
		</div>
	{/snippet}

	<!-- Rekap -->
	<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Pegawai di struktur</p>
			<p class="text-xl font-bold">{rekap?.pegawaiUnik ?? 0}</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Entri anggota</p>
			<p class="text-xl font-bold">{rekap?.anggotaAktif ?? 0}</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Wali kelas vs rombel</p>
			<p class="text-xl font-bold">
				{rekap?.wali ?? 0}/{rekap?.jumlahRombel ?? 0}
				<span class="text-xs font-semibold {rekap?.selisihWali === 0 ? 'text-green-600' : 'text-amber-600'}">
					({labelSelisih})
				</span>
			</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Unit kosong</p>
			<p class="text-xl font-bold">{rekap?.unitKosong ?? 0}</p>
		</div>
	</div>

	<!-- Form tambah unit -->
	{#if formOpen && bolehUbah}
		<form {...simpanUnitF} class="rounded-lg border p-3 space-y-3">
			<p class="text-sm font-semibold">Unit baru</p>
			<div class="grid gap-2 md:grid-cols-3">
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="kode">Kode</label>
					<Input id="kode" name="kode" placeholder="wakamad-kurikulum" class="h-8 text-xs" required />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="nama">Nama unit</label>
					<Input id="nama" name="nama" placeholder="Wakamad Kurikulum" class="h-8 text-xs" required />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="kelompok">Kelompok</label>
					<Input id="kelompok" name="kelompok" placeholder="PIMPINAN" class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="kolom">Kolom</label>
					<Input id="kolom" name="kolom" type="number" value="2" min="1" max="6" class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="urutan">Urutan</label>
					<Input id="urutan" name="urutan" type="number" value="0" min="0" class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="parentKode">Induk (opsional)</label>
					<Input id="parentKode" name="parentKode" placeholder="kamad" class="h-8 text-xs" />
				</div>
			</div>
			<label class="flex items-center gap-2 text-xs text-muted-foreground">
				<input type="checkbox" name="tampilBagan" checked /> Tampilkan di bagan
			</label>
			<div class="flex gap-2">
				<Button type="submit" size="sm" class="h-8 cursor-pointer" disabled={simpanUnitF.pending > 0}>
					Simpan
				</Button>
				<Button type="button" size="sm" variant="outline" class="h-8 cursor-pointer" onclick={() => (formOpen = false)}>
					Batal
				</Button>
			</div>
		</form>
	{/if}

	<!-- Daftar unit -->
	<div class="space-y-2">
		{#each units as u (u.kode)}
			{@const isi = daftarAnggota(u.kode)}
			<div class="rounded-lg border p-3">
				<div class="flex flex-wrap items-start justify-between gap-2">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<a href={resolve(`/admin/struktur/${u.kode}`)} class="text-sm font-semibold hover:underline">
								{u.nama}
							</a>
							<Badge variant="outline" class="text-[10px]">{u.kode}</Badge>
							{#if u.kelompok}<Badge variant="secondary" class="text-[10px]">{u.kelompok}</Badge>{/if}
							<Badge variant="outline" class="text-[10px]">kolom {u.kolom} · urut {u.urutan}</Badge>
							{#if u.tampilBagan !== 1}
								<Badge variant="destructive" class="text-[10px]">tidak tampil</Badge>
							{/if}
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							{isi.length} anggota
							{#if isi.length > 0}
								· {isi
									.slice(0, 4)
									.map((a: any) => a.namaPtk ?? a.namaManual)
									.join(', ')}{isi.length > 4 ? ', …' : ''}
							{/if}
						</p>
					</div>
					{#if bolehUbah}
						<Button
							size="sm"
							variant="outline"
							class="h-7 cursor-pointer text-xs text-destructive"
							onclick={() => hapus(u.kode, u.nama)}
						>
							Hapus
						</Button>
					{/if}
				</div>
			</div>
		{:else}
			<p class="rounded-lg border p-6 text-center text-sm text-muted-foreground">
				Belum ada unit. Jalankan <code>scripts/seed-struktur-sk023.ts</code> atau tambah unit manual.
			</p>
		{/each}
	</div>

	{#if kolomPreview.length > 0}
		<p class="text-xs text-muted-foreground">
			Bagan tersusun dari {kolomPreview.length} kolom — lihat pratinjau di halaman
			<a class="underline" href={resolve('/admin/struktur/bagan')}>Bagan &amp; Cetak</a>.
		</p>
	{/if}
</PageLayout>
