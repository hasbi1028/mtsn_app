<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { notify } from '$lib/toast';
	import { getBelSuaraFilesQ, playBellC, stopBellC, uploadSuaraC, deleteSuaraC } from '$modules/bel/bel.remote';

	const suaraQuery = $derived(getBelSuaraFilesQ());
	const files = $derived(((suaraQuery.current as any)?.files ?? []) as { name: string; size: number; used_by: number }[]);

	let uploading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	function fmtSize(n: number) {
		if (n >= 1 << 20) return (n / (1 << 20)).toFixed(1) + ' MB';
		return Math.round(n / 1024) + ' KB';
	}

	async function handleStop() {
		const r = await stopBellC({}) as any;
		notify.success(r?.pesan || 'Perintah terkirim.');
	}

	async function handlePlay(file: string) {
		const r = await playBellC({ file }) as any;
		if (r?.ok) notify.success(r.pesan);
		else notify.error(r?.error || 'Gagal memutar.');
	}

	async function handleDelete(name: string) {
		const r = await deleteSuaraC({ name }) as any;
		if (r?.ok) { notify.success(r.pesan); suaraQuery.refresh(); }
		else notify.error(r?.error || 'Gagal hapus.');
	}

	async function onUpload(e: Event) {
		e.preventDefault();
		if (!fileInput?.files?.[0]) { notify.warning('Pilih file terlebih dahulu.'); return; }
		const file = fileInput.files[0];
		uploading = true;
		try {
			const fd = new FormData();
			fd.append('file', file);
			const r = await uploadSuaraC({ fileName: file.name, fileSize: file.size }) as any;
			if (r?.ok) { notify.success(r.pesan); suaraQuery.refresh(); if (fileInput) fileInput.value = ''; }
			else notify.error(r?.error || 'Upload gagal.');
		} finally { uploading = false; }
	}
</script>

<svelte:head><title>Perpustakaan Suara — SIMAD</title></svelte:head>

<PageLayout title="Perpustakaan Suara Bel" description="Kelola file suara bel — putar, upload, hapus">
	{#if files.length > 0}
		<Button size="sm" variant="destructive" class="cursor-pointer h-8" onclick={handleStop}>Stop Pemutaran</Button>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
		{#each files as f (f.name)}
			<div class="rounded-lg border p-3 flex flex-col gap-2">
				<div class="flex items-start justify-between gap-2">
					<p class="text-sm font-medium truncate" title={f.name}>{f.name}</p>
					{#if f.used_by > 0}
						<Badge variant="secondary" class="text-[10px] shrink-0">dipakai {f.used_by}</Badge>
					{:else}
						<Badge variant="outline" class="text-[10px] shrink-0">tidak dipakai</Badge>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">{fmtSize(f.size)}</p>
				<div class="flex gap-1 mt-auto">
					<Button size="sm" variant="outline" class="flex-1 h-7 text-xs cursor-pointer" onclick={() => handlePlay(f.name)}>Putar</Button>
					<Button size="sm" variant="outline" class="h-7 text-xs cursor-pointer text-destructive" onclick={() => { if (confirm('Hapus file suara ini?')) handleDelete(f.name); }}>Hapus</Button>
				</div>
			</div>
		{:else}
			<p class="col-span-full text-sm text-muted-foreground py-4 text-center">Belum ada file suara.</p>
		{/each}
	</div>

	<div class="rounded-lg border p-4 mt-4">
		<p class="text-sm font-semibold mb-2">Upload Suara Baru</p>
		<form onsubmit={onUpload} class="flex flex-wrap items-center gap-2">
			<input type="file" accept=".mp3,.wav,.m4a,.wma,audio/*" class="text-xs max-w-xs" bind:this={fileInput} required />
			<Button type="submit" size="sm" disabled={uploading} class="h-8 cursor-pointer">
				{uploading ? 'Mengunggah...' : 'Upload'}
			</Button>
		</form>
		<p class="text-xs text-muted-foreground mt-2">Format mp3/wav/m4a/wma, maksimal 10 MB.</p>
	</div>

	<a href={resolve('/admin/bel')} class="text-xs text-primary hover:underline">← Kembali ke Modul Bel</a>
</PageLayout>
