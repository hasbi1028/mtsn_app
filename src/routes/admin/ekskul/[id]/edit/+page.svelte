<script lang="ts">
	import { page } from '$app/state';
	import { getAllEkskulListQ, updateEkskulF, deleteEkskulC } from '$modules/ekskul/ekskul.remote';
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

	let nama = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let pembina = $state('');
	let jadwal = $state('');
	let aktif = $state(true);
	let authorUserId = $state<number | null>(null);
	let loaded = $state(false);

	const dataQ = getAllEkskulListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((e) => e.id === id);
		if (item) {
			nama = item.nama;
			deskripsi = item.deskripsi ?? '';
			gambar = item.gambar ?? '';
			pembina = item.pembina ?? '';
			jadwal = item.jadwal ?? '';
			aktif = item.aktif ?? true;
			authorUserId = item.authorUserId ?? null;
		}
		loaded = true;
	});

	const updateForm = updateEkskulF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Ekskul berhasil diperbarui');
		goto('/admin/ekskul');
	});

	async function handleDelete() {
		if (!confirm('Hapus ekskul ini?')) return;
		await deleteEkskulC(id);
		notify.success('Ekskul dihapus');
		goto('/admin/ekskul');
	}
</script>

<svelte:head><title>Edit Ekskul — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/ekskul"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Ekskul</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete} class={canManage(user?.role, user?.userId, authorUserId) ? '' : 'hidden'}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Ekskul</CardTitle></CardHeader>
			<CardContent>
				<form {...updateForm} class="space-y-4">
					<input type="hidden" name="id" value={id} />
					<div class="space-y-1.5">
						<label for="nama" class="text-sm font-medium">Nama *</label>
						<input id="nama" name="nama" bind:value={nama} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="deskripsi" class="text-sm font-medium">Deskripsi</label>
						<textarea id="deskripsi" name="deskripsi" bind:value={deskripsi} rows={5} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
					</div>
					<div class="space-y-1.5">
						<label for="gambar" class="text-sm font-medium">URL Gambar</label>
						<input id="gambar" name="gambar" bind:value={gambar} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<label for="pembina" class="text-sm font-medium">Pembina</label>
							<input id="pembina" name="pembina" bind:value={pembina} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
						</div>
						<div class="space-y-1.5">
							<label for="jadwal" class="text-sm font-medium">Jadwal</label>
							<input id="jadwal" name="jadwal" bind:value={jadwal} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
						</div>
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" id="aktif" name="aktif" bind:checked={aktif} class="rounded" />
						<label for="aktif" class="text-sm">Aktif</label>
					</div>
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
