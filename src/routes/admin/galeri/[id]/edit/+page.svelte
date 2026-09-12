<script lang="ts">
	import { getGaleriListQ, updateGaleriF, deleteGaleriC } from '$modules/galeri/galeri.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { params } = $props();
	const id = $derived(Number(params.id));

	let judul = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let kategori = $state('kegiatan');
	let loaded = $state(false);

	const kategoriOptions = ['kegiatan', 'wisata', 'olahraga', 'lainnya'];

	const dataQ = getGaleriListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((g) => g.id === id);
		if (item) {
			judul = item.judul;
			deskripsi = item.deskripsi ?? '';
			gambar = item.gambar;
			kategori = item.kategori ?? 'kegiatan';
		}
		loaded = true;
	});

	const updateForm = updateGaleriF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Galeri berhasil diperbarui');
		goto('/admin/galeri');
	});

	async function handleDelete() {
		if (!confirm('Hapus galeri ini?')) return;
		await deleteGaleriC(id);
		notify.success('Galeri dihapus');
		goto('/admin/galeri');
	}
</script>

<svelte:head><title>Edit Galeri — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/galeri"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Galeri</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Galeri</CardTitle></CardHeader>
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
						<label for="gambar" class="text-sm font-medium">URL Gambar *</label>
						<input id="gambar" name="gambar" bind:value={gambar} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="kategori" class="text-sm font-medium">Kategori</label>
						<select id="kategori" name="kategori" bind:value={kategori} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
							{#each kategoriOptions as k}<option value={k}>{k}</option>{/each}
						</select>
					</div>
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
