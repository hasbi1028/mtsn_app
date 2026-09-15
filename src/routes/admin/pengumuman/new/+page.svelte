<script lang="ts">
	import { page } from '$app/state';
	import { createPengumumanF } from '$modules/pengumuman/pengumuman.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { goto } from '$app/navigation';
	import { notify } from '$lib/toast';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const user = $derived(page.data.user as { role?: string } | null);
	const guru = $derived(user?.role === 'guru');

	let judul = $state('');
	let konten = $state('');
	let penting = $state(false);
	let published = $state(false);

	const createForm = createPengumumanF.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		notify.success('Pengumuman berhasil dibuat');
		goto('/admin/pengumuman');
	});
</script>

<svelte:head><title>Tambah Pengumuman — Admin</title></svelte:head>

<div class="space-y-4 max-w-2xl">
	<div class="flex items-center gap-2">
		<a href="/admin/pengumuman"><Button variant="ghost" size="icon" class="size-8"><ArrowLeft class="size-4" /></Button></a>
		<h1 class="text-xl font-semibold">Tambah Pengumuman</h1>
	</div>
	<Card>
		<CardHeader><CardTitle class="text-sm">Form Pengumuman</CardTitle></CardHeader>
		<CardContent>
			<form {...createForm} class="space-y-4">
				<div class="space-y-1.5">
					<label for="judul" class="text-sm font-medium">Judul *</label>
					<input id="judul" name="judul" bind:value={judul} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
				</div>
				<div class="space-y-1.5">
					<label for="konten" class="text-sm font-medium">Konten *</label>
					<textarea id="konten" name="konten" bind:value={konten} rows={10} required class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"></textarea>
				</div>
				<div class="flex flex-wrap items-center gap-4">
					<div class="flex items-center gap-2">
						<input type="checkbox" id="penting" name="penting" bind:checked={penting} class="rounded" />
						<label for="penting" class="text-sm">Penting</label>
					</div>
					{#if !guru}
						<div class="flex items-center gap-2">
							<input type="checkbox" id="published" name="published" bind:checked={published} class="rounded" />
							<label for="published" class="text-sm">Publikasikan</label>
						</div>
					{/if}
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
