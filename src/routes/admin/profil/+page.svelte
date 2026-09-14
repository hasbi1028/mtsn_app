<script lang="ts">
	import { resolve } from '$app/paths';
	import PageLayout from '$lib/components/page-layout.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getProfilSayaQ } from '$modules/profil/profil.remote';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import UserIcon from '@lucide/svelte/icons/user';

	const profil = $derived(await getProfilSayaQ());

	const fotoUrl = $derived(profil?.ptk?.fotoPath ? `/${profil.ptk.fotoPath}` : '');
	const inisial = $derived(
		(profil?.ptk?.nama ?? profil?.akun.username ?? 'U').slice(0, 2).toUpperCase()
	);

	function label(v: unknown): string {
		return v === null || v === undefined || v === '' ? '—' : String(v);
	}
	function tanggal(ts: string | null): string {
		if (!ts) return '—';
		return new Date(ts).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>Profil Saya — SIMAD</title></svelte:head>

<PageLayout title="Profil Saya" description="Identitas dan pengaturan akun Anda">
	{#snippet actions()}
		<a href={resolve('/admin/profil/ganti-password')}>
			<Button size="sm" class="cursor-pointer">
				<KeyRoundIcon class="size-4" />
				Ganti Kata Sandi
			</Button>
		</a>
	{/snippet}

	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root class="md:col-span-1">
			<Card.Content class="flex flex-col items-center gap-3 pt-6 text-center">
				{#if fotoUrl}
					<img src={fotoUrl} alt={profil?.ptk?.nama ?? 'Foto'} class="size-24 rounded-full object-cover" />
				{:else}
					<div class="flex size-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
						{inisial}
					</div>
				{/if}
				<div class="space-y-1">
					<p class="text-base font-semibold">{label(profil?.ptk?.nama ?? profil?.akun.username)}</p>
					<Badge variant="secondary">{label(profil?.akun.role)}</Badge>
				</div>
				{#if profil?.akun.mustChangePassword}
					<Badge variant="destructive">Kata sandi masih default</Badge>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="md:col-span-2">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<UserIcon class="size-4" />
					Identitas
				</Card.Title>
				<Card.Description>Data pokok dari EMIS / SK pembagian tugas.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3 text-sm">
				{#if profil?.ptk}
					<dl class="grid gap-x-6 gap-y-2 sm:grid-cols-2">
						<div><dt class="text-muted-foreground">Nama</dt><dd class="font-medium">{label(profil.ptk.nama)}</dd></div>
						<div><dt class="text-muted-foreground">NIP</dt><dd class="font-mono">{label(profil.ptk.nip)}</dd></div>
						<div><dt class="text-muted-foreground">NUPTK</dt><dd class="font-mono">{label(profil.ptk.nuptk)}</dd></div>
						<div><dt class="text-muted-foreground">Fungsi</dt><dd>{label(profil.ptk.fungsi)}</dd></div>
						<div><dt class="text-muted-foreground">Kepegawaian</dt><dd>{label(profil.ptk.kepegawaian)}</dd></div>
						<div><dt class="text-muted-foreground">Jabatan Struktural</dt><dd>{label(profil.ptk.jabatanStruktural)}</dd></div>
						<div><dt class="text-muted-foreground">Wali Kelas</dt><dd>{label(profil.ptk.waliKelas)}</dd></div>
						<div><dt class="text-muted-foreground">Akun EMIS</dt><dd class="font-mono">{label(profil.ptk.userEmis)}</dd></div>
					</dl>
					{#if profil.ptk.biografi}
						<Separator />
						<p class="text-muted-foreground">{profil.ptk.biografi}</p>
					{/if}
				{:else}
					<p class="text-muted-foreground">
						Akun ini tidak tertaut ke data PTK. Hubungi admin bila perlu menautkan (ref_id).
					</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="md:col-span-1">
			<Card.Header>
				<Card.Title>Akun</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2 text-sm">
				<div class="flex justify-between"><span class="text-muted-foreground">Username</span><span class="font-mono">{label(profil?.akun.username)}</span></div>
				<div class="flex justify-between"><span class="text-muted-foreground">Status</span><span>{profil?.akun.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
				<div class="flex flex-col gap-0.5"><span class="text-muted-foreground">Login terakhir</span><span>{tanggal(profil?.akun.lastLogin ?? null)}</span></div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="md:col-span-2">
			<Card.Header>
				<Card.Title>Jadwal Mengajar</Card.Title>
				<Card.Description>{profil?.roster.length ?? 0} baris roster atas nama Anda.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if profil?.roster.length}
					<ul class="space-y-1 text-sm">
						{#each profil.roster.slice(0, 12) as r (r.id)}
							<li class="flex justify-between gap-4 border-b py-1 last:border-0">
								<span>{label(r.mapel ?? r.kelas ?? r.hari)}</span>
								<span class="text-muted-foreground">{label(r.kelas)} {label(r.hari)} Jam {label(r.jamKe)}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-muted-foreground">Belum ada data roster untuk akun ini.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</PageLayout>
