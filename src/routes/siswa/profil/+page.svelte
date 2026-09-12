<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { notify } from '$lib/toast';
	import { invalidateAll } from '$app/navigation';
	import UserIcon from '@lucide/svelte/icons/user';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckCircle from '@lucide/svelte/icons/check-circle-2';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import { submitPerubahanC, uploadFoto } from '$modules/siswa/siswa.remote';

	let { data } = $props();
	const user = $derived(data.user);
	const profile = $derived(data.profile as any);

	const fotoUrl = $derived(profile?.foto_path ? `/${profile.foto_path}` : '');
	// Foto pending menunggu approve: tampilkan preview + status
	const isPendingFoto = $derived(profile?.foto_status === 'pending');

	// Field yang boleh diubah siswa
	const fields = [
		{ key: 'nama', label: 'Nama', icon: UserIcon },
		{ key: 'nik', label: 'NIK' },
		{ key: 'nisn', label: 'NISN' },
		{ key: 'nis', label: 'NIS' },
		{ key: 'ayah', label: 'Nama Ayah' },
		{ key: 'ibu', label: 'Nama Ibu' },
		{ key: 'kerja_ayah', label: 'Pekerjaan Ayah' },
		{ key: 'kerja_ibu', label: 'Pekerjaan Ibu' },
		{ key: 'tempat_lahir', label: 'Tempat Lahir' },
		{ key: 'tgl_lahir', label: 'Tanggal Lahir' },
		{ key: 'alamat', label: 'Alamat' },
		{ key: 'no_hp', label: 'No. HP' },
		{ key: 'kip_pip', label: 'KIP/PIP' },
	];

	// Dialog ubah data
	let editField = $state('');
	let editValue = $state('');
	function bukaEdit(field: string, currentVal: string) {
		editField = field;
		editValue = currentVal || '';
		editOpen = true;
	}
	let editOpen = $state(false);
	const editLabel = $derived(fields.find((f) => f.key === editField)?.label || editField);

	// Ajukan perubahan data via remote command
	let submitting = $state(false);
	async function ajukanPerubahan() {
		if (!editField || !editValue) {
			notify.warning('Pilih field dan isi nilai baru');
			return;
		}
		submitting = true;
		try {
			const res = await submitPerubahanC({
				siswaId: profile.id,
				field: editField,
				nilai_baru: editValue
			});
			if (res?.error) {
				notify.error(res.error);
			} else {
				notify.success('Perubahan berhasil diajukan, menunggu persetujuan admin.');
				editOpen = false;
				await invalidateAll();
			}
		} catch (err: any) {
			notify.error('Gagal mengajukan perubahan: ' + (err.message || ''));
		}
		submitting = false;
	}

	// Upload foto via remote form()
	const uploadForm = uploadFoto.enhance(async (form) => {
		const valid = await form.submit();
		if (!valid) return;
		const result = form.result as any;
		if (result?.error) {
			notify.error(result.error);
		} else {
			notify.success(result?.pesan || 'Foto dikirim untuk persetujuan');
			await invalidateAll();
		}
	});
</script>

<svelte:head><title>Profil Saya — SIMAD</title></svelte:head>

<div class="flex flex-col gap-4">
	<!-- Foto & ringkasan -->
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Title class="flex items-center gap-2 text-base">
				<UserIcon class="size-5" /> Profil Saya
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3">
					<div class="relative shrink-0">
						{#if fotoUrl}
							<img src={fotoUrl} alt="Foto" class="size-16 rounded-full object-cover border" />
						{:else}
							<div class="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
								{profile?.nama?.slice(0, 2).toUpperCase() ?? 'SI'}
							</div>
						{/if}
						{#if isPendingFoto}
							<div class="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-1 text-white" title="Menunggu persetujuan">
								<ClockIcon class="size-3" />
							</div>
						{/if}
					</div>
					<div class="min-w-0">
						<p class="text-lg font-semibold truncate">{profile?.nama ?? '-'}</p>
						<div class="flex flex-wrap gap-1.5 mt-1">
							<Badge class="text-[10px]">Kelas {profile?.kelas ?? '-'}</Badge>
							<Badge variant="outline" class="text-[10px]">{profile?.rombel || 'Tanpa rombel'}</Badge>
							{#if profile?.jk}<Badge variant="secondary" class="text-[10px]">{profile.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</Badge>{/if}
						</div>
					</div>
				</div>

				{#if isPendingFoto}
					<div class="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
						<ClockIcon class="size-3.5 inline mr-1" /> Foto baru menunggu persetujuan admin.
					</div>
				{/if}

				<!-- Upload foto (remote form) -->
				<form {...uploadForm} enctype="multipart/form-data" class="flex items-center gap-2">
					<label class="flex flex-1 items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground cursor-pointer" for="foto-input">
						<CameraIcon class="size-4 shrink-0" />
						<span>Pilih foto...</span>
					</label>
					<input id="foto-input" {...uploadFoto.fields.foto.as('file')} accept="image/*" class="hidden" />
					<Button type="submit" size="sm" class="cursor-pointer">Upload & Kirim</Button>
				</form>
				<p class="text-[10px] text-muted-foreground mt-1">JPG/PNG max 2MB. Foto perlu persetujuan admin sebelum aktif.</p>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Data diri -->
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Title class="text-sm">Data Pribadi</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
				{#each fields as f (f.key)}
					{@const val = profile?.[f.key] }
					<div class="min-w-0">
						<p class="text-[11px] text-muted-foreground">{f.label}</p>
						<p class="text-sm font-medium truncate">{val || '—'}</p>
					</div>
				{/each}
			</div>
			<div class="mt-3 border-t pt-3">
				<Button size="sm" variant="outline" class="w-full cursor-pointer" onclick={() => bukaEdit('', '')}>
					<PencilIcon class="size-4" /> Ubah Data Pribadi
				</Button>
				<p class="text-[10px] text-muted-foreground text-center mt-1.5">Perubahan butuh persetujuan admin</p>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Dialog: pilih field & isi nilai baru -->
<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title class="text-base">Ubah Data Pribadi</Dialog.Title>
			<Dialog.Description>Pilih field lalu isi nilai baru. Perubahan akan menunggu persetujuan admin.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			<Field>
				<FieldLabel>Field</FieldLabel>
				<select
					class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
					value={editField}
					onchange={(e) => {
						const f = (e.target as HTMLSelectElement).value;
						editField = f;
						editValue = profile?.[f] || '';
					}}
				>
					<option value="">— Pilih field —</option>
					{#each fields as f (f.key)}
						<option value={f.key}>{f.label}</option>
					{/each}
				</select>
			</Field>
			{#if editField}
				<form onsubmit={(e) => { e.preventDefault(); ajukanPerubahan(); }} class="space-y-3">
					<Field>
						<FieldLabel>Nilai Baru ({editLabel})</FieldLabel>
						<Input bind:value={editValue} placeholder={profile?.[editField] || ''} class="h-9 text-sm" />
					</Field>
					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" size="sm" onclick={() => (editOpen = false)}>Batal</Button>
						<Button type="submit" size="sm" class="cursor-pointer" disabled={submitting}>Ajukan Perubahan</Button>
					</div>
				</form>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>