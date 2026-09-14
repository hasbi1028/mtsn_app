<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import PrinterIcon from '@lucide/svelte/icons/printer';
	import InfoIcon from '@lucide/svelte/icons/info';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import XCircleIcon from '@lucide/svelte/icons/circle-x';
	import { getSiswaDetailQ, getSiswaBansosQ } from '$modules/siswa/siswa.remote';

	let { params } = $props();
	const [siswa, bansosRaw] = $derived(await Promise.all([
		getSiswaDetailQ({ id: params.id }),
		getSiswaBansosQ({ id: params.id })
	]));
	const bi = $derived(bansosRaw?.bansosInterpretasi);

	function desilColor(d: string | null | undefined): string {
		if (!d || d === 'TIDAK DITEMUKAN') return 'bg-gray-100 text-gray-700';
		const n = parseInt(d);
		if (n >= 1 && n <= 4) return 'bg-green-100 text-green-700';
		if (n === 5) return 'bg-yellow-100 text-yellow-700';
		return 'bg-red-100 text-red-700';
	}
</script>

<svelte:head>
	<title>Bansos — SIMAD</title>
</svelte:head>

<div class="mx-auto max-w-xl space-y-4 p-4">
	<div class="flex items-center gap-2">
		{#if siswa}
			<a href={`/admin/siswa/${siswa.publicId}/profil`}>
				<Button variant="ghost" size="sm" class="h-8 px-2">
					<ArrowLeft class="size-4" />
					Profil
				</Button>
			</a>
		{:else}
			<Button variant="ghost" size="sm" class="h-8 px-2" disabled>
				<ArrowLeft class="size-4" />
				Profil
			</Button>
		{/if}
		<h1 class="text-lg font-bold">Cek Bansos</h1>
	</div>

	{#if bansosRaw && siswa}
		<a href={`/admin/siswa/${siswa.publicId}/bansos/cetak`} target="_blank">
			<Button variant="outline" size="sm" class="w-full">
				<PrinterIcon class="size-4 mr-2" />
				Cetak PDF
			</Button>
		</a>

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<div class="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
						{siswa?.nama?.charAt(0) ?? '?'}
					</div>
					{siswa?.nama}
				</Card.Title>
				<Card.Description>
					NISN: {siswa?.nisn ?? '—'} · Kelas {siswa?.kelas} {siswa?.rombel ?? ''}
				</Card.Description>
			</Card.Header>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					{#if !bi?.desil}
						<XCircleIcon class="size-5 text-red-500" />
					{:else}
						<CheckCircleIcon class="size-5 text-green-500" />
					{/if}
					Data Bansos DTSEN
				</Card.Title>
				<Card.Description>Triwulan 3 2026</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Desil</span>
					<Badge class={desilColor(bi?.desil)}>
						{bi?.desil ?? '—'}
					</Badge>
				</div>

				<Separator />

				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Sembako</span>
					<Badge variant={bi?.sembako ? 'default' : 'outline'}>
						{bi?.sembako ? 'YA' : 'TIDAK'}
					</Badge>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">PKH</span>
					<Badge variant={bi?.pkh ? 'default' : 'outline'}>
						{bi?.pkh ? 'YA' : 'TIDAK'}
					</Badge>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">PBI-JK</span>
					<Badge variant={bi?.pbijk ? 'default' : 'outline'}>
						{bi?.pbijk ? 'YA' : 'TIDAK'}
					</Badge>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">KPD</span>
					<Badge variant={bi?.kpd === 'YA' ? 'default' : 'outline'}>
						{bi?.kpd ?? '—'}
					</Badge>
				</div>

				<Separator />

				<div class="space-y-2 rounded-lg bg-muted/50 p-3">
					<p class="flex items-center gap-1 text-xs font-medium">
						<InfoIcon class="size-3.5" />
						Interpretasi
					</p>

					{#if bi?.pkh}
						<p class="text-xs text-green-600">✓ Layak PKH/Sembako (desil {bi?.desil})</p>
					{:else}
						<p class="text-xs text-muted-foreground">✗ Tidak layak PKH/Sembako</p>
					{/if}

					{#if bi?.pbijk}
						<p class="text-xs text-green-600">✓ Layak PBI-JK (desil {bi?.desil})</p>
					{:else}
						<p class="text-xs text-muted-foreground">✗ Tidak layak PBI-JK</p>
					{/if}
				</div>

				{#if !bi?.desil}
					<div class="rounded-lg bg-red-50 p-3">
						<p class="text-xs text-red-600">Data tidak ditemukan di DTSEN — verifikasi data KTP/KK siswa.</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Content class="py-8 text-center text-muted-foreground">
				Data bansos tidak tersedia
			</Card.Content>
		</Card.Root>
	{/if}
</div>
