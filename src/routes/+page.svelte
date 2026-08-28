<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Users from '@lucide/svelte/icons/users';
	import FileText from '@lucide/svelte/icons/file-text';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Activity from '@lucide/svelte/icons/activity';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	let { data } = $props();
	const s = $derived(data.stats as Record<string, number>);
	const bansos = $derived(data.bansosStats as any);

	const cards: { label: string; key: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
		{ label: 'Total PTK', key: 'totalPtk', variant: 'default' },
		{ label: 'Guru', key: 'guru', variant: 'secondary' },
		{ label: 'Sertifikasi', key: 'sertifikasi', variant: 'default' },
		{ label: 'Belum Sertifikasi', key: 'belumSertifikasi', variant: 'outline' },
		{ label: 'JTM < 24 jam', key: 'jtmDiBawah24', variant: 'destructive' },
		{ label: 'SKMT Disetujui', key: 'skmtDisetujui', variant: 'default' },
		{ label: 'SKMT Menunggu', key: 'skmtMenunggu', variant: 'secondary' },
		{ label: 'SKBK Disetujui', key: 'skbkDisetujui', variant: 'default' },
		{ label: 'SKBK Menunggu', key: 'skbkMenunggu', variant: 'secondary' },
		{ label: 'SKAKPT Diajukan', key: 'skakptDiajukan', variant: 'default' },
		{ label: 'SKAKPT Menunggu', key: 'skakptMenunggu', variant: 'secondary' },
		{ label: 'Dokumen PDF', key: 'totalDokumen', variant: 'outline' },
	];

	const desilOrder = ['1', '2', '3', '4', '5', '6-10', 'Belum Dicek', 'Tidak Ditemukan'];
</script>

<svelte:head><title>Dashboard — MTsN App</title></svelte:head>

<h1 class="text-lg font-semibold mb-4">Dashboard</h1>

<!-- Stats Cards - PTK -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
	{#each cards as c}
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{s[c.key] ?? 0}</div>
			</CardContent>
		</Card>
	{/each}
</div>

<!-- Bansos Stats -->
<div class="mb-6">
	<h2 class="text-sm font-semibold mb-3 flex items-center gap-2">
		<BellRing class="size-4" />
		Statistik Bansos Siswa
	</h2>

	<!-- Summary Cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-xs font-medium text-muted-foreground">Total Siswa</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{bansos.totalSiswa}</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-xs font-medium text-muted-foreground">Sudah Cek Bansos</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-green-600">{bansos.sudahCek}</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-xs font-medium text-muted-foreground">Belum Cek Bansos</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-amber-600">{bansos.belumCek}</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-xs font-medium text-muted-foreground">Tenggang >90 Hari</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-red-600">{bansos.tenggang90}</div>
			</CardContent>
		</Card>
	</div>

	<!-- Layak Counts -->
	<div class="grid grid-cols-3 gap-3 mb-4">
		<Card>
			<CardContent class="p-3 text-center">
				<ShieldCheck class="mx-auto mb-1 size-6 text-green-600" />
				<div class="text-lg font-bold">{bansos.layakPkh}</div>
				<div class="text-xs text-muted-foreground">Layak PKH</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-3 text-center">
				<ShieldCheck class="mx-auto mb-1 size-6 text-green-600" />
				<div class="text-lg font-bold">{bansos.layakSembako}</div>
				<div class="text-xs text-muted-foreground">Layak Sembako</div>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="p-3 text-center">
				<ShieldCheck class="mx-auto mb-1 size-6 text-blue-600" />
				<div class="text-lg font-bold">{bansos.layakPbijk}</div>
				<div class="text-xs text-muted-foreground">Layak PBI-JK</div>
			</CardContent>
		</Card>
	</div>

	<!-- Desil Distribution -->
	<Card class="mb-4">
		<CardHeader class="pb-2">
			<CardTitle class="text-sm">Distribusi Desil</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-2">
				{#each desilOrder as d}
					{#if bansos.desilDist[d]}
						<div class="flex items-center gap-2">
							<span class="text-xs w-24 text-muted-foreground truncate">{d}</span>
							<div class="flex-1 h-4 bg-muted rounded overflow-hidden">
								<div
									class="h-full rounded transition-all
										{['1','2','3','4'].includes(d) ? 'bg-green-500' :
										 d === '5' ? 'bg-yellow-500' :
										 ['6-10'].includes(d) ? 'bg-red-500' :
										 'bg-gray-400'}"
									style="width: {bansos.totalSiswa > 0 ? (bansos.desilDist[d] / bansos.totalSiswa * 100) : 0}%"
								></div>
							</div>
							<span class="text-xs font-medium w-8 text-right">{bansos.desilDist[d]}</span>
						</div>
					{/if}
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Kelas Breakdown -->
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm">Breakdown per Kelas</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-3 gap-2">
				{#each Object.entries(bansos.kelasDist) as [kelas, count]}
					<div class="rounded-lg border p-2 text-center">
						<p class="text-xs text-muted-foreground">Kelas {kelas}</p>
						<p class="text-lg font-bold">{count}</p>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Info -->
<p class="text-xs text-muted-foreground mb-4">
	Periode aktif: <strong>TA 2026/2027 Ganjil</strong>. Data dari EMIS GTK + SK Pembagian Tugas + Roster Pelajaran.
</p>

<!-- Quick Links -->
<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
	<a href="/ptk" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<Users class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">Data PTK</div>
				<div class="text-xs text-muted-foreground">{s.totalPtk ?? 0} guru</div>
			</CardContent>
		</Card>
	</a>
	<a href="/siswa" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<GraduationCap class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">Data Siswa</div>
				<div class="text-xs text-muted-foreground">{bansos.totalSiswa} siswa</div>
			</CardContent>
		</Card>
	</a>
	<a href="/skmt" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<FileText class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">SKMT</div>
				<div class="text-xs text-muted-foreground">{s.skmtDisetujui ?? 0} disetujui</div>
			</CardContent>
		</Card>
	</a>
	<a href="/skbk" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<ClipboardList class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">SKBK</div>
				<div class="text-xs text-muted-foreground">{s.skbkDisetujui ?? 0} disetujui</div>
			</CardContent>
		</Card>
	</a>
	<a href="/skakpt" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<FileCheck class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">SKAKPT</div>
				<div class="text-xs text-muted-foreground">{s.skakptDiajukan ?? 0} diajukan</div>
			</CardContent>
		</Card>
	</a>
	<a href="/roster" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<CalendarDays class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">Roster</div>
				<div class="text-xs text-muted-foreground">12 kelas</div>
			</CardContent>
		</Card>
	</a>
	<a href="/activity" class="block">
		<Card class="hover:border-primary transition-colors cursor-pointer">
			<CardContent class="p-4 text-center">
				<Activity class="mx-auto mb-1 size-8 text-muted-foreground" />
				<div class="text-sm font-medium">Aktivitas</div>
				<div class="text-xs text-muted-foreground">Riwayat</div>
			</CardContent>
		</Card>
	</a>
</div>
