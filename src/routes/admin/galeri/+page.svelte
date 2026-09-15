<script lang="ts">
	import { page as pageState } from '$app/state';
	import { getAllGaleriListQ, toggleGaleriPublishC, deleteGaleriC } from '$modules/galeri/galeri.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Images from '@lucide/svelte/icons/images';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { notify } from '$lib/toast';
	import { canManage, isModerator } from '$lib/konten';

	const user = $derived(pageState.data.user as { role?: string; userId?: number } | null);
	const moderator = $derived(isModerator(user?.role));

	let page = $state(1);
	let q = $state('');
	let kategori = $state('');
	let kontenSaya = $state(false);
	const perPage = 20;

	let listQ = $derived(
		getAllGaleriListQ({ q, kategori, page, perPage, mine: kontenSaya ? user?.userId : undefined })
	);

	const kategoriOptions = ['', 'kegiatan', 'wisata', 'olahraga', 'lainnya'];

	function handleSearch(e: Event) {
		e.preventDefault();
		page = 1;
	}

	async function togglePublish(id: number) {
		await toggleGaleriPublishC(id);
		notify.success('Status publikasi diperbarui');
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus galeri ini?')) return;
		await deleteGaleriC(id);
		notify.success('Galeri berhasil dihapus');
	}
</script>

<svelte:head><title>Kelola Galeri — Admin</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Images class="size-5" />
			<h1 class="text-xl font-semibold">Galeri</h1>
		</div>
		<a href="/admin/galeri/new"><Button size="sm"><Plus class="mr-1 size-4" /> Tambah</Button></a>
	</div>

	<form onsubmit={handleSearch} class="flex flex-wrap gap-2">
		<input type="text" bind:value={q} placeholder="Cari galeri..." class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
		<select bind:value={kategori} class="rounded-md border bg-background px-3 py-1.5 text-sm">
			{#each kategoriOptions as k}<option value={k}>{k || 'Semua Kategori'}</option>{/each}
		</select>
		<label class="flex items-center gap-1.5 text-sm">
			<input type="checkbox" bind:checked={kontenSaya} class="rounded" />
			Konten Saya
		</label>
		<Button type="submit" variant="secondary" size="sm">Cari</Button>
	</form>

	{#await listQ}
		<p class="text-muted-foreground">Memuat...</p>
	{:then data}
		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">{kontenSaya ? 'Konten Saya' : 'Semua Galeri'} ({data.total})</CardTitle></CardHeader>
			<CardContent class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Judul</Table.Head>
							<Table.Head>Penulis</Table.Head>
							<Table.Head>Kategori</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="w-32">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as g (g.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{g.judul}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">{g.penulis ?? '-'}</Table.Cell>
								<Table.Cell><Badge variant="outline">{g.kategori}</Badge></Table.Cell>
								<Table.Cell>{#if g.published}<Badge variant="default" class="bg-green-600">Terbit</Badge>{:else}<Badge variant="secondary">Draft</Badge>{/if}</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										{#if moderator}
											<Button variant="ghost" size="icon" class="size-7" onclick={() => togglePublish(g.id)}>{#if g.published}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}</Button>
										{/if}
										{#if canManage(user?.role, user?.userId, g.authorUserId)}
											<a href="/admin/galeri/{g.id}/edit"><Button variant="ghost" size="icon" class="size-7"><Pencil class="size-3.5" /></Button></a>
											<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={() => handleDelete(g.id)}><Trash2 class="size-3.5" /></Button>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={5} class="text-center text-muted-foreground">Belum ada galeri</Table.Cell></Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</CardContent>
		</Card>

		{#if data.total > perPage}
			<div class="flex justify-center gap-2">
				<Button variant="secondary" size="sm" disabled={page <= 1} onclick={() => page--}>Sebelumnya</Button>
				<span class="flex items-center px-3 text-sm text-muted-foreground">Hal {page} / {Math.ceil(data.total / perPage)}</span>
				<Button variant="secondary" size="sm" disabled={page * perPage >= data.total} onclick={() => page++}>Selanjutnya</Button>
			</div>
		{/if}
	{/await}
</div>
