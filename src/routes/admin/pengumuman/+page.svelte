<script lang="ts">
	import { getAllPengumumanListQ, togglePengumumanPublishC, deletePengumumanC } from '$modules/pengumuman/pengumuman.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { notify } from '$lib/toast';

	let page = $state(1);
	let q = $state('');
	const perPage = 20;

	let listQ = $derived(getAllPengumumanListQ({ q, page, perPage }));

	function handleSearch(e: Event) {
		e.preventDefault();
		page = 1;
		listQ = getAllPengumumanListQ({ q, page, perPage });
	}

	async function togglePublish(id: number) {
		await togglePengumumanPublishC(id);
		notify.success('Status publikasi diperbarui');
		listQ = getAllPengumumanListQ({ q, page, perPage });
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus pengumuman ini?')) return;
		await deletePengumumanC(id);
		notify.success('Pengumuman berhasil dihapus');
		listQ = getAllPengumumanListQ({ q, page, perPage });
	}
</script>

<svelte:head><title>Kelola Pengumuman — Admin</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Megaphone class="size-5" />
			<h1 class="text-xl font-semibold">Pengumuman</h1>
		</div>
		<a href="/admin/pengumuman/new"><Button size="sm"><Plus class="mr-1 size-4" /> Tambah</Button></a>
	</div>

	<form onsubmit={handleSearch} class="flex gap-2">
		<input type="text" bind:value={q} placeholder="Cari pengumuman..." class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
		<Button type="submit" variant="secondary" size="sm">Cari</Button>
	</form>

	{#await listQ}
		<p class="text-muted-foreground">Memuat...</p>
	{:then data}
		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Semua Pengumuman ({data.total})</CardTitle></CardHeader>
			<CardContent class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Judul</Table.Head>
							<Table.Head>Penting</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="w-32">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as p (p.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{p.judul}</Table.Cell>
								<Table.Cell>{#if p.penting}<Badge variant="destructive">Penting</Badge>{:else}-{/if}</Table.Cell>
								<Table.Cell>{#if p.published}<Badge variant="default" class="bg-green-600">Terbit</Badge>{:else}<Badge variant="secondary">Draft</Badge>{/if}</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										<Button variant="ghost" size="icon" class="size-7" onclick={() => togglePublish(p.id)}>{#if p.published}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}</Button>
										<a href="/admin/pengumuman/{p.id}/edit"><Button variant="ghost" size="icon" class="size-7"><Pencil class="size-3.5" /></Button></a>
										<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={() => handleDelete(p.id)}><Trash2 class="size-3.5" /></Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={4} class="text-center text-muted-foreground">Belum ada pengumuman</Table.Cell></Table.Row>
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
