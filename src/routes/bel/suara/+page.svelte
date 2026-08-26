<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { notify } from '$lib/toast';

	let { data, form } = $props();
	const files = $derived((data.suara?.files ?? []) as { name: string; size: number; used_by: number }[]);
	let uploading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	// Notifikasi hasil aksi (sonner)
	$effect(() => {
		notify.fromForm(form);
	});

	function fmtSize(n: number) {
		if (n >= 1 << 20) return (n / (1 << 20)).toFixed(1) + ' MB';
		return Math.round(n / 1024) + ' KB';
	}

	async function onUpload(e: SubmitEvent) {
		e.preventDefault();
		if (!fileInput?.files?.[0]) {
			notify.warning('Pilih file terlebih dahulu.');
			return;
		}
		uploading = true;
		(e.currentTarget as HTMLFormElement).submit();
	}
</script>

<PageLayout title="Perpustakaan Suara Bel" description="Kelola file suara bel — putar, upload, hapus">
	{#if files.length > 0}
		<form method="POST" action="?/stop" class="mb-2">
			<Button type="submit" size="sm" variant="destructive" class="cursor-pointer h-8">Stop Pemutaran</Button>
		</form>
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
					<form method="POST" action="?/play" class="flex-1">
						<input type="hidden" name="file" value={f.name} />
						<Button type="submit" size="sm" variant="outline" class="w-full h-7 text-xs cursor-pointer">Putar</Button>
					</form>
					<form
						method="POST"
						action="?/delete"
						onsubmit={(e) => {
							if (!confirm(`Hapus ${f.name}?`)) e.preventDefault();
						}}
					>
						<input type="hidden" name="name" value={f.name} />
						<Button type="submit" size="sm" variant="destructive" class="h-7 text-xs cursor-pointer">Hapus</Button>
					</form>
				</div>
			</div>
		{:else}
			<p class="col-span-full text-sm text-muted-foreground py-4 text-center">Belum ada file suara.</p>
		{/each}
	</div>

	<!-- Upload -->
	<div class="rounded-lg border p-4 mt-4">
		<p class="text-sm font-semibold mb-2">Upload Suara Baru</p>
		<form method="POST" action="?/upload" enctype="multipart/form-data" onsubmit={onUpload} class="flex flex-wrap items-center gap-2">
			<input
				type="file"
				name="file"
				accept=".mp3,.wav,.m4a,.wma,audio/*"
				class="text-xs max-w-xs"
				bind:this={fileInput}
				required
			/>
			<Button type="submit" size="sm" disabled={uploading} class="h-8 cursor-pointer">
				{uploading ? 'Mengunggah...' : 'Upload'}
			</Button>
		</form>
		<p class="text-xs text-muted-foreground mt-2">Format mp3/wav/m4a/wma, maksimal 10 MB.</p>
	</div>

	<a href="/bel" class="text-xs text-primary hover:underline">← Kembali ke Modul Bel</a>
</PageLayout>