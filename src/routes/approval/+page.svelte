<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import { notify } from '$lib/toast';
	import { getApprovalFotoListQ, getApprovalPerubahanListQ, approveFotoC, rejectFotoC, approvePerubahanC, rejectPerubahanC } from '$modules/approval/approval.remote';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import { resolve } from '$app/paths';

	const fotoList = getApprovalFotoListQ();
	const perubahanList = getApprovalPerubahanListQ();

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

	function refreshAll() {
		void getApprovalFotoListQ().refresh();
		void getApprovalPerubahanListQ().refresh();
	}

	type CmdResult = { ok?: boolean; pesan?: string; error?: string };

	async function handleApproveFoto(id: number) {
		try {
			const res = (await approveFotoC(id)) as CmdResult;
			if (res?.ok) {
				notify.success(res.pesan ?? 'Berhasil');
				refreshAll();
			} else {
				notify.error(res?.error ?? 'Gagal menyetujui foto');
			}
		} catch {
			notify.error('Gagal menyetujui foto');
		}
	}

	async function handleRejectFoto(id: number) {
		try {
			const res = (await rejectFotoC(id)) as CmdResult;
			if (res?.ok) {
				notify.success(res.pesan ?? 'Berhasil');
				refreshAll();
			} else {
				notify.error(res?.error ?? 'Gagal menolak foto');
			}
		} catch {
			notify.error('Gagal menolak foto');
		}
	}

	async function handleApprovePerubahan(id: number) {
		try {
			const res = (await approvePerubahanC(id)) as CmdResult;
			if (res?.ok) {
				notify.success(res.pesan ?? 'Berhasil');
				refreshAll();
			} else {
				notify.error(res?.error ?? 'Gagal menyetujui perubahan');
			}
		} catch {
			notify.error('Gagal menyetujui perubahan');
		}
	}

	async function handleRejectPerubahan(id: number) {
		try {
			const res = (await rejectPerubahanC({ id, catatan: '' })) as CmdResult;
			if (res?.ok) {
				notify.success(res.pesan ?? 'Berhasil');
				refreshAll();
			} else {
				notify.error(res?.error ?? 'Gagal menolak perubahan');
			}
		} catch {
			notify.error('Gagal menolak perubahan');
		}
	}
</script>

{#await Promise.all([fotoList, perubahanList])}
	<p class="text-sm text-muted-foreground text-center py-8">Memuat data persetujuan...</p>
{:then [fotoRows, perubahanRows]}
	<PageLayout title="Persetujuan" description="Persetujuan foto & perubahan data siswa oleh siswa">
		{#snippet actions()}
			<div class="flex gap-2">
				<div class="bg-muted rounded-lg px-3 py-2 text-sm">Foto: <strong>{fotoRows.length}</strong></div>
				<div class="bg-muted rounded-lg px-3 py-2 text-sm">Perubahan: <strong>{perubahanRows.length}</strong></div>
			</div>
		{/snippet}

		<!-- Foto pendaan -->
		<section>
			<h2 class="text-sm font-semibold mb-2">Foto Menunggu Persetujuan</h2>
			<DataTable columns={columnsFoto} data={fotoRows} emptyMessage="Tidak ada foto menunggu persetujuan.">
				{#snippet children({ row, column })}
					{#if column.key === 'nama'}
						<span class="font-medium text-sm">{row.nama}</span>
					{:else if column.key === 'foto'}
						{#if row.foto_pending}
							<a href={resolve(row.foto_pending)} target="_blank" class="text-xs text-primary hover:underline">Lihat Foto</a>
						{:else}
							<span class="text-xs text-muted-foreground">—</span>
						{/if}
					{:else if column.key === 'aksi'}
						<div class="flex gap-1">
							<Button type="button" size="sm" class="h-7 text-[10px] cursor-pointer" onclick={() => handleApproveFoto(row.id)}>
								<CheckCircle class="size-3" /> Setujui
							</Button>
							<Button type="button" size="sm" variant="outline" class="h-7 text-[10px] text-destructive cursor-pointer" onclick={() => handleRejectFoto(row.id)}>
								<XCircle class="size-3" /> Tolak
							</Button>
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
			<DataTable columns={columnsPerubahan} data={perubahanRows} emptyMessage="Tidak ada perubahan data menunggu persetujuan.">
				{#snippet children({ row, column })}
					{#if column.key === 'nilai_lama'}
						<span class="text-xs line-through text-muted-foreground">{row.nilai_lama || '—'}</span>
					{:else if column.key === 'nilai_baru'}
						<span class="text-xs font-semibold text-green-700 dark:text-green-300">{row.nilai_baru}</span>
					{:else if column.key === 'aksi'}
						<div class="flex gap-1">
							<Button type="button" size="sm" class="h-7 text-[10px] cursor-pointer" onclick={() => handleApprovePerubahan(row.id)}>
								<CheckCircle class="size-3" /> Setujui
							</Button>
							<Button type="button" size="sm" variant="outline" class="h-7 text-[10px] text-destructive cursor-pointer" onclick={() => handleRejectPerubahan(row.id)}>
								<XCircle class="size-3" /> Tolak
							</Button>
						</div>
					{:else}
						{row[column.key] ?? '—'}
					{/if}
				{/snippet}
			</DataTable>
		</section>
	</PageLayout>
{/await}
