<script lang="ts">
	import { page } from '$app/state';
	import { getAllBeritaListQ, updateBeritaF, deleteBeritaC } from '$modules/berita/berita.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { params } = $props();
	const id = $derived(Number(params.id));

	let judul = $state('');
	let ringkasan = $state('');
	let konten = $state('');
	let gambar = $state('');
	let penulis = $state('Admin');
	let kategori = $state('umum');
	let published = $state(false);
	let loaded = $state(false);

	const kategoriOptions = ['umum', 'kegiatan', 'prestasi'];

	const dataQ = getAllBeritaListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((b) => b.id === id);
		if (item) {
			judul = item.judul;
			ringkasan = item.ringkasan ?? '';
			konten = item.konten ?? '';
			gambar = item.gambar ?? '';
			penulis = item.penulis ?? 'Admin';
			kategori = item.kategori ?? 'umum';
			published = item.published ?? false;
		}
		loaded = true;
	});

	const updateForm = updateBeritaF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Berita berhasil diperbarui');
		goto('/admin/berita');
	});

	async function handleDelete() {
		if (!confirm('Hapus berita ini?')) return;
		await deleteBeritaC(id);
		notify.success('Berita dihapus');
		goto('/admin/berita');
	}
</script>

<svelte:head><title>Edit Berita — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/berita"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Berita</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Berita</CardTitle></CardHeader>
			<CardContent>
				<form {...updateForm} class="space-y-4">
					<input type="hidden" name="id" value={id} />
					<div class="space-y-1.5">
						<label for="judul" class="text-sm font-medium">Judul *</label>
						<input id="judul" name="judul" bind:value={judul} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="ringkasan" class="text-sm font-medium">Ringkasan</label>
						<textarea id="ringkasan" name="ringkasan" bind:value={ringkasan} rows={3} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
					</div>
					<div class="space-y-1.5">
						<label for="konten" class="text-sm font-medium">Konten</label>
						<textarea id="konten" name="konten" bind:value={konten} rows={10} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
					</div>
					<div class="space-y-1.5">
						<label for="gambar" class="text-sm font-medium">URL Gambar</label>
						<input id="gambar" name="gambar" bind:value={gambar} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<label for="penulis" class="text-sm font-medium">Penulis</label>
							<input id="penulis" name="penulis" bind:value={penulis} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
						</div>
						<div class="space-y-1.5">
							<label for="kategori" class="text-sm font-medium">Kategori</label>
							<select id="kategori" name="kategori" bind:value={kategori} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
								{#each kategoriOptions as k}<option value={k}>{k}</option>{/each}
							</select>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" id="published" name="published" bind:checked={published} class="rounded" />
						<label for="published" class="text-sm">Publikasikan</label>
					</div>
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
