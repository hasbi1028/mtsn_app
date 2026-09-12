<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Camera from '@lucide/svelte/icons/camera';
	import X from '@lucide/svelte/icons/x';
	import { notify } from '$lib/toast';

	let { data } = $props();
	let siswa = $derived(data.siswa);
	let fileInput = $state<HTMLInputElement>(); let preview = $state<string | null>(null); let pendingFile = $state<File | null>(null); let saving = $state(false);
	function fotoUrl(path: string) { return path.startsWith('/') ? path : `/${path}`; }
	function choosePhoto() { fileInput?.click(); }
	function selectPhoto(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; if (!/^image\/(jpeg|jpg|png|gif)$/.test(file.type)) return notify.error('Gunakan foto JPG, PNG, atau GIF.'); if (file.size > 2 * 1024 * 1024) return notify.error('Ukuran foto maksimal 2MB.'); pendingFile = file; preview = URL.createObjectURL(file); }
	async function savePhoto() { if (!pendingFile || !siswa) return; saving = true; try { const fd = new FormData(); fd.append('foto', pendingFile); const res = await fetch(`/siswa/${siswa.id}/profil`, { method: 'POST', body: fd }); if (!res.ok) throw new Error('Upload foto gagal.'); const result = await res.json(); pendingFile = null; preview = null; notify.success('Foto siswa berhasil diperbarui.'); } catch (err: any) { notify.error(err.message || 'Upload foto gagal.'); } finally { saving = false; if (fileInput) fileInput.value = ''; } }
	function cancelPhoto() { pendingFile = null; preview = null; if (fileInput) fileInput.value = ''; }
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
					<div class="relative size-16 overflow-hidden rounded-full bg-primary text-primary-foreground text-lg font-bold">{#if preview || siswa.foto_path}<img src={preview || fotoUrl(siswa.foto_path)} alt="Foto {siswa.nama}" class="size-full object-cover" />{:else}<div class="grid size-full place-items-center">{siswa.nama?.charAt(0) ?? '?'}</div>{/if}<button type="button" onclick={choosePhoto} class="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] text-white"><Camera class="mx-auto size-3" />Ubah</button></div>
					{siswa.nama}
				</Card.Title>
				<Card.Description>{siswa.kelas} · {siswa.rombel || '—'}</Card.Description>
			</Card.Header>
			{#if pendingFile}<div class="mx-6 mb-3 flex items-center justify-between rounded-md border bg-muted/40 p-2 text-xs"><span>Foto baru siap disimpan</span><span class="flex gap-1"><Button size="sm" class="h-7 text-xs" onclick={savePhoto} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Foto'}</Button><Button variant="ghost" size="sm" class="h-7 px-2" onclick={cancelPhoto}><X class="size-4" /></Button></span></div>{/if}
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
							<p class="text-muted-foreground text-xs">Asal Sekolah</p>
							<p>{siswa.asal_sekolah ?? '—'}</p>
						</div>
						<div>
							<p class="text-muted-foreground text-xs">NPSN Asal Sekolah</p>
							<p class="font-mono">{siswa.asal_sekolah_npsn ?? '—'}</p>
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
			<input bind:this={fileInput} type="file" accept="image/jpeg,image/jpg,image/png,image/gif" class="hidden" onchange={selectPhoto} />

			<div class="flex gap-2">
				<a href="/siswa/{siswa.id}/bansos">
					<Button variant="outline" size="sm" class="text-xs">Lihat Bansos</Button>
				</a>
				<a href="/siswa/{siswa.id}/kartu">
					<Button variant="outline" size="sm" class="text-xs">Kartu Siswa</Button>
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
