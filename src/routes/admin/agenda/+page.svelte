<script lang="ts">
	import { page as pageState } from '$app/state';
	import { getAllAgendaListQ, toggleAgendaPublishC, deleteAgendaC } from '$modules/agenda/agenda.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
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
	let kontenSaya = $state(false);
	const perPage = 20;

	let listQ = $derived(
		getAllAgendaListQ({ q, page, perPage, mine: kontenSaya ? user?.userId : undefined })
	);

	function handleSearch(e: Event) {
		e.preventDefault();
		page = 1;
	}

	async function togglePublish(id: number) {
		await toggleAgendaPublishC(id);
		notify.success('Status publikasi diperbarui');
	}

	async function handleDelete(id: number) {
		if (!confirm('Hapus agenda ini?')) return;
		await deleteAgendaC(id);
		notify.success('Agenda berhasil dihapus');
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

	<form onsubmit={handleSearch} class="flex flex-wrap gap-2">
		<input type="text" bind:value={q} placeholder="Cari agenda..." class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
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
			<CardHeader class="pb-2"><CardTitle class="text-sm">{kontenSaya ? 'Konten Saya' : 'Semua Agenda'} ({data.total})</CardTitle></CardHeader>
			<CardContent class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Judul</Table.Head>
							<Table.Head>Penulis</Table.Head>
							<Table.Head>Tanggal</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="w-32">Aksi</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as a (a.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{a.judul}</Table.Cell>
								<Table.Cell class="text-sm text-muted-foreground">{a.penulis ?? '-'}</Table.Cell>
								<Table.Cell class="text-sm">{a.tanggalMulai}{#if a.tanggalSelesai} - {a.tanggalSelesai}{/if}</Table.Cell>
								<Table.Cell>{#if a.published}<Badge variant="default" class="bg-green-600">Terbit</Badge>{:else}<Badge variant="secondary">Draft</Badge>{/if}</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										{#if moderator}
											<Button variant="ghost" size="icon" class="size-7" onclick={() => togglePublish(a.id)}>{#if a.published}<EyeOff class="size-3.5" />{:else}<Eye class="size-3.5" />{/if}</Button>
										{/if}
										{#if canManage(user?.role, user?.userId, a.authorUserId)}
											<a href="/admin/agenda/{a.id}/edit"><Button variant="ghost" size="icon" class="size-7"><Pencil class="size-3.5" /></Button></a>
											<Button variant="ghost" size="icon" class="size-7 text-destructive" onclick={() => handleDelete(a.id)}><Trash2 class="size-3.5" /></Button>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row><Table.Cell colspan={5} class="text-center text-muted-foreground">Belum ada agenda</Table.Cell></Table.Row>
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
