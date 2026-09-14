<script lang="ts">
	import Bagan from '$modules/struktur/components/bagan.svelte';
	import { getBaganPublikQ } from '$modules/struktur/struktur.remote';

	const bagan = $derived(await getBaganPublikQ());
	const data = $derived((bagan ?? {}) as any);
	const pengaturan = $derived((data.pengaturan ?? {}) as any);
	const kolom = $derived((data.kolom ?? []) as any[]);
	const nonaktif = $derived(data.nonaktif === true);

	/** Lebar wrapper → hitung skala supaya kanvas 2000 px muat di viewport. */
	let wrapperWidth = $state(1100);
	const scale = $derived(Math.min(1, wrapperWidth / 2000));
</script>

<svelte:head>
	<title>Struktur Organisasi — MTsN 2 Kolaka Utara</title>
	<meta
		name="description"
		content="Struktur organisasi dan susunan pegawai MTsN 2 Kolaka Utara."
	/>
</svelte:head>

<div class="min-h-screen">
	{#if nonaktif}
		<div class="mx-auto max-w-6xl px-4 py-8">
			<p class="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
				Bagan struktur organisasi belum ditayangkan. Silakan hubungi admin madrasah.
			</p>
		</div>
	{:else if kolom.length === 0}
		<div class="mx-auto max-w-6xl px-4 py-8">
			<p class="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
				Data struktur organisasi belum diisi.
			</p>
		</div>
	{:else}
		<!-- Kanvas banner 2000×1000 di-scale ke lebar viewport -->
		<div
			bind:clientWidth={wrapperWidth}
			class="bagan-wrap"
			style="height:{Math.round(1000 * scale)}px"
		>
			<div
				class="bagan-inner"
				style="width:2000px; transform:scale({scale}); transform-origin:top left;"
			>
				<Bagan
					{kolom}
					judul={pengaturan.judul}
					tahun={pengaturan.tahun}
					sk={pengaturan.sk}
					kop={pengaturan.kop}
					badge={data.badge}
					mode="cetak"
					publik={true}
					catatanKaki={pengaturan.catatanKaki || ''}
					tempatTgl={pengaturan.tempatTgl || ''}
					ttdNama={pengaturan.kamadNama || ''}
					ttdNip={pengaturan.kamadNip || ''}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.bagan-wrap {
		width: 100%;
		overflow: hidden;
		background: #fdfcf7;
	}
	.bagan-inner {
		height: 1000px;
	}
</style>
