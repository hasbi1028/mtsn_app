<script lang="ts">
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import Bagan from '$modules/struktur/components/bagan.svelte';
	import { getBaganPublikQ } from '$modules/struktur/struktur.remote';
	import Network from '@lucide/svelte/icons/network';

	const bagan = $derived(await getBaganPublikQ());
	const data = $derived((bagan ?? {}) as any);
	const pengaturan = $derived((data.pengaturan ?? {}) as any);
	const kolom = $derived((data.kolom ?? []) as any[]);
	const nonaktif = $derived(data.nonaktif === true);
</script>

<svelte:head>
	<title>Struktur Organisasi — MTsN 2 Kolaka Utara</title>
	<meta
		name="description"
		content="Struktur organisasi dan susunan pegawai MTsN 2 Kolaka Utara (nama, gelar, dan penugasan)."
	/>
</svelte:head>

<div class="min-h-screen">
	<PublicPageHeader
		icon={Network}
		title="Struktur Organisasi"
		subtitle="Susunan pimpinan, tenaga kependidikan, dan guru MTsN 2 Kolaka Utara"
		accent="teal"
	/>

	<section class="mx-auto max-w-6xl px-4 py-8">
		{#if nonaktif}
			<p class="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
				Bagan struktur organisasi belum ditayangkan. Silakan hubungi admin madrasah.
			</p>
		{:else if kolom.length === 0}
			<p class="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
				Data struktur organisasi belum diisi.
			</p>
		{:else}
			<div class="overflow-x-auto">
				<Bagan
					{kolom}
					judul={pengaturan.judul}
					tahun={pengaturan.tahun}
					sk={pengaturan.sk}
					kop={pengaturan.kop}
					badge={data.badge}
					mode="web"
					publik={true}
				/>
			</div>

			<div class="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
				{#if pengaturan.tahun}<span>Tahun Pelajaran {pengaturan.tahun}</span>{/if}
				{#if pengaturan.sk}<span>· {pengaturan.sk}</span>{/if}
				{#if data.badge}<span>· {data.badge} pegawai</span>{/if}
				{#if pengaturan.tempatTgl}<span>· {pengaturan.tempatTgl}</span>{/if}
				<a class="underline" href="/guru">Lihat daftar guru &amp; staf</a>
			</div>
		{/if}
	</section>
</div>
