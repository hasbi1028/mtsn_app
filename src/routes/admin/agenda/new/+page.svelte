<script lang="ts">
	import { page } from '$app/state';
	import { createAgendaF } from '$modules/agenda/agenda.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const user = $derived(page.data.user as { role?: string } | null);
	const guru = $derived(user?.role === 'guru');

	let judul = $state('');
	let deskripsi = $state('');
	let tanggalMulai = $state('');
	let tanggalSelesai = $state('');
	let lokasi = $state('');
	let warna = $state('#3b82f6');

	const createForm = createAgendaF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Agenda berhasil dibuat');
		goto('/admin/agenda');
	});
</script>

<svelte:head><title>Tambah Agenda — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center gap-2">
		<a href="/admin/agenda"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
		<h1 class="text-xl font-semibold">Tambah Agenda</h1>
	</div>
	<Card>
		<CardHeader><CardTitle class="text-sm">Form Agenda</CardTitle></CardHeader>
		<CardContent>
			<form {...createForm} class="space-y-4">
				<div class="space-y-1.5">
					<label for="judul" class="text-sm font-medium">Judul *</label>
					<input id="judul" name="judul" bind:value={judul} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
				</div>
				<div class="space-y-1.5">
					<label for="deskripsi" class="text-sm font-medium">Deskripsi</label>
					<textarea id="deskripsi" name="deskripsi" bind:value={deskripsi} rows={5} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="tanggalMulai" class="text-sm font-medium">Tanggal Mulai *</label>
						<input id="tanggalMulai" name="tanggalMulai" type="date" bind:value={tanggalMulai} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="tanggalSelesai" class="text-sm font-medium">Tanggal Selesai</label>
						<input id="tanggalSelesai" name="tanggalSelesai" type="date" bind:value={tanggalSelesai} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="lokasi" class="text-sm font-medium">Lokasi</label>
						<input id="lokasi" name="lokasi" bind:value={lokasi} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<label for="warna" class="text-sm font-medium">Warna</label>
						<input id="warna" name="warna" type="color" bind:value={warna} class="h-9 w-full rounded-md border bg-background px-1 py-1" />
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
