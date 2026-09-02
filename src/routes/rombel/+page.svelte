<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import PageLayout from '$lib/components/page-layout.svelte';

	let { data } = $props();
	const rombels = $derived((data.rombels as any[]) || []);
	const stats = $derived((data.stats as any) || {});

	// Group rombel per kelas
	const byKelas = $derived({
		'7': rombels.filter((r: any) => r.kelas === 7),
		'8': rombels.filter((r: any) => r.kelas === 8),
		'9': rombels.filter((r: any) => r.kelas === 9),
	} as Record<string, any[]>);

	function kelasLabel(k: number): string {
		return k === 7 ? 'VII' : k === 8 ? 'VIII' : 'IX';
	}
	const totalTerisi = $derived(rombels.reduce((sum: number, r: any) => sum + (r.jml_siswa || 0), 0));
	const totalKapasitas = $derived(rombels.reduce((sum: number, r: any) => sum + (r.kapasitas || 40), 0));
</script>

<PageLayout title="Rombel" description="Manajemen rombongan belajar — alokasi siswa & penugasan wali kelas">
	{#snippet filters()}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Total Rombel</p>
				<p class="text-xl font-bold">{stats.total_rombel ?? rombels.length}</p>
			</div>
			<div class="rounded-lg border border-primary/40 bg-primary/5 p-3">
				<p class="text-xs text-muted-foreground">Siswa Teralokasi</p>
				<p class="text-xl font-bold">{stats.total_siswa_teralokasi ?? totalTerisi}</p>
			</div>
			<div class="rounded-lg border border-amber-500/50 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
				<p class="text-xs text-amber-700 dark:text-amber-300">Tanpa Rombel</p>
				<p class="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.siswa_tanpa_rombel ?? 0}</p>
			</div>
			<div class="rounded-lg border p-3">
				<p class="text-xs text-muted-foreground">Rata-rata Terisi</p>
				<p class="text-xl font-bold">{totalKapasitas > 0 ? Math.round((totalTerisi / totalKapasitas) * 100) : 0}%</p>
			</div>
		</div>
	{/snippet}

	{#each [7, 8, 9] as kelas}
		{@const kelasRombels = byKelas[String(kelas)] || []}
		{@const ks = stats.per_kelas?.[String(kelas)]}
		<section class="mt-1">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-sm font-semibold">Kelas {kelasLabel(kelas)}</h2>
				{#if ks}
					<span class="text-xs text-muted-foreground">
						{ks.teralokasi ?? 0}/{ks.total ?? 0} siswa teralokasi
						{#if ks.tanpa > 0}<span class="text-amber-600 dark:text-amber-400"> · {ks.tanpa} tanpa rombel</span>{/if}
					</span>
				{/if}
			</div>

			{#if kelasRombels.length === 0}
				<Card>
					<CardContent class="p-4">
						<p class="text-xs text-muted-foreground">Belum ada rombel untuk kelas ini.</p>
					</CardContent>
				</Card>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
					{#each kelasRombels as rombel (rombel.id)}
						<a href="/rombel/{rombel.id}" class="rounded-lg border p-3 hover:border-primary hover:bg-primary/5 transition-colors block">
							<div class="flex items-center justify-between mb-1">
								<span class="font-semibold text-sm">{rombel.nama}</span>
								{#if !rombel.aktif}
									<Badge variant="outline" class="text-[9px]">Nonaktif</Badge>
								{/if}
							</div>
							<p class="text-2xl font-bold">{rombel.jml_siswa}</p>
							<p class="text-[11px] text-muted-foreground truncate">
								{rombel.wali_nama || 'Belum ada wali'}
							</p>
							<div class="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
								<div
									class="h-full rounded-full bg-primary transition-all {rombel.jml_siswa >= rombel.kapasitas ? 'bg-amber-500' : ''}"
									style="width: {rombel.kapasitas > 0 ? Math.min(100, rombel.jml_siswa / rombel.kapasitas * 100) : 0}%"
								></div>
							</div>
							<p class="text-[10px] text-muted-foreground mt-0.5">{rombel.jml_siswa}/{rombel.kapasitas || 40} siswa</p>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</PageLayout>