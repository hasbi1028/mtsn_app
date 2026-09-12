<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import Eye from '@lucide/svelte/icons/eye';
	import { getPtkDetailQ } from '$modules/ptk/ptk.remote';
	import { notify } from '$lib/toast';

	let { params } = $props();
	const p = $derived(await getPtkDetailQ({ id: params.id }));

	let detailOpen = $state(false);
	let detailRow = $state<any>(null);
	const detailIndikator = $derived((detailRow?.detail?.indikator as any[]) || []);
	const detailUnmet = $derived((detailRow?.detail?.indikator_unmet as any[]) || []);
	function lihatDetail(s: any) {
		detailRow = s;
		detailOpen = true;
	}

	let buktiOpen = $state(false);
	let buktiUrl = $state('');
	let buktiNama = $state('');
	function lihatBukti(name: string, namaPtk: string) {
		buktiUrl = `/api/skakpt/bukti/${encodeURIComponent(name)}`;
		buktiNama = namaPtk;
		buktiOpen = true;
	}

	let dokumenOpen = $state(false);
	let dokumenUrl = $state('');
	let dokumenNama = $state('');
	function lihatDokumen(pdfFile: string, namaPtk: string) {
		dokumenUrl = `/api/skakpt/dokumen/${encodeURIComponent(pdfFile)}`;
		dokumenNama = namaPtk;
		dokumenOpen = true;
	}

	let uploading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let fotoPath = $state('');
	let fotoPreview = $derived(fotoPath ? `/${fotoPath}` : '');

	$effect(() => {
		if (p?.fotoPath) fotoPath = p.fotoPath;
	});

	async function uploadFoto(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const fd = new FormData();
			fd.append('foto', file);
			const res = await fetch(`/admin/ptk/${params.id}/foto`, { method: 'POST', body: fd });
			const data = await res.json();
			if (data.ok) {
				fotoPath = data.foto_path;
				notify.success('Foto profil berhasil diperbarui');
			} else {
				notify.error(data.error || 'Gagal upload foto');
			}
		} catch {
			notify.error('Gagal upload foto');
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<svelte:head><title>{p?.nama ?? 'PTK'} — MTsN App</title></svelte:head>

{#if p}
	{@const jtm = (Array.isArray(p.jtm) ? p.jtm[0] : p.jtm) || {}}
	{@const totalJtm = Number(jtm.mengajar || 0) + Number(jtm.tugas || 0)}
	{@const emisDiffers = Number(jtm.dashboardTotal || 0) !== totalJtm}

	<a href="/admin/ptk" class="text-sm text-muted-foreground hover:underline mb-2 inline-block">&larr; Kembali</a>

	<div class="flex items-center gap-2 mb-1">
		<h1 class="text-lg font-semibold">{p.nama}</h1>
		{#if p.sertifikasi}
			<Badge class="text-xs">Sertifikasi</Badge>
		{:else}
			<Badge variant="outline" class="text-xs">Belum Sertifikasi</Badge>
		{/if}
		{#if p.aktivasi}
			<Badge variant="secondary" class="text-xs">Aktif</Badge>
		{/if}
	</div>
	<div class="flex flex-wrap gap-1.5 mb-4">
		{#if p.waliKelas}<Badge variant="default" class="text-xs">Wali {p.waliKelas}</Badge>{/if}
		{#if p.jabatanStruktural}<Badge variant="secondary" class="text-xs">{p.jabatanStruktural}</Badge>{/if}
	</div>

	<div class="grid gap-3 md:grid-cols-2">
		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Foto Profil</CardTitle></CardHeader>
			<CardContent>
				<div class="flex items-center gap-4">
					<div class="size-20 rounded-full bg-muted overflow-hidden shrink-0">
						{#if fotoPreview}
							<img src={fotoPreview} alt={p.nama} class="size-full object-cover" />
						{:else}
							<div class="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
								{p.nama.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
							</div>
						{/if}
					</div>
					<div>
						<Button size="sm" variant="outline" class="cursor-pointer" onclick={() => fileInput?.click()} disabled={uploading}>
							{uploading ? 'Mengupload...' : 'Ubah Foto'}
						</Button>
						<p class="text-[10px] text-muted-foreground mt-1">PNG/JPG/WEBP, max 2MB</p>
					</div>
				</div>
				<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={uploadFoto} />
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Identitas</CardTitle></CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						<TableRow><TableCell class="text-muted-foreground text-xs">PEG ID</TableCell><TableCell class="text-xs">{p.pegId || '-'}</TableCell></TableRow>
						<TableRow><TableCell class="text-muted-foreground text-xs">NIP</TableCell><TableCell class="text-xs">{p.nip || '-'}</TableCell></TableRow>
						<TableRow><TableCell class="text-muted-foreground text-xs">NIK</TableCell><TableCell class="text-xs">{p.nik || '-'}</TableCell></TableRow>
						<TableRow><TableCell class="text-muted-foreground text-xs">NUPTK</TableCell><TableCell class="text-xs">{p.nuptk || '-'}</TableCell></TableRow>
						<TableRow><TableCell class="text-muted-foreground text-xs">Kelengkapan</TableCell><TableCell class="text-xs">{p.kelengkapan ?? 0}%</TableCell></TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">JTM (Satminkal, TA 2026/2027)</CardTitle></CardHeader>
			<CardContent>
				{#if totalJtm > 0}
					<Table>
						<TableBody>
							<TableRow><TableCell class="text-muted-foreground text-xs">Mengajar</TableCell><TableCell class="text-xs">{jtm.mengajar ?? 0} jam</TableCell></TableRow>
							<TableRow><TableCell class="text-muted-foreground text-xs">Tugas Tambahan</TableCell><TableCell class="text-xs">{jtm.tugas ?? 0} jam</TableCell></TableRow>
							<TableRow>
								<TableCell class="font-medium text-xs">Total</TableCell>
								<TableCell class="font-medium text-xs">
									{totalJtm} jam
									{#if totalJtm < 24}
										<Badge variant="destructive" class="ml-1 text-[10px] px-1 py-0">&lt;24!</Badge>
									{/if}
								</TableCell>
							</TableRow>
							{#if jtm.totalS25a != null}
								<TableRow><TableCell class="text-muted-foreground text-xs">Total di S25a</TableCell><TableCell class="text-xs">{jtm.totalS25a}</TableCell></TableRow>
							{/if}
							{#if jtm.dashboardTotal != null}
								<TableRow><TableCell class="text-muted-foreground text-xs">Dashboard EMIS</TableCell><TableCell class="text-xs">{jtm.dashboardTotal}</TableCell></TableRow>
								{#if emisDiffers}
									<TableRow><TableCell colspan={2} class="text-[10px] text-muted-foreground italic">* EMIS termasuk tugas tambahan lain</TableCell></TableRow>
								{/if}
							{/if}
						</TableBody>
					</Table>
				{:else}
					<p class="text-xs text-muted-foreground">Belum ada data JTM.</p>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Riwayat SKMT</CardTitle></CardHeader>
			<CardContent>
				{#if !p.skmt || p.skmt.length === 0}
					<p class="text-xs text-muted-foreground">Belum ada ajuan.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow><TableHead class="text-xs">Periode</TableHead><TableHead class="text-xs">Instansi</TableHead><TableHead class="text-xs">Status</TableHead></TableRow>
						</TableHeader>
						<TableBody>
							{#each p.skmt as s}
								<TableRow>
									<TableCell class="text-xs">{s.periode}</TableCell>
									<TableCell class="text-xs">{s.instansi}</TableCell>
									<TableCell>
										<Badge variant={s.status?.startsWith('Disetujui') ? 'default' : 'secondary'} class="text-[10px]">
											{s.status}
										</Badge>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Riwayat SKBK</CardTitle></CardHeader>
			<CardContent>
				{#if !p.skbk || p.skbk.length === 0}
					<p class="text-xs text-muted-foreground">Belum ada ajuan SKBK.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow><TableHead class="text-xs">Periode</TableHead><TableHead class="text-xs">JTM</TableHead><TableHead class="text-xs">Status</TableHead></TableRow>
						</TableHeader>
						<TableBody>
							{#each p.skbk as s}
								<TableRow>
									<TableCell class="text-xs">{s.periode}</TableCell>
									<TableCell class="text-xs">{s.jtmTotal ?? '—'} jam</TableCell>
									<TableCell>
										<Badge variant={s.status === 'Disetujui' ? 'default' : 'secondary'} class="text-[10px] {s.status === 'Disetujui' ? 'bg-green-600 text-white hover:bg-green-600' : ''}">
											{s.status}
										</Badge>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Riwayat SKAKPT</CardTitle></CardHeader>
			<CardContent>
				{#if !p.skakpt || p.skakpt.length === 0}
					<p class="text-xs text-muted-foreground">Belum ada ajuan SKAKPT.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow><TableHead class="text-xs">Bulan</TableHead><TableHead class="text-xs">Syarat</TableHead><TableHead class="text-xs">Status</TableHead><TableHead class="text-xs">Aksi</TableHead></TableRow>
						</TableHeader>
						<TableBody>
							{#each p.skakpt as s}
								{@const det = s.detail as any}
								{@const totalOk = Number(det?.totalOk ?? 0)}
								{@const total = Number(det?.total ?? 11)}
								<TableRow>
									<TableCell class="text-xs">{s.bulan || '—'}</TableCell>
									<TableCell>
										{#if det}
											<Badge variant={totalOk === total ? 'default' : 'destructive'} class="text-[10px]">
												{totalOk}/{total}
											</Badge>
										{:else}
											<span class="text-xs text-muted-foreground">—</span>
										{/if}
									</TableCell>
									<TableCell>
										{#if s.status === 'Sudah Terbit' || s.status === 'Disetujui'}
											<Badge variant="default" class="text-[10px]">✓ Sudah Terbit</Badge>
										{:else if det?.layak && totalOk >= total}
											<Badge class="text-[10px] bg-emerald-600 hover:bg-emerald-600 text-white">✓ Indikator Hijau (belum terbit)</Badge>
										{:else if det?.indikator_unmet?.length > 0}
											<Badge variant="destructive" class="text-[10px]">Belum Layak</Badge>
										{:else}
											<Badge variant="secondary" class="text-[10px]">{s.status}</Badge>
										{/if}
									</TableCell>
								<TableCell class="text-xs">
									<div class="flex gap-1">
										{#if det}
											<Button size="sm" variant="outline" class="h-6 text-[10px] cursor-pointer" onclick={() => lihatDetail(s)}>
												<Eye class="size-3" /> Indikator
											</Button>
										{/if}
										{#if s.status === 'Sudah Terbit' || s.status === 'Disetujui'}
											{@const buktiName = `skakpt-${(s.bulan || '').replace(/\s+/g, '-')}-${(p.nama || '').replace(/\s+/g, '_')}.png`}
											<Button size="sm" variant="outline" class="h-6 text-[10px] cursor-pointer" onclick={() => lihatBukti(buktiName, p.nama)}>
												<Eye class="size-3" /> Bukti
											</Button>
											{@const pdfFile = `SKAKPT_${(p.nama || '').replace(/ /g, '_')}_${(s.bulan || '').replace(/\s+/g, '')}.pdf`}
											<Button size="sm" variant="outline" class="h-6 text-[10px] cursor-pointer" onclick={() => lihatDokumen(pdfFile, p.nama)}>
												<Eye class="size-3" /> Dokumen
											</Button>
										{/if}
									</div>
								</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2"><CardTitle class="text-sm">Dokumen</CardTitle></CardHeader>
			<CardContent>
				{#if !p.dokumen || p.dokumen.length === 0}
					<p class="text-xs text-muted-foreground">Belum ada dokumen.</p>
				{:else}
					<ul class="space-y-1">
						{#each p.dokumen as d}
							<li>
								<PdfViewer src={d.filePath} title={d.jenis + " — " + d.periode} />
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="md:col-span-2">
			<CardHeader class="pb-2"><CardTitle class="text-sm">Roster Mengajar ({(p.roster || []).length} slot)</CardTitle></CardHeader>
			<CardContent>
				{#if !p.roster || p.roster.length === 0}
					<p class="text-xs text-muted-foreground">Tidak ditemukan di roster.</p>
				{:else}
					<div class="max-h-64 overflow-y-auto">
						<Table>
							<TableHeader>
								<TableRow><TableHead class="text-xs">Hari</TableHead><TableHead class="text-xs">Jam</TableHead><TableHead class="text-xs">Kelas</TableHead><TableHead class="text-xs">Mapel</TableHead></TableRow>
							</TableHeader>
							<TableBody>
								{#each p.roster as m}
									<TableRow>
										<TableCell class="text-xs">{m.hari}</TableCell>
										<TableCell class="text-xs">{m.jamKe}</TableCell>
										<TableCell class="text-xs">{m.kelas}</TableCell>
										<TableCell class="text-xs">{m.mapel}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Dialog.Root bind:open={detailOpen}>
		<Dialog.Content class="max-w-2xl p-0 gap-0">
			<Dialog.Header class="px-4 py-3 border-b">
				<Dialog.Title class="text-sm">11 Indikator Kelayakan TPG — {p.nama}{detailRow?.bulan ? ` (${detailRow.bulan})` : ''}</Dialog.Title>
				<div class="flex items-center gap-2 mt-1">
					<Badge variant={detailUnmet.length === 0 ? 'default' : 'destructive'} class="text-[10px]">
						{detailRow?.detail?.totalOk}/{detailRow?.detail?.total} terpenuhi
					</Badge>
					{#if detailUnmet.length > 0}
						<span class="text-xs text-destructive">{detailUnmet.length} indikator merah</span>
					{:else}
						<span class="text-xs text-green-600">Semua terpenuhi</span>
					{/if}
				</div>
			</Dialog.Header>
			<div class="max-h-[65vh] overflow-auto px-4 py-3">
				{#if detailIndikator.length === 0}
					<p class="text-sm text-muted-foreground py-4 text-center">Belum ada detail indikator.</p>
				{:else}
					<ul class="space-y-2">
						{#each detailIndikator as ind (ind.no)}
							<li class="flex items-start gap-2 rounded-lg border p-2.5 {ind.ok ? 'border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20' : 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'}">
								{#if ind.ok}
									<CheckCircle class="size-4 mt-0.5 shrink-0 text-green-600" />
								{:else}
									<XCircle class="size-4 mt-0.5 shrink-0 text-red-600" />
								{/if}
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-xs font-medium">{ind.no}. {ind.nama}</span>
										<Badge variant={ind.ok ? 'secondary' : 'destructive'} class="text-[9px]">
											{ind.ok ? 'OK' : 'Belum'}
										</Badge>
									</div>
									{#if ind.keterangan}
										<p class="text-[11px] text-muted-foreground mt-0.5">{ind.keterangan}</p>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={buktiOpen}>
		<Dialog.Content class="max-w-4xl p-0 gap-0">
			<Dialog.Header class="px-4 py-3 border-b">
				<Dialog.Title class="text-sm">Bukti SKAKPT — {buktiNama}</Dialog.Title>
				<a href={buktiUrl} target="_blank" class="text-xs text-primary hover:underline">
					Buka gambar di tab baru
				</a>
			</Dialog.Header>
			<div class="max-h-[75vh] overflow-auto bg-muted/30">
				{#if buktiUrl}
					<img src={buktiUrl} alt="Bukti SKAKPT {buktiNama}" class="w-full max-w-3xl mx-auto" />
				{:else}
					<p class="p-8 text-center text-sm text-muted-foreground">Belum ada bukti</p>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={dokumenOpen}>
		<Dialog.Content class="max-w-5xl p-0 gap-0">
			<Dialog.Header class="px-4 py-3 border-b">
				<Dialog.Title class="text-sm">Dokumen SKAKPT — {dokumenNama}</Dialog.Title>
				<a href={dokumenUrl} target="_blank" class="text-xs text-primary hover:underline">
					Buka dokumen di tab baru
				</a>
			</Dialog.Header>
			<div class="h-[80vh]">
				{#if dokumenUrl}
					<iframe src={dokumenUrl} class="w-full h-full border-0" title="Dokumen SKAKPT {dokumenNama}"></iframe>
				{:else}
					<p class="p-8 text-center text-sm text-muted-foreground">Dokumen tidak ditemukan</p>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<p class="text-sm text-muted-foreground text-center py-8">PTK tidak ditemukan</p>
{/if}
