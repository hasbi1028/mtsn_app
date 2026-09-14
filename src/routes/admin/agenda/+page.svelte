<script lang="ts">
	import { getAgendaListQ, deleteAgendaC } from '$modules/agenda/agenda.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { notify } from '$lib/toast';

	let page = $state(1);
	let q = $state('');
	const perPage = 20;

	let listQ = $derived(getAgendaListQ({ q, page, perPage }));

	function handleSearch(e: Event) {
		e.preventDefault();
		page = 1;
		listQ = getAgendaListQ({ q, page, perPage });
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus agenda ini?')) return;
		await deleteAgendaC(id);
		notify.success('Agenda berhasil dihapus');
		listQ = getAgendaListQ({ q, page, perPage });
	}
</script>

<svelte:head><title>Kelola Agenda — Admin</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<CalendarDays class="size-5" />
			<h1 class="text-xl font-semibold">Agenda</h1>
		</div>
		<a href="/admin/agenda/new"><Button size="sm"><Plus class="mr-1 size-4" /> Tambah</Button></a>
	</div>

	<form onsubmit={handleSearch} class="flex gap-2">
		<input type="text" bind:value={q} placeholder="Cari agenda..." class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
		<Button type="submit" variant="secondary" size="sm">Cari</Button>
	</form>

	{#await listQ}
		<p class="text-muted-foreground">Memuat...</p>
	{:then data}
		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Semua Agenda ({data.total})</CardTitle></CardHeader>
			<CardContent class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Judul</Table.Head>
							<Table.Head>Tanggal</Table.Head>
							<Table.Head>Lokasi</Table.Head>
							<Table.Head class="w-24">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as a (a.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{a.judul}</Table.Cell>
								<Table.Cell class="text-sm">{a.tanggalMulai}{#if a.tanggalSelesai} - {a.tanggalSelesai}{/if}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">{a.lokasi ?? '-'}</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										<a href="/admin/agenda/{a.id}/edit"><Button variant="ghost" size="icon" class="size-7"><Pencil class="size-3.5" /></Button></a>
										<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={() => handleDelete(a.id)}><Trash2 class="size-3.5" /></Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={4} class="text-center text-muted-foreground">Belum ada agenda</Table.Cell></Table.Row>
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
