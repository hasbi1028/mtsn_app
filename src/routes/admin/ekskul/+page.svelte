<script lang="ts">
	import { getAllEkskulListQ, deleteEkskulC } from '$modules/ekskul/ekskul.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { notify } from '$lib/toast';

	let page = $state(1);
	let q = $state('');
	const perPage = 20;

	let listQ = $derived(getAllEkskulListQ({ q, page, perPage }));

	function handleSearch(e: Event) {
		e.preventDefault();
		page = 1;
		listQ = getAllEkskulListQ({ q, page, perPage });
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus ekskul ini?')) return;
		await deleteEkskulC(id);
		notify.success('Ekskul berhasil dihapus');
		listQ = getAllEkskulListQ({ q, page, perPage });
	}
</script>

<svelte:head><title>Kelola Ekskul — Admin</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Trophy class="size-5" />
			<h1 class="text-xl font-semibold">Ekstrakurikuler</h1>
		</div>
		<a href="/admin/ekskul/new"><Button size="sm"><Plus class="mr-1 size-4" /> Tambah</Button></a>
	</div>

	<form onsubmit={handleSearch} class="flex gap-2">
		<input type="text" bind:value={q} placeholder="Cari ekskul..." class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
		<Button type="submit" variant="secondary" size="sm">Cari</Button>
	</form>

	{#await listQ}
		<p class="text-muted-foreground">Memuat...</p>
	{:then data}
		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Semua Ekskul ({data.total})</CardTitle></CardHeader>
			<CardContent class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nama</Table.Head>
							<Table.Head>Pembina</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="w-24">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as e (e.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{e.nama}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">{e.pembina ?? '-'}</Table.Cell>
								<Table.Cell>{#if e.aktif}<Badge variant="default" class="bg-green-600">Aktif</Badge>{:else}<Badge variant="secondary">Nonaktif</Badge>{/if}</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										<a href="/admin/ekskul/{e.id}/edit"><Button variant="ghost" size="icon" class="size-7"><Pencil class="size-3.5" /></Button></a>
										<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={() => handleDelete(e.id)}><Trash2 class="size-3.5" /></Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={4} class="text-center text-muted-foreground">Belum ada ekskul</Table.Cell></Table.Row>
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
