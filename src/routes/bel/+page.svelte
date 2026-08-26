<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const status = $derived(data.status as any);
	const jadwal = $derived(data.jadwal as any);
</script>

<PageLayout title="Modul Bel" description="Monitoring & kontrol bel sekolah — MTsN 2 Kolaka Utara">
	{#if form?.ok !== undefined}
		<div class="rounded-md border px-3 py-2 text-sm {form.ok ? 'bg-green-500/10 text-green-700' : 'bg-destructive/10 text-destructive'}">
			{form.ok ? 'Perintah terkirim ke bel service.' : (form.error || 'Gagal mengirim perintah.')}
		</div>
	{/if}

	{#if status.offline}
		<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
			Bel service tidak aktif. Jalankan: <code class="font-mono">pm2 start bel</code>
		</div>
	{:else}
		<!-- Status cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Status</p>
				<p class="text-sm font-bold {status.playing ? 'text-green-600' : ''}">
					{status.playing ? '🔊 Berbunyi' : '✓ Siaga'}
				</p>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Master Switch</p>
				<Badge variant={status.master ? 'default' : 'outline'}>{status.master ? 'AKTIF' : 'NONAKTIF'}</Badge>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Hari</p>
				<p class="text-sm font-bold capitalize">{jadwal.hari_ini || '-'}</p>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Jadwal Hari Ini</p>
				<p class="text-xl font-bold">{jadwal.jadwal_hari_ini?.length ?? 0}</p>
			</div>
		</div>

		<!-- Kontrol manual -->
		<div class="rounded-lg border p-4 space-y-3">
			<p class="text-sm font-semibold">Kontrol Manual (tes suara)</p>
			<div class="flex flex-wrap items-center gap-2">
				<form method="POST" action="?/stop">
					<Button size="sm" variant="destructive" disabled={!status.playing} class="cursor-pointer h-8">⏹ Stop Pemutaran</Button>
				</form>
				{#each [['indonesia-raya.mp3', '▶ Indonesia Raya'], ['istirahat.mp3', '▶ Bel Istirahat'], ['jampulang.mp3', '▶ Bel Pulang']] as [file, label]}
					<form method="POST" action="?/play">
						<input type="hidden" name="file" value={file} />
						<Button size="sm" variant="outline" class="cursor-pointer h-8">{label}</Button>
					</form>
				{/each}
			</div>

			<div class="border-t pt-3">
				<p class="text-sm font-semibold mb-1">Master Switch Bel</p>
				<p class="text-xs text-muted-foreground mb-2">
					Pengelolaan master switch dilakukan via <b>web app mtsn2kolut</b> → Admin → Jam Bel.
					Halaman ini hanya menampilkan status (read-only).
				</p>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border p-4 text-sm text-muted-foreground">
			Status tidak diketahui — bel service mungkin belum berjalan.
		</div>
	{/if}

	<!-- Jadwal hari ini -->
	<div class="rounded-lg border overflow-hidden">
		<div class="bg-muted px-3 py-2 text-sm font-semibold capitalize">Jadwal Hari {jadwal.hari_ini}</div>
		<table class="w-full text-sm">
			<thead class="bg-muted/50 text-xs text-muted-foreground">
				<tr><th class="px-3 py-1.5 text-left">Jam</th><th class="px-3 py-1.5 text-left">Jenis</th><th class="px-3 py-1.5 text-left">Label</th></tr>
			</thead>
			<tbody>
				{#each jadwal.jadwal_hari_ini ?? [] as x}
					<tr class="border-t">
						<td class="px-3 py-1.5 font-medium">{x.jam}</td>
						<td class="px-3 py-1.5"><Badge variant={x.jenis === 'masuk' ? 'default' : x.jenis === 'pulang' ? 'destructive' : 'secondary'} class="text-[10px]">{x.jenis}</Badge></td>
						<td class="px-3 py-1.5">{x.label}</td>
					</tr>
				{:else}
					<tr><td colspan="3" class="px-3 py-4 text-center text-muted-foreground">Tidak ada jadwal hari ini.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="text-xs text-muted-foreground">
		Mesin bel dikelola via web app mtsn2kolut (menu Admin → Jam Bel). Halaman ini hanya monitoring & kontrol darurat.
	</p>
</PageLayout>
