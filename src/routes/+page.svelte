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
	import UsersRound from '@lucide/svelte/icons/users-round';

	let { data } = $props();
	const s = $derived(data.stats as Record<string, number>);
	const bansos = $derived(data.bansosStats as any);
	const rombelStats = $derived(data.rombelStats as any);

	const attentionCards = $derived([
		{
			label: 'JTM di bawah 24 jam',
			value: s.jtmDiBawah24 ?? 0,
			tone: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
		},
		{
			label: 'SKMT menunggu',
			value: s.skmtMenunggu ?? 0,
			tone: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
		},
		{
			label: 'Bansos belum dicek',
			value: bansos.belumCek ?? 0,
			tone: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300'
		}
	]);

	const documentCards = $derived([
		{ label: 'SKMT disetujui', value: s.skmtDisetujui ?? 0, icon: FileText },
		{ label: 'SKBK disetujui', value: s.skbkDisetujui ?? 0, icon: ClipboardList },
		{ label: 'SKAKPT diajukan', value: s.skakptDiajukan ?? 0, icon: FileCheck },
		{ label: 'Dokumen PDF', value: s.totalDokumen ?? 0, icon: FileText }
	]);

	const peopleCards = $derived([
		{ label: 'Total PTK', value: s.totalPtk ?? 0, helper: `${s.guru ?? 0} guru` },
		{ label: 'Sertifikasi', value: s.sertifikasi ?? 0, helper: `${s.belumSertifikasi ?? 0} belum sertifikasi` },
		{ label: 'Total Siswa', value: bansos.totalSiswa ?? 0, helper: `${bansos.sudahCek ?? 0} sudah cek bansos` },
		{ label: 'Tenggang >90 hari', value: bansos.tenggang90 ?? 0, helper: 'Perlu pembaruan data' }
	]);

	const desilOrder = ['1', '2', '3', '4', '5', '6-10', 'Belum Dicek', 'Tidak Ditemukan'];
	const quickLinks = $derived([
		{ href: '/ptk', label: 'Data PTK', helper: `${s.totalPtk ?? 0} guru`, icon: Users },
		{ href: '/siswa', label: 'Data Siswa', helper: `${bansos.totalSiswa ?? 0} siswa`, icon: GraduationCap },
		{ href: '/skmt', label: 'SKMT', helper: `${s.skmtDisetujui ?? 0} disetujui`, icon: FileText },
		{ href: '/skbk', label: 'SKBK', helper: `${s.skbkDisetujui ?? 0} disetujui`, icon: ClipboardList },
		{ href: '/skakpt', label: 'SKAKPT', helper: `${s.skakptDiajukan ?? 0} diajukan`, icon: FileCheck },
		{ href: '/roster', label: 'Roster', helper: '12 kelas', icon: CalendarDays },
		{ href: '/bel', label: 'Bel Sekolah', helper: 'Jadwal & suara', icon: BellRing },
		{ href: '/activity', label: 'Aktivitas', helper: 'Riwayat sistem', icon: Activity }
	]);
</script>

<svelte:head><title>Dashboard — MTsN App</title></svelte:head>

