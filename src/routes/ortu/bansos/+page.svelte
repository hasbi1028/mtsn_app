<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import BellIcon from '@lucide/svelte/icons/bell-ring';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import XCircleIcon from '@lucide/svelte/icons/circle-x';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import PrinterIcon from '@lucide/svelte/icons/printer';

	let { data } = $props();
	const siswa = $derived(data.siswa as any);
	const ortu = $derived(data.ortu as any);

	function desilBadgeClass(desil: string | null): string {
		if (!desil || desil === '' || desil === 'TIDAK DITEMUKAN' || desil === 'BELUM ADA DESIL') {
			return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
		}
		const num = parseInt(desil);
		if (num >= 1 && num <= 4) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
		if (num === 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
		if (num >= 6 && num <= 10) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
		return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
	}

	const isLayakPkh = $derived(
		siswa?.bansos_pkh && siswa.bansos_pkh !== 'TIDAK' && siswa.bansos_pkh !== ''
	);
	const isLayakSembako = $derived(
		siswa?.bansos_sembako && siswa.bansos_sembako !== 'TIDAK' && siswa.bansos_sembako !== ''
	);
	const isLayakPbijk = $derived(
		siswa?.bansos_pbijk && siswa.bansos_pbijk !== 'TIDAK' && siswa.bansos_pbijk !== ''
	);

	const cekDate = $derived(siswa?.bansos_cek_at ? new Date(siswa.bansos_cek_at) : null);
	const isTenggang90 = $derived(() => {
		if (!cekDate) return false;
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - cekDate.getTime()) / (1000 * 60 * 60 * 24));
		return diffDays > 90;
	});

	const desilLabel = $derived(() => {
		const d = siswa?.bansos_desil;
		if (!d || d === '') return 'Belum Dicek';
		if (d === 'TIDAK DITEMUKAN') return 'Tidak Ditemukan di DTSEN';
		if (d === 'BELUM ADA DESIL') return 'Belum Ada Desil';
		return `Desil ${d}`;
	});
</script>

<svelte:head><title>Cek Bansos — SIMAD</title></svelte:head>

