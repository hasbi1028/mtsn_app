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

	// master switch konfirmasi
	let masterConfirm = $state('');
	const masterTarget = $derived(status?.master ? 'NONAKTIF' : 'AKTIF');

	// Satu form universal: editId '' = tambah, ada id = edit (gaya SAMA persis)
	let formOpen = $state(false);
	let editId = $state('');
	let eHari = $state('senin');
	let eJam = $state('07:00');
	let eJenis = $state('khusus');
	let eLabel = $state('');
	let eSuara = $state('');
	let eRepeat = $state(2);

	function bukaTambah() {
		editId = '';
		eHari = 'senin';
		eJam = '07:00';
		eJenis = 'khusus';
		eLabel = '';
		eSuara = suaraFiles[0] ?? '';
		eRepeat = 2;
		formOpen = true;
	}

	function mulaiEdit(x: any) {
		editId = x.id;
		eHari = x.hari;
		eJam = x.jam;
		eJenis = x.jenis;
		eLabel = x.label ?? '';
		eSuara = x.sound_path ?? suaraFiles[0] ?? '';
		eRepeat = x.repeat ?? 2;
		formOpen = true;
	}

	function tutupForm() {
		formOpen = false;
		editId = '';
	}
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

	<!-- Form jadwal (tambah/edit, gaya sama) -->
	{#if formOpen}
		<div class="rounded-lg border border-primary/40 p-4 mb-3">
			<p class="text-sm font-semibold mb-3">{editId ? 'Edit Jadwal' : 'Tambah Jadwal Bel'}</p>
			<form method="POST" action={editId ? '?/update' : '?/create'} class="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
				<input type="hidden" name="id" value={editId} />
				<label class="text-xs">
					<span class="text-muted-foreground">Hari</span>
					<select name="hari" bind:value={eHari} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each hariList as h}<option value={h} selected={h === eHari}>{h}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jam (HH:MM)</span>
					<Input name="jam" bind:value={eJam} class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jenis</span>
					<select name="jenis" bind:value={eJenis} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each jenisList as j}<option value={j} selected={j === eJenis}>{j}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Label</span>
					<Input name="label" bind:value={eLabel} class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Suara</span>
					<select name="sound_path" bind:value={eSuara} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each suaraFiles as f}<option value={f} selected={f === eSuara}>{f}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Repeat</span>
					<Input name="repeat" type="number" min="1" max="10" bind:value={eRepeat} class="h-8 text-xs" />
				</label>
				<div class="col-span-2 md:col-span-6 flex gap-2">
					<Button type="submit" size="sm" class="h-8 cursor-pointer">{editId ? 'Simpan Perubahan' : 'Simpan Jadwal'}</Button>
					<Button type="button" size="sm" variant="outline" class="h-8 cursor-pointer" onclick={tutupForm}>Batal</Button>
				</div>
			</form>
		</div>
	{/if}

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
								<button
									type="button"
									onclick={() => mulaiEdit(x)}
									class="inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-medium hover:bg-muted cursor-pointer"
								>Edit</button>
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

	<!-- Tombol tambah (membuka form gaya edit di atas) -->
	<button
		onclick={bukaTambah}
		class="w-full rounded-lg border border-dashed p-3 text-sm font-medium text-primary hover:bg-muted/50 cursor-pointer"
	>
		+ Tambah Jadwal Bel
	</button>

	<p class="text-xs text-muted-foreground">
		Worker bel SIMAD (simad-bel) membaca jadwal dari database SIMAD dan memutar suara otomatis sesuai jadwal (WITA).
	</p>
</PageLayout>