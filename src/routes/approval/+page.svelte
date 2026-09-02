<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import { notify } from '$lib/toast';
	import { enhance } from '$app/forms';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	const fotoPending = $derived((data.fotoPending as any[]) || []);
	const perubahanPending = $derived((data.perubahanPending as any[]) || []);

	$effect(() => {
		notify.fromForm(form, 'Aksi berhasil');
	});

	// Refresh page setelah aksi
	$effect(() => {
		if (form?.ok) {
			goto('/approval', { invalidateAll: true, noScroll: true });
		}
	});

	const columnsFoto = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'nisn', label: 'NISN', hideOnMobile: true },
		{ key: 'kelas', label: 'Kelas' },
		{ key: 'foto', label: 'Foto' },
		{ key: 'aksi', label: 'Aksi' },
	];

	const columnsPerubahan = [
		{ key: 'nama', label: 'Siswa' },
		{ key: 'field_label', label: 'Field' },
		{ key: 'nilai_lama', label: 'Lama', hideOnMobile: true },
		{ key: 'nilai_baru', label: 'Baru' },
		{ key: 'aksi', label: 'Aksi' },
	];

	// Toast helper dari svelte-sonner
</script>

<PageLayout title="Persetujuan" description="Persetujuan foto & perubahan data siswa oleh siswa">
	{#snippet actions()}
		{@const total = fotoPending.length + perubahanPending.length}
		<div class="flex gap-2">
			<div class="bg-muted rounded-lg px-3 py-2 text-sm">Foto: <strong>{fotoPending.length}</strong></div>
			<div class="bg-muted rounded-lg px-3 py-2 text-sm">Perubahan: <strong>{perubahanPending.length}</strong></div>
		</div>
	{/snippet}

	<!-- Foto pendaan -->
	<section>
		<h2 class="text-sm font-semibold mb-2">Foto Menunggu Persetujuan</h2>
		<DataTable columns={columnsFoto} data={fotoPending} emptyMessage="Tidak ada foto menunggu persetujuan.">
			{#snippet children({ row, column })}
				{#if column.key === 'nama'}
					<span class="font-medium text-sm">{row.nama}</span>
				{:else if column.key === 'foto'}
					{#if row.foto_pending}
						<a href={row.foto_pending} target="_blank" class="text-xs text-primary hover:underline">Lihat Foto</a>
					{:else}
						<span class="text-xs text-muted-foreground">—</span>
					{/if}
				{:else if column.key === 'aksi'}
					<div class="flex gap-1">
						<form method="POST" action="?/approveFoto" use:enhance>
							<input type="hidden" name="id" value={row.id} />
							<Button type="submit" size="sm" class="h-7 text-[10px] cursor-pointer">
								<CheckCircle class="size-3" /> Setujui
							</Button>
						</form>
						<form method="POST" action="?/rejectFoto" use:enhance>
							<input type="hidden" name="id" value={row.id} />
							<Button type="submit" size="sm" variant="outline" class="h-7 text-[10px] text-destructive cursor-pointer">
								<XCircle class="size-3" /> Tolak
							</Button>
						</form>
					</div>
				{:else}
					{row[column.key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
	</section>

	<!-- Perubahan data -->
	<section class="mt-6">
		<h2 class="text-sm font-semibold mb-2">Perubahan Data Menunggu Persetujuan</h2>
		<DataTable columns={columnsPerubahan} data={perubahanPending} emptyMessage="Tidak ada perubahan data menunggu persetujuan.">
			{#snippet children({ row, column })}
				{#if column.key === 'nilai_lama'}
					<span class="text-xs line-through text-muted-foreground">{row.nilai_lama || '—'}</span>
				{:else if column.key === 'nilai_baru'}
					<span class="text-xs font-semibold text-green-700 dark:text-green-300">{row.nilai_baru}</span>
				{:else if column.key === 'aksi'}
					<div class="flex gap-1">
						<form method="POST" action="?/approvePerubahan" use:enhance>
							<input type="hidden" name="id" value={row.id} />
							<Button type="submit" size="sm" class="h-7 text-[10px] cursor-pointer">
								<CheckCircle class="size-3" /> Setujui
							</Button>
						</form>
						<form method="POST" action="?/rejectPerubahan" use:enhance>
							<input type="hidden" name="id" value={row.id} />
							<Button type="submit" size="sm" variant="outline" class="h-7 text-[10px] text-destructive cursor-pointer">
								<XCircle class="size-3" /> Tolak
							</Button>
						</form>
					</div>
				{:else}
					{row[column.key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
	</section>
</PageLayout>