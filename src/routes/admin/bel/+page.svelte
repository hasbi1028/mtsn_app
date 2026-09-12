<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { notify } from '$lib/toast';
	import {
		getBelStatusQ, getBelJadwalQ, getBelSuaraFilesQ,
		playBellC, stopBellC, toggleMasterC,
		createJadwalC, updateJadwalC, toggleJadwalC, deleteJadwalC
	} from '$modules/bel/bel.remote';

	const statusQuery = $derived(getBelStatusQ());
	const jadwalQuery = $derived(getBelJadwalQ());
	const suaraQuery = $derived(getBelSuaraFilesQ());

	const status = $derived(statusQuery.current as any);
	const jadwal = $derived(jadwalQuery.current as any);
	const suaraFiles = $derived(((suaraQuery.current as any)?.files ?? []).map((f: any) => f.name ?? f));

	let semua = $state(false);
	const arrJadwal = $derived(semua ? (jadwal?.semua ?? []) : (jadwal?.jadwal_hari_ini ?? []));
	const hariList = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
	const jenisList = ['masuk', 'istirahat', 'pulang', 'upacara', 'khusus'];

	let masterConfirm = $state('');
	const masterTarget = $derived(status?.master ? 'NONAKTIF' : 'AKTIF');

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

	async function handleStop() {
		const r = await stopBellC({}) as any;
		notify.success(r?.pesan || 'Perintah terkirim.');
	}

	async function handlePlay(file: string) {
		const r = await playBellC({ file }) as any;
		if (r?.ok) notify.success(r.pesan);
		else notify.error(r?.error || 'Gagal memutar.');
	}

	async function handleMaster() {
		const r = await toggleMasterC({ confirm: masterConfirm, target: status?.master ? '0' : '1' }) as any;
		if (r?.ok) { notify.success(r.pesan); masterConfirm = ''; statusQuery.refresh(); }
		else notify.error(r?.error || 'Gagal.');
	}

	async function handleSaveJadwal() {
		const data = { hari: eHari, jam: eJam, jenis: eJenis, label: eLabel, sound_path: eSuara, repeat: eRepeat };
		if (editId) {
			const r = await updateJadwalC({ id: editId, ...data }) as any;
			if (r?.ok) { notify.success(r.pesan); tutupForm(); jadwalQuery.refresh(); }
			else notify.error(r?.error || 'Gagal update.');
		} else {
			const r = await createJadwalC(data) as any;
			if (r?.ok) { notify.success(r.pesan); tutupForm(); jadwalQuery.refresh(); }
			else notify.error(r?.error || 'Gagal tambah.');
		}
	}

	async function handleToggle(x: any) {
		const r = await toggleJadwalC({ id: x.id, aktif: x.aktif === 0 ? 1 : 0 }) as any;
		if (r?.ok) { notify.success(r.pesan); jadwalQuery.refresh(); }
		else notify.error(r?.error || 'Gagal toggle.');
	}

	async function handleDelete(id: string) {
		const r = await deleteJadwalC({ id }) as any;
		if (r?.ok) { notify.success(r.pesan); jadwalQuery.refresh(); }
		else notify.error(r?.error || 'Gagal hapus.');
	}
</script>

<svelte:head><title>Modul Bel — SIMAD</title></svelte:head>

<PageLayout title="Modul Bel" description="Jadwal & kontrol bel sekolah — SIMAD MTsN 2 Kolaka Utara">
	{#if status?.offline}
		<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
			Worker bel tidak aktif. Jalankan: <code class="font-mono">pm2 start simad-bel</code>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Status</p>
				<p class="text-sm font-bold {status?.playing ? 'text-green-600' : ''}">{status?.playing ? 'Berbunyi' : 'Siaga'}</p>
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

		{#if status?.playing}
			<Button size="sm" variant="destructive" class="cursor-pointer" onclick={handleStop}>Stop Pemutaran</Button>
		{/if}

		{#if !status?.master}
			<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-center gap-2">
				<span class="text-sm text-destructive">Master switch NONAKTIF.</span>
				<Input bind:value={masterConfirm} placeholder="Ketik NONAKTIF" class="h-7 w-32 text-xs" />
				<Button size="sm" variant="outline" class="h-7 text-xs cursor-pointer" onclick={handleMaster} disabled={masterConfirm.toUpperCase() !== 'NONAKTIF'}>
					Aktifkan
				</Button>
			</div>
		{/if}
	{/if}

	<a href={resolve('/admin/bel/suara')} class="rounded-lg border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
		<div>
			<p class="text-sm font-semibold">Perpustakaan Suara</p>
			<p class="text-xs text-muted-foreground">Kelola file suara: putar (kontrol manual), upload, hapus</p>
		</div>
		<span class="text-xs text-primary">Buka →</span>
	</a>

	{#if formOpen}
		<div class="rounded-lg border border-primary/40 p-4 mb-3">
			<p class="text-sm font-semibold mb-3">{editId ? 'Edit Jadwal' : 'Tambah Jadwal Bel'}</p>
			<div class="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
				<label class="text-xs">
					<span class="text-muted-foreground">Hari</span>
					<select bind:value={eHari} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each hariList as h}<option value={h}>{h}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jam (HH:MM)</span>
					<Input bind:value={eJam} class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Jenis</span>
					<select bind:value={eJenis} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each jenisList as j}<option value={j}>{j}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Label</span>
					<Input bind:value={eLabel} class="h-8 text-xs" />
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Suara</span>
					<select bind:value={eSuara} class="w-full h-8 rounded-md border bg-background px-2 text-xs">
						{#each suaraFiles as f}<option value={f}>{f}</option>{/each}
					</select>
				</label>
				<label class="text-xs">
					<span class="text-muted-foreground">Repeat</span>
					<Input type="number" min="1" max="10" bind:value={eRepeat} class="h-8 text-xs" />
				</label>
				<div class="col-span-2 md:col-span-6 flex gap-2">
					<Button size="sm" class="h-8 cursor-pointer" onclick={handleSaveJadwal}>{editId ? 'Simpan Perubahan' : 'Simpan Jadwal'}</Button>
					<Button type="button" size="sm" variant="outline" class="h-8 cursor-pointer" onclick={tutupForm}>Tutup</Button>
				</div>
			</div>
		</div>
	{/if}

	<div class="rounded-lg border overflow-hidden">
		<div class="bg-muted px-3 py-2 flex items-center justify-between gap-2">
			<button onclick={() => (semua = !semua)} class="text-sm font-semibold flex items-center gap-2 hover:bg-muted/70 cursor-pointer rounded px-1">
				<span class="capitalize">{semua ? 'Semua Jadwal (6 Hari)' : 'Jadwal Hari ' + (jadwal?.hari_ini || '-')}</span>
				<span class="text-xs text-muted-foreground">{semua ? 'tampilkan hari ini' : 'lihat semua hari'}</span>
			</button>
			<button onclick={formOpen ? tutupForm : bukaTambah} class="shrink-0 inline-flex h-7 items-center rounded-md border px-3 text-xs font-medium cursor-pointer hover:bg-background {formOpen ? 'text-destructive' : 'text-primary'}">
				{formOpen ? 'Batal' : '+ Tambah Jadwal'}
			</button>
		</div>
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
				{#each arrJadwal as x, i (x.id ?? i)}
					<tr class="border-t {x.aktif === 0 ? 'opacity-40' : ''}">
						{#if semua}<td class="px-3 py-1.5 capitalize text-xs">{x.hari}</td>{/if}
						<td class="px-3 py-1.5 font-medium">{x.jam}</td>
						<td class="px-3 py-1.5"><Badge variant={x.jenis === 'masuk' ? 'default' : x.jenis === 'pulang' ? 'destructive' : 'secondary'} class="text-[10px]">{x.jenis}</Badge></td>
						<td class="px-3 py-1.5">{x.label}</td>
						<td class="px-3 py-1.5 text-right">
							{#if x.id}
								<button type="button" onclick={() => mulaiEdit(x)} class="inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-medium hover:bg-muted cursor-pointer">Edit</button>
								<button type="button" onclick={() => handleToggle(x)} class="inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-medium hover:bg-muted cursor-pointer me-1">
									{x.aktif === 0 ? 'Aktifkan' : 'Nonaktifkan'}
								</button>
								<button type="button" onclick={() => { if (confirm('Hapus jadwal ini?')) handleDelete(x.id); }} class="inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-medium hover:bg-destructive/10 text-destructive cursor-pointer">
									Hapus
								</button>
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

	<p class="text-xs text-muted-foreground">
		Worker bel SIMAD (simad-bel) membaca jadwal dari database SIMAD dan memutar suara otomatis sesuai jadwal (WITA).
	</p>
</PageLayout>
