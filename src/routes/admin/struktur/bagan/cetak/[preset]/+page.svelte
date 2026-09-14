<script lang="ts">
	/**
	 * Halaman cetak bagan struktur — juga dipakai sebagai sumber PNG server-side
	 * (Playwright membuka URL ini dengan ?bare=1 lalu memotret elemen .struktur-page).
	 *
	 * Preset menentukan ukuran @page; kanvas bagan SELALU 2000×1000 px (2:1) supaya
	 * rasio spanduk tidak melar. Untuk kertas yang lebih kecil dari kanvas, penyusutan
	 * hanya dilakukan saat mencetak (transform di @media print) — sehingga DOM 1:1
	 * tetap utuh untuk kebutuhan screenshot.
	 */
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import Bagan from '$modules/struktur/components/bagan.svelte';
	import { getRekapStrukturQ } from '$modules/struktur/struktur.remote';

	let { params } = $props();

	const PRESETS: Record<string, { label: string; mmW: number; mmH: number }> = {
		'spanduk-2x1': { label: 'Spanduk 2:1 (500×264 mm)', mmW: 529.17, mmH: 264.58 },
		a2: { label: 'A2 landscape', mmW: 594, mmH: 420 },
		a3: { label: 'A3 landscape', mmW: 420, mmH: 297 },
		a4: { label: 'A4 landscape', mmW: 297, mmH: 210 }
	};

	const presetKode = $derived(PRESETS[String(params.preset)] ? String(params.preset) : 'spanduk-2x1');
	const preset = $derived(PRESETS[presetKode]);
	const nip = $derived(page.url.searchParams.get('nip') === '1');
	const bare = $derived(page.url.searchParams.get('bare') === '1');

	/** Kanvas 2000px @96dpi = 529,17 mm; susutkan bila kertas lebih sempit. */
	const fit = $derived(Math.min(1, preset.mmW / 529.17).toFixed(4));

	const bagan = $derived(await getRekapStrukturQ());
	const data = $derived((bagan ?? {}) as any);
	const pengaturan = $derived((data.pengaturan ?? {}) as any);
	const kolom = $derived((data.kolom ?? []) as any[]);
	const kolomTerisi = $derived(kolom.filter((k: any) => (k.kotak ?? []).length > 0).length);
</script>

<svelte:head>
	<title>Cetak Bagan Struktur — {preset.label}</title>
	{@html `<style>@media print { @page { size: ${preset.mmW}mm ${preset.mmH}mm; margin: 0; } }</style>`}
</svelte:head>

{#if !bare}
	<div class="no-print sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-white px-3 py-2">
		<a href={resolve('/admin/struktur/bagan')} class="inline-flex">
			<Button size="sm" variant="outline" class="h-8 cursor-pointer">Kembali</Button>
		</a>
		<Button size="sm" class="h-8 cursor-pointer" onclick={() => window.print()}>Cetak / Simpan PDF</Button>
		<span class="text-xs text-muted-foreground">
			{preset.label} · {kolomTerisi} kolom · kanvas 2000×1000 px{nip ? ' · dengan NIP' : ' · tanpa NIP'}
		</span>
	</div>
{/if}

<!-- Kanvas bagan (penyusutan hanya berlaku saat mencetak) -->
<div class="cetak-wrap" style="--fit:{fit}">
	<div class="cetak-page">
		<Bagan
			{kolom}
			judul={pengaturan.judul}
			tahun={pengaturan.tahun}
			kop={pengaturan.kop}
			badge={data.badge}
			mode="cetak"
			publik={!nip}
			catatanKaki={pengaturan.catatanKaki || ''}
			tempatTgl={pengaturan.tempatTgl || ''}
			ttdNama={pengaturan.kamadNama || ''}
			ttdNip={pengaturan.kamadNip || ''}
		/>
	</div>
</div>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		background: #e9e9e9;
	}

	.cetak-page {
		width: 2000px;
		height: 1000px;
		background: #fdfcf7;
	}

	.cetak-wrap {
		width: 2000px;
		height: 1000px;
		margin: 0 auto;
	}

	@media print {
		:global(body) {
			background: #fff;
		}

		:global(.no-print),
		.no-print {
			display: none !important;
		}

		.cetak-wrap {
			transform: scale(var(--fit, 1));
			transform-origin: top left;
		}
	}
</style>
