<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Users from '@lucide/svelte/icons/users';
	import FileText from '@lucide/svelte/icons/file-text';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import FileCheck from '@lucide/svelte/icons/file-check';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Activity from '@lucide/svelte/icons/activity';
	let { data } = $props();
	const s = $derived(data.stats as Record<string, number>);
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
</script>

<svelte:head><title>Dashboard — MTsN App</title></svelte:head>

<h1 class="text-lg font-semibold mb-4">Dashboard</h1>

<!-- Stats Cards -->
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
