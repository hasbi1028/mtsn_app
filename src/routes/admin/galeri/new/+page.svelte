<script lang="ts">
	import { createGaleriF } from '$modules/galeri/galeri.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let judul = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let kategori = $state('kegiatan');

	const kategoriOptions = ['kegiatan', 'wisata', 'olahraga', 'lainnya'];

	const createForm = createGaleriF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Galeri berhasil dibuat');
		goto('/admin/galeri');
	});
</script>

<svelte:head><title>Tambah Galeri — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center gap-2">
		<a href="/admin/galeri"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
		<h1 class="text-xl font-semibold">Tambah Galeri</h1>
	</div>
	<Card>
		<CardHeader><CardTitle class="text-sm">Form Galeri</CardTitle></CardHeader>
		<CardContent>
			<form {...createForm} class="space-y-4">
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
</div>
