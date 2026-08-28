<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();
	const siswa = $derived(data.siswa as any);
</script>

<svelte:head>
	<title>Profil Siswa — SIMAD</title>
</svelte:head>

<div class="mx-auto max-w-xl space-y-4 p-4">
	<div class="flex items-center gap-2">
		<a href="/siswa">
			<Button variant="ghost" size="sm" class="h-8 px-2">
				<ArrowLeft class="size-4" />
				Kembali
			</Button>
		</a>
		<h1 class="text-lg font-bold">Profil Siswa</h1>
	</div>

	{#if siswa}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<div class="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
						{siswa.nama?.charAt(0) ?? '?'}
					</div>
					{siswa.nama}
				</Card.Title>
				<Card.Description>{siswa.kelas} · {siswa.rombel || '—'}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3 text-sm">
				<div class="grid grid-cols-2 gap-2">
					<div>
						<p class="text-muted-foreground text-xs">NISN</p>
						<p class="font-mono">{siswa.nisn ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">NIK</p>
						<p class="font-mono">{siswa.nik ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Jenis Kelamin</p>
						<p>{siswa.jk ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Tempat, Tgl Lahir</p>
						<p>{siswa.tempat_lahir ?? '—'}, {siswa.tgl_lahir ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Ayah</p>
						<p>{siswa.ayah ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Ibu</p>
						<p>{siswa.ibu ?? '—'}</p>
					</div>
					<div class="col-span-2">
						<p class="text-muted-foreground text-xs">Alamat</p>
						<p>{siswa.alamat ?? '—'}</p>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Status EMIS</p>
						<Badge variant={siswa.status_emis === 'Aktif' ? 'outline' : 'destructive'} class="text-xs">
							{siswa.status_emis ?? '—'}
						</Badge>
					</div>
					<div>
						<p class="text-muted-foreground text-xs">Sumber Data</p>
						<p class="text-xs">{siswa.sumber_data ?? '—'}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex gap-2">
			<a href="/siswa/{siswa.id}/bansos">
				<Button variant="outline" size="sm" class="text-xs">Lihat Bansos</Button>
			</a>
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="py-8 text-center text-muted-foreground">
				Siswa tidak ditemukan
			</Card.Content>
		</Card.Root>
	{/if}
</div>
