<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { notify } from '$lib/toast';

	let { data, form } = $props();
	const status = $derived(data.status as any);
	const jadwal = $derived(data.jadwal as any);

	// Notifikasi hasil aksi (sonner, via helper terpusat)
	$effect(() => {
		notify.fromForm(form, 'Perintah terkirim ke bel service.');
	});
	const suaraFiles = $derived(((data.suara?.files ?? []) as any[]).map((f) => f.name ?? f));
	let semua = $state(false);
	const arrJadwal = $derived(semua ? (jadwal.semua ?? []) : (jadwal.jadwal_hari_ini ?? []));
	const hariList = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
	const jenisList = ['masuk', 'istirahat', 'pulang', 'upacara', 'khusus'];

	// form tambah
	let showForm = $state(false);
	let fHari = $state('senin');
	let fJam = $state('07:00');
	let fJenis = $state('khusus');
	let fLabel = $state('');
	let fSuara = $state(suaraFiles[0] ?? '');
	let fRepeat = $state(2);

	// master switch konfirmasi
	let masterConfirm = $state('');
	const masterTarget = $derived(status?.master ? 'NONAKTIF' : 'AKTIF');
</script>

<PageLayout title="Modul Bel" description="Jadwal & kontrol bel sekolah — SIMAD MTsN 2 Kolaka Utara">

	{#if status?.offline}
		<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
			Worker bel tidak aktif. Jalankan: <code class="font-mono">pm2 start simad-bel</code>
		</div>
	{:else}
		<!-- Status cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Status</p>
				<p class="text-sm font-bold {status?.playing ? 'text-green-600' : ''}">
					{status?.playing ? 'Berbunyi' : 'Siaga'}
				</p>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Master Switch</p>
				<Badge variant={status?.master ? 'default' : 'destructive'}>{status?.master ? 'AKTIF' : 'NONAKTIF'}</Badge>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Hari</p>
				<p class="text-sm font-bold capitalize">{jadwal?.hari_ini || '-'}</p>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Jadwal Aktif</p>
				<p class="text-xl font-bold">{jadwal?.semua?.length ?? 0}</p>
			</div>
		</div>


	{/if}

	<a
		href="/bel/suara"
		class="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
	>
		<div>
			<p class="text-sm font-semibold">Perpustakaan Suara</p>
			<p class="text-xs text-muted-foreground">Kelola file suara: putar (kontrol manual), upload, hapus</p>
		</div>
		<span class="text-xs text-primary">Buka →</span>
	</a>

	<!-- Jadwal + kelola -->
	<div class="rounded-lg border overflow-hidden">
		<button
			onclick={() => (semua = !semua)}
			class="bg-muted px-3 py-2 text-sm font-semibold w-full flex items-center justify-between hover:bg-muted/70 cursor-pointer"
		>
			<span class="capitalize">{semua ? 'Semua Jadwal (6 Hari)' : 'Jadwal Hari ' + (jadwal?.hari_ini || '-')}</span>
			<span class="text-xs text-muted-foreground">{semua ? 'tampilkan hari ini' : 'lihat semua hari'}</span>
		</button>
		<table class="w-full text-sm">
			<thead class="bg-muted/50 text-xs text-muted-foreground">
				<tr>
					{#if semua}<th class="px-3 py-1.5 text-left">Hari</th>{/if}
					<th class="px-3 py-1.5 text-left">Jam</th>
					<th class="px-3 py-1.5 text-left">Jenis</th>
					<th class="px-3 py-1.5 text-left">Label</th>
					<th class="px-3 py-1.5 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each arrJadwal as x, i}
					<tr class="border-t {x.aktif === 0 ? 'opacity-40' : ''}">
						{#if semua}<td class="px-3 py-1.5 capitalize text-xs">{x.hari}</td>{/if}
						<td class="px-3 py-1.5 font-medium">{x.jam}</td>
						<td class="px-3 py-1.5"><Badge variant={x.jenis === 'masuk' ? 'default' : x.jenis === 'pulang' ? 'destructive' : 'secondary'} class="text-[10px]">{x.jenis}</Badge></td>
						<td class="px-3 py-1.5">{x.label}</td>
						<td class="px-3 py-1.5 text-right">
							{#if x.id}
								<form method="POST" action="?/toggle" class="inline me-1">
									<input type="hidden" name="id" value={x.id} />
									<input type="hidden" name="aktif" value={x.aktif === 0 ? 1 : 0} />
									<Button type="submit" size="sm" variant="outline" class="h-6 px-2 text-[10px] cursor-pointer">
										{x.aktif === 0 ? 'Aktifkan' : 'Nonaktifkan'}
									</Button>
								</form>
								<form method="POST" action="?/delete" class="inline"
									onsubmit={(e) => { if (!confirm('Hapus jadwal ini?')) e.preventDefault(); }}>
									<input type="hidden" name="id" value={x.id} />
									<Button type="submit" size="sm" variant="destructive" class="h-6 px-2 text-[10px] cursor-pointer">Hapus</Button>
								</form>
							{:else}
								<span class="text-[10px] text-muted-foreground">—</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr><td colspan={semua ? 5 : 4} class="px-3 py-4 text-center text-muted-foreground">Tidak ada jadwal.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Form tambah jadwal -->
	<div class="rounded-lg border p-4">
		<button onclick={() => (showForm = !showForm)} class="text-sm font-semibold w-full flex items-center justify-between cursor-pointer">
			<span>Tambah Jadwal Bel</span>
			<span class="text-xs text-muted-foreground">{showForm ? '▲' : '▼'}</span>
		</button>
		{#if showForm}
			<form method="POST" action="?/create" class="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3 items-end">
				<label class="text-xs">
					<span class="text-muted-foreground">Hari</span>
					<select name="hari" bind:value={fHari} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each hariList as h}<option value={h}>{h}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jam (HH:MM)</span>
					<Input name="jam" bind:value={fJam} class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jenis</span>
					<select name="jenis" bind:value={fJenis} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each jenisList as j}<option value={j}>{j}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Label</span>
					<Input name="label" bind:value={fLabel} placeholder="mis. Jam ke-2" class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Suara</span>
					<select name="sound_path" bind:value={fSuara} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each suaraFiles as f}<option value={f}>{f}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Repeat</span>
					<Input name="repeat" type="number" min="1" max="10" bind:value={fRepeat} class="h-8 text-xs" />
				</label>
				<div class="col-span-2 md:col-span-6">
					<Button type="submit" size="sm" class="h-8 cursor-pointer">Simpan Jadwal</Button>
				</div>
			</form>
		{/if}
	</div>

	<p class="text-xs text-muted-foreground">
		Worker bel SIMAD (simad-bel) membaca jadwal dari database SIMAD dan memutar suara otomatis sesuai jadwal (WITA).
	</p>
</PageLayout>