<script lang="ts">
	import { getAllPengumumanListQ, updatePengumumanF, deletePengumumanC } from '$modules/pengumuman/pengumuman.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { params } = $props();
	const id = $derived(Number(params.id));

	let judul = $state('');
	let konten = $state('');
	let penting = $state(false);
	let published = $state(false);
	let loaded = $state(false);

	const dataQ = getAllPengumumanListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((p) => p.id === id);
		if (item) {
			judul = item.judul;
			konten = item.konten;
			penting = item.penting ?? false;
			published = item.published ?? false;
		}
		loaded = true;
	});

	const updateForm = updatePengumumanF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Pengumuman berhasil diperbarui');
		goto('/admin/pengumuman');
	});

	async function handleDelete() {
		if (!confirm('Hapus pengumuman ini?')) return;
		await deletePengumumanC(id);
		notify.success('Pengumuman dihapus');
		goto('/admin/pengumuman');
	}
</script>

<svelte:head><title>Edit Pengumuman — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/pengumuman"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Pengumuman</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Pengumuman</CardTitle></CardHeader>
			<CardContent>
				<form {...updateForm} class="space-y-4">
					<input type="hidden" name="id" value={id} />
					<div class="space-y-1.5">
						<label for="judul" class="text-sm font-medium">Judul *</label>
						<input id="judul" name="judul" bind:value={judul} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="konten" class="text-sm font-medium">Konten *</label>
						<textarea id="konten" name="konten" bind:value={konten} rows={10} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
					</div>
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<input type="checkbox" id="penting" name="penting" bind:checked={penting} class="rounded" />
							<label for="penting" class="text-sm">Penting</label>
						</div>
						<div class="flex items-center gap-2">
							<input type="checkbox" id="published" name="published" bind:checked={published} class="rounded" />
							<label for="published" class="text-sm">Publikasikan</label>
						</div>
					</div>
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
