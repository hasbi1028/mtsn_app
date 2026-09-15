<script lang="ts">
	import { createEkskulF } from '$modules/ekskul/ekskul.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const user = $derived(page.data.user as { role?: string } | null);
	const guru = $derived(user?.role === 'guru');

	let nama = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let pembina = $state('');
	let jadwal = $state('');
	let aktif = $state(true);

	const createForm = createEkskulF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Ekskul berhasil dibuat');
		goto('/admin/ekskul');
	});
</script>

<svelte:head><title>Tambah Ekskul — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center gap-2">
		<a href="/admin/ekskul"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
		<h1 class="text-xl font-semibold">Tambah Ekskul</h1>
	</div>
	<Card>
		<CardHeader><CardTitle class="text-sm">Form Ekskul</CardTitle></CardHeader>
		<CardContent>
			<form {...createForm} class="space-y-4">
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
				{#if guru}
					<p class="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
						Konten Anda akan disimpan sebagai <b>draft</b> dan ditinjau admin sebelum terbit.
					</p>
				{/if}
				<Button type="submit">Simpan</Button>
			</form>
		</CardContent>
	</Card>
</div>