<div class="space-y-5">
	<section class="rounded-xl border bg-card p-4 shadow-sm">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="space-y-2">
				<Badge variant="secondary" class="w-fit">TA 2026/2027 Ganjil</Badge>
				<div>
					<h1 class="text-2xl font-semibold tracking-tight">Dashboard SIMAD</h1>
					<p class="text-sm text-muted-foreground">Ringkasan operasional MTsN 2 Kolaka Utara dari EMIS GTK, SK Pembagian Tugas, roster, dan data bansos.</p>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-2 md:min-w-80">
				{#each attentionCards as item (item.label)}
					<div class="rounded-lg border p-3 {item.tone}">
						<p class="text-[11px] font-medium leading-tight">{item.label}</p>
						<p class="mt-1 text-2xl font-bold">{item.value}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="grid gap-3 md:grid-cols-4">
		{#each peopleCards as item (item.label)}
			<Card>
				<CardHeader class="pb-1">
					<CardTitle class="text-xs font-medium text-muted-foreground">{item.label}</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{item.value}</div>
					<p class="text-xs text-muted-foreground">{item.helper}</p>
				</CardContent>
			</Card>
		{/each}
	</section>

	<section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-sm">
					<FileCheck class="size-4 text-primary" />
					Progres Dokumen
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 gap-2">
					{#each documentCards as item (item.label)}
						<div class="rounded-lg border bg-muted/20 p-3">
							<div class="mb-2 flex items-center justify-between">
								<item.icon class="size-4 text-primary" />
								<span class="text-xl font-bold">{item.value}</span>
							</div>
							<p class="text-xs text-muted-foreground">{item.label}</p>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-sm">
					<ShieldCheck class="size-4 text-primary" />
					Kelayakan Bansos
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border p-3">
						<div class="text-xl font-bold text-green-700 dark:text-green-300">{bansos.layakPkh}</div>
						<div class="text-xs text-muted-foreground">PKH</div>
					</div>
					<div class="rounded-lg border p-3">
						<div class="text-xl font-bold text-green-700 dark:text-green-300">{bansos.layakSembako}</div>
						<div class="text-xs text-muted-foreground">Sembako</div>
					</div>
					<div class="rounded-lg border p-3">
						<div class="text-xl font-bold text-sky-700 dark:text-sky-300">{bansos.layakPbijk}</div>
						<div class="text-xs text-muted-foreground">PBI-JK</div>
					</div>
				</div>
				{#if bansos.tenggang90 > 0}
					<div class="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
						<AlertTriangle class="mt-0.5 size-4 shrink-0" />
						<span>{bansos.tenggang90} data bansos melewati tenggang 90 hari.</span>
					</div>
				{/if}
			</CardContent>
		</Card>
	</section>

	<section class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm">Distribusi Desil</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					{#each desilOrder as d}
						{#if bansos.desilDist[d]}
							<div class="flex items-center gap-2">
								<span class="w-24 truncate text-xs text-muted-foreground">{d}</span>
								<div class="h-4 flex-1 overflow-hidden rounded bg-muted">
									<div
										class="h-full rounded transition-all {['1','2','3','4'].includes(d) ? 'bg-green-500' : d === '5' ? 'bg-yellow-500' : ['6-10'].includes(d) ? 'bg-red-500' : 'bg-gray-400'}"
										style="width: {bansos.totalSiswa > 0 ? (bansos.desilDist[d] / bansos.totalSiswa * 100) : 0}%"
									></div>
								</div>
								<span class="w-8 text-right text-xs font-medium">{bansos.desilDist[d]}</span>
							</div>
						{/if}
					{/each}
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm">Akses Cepat</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#each quickLinks as item (item.href)}
						<a href={item.href} class="rounded-lg border p-3 transition-colors hover:border-primary hover:bg-primary/5">
							<item.icon class="mb-2 size-5 text-primary" />
							<div class="text-sm font-medium">{item.label}</div>
							<div class="text-xs text-muted-foreground">{item.helper}</div>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	</section>

	<!-- Alokasi Rombel -->
	<section>
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="flex items-center gap-2 text-sm">
					<UsersRound class="size-4 text-primary" />
					Alokasi Rombel
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 gap-2 mb-3 md:grid-cols-4">
					<div class="rounded-lg border p-3">
						<p class="text-xs text-muted-foreground">Total Rombel</p>
						<p class="text-xl font-bold">{rombelStats.totalRombel}</p>
					</div>
					<div class="rounded-lg border p-3">
						<p class="text-xs text-muted-foreground">Siswa Teralokasi</p>
						<p class="text-xl font-bold">{rombelStats.teralokasi}</p>
					</div>
					<div class="rounded-lg border border-amber-500/50 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
						<p class="text-xs text-amber-700 dark:text-amber-300">Tanpa Rombel</p>
						<p class="text-xl font-bold text-amber-700 dark:text-amber-300">{rombelStats.tanpa}</p>
					</div>
					<div class="rounded-lg border p-3">
						<p class="text-xs text-muted-foreground">Progress</p>
						<p class="text-xl font-bold">
							{rombelStats.totalSiswa > 0 ? Math.round((rombelStats.teralokasi / rombelStats.totalSiswa) * 100) : 0}%
						</p>
					</div>
				</div>

				<!-- Progress per kelas -->
				<div class="space-y-1.5">
					{#each [7, 8, 9] as kelas}
						{@const ks = rombelStats.perKelas[String(kelas)]}
						{#if ks}
							<div class="flex items-center gap-2">
								<span class="w-14 shrink-0 text-xs">{kelas === 7 ? 'VII' : kelas === 8 ? 'VIII' : 'IX'}</span>
								<div class="h-3 flex-1 overflow-hidden rounded bg-muted">
									<div
										class="h-full rounded transition-all {ks.tanpa > 0 ? 'bg-amber-500' : 'bg-green-500'}"
										style="width: {ks.total > 0 ? ks.teralokasi / ks.total * 100 : 0}%"
									></div>
								</div>
								<span class="w-16 text-right text-xs text-muted-foreground">{ks.teralokasi}/{ks.total}{#if ks.tanpa > 0} ({ks.tanpa}){/if}</span>
							</div>
						{/if}
					{/each}
				</div>

				{#if rombelStats.tanpa > 0}
					<div class="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
						<AlertTriangle class="mt-0.5 size-4 shrink-0" />
						<span>{rombelStats.tanpa} siswa belum dialokasikan ke rombel. <a href="/rombel" class="underline">Kelola rombel</a></span>
					</div>
				{/if}
			</CardContent>
		</Card>
	</section>
</div>
