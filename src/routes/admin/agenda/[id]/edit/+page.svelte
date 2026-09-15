<script lang="ts">
	import { page } from '$app/state';
	import { getAllAgendaListQ, updateAgendaF, deleteAgendaC } from '$modules/agenda/agenda.remote';
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
	let tanggalMulai = $state('');
	let tanggalSelesai = $state('');
	let lokasi = $state('');
	let warna = $state('#3b82f6');
	let authorUserId = $state<number | null>(null);
	let loaded = $state(false);

	const dataQ = getAllAgendaListQ({ q: '', page: 1, perPage: 100 });
	dataQ.then((data) => {
		const item = data.items.find((a) => a.id === id);
		if (item) {
			judul = item.judul;
			deskripsi = item.deskripsi ?? '';
			tanggalMulai = item.tanggalMulai;
			tanggalSelesai = item.tanggalSelesai ?? '';
			lokasi = item.lokasi ?? '';
			warna = item.warna ?? '#3b82f6';
			authorUserId = item.authorUserId ?? null;
		}
		loaded = true;
	});

	const updateForm = updateAgendaF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Agenda berhasil diperbarui');
		goto('/admin/agenda');
	});

	async function handleDelete() {
		if (!confirm('Hapus agenda ini?')) return;
		await deleteAgendaC(id);
		notify.success('Agenda dihapus');
		goto('/admin/agenda');
	}
</script>

<svelte:head><title>Edit Agenda — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<a href="/admin/agenda"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
			<h1 class="text-xl font-semibold">Edit Agenda</h1>
		</div>
		<Button variant="destructive" size="sm" onclick={handleDelete} class={canManage(user?.role, user?.userId, authorUserId) ? '' : 'hidden'}><Trash2 class="mr-1 size-3.5" /> Hapus</Button>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Memuat...</p>
	{:else}
		<Card>
			<CardHeader><CardTitle class="text-sm">Form Agenda</CardTitle></CardHeader>
			<CardContent>
				<form {...updateForm} class="space-y-4">
					<input type="hidden" name="id" value={id} />
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
					<Button type="submit">Simpan</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