<div class="flex flex-col gap-4">
	<!-- Header Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<BellIcon class="size-5" />
				Cek Bansos
			</Card.Title>
			<Card.Description>Informasi Bantuan Sosial Anak</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if siswa}
				<div class="mb-3">
					<a
						href="/ortu/bansos/cetak"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
					>
						<PrinterIcon class="size-3.5" />
						Cetak PDF
					</a>
				</div>
			{/if}

			{#if ortu}
				<!-- Ortu Info -->
				<div class="flex items-center gap-3 mb-4">
					<div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
						<UsersRoundIcon class="size-5" />
					</div>
					<div>
						<p class="font-medium text-sm">{ortu.nama}</p>
						<p class="text-xs text-muted-foreground">Orang Tua/Wali</p>
					</div>
				</div>
			{/if}

			{#if siswa}
				<!-- Siswa Info -->
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
							{siswa.nama?.charAt(0) ?? '?'}
						</div>
						<div>
							<p class="font-medium text-sm">{siswa.nama}</p>
							<p class="text-xs text-muted-foreground">
								NISN: {siswa.nisn || '—'} · Kelas: {siswa.kelas || '—'}
							</p>
						</div>
					</div>

					<!-- NIK -->
					<div class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
						<span class="text-xs text-muted-foreground">NIK</span>
						<span class="text-sm font-mono">{siswa.nik || '—'}</span>
					</div>

					<!-- Desil Badge -->
					<div class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
						<span class="text-xs text-muted-foreground">Desil</span>
						<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {desilBadgeClass(siswa.bansos_desil)}">
							{desilLabel()}
						</span>
					</div>

					{#if siswa.bansos_cek_at}
						<div class="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
							<span class="text-xs text-muted-foreground">Terakhir Dicek</span>
							<span class="text-xs">{new Date(siswa.bansos_cek_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3 py-6">
					<InfoIcon class="size-12 text-muted-foreground" />
					<p class="text-sm text-muted-foreground text-center">
						Data anak tidak ditemukan.<br/>
						{#if ortu}
							Silakan hubungi admin untuk menghubungkan akun ortu dengan data siswa.
						{/if}
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if siswa}
		<!-- Interpretasi Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-sm">
					<ShieldCheckIcon class="size-4" />
					Interpretasi Status Bansos
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<!-- PKH -->
				<div class="flex items-center justify-between rounded-lg border px-3 py-2">
					<div class="flex items-center gap-2">
						{#if isLayakPkh}
							<CheckCircleIcon class="size-4 text-green-600" />
						{:else}
							<XCircleIcon class="size-4 text-gray-400" />
						{/if}
						<span class="text-sm">Layak PKH</span>
					</div>
					{#if isLayakPkh}
						<Badge variant="default" class="text-[10px] px-1.5 py-0 bg-green-600">YA</Badge>
					{:else}
						<Badge variant="outline" class="text-[10px] px-1.5 py-0">TIDAK</Badge>
					{/if}
				</div>

				<!-- Sembako -->
				<div class="flex items-center justify-between rounded-lg border px-3 py-2">
					<div class="flex items-center gap-2">
						{#if isLayakSembako}
							<CheckCircleIcon class="size-4 text-green-600" />
						{:else}
							<XCircleIcon class="size-4 text-gray-400" />
						{/if}
						<span class="text-sm">Layak Sembako</span>
					</div>
					{#if isLayakSembako}
						<Badge variant="default" class="text-[10px] px-1.5 py-0 bg-green-600">YA</Badge>
					{:else}
						<Badge variant="outline" class="text-[10px] px-1.5 py-0">TIDAK</Badge>
					{/if}
				</div>

				<!-- PBI-JK -->
				<div class="flex items-center justify-between rounded-lg border px-3 py-2">
					<div class="flex items-center gap-2">
						{#if isLayakPbijk}
							<CheckCircleIcon class="size-4 text-blue-600" />
						{:else}
							<XCircleIcon class="size-4 text-gray-400" />
						{/if}
						<span class="text-sm">Layak PBI-JK</span>
					</div>
					{#if isLayakPbijk}
						<Badge variant="default" class="text-[10px] px-1.5 py-0 bg-blue-600">YA</Badge>
					{:else}
						<Badge variant="outline" class="text-[10px] px-1.5 py-0">TIDAK</Badge>
					{/if}
				</div>

				<!-- KPD -->
				<div class="flex items-center justify-between rounded-lg border px-3 py-2">
					<div class="flex items-center gap-2">
						{#if siswa.bansos_kpd && siswa.bansos_kpd !== 'TIDAK' && siswa.bansos_kpd !== ''}
							<CheckCircleIcon class="size-4 text-purple-600" />
						{:else}
							<XCircleIcon class="size-4 text-gray-400" />
						{/if}
						<span class="text-sm">Layak KPD</span>
					</div>
					{#if siswa.bansos_kpd && siswa.bansos_kpd !== 'TIDAK' && siswa.bansos_kpd !== ''}
						<Badge variant="default" class="text-[10px] px-1.5 py-0 bg-purple-600">YA</Badge>
					{:else}
						<Badge variant="outline" class="text-[10px] px-1.5 py-0">TIDAK</Badge>
					{/if}
				</div>

				<!-- Tenggang 90 hari warning -->
				{#if isTenggang90()}
					<Alert.Root variant="destructive">
						<AlertTriangleIcon class="size-4" />
						<Alert.Title>Peringatan</Alert.Title>
						<Alert.Description class="text-xs">
							Data bansos sudah lebih dari 90 hari belum diperiksa. Silakan update data terbaru.
						</Alert.Description>
					</Alert.Root>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Info Detail -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-sm">
					<InfoIcon class="size-4" />
					Detail Data Bansos
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Desil</span>
						<span class="font-medium">{siswa.bansos_desil || '—'}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Sembako</span>
						<span class="font-medium">{siswa.bansos_sembako || '—'}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">PKH</span>
						<span class="font-medium">{siswa.bansos_pkh || '—'}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">PBI-JK</span>
						<span class="font-medium">{siswa.bansos_pbijk || '—'}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">KPD</span>
						<span class="font-medium">{siswa.bansos_kpd || '—'}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
