<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	let { data } = $props();
	const p = $derived(data.p as any);
	const jtm = $derived(p.jtm || {});
	const totalJtm = $derived((jtm.mengajar || 0) + (jtm.tugas || 0));
</script>

<svelte:head><title>{p.nama} — MTsN App</title></svelte:head>

<a href="/ptk" class="text-sm text-muted-foreground hover:underline mb-2 inline-block">&larr; Kembali</a>

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
	<!-- Identitas -->
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

	<!-- JTM -->
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
						{/if}
					</TableBody>
				</Table>
			{:else}
				<p class="text-xs text-muted-foreground">Belum ada data JTM.</p>
			{/if}
		</CardContent>
	</Card>

	<!-- SKMT -->
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

	<!-- SKBK -->
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

	<!-- SKAKPT -->
<Card>
	<CardHeader class="pb-2"><CardTitle class="text-sm">Riwayat SKAKPT</CardTitle></CardHeader>
	<CardContent>
		{#if !p.skakpt || p.skakpt.length === 0}
			<p class="text-xs text-muted-foreground">Belum ada ajuan SKAKPT.</p>
		{:else}
			<Table>
				<TableHeader>
					<TableRow><TableHead class="text-xs">Periode</TableHead><TableHead class="text-xs">Bulan</TableHead><TableHead class="text-xs">Status</TableHead><TableHead class="text-xs hideOnMobile">Aksi</TableHead></TableRow>
				</TableHeader>
				<TableBody>
					{#each p.skakpt as s}
						<TableRow>
							<TableCell class="text-xs">{s.periode || '—'}</TableCell>
							<TableCell class="text-xs">{s.bulan || '—'}</TableCell>
							<TableCell>
								<Badge variant={s.status === 'Disetujui' ? 'default' : 'secondary'} class="text-[10px] {s.status === 'Disetujui' ? 'bg-green-600 text-white hover:bg-green-600' : ''}">
									{s.status}
								</Badge>
							</TableCell>
							<TableCell class="text-xs">
								{#if s.status === 'Disetujui'}
									{@const nama = p.nama.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}
									{@const pdfUrl = `/uploads/skakpt/SKAKPT_${nama}_Juli2026.pdf`}
									<PdfViewer src={pdfUrl} title="SKAKPT {p.nama} — Juli 2026" />
								{/if}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</CardContent>
</Card>

<!-- Dokumen -->
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

	<!-- Roster -->
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
