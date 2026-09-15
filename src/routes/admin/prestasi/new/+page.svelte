<script lang="ts">
	import { createPrestasiF } from '$modules/prestasi/prestasi.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const user = $derived(page.data.user as { role?: string } | null);
	const guru = $derived(user?.role === 'guru');

	let judul = $state('');
	let deskripsi = $state('');
	let gambar = $state('');
	let pemenang = $state('');
	let tingkat = $state('sekolah');
	let tahun = $state(new Date().getFullYear());

	const tingkatOptions = ['sekolah', 'kabupaten', 'provinsi', 'nasional'];

	const createForm = createPrestasiF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Prestasi berhasil dibuat');
		goto('/admin/prestasi');
	});
</script>

<svelte:head><title>Tambah Prestasi — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center gap-2">
		<a href="/admin/prestasi"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
		<h1 class="text-xl font-semibold">Tambah Prestasi</h1>
	</div>
	<Card>
		<CardHeader><CardTitle class="text-sm">Form Prestasi</CardTitle></CardHeader>
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
