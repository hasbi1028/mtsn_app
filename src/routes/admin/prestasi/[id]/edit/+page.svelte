<script lang="ts">
	import { page } from '$app/state';
	import { getAllPrestasiListQ, updatePrestasiF, deletePrestasiC } from '$modules/prestasi/prestasi.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { canManage } from '$lib/konten';

	let { params } = $props();
	const id = $derived(Number(params.id));

	const user = $derived(page.data.user as { role?: string; userId?: number } | null);

	let judul = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let pemenang = $state('');
	let tingkat = $state('sekolah');
	let tahun = $state(new Date().getFullYear());
	let authorUserId = $state<number | null>(null);
	let loaded = $state(false);

	const tingkatOptions = ['sekolah', 'kabupaten', 'provinsi', 'nasional'];

	const dataQ = getAllPrestasiListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((p) => p.id === id);
		if (item) {
			judul = item.judul;
			deskripsi = item.deskripsi ?? '';
			gambar = item.gambar ?? '';
			pemenang = item.pemenang ?? '';
			tingkat = item.tingkat ?? 'sekolah';
			tahun = item.tahun ?? new Date().getFullYear();
			authorUserId = item.authorUserId ?? null;
		}
		loaded = true;
	});

	const updateForm = updatePrestasiF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Prestasi berhasil diperbarui');
		goto('/admin/prestasi');
	});

	async function handleDelete() {
		if (!confirm('Hapus prestasi ini?')) return;
		await deletePrestasiC(id);
		notify.success('Prestasi dihapus');
		goto('/admin/prestasi');
	}
</script>

<svelte:head><title>Edit Prestasi — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/prestasi"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Prestasi</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete} class={canManage(user?.role, user?.userId, authorUserId) ? '' : 'hidden'}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Prestasi</CardTitle></CardHeader>
			<CardContent>
				<form {...updateForm} class="space-y-4">
					<input type="hidden" name="id" value={id} />
					<div class="space-y-1.5">
						<label for="judul" class="text-sm font-medium">Judul *</label>
						<input id="judul" name="judul" bind:value={judul} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="deskripsi" class="text-sm font-medium">Deskripsi</label>
						<textarea id="deskripsi" name="deskripsi" bind:value={deskripsi} rows={3} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
					</div>
					<div class="space-y-1.5">
						<label for="gambar" class="text-sm font-medium">URL Gambar</label>
						<input id="gambar" name="gambar" bind:value={gambar} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="grid grid-cols-3 gap-4">
						<div class="space-y-1.5">
							<label for="pemenang" class="text-sm font-medium">Pemenang</label>
							<input id="pemenang" name="pemenang" bind:value={pemenang} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
						</div>
						<div class="space-y-1.5">
							<label for="tingkat" class="text-sm font-medium">Tingkat</label>
							<select id="tingkat" name="tingkat" bind:value={tingkat} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
								{#each tingkatOptions as t}<option value={t}>{t}</option>{/each}
							</select>
						</div>
						<div class="space-y-1.5">
							<label for="tahun" class="text-sm font-medium">Tahun</label>
							<input id="tahun" name="tahun" type="number" bind:value={tahun} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
						</div>
					</div>
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
