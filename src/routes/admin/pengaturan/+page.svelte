<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { notify } from '$lib/toast';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import StarIcon from '@lucide/svelte/icons/star';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import {
		resetBrandingC,
		updateBrandingTextForm,
		uploadFaviconForm,
		uploadLogoForm
	} from '$modules/pengaturan/pengaturan.remote';

	const user = $derived((page.data as any)?.user);
	const isAdmin = $derived(user?.role === 'admin');
	const pengaturan = $derived((page.data as any)?.pengaturan ?? {});

	let busy = $state(false);

	async function handleReset(kind: 'logo' | 'favicon') {
		busy = true;
		try {
			const r: any = await resetBrandingC({ kind });
			notify.success(r?.pesan || 'Dikembalikan ke logo Kemenag.');
			await invalidateAll();
		} catch (e) {
			notify.error(e instanceof Error ? e.message : 'Gagal mengembalikan logo.');
		} finally {
			busy = false;
		}
	}
</script>

<PageLayout title="Pengaturan" description="Identitas, logo, dan favicon aplikasi">
	<div class="mx-auto w-full max-w-3xl space-y-4">
		{#if !isAdmin}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<ShieldAlertIcon class="size-4" /> Akses ditolak
					</CardTitle>
				</CardHeader>
				<CardContent class="text-sm text-muted-foreground">
					Halaman pengaturan hanya untuk <b>admin</b>. Hubungi operator madrasah.
				</CardContent>
			</Card>
		{:else}
			<!-- Identitas -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<BuildingIcon class="size-4" /> Identitas Aplikasi
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						{...updateBrandingTextForm.enhance(async (form) => {
							const valid = await form.submit();
							if (!valid) {
								notify.error('Periksa kembali isian identitas.');
								return;
							}
							const r = (form as any).result;
							if (r?.ok) {
								notify.success(r.pesan);
								await invalidateAll();
							} else if (r?.error) {
								notify.error(r.error);
							}
						})}
						class="space-y-4"
					>
						<FieldGroup>
							<Field>
								<FieldLabel for="app_name">Nama aplikasi</FieldLabel>
								<Input
									id="app_name"
									name="app_name"
									value={pengaturan.appName ?? 'SIMAD'}
									maxlength={60}
									placeholder="SIMAD"
								/>
							</Field>
							<Field>
								<FieldLabel for="app_subtitle">Subjudul / nama madrasah</FieldLabel>
								<Input
									id="app_subtitle"
									name="app_subtitle"
									value={pengaturan.appSubtitle ?? 'MTsN 2 Kolaka Utara'}
									maxlength={80}
									placeholder="MTsN 2 Kolaka Utara"
								/>
							</Field>
						</FieldGroup>
						<Button
							type="submit"
							size="sm"
							class="cursor-pointer"
							disabled={updateBrandingTextForm.pending > 0}
						>
							{updateBrandingTextForm.pending > 0 ? 'Menyimpan…' : 'Simpan identitas'}
						</Button>
					</form>
				</CardContent>
			</Card>

			<!-- Logo -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<ImageIcon class="size-4" /> Logo Aplikasi
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<p class="text-xs text-muted-foreground">
						Format: PNG, JPG, WEBP, atau SVG (maks 2 MB). Bila dikosongkan, dipakai logo Kemenag.
					</p>
					<div class="flex items-center gap-4 rounded-lg border p-3">
						<img
							src={pengaturan.logoUrl}
							alt="Pratinjau logo"
							class="h-16 w-16 rounded-md object-contain"
						/>
						<div class="text-xs text-muted-foreground">
							{#if pengaturan.logoCustom}
								<p class="font-medium text-foreground">Logo kustom aktif</p>
							{:else}
								<p class="font-medium text-foreground">Memakai logo Kemenag (bawaan)</p>
							{/if}
							<p class="break-all">{pengaturan.logoUrl}</p>
						</div>
					</div>
					<form
						{...uploadLogoForm.enhance(async (form) => {
							const valid = await form.submit();
							if (!valid) {
								notify.error('Berkas logo tidak valid.');
								return;
							}
							const r = (form as any).result;
							if (r?.ok) {
								notify.success(r.pesan);
								await invalidateAll();
							} else if (r?.error) {
								notify.error(r.error);
							}
						})}
						enctype="multipart/form-data"
						class="flex flex-wrap items-center gap-2"
					>
						<input
							type="file"
							name="logo"
							accept="image/png,image/jpeg,image/webp,image/svg+xml"
							required
							class="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
						/>
						<Button type="submit" size="sm" class="cursor-pointer" disabled={uploadLogoForm.pending > 0}>
							<UploadIcon class="mr-1 size-4" />
							{uploadLogoForm.pending > 0 ? 'Mengunggah…' : 'Unggah logo'}
						</Button>
						{#if pengaturan.logoCustom}
							<Button
								type="button"
								size="sm"
								variant="outline"
								class="cursor-pointer text-destructive"
								disabled={busy}
								onclick={() => handleReset('logo')}
							>
								<RotateCcwIcon class="mr-1 size-4" /> Pakai Kemenag
							</Button>
						{/if}
					</form>
				</CardContent>
			</Card>

			<!-- Favicon -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<StarIcon class="size-4" /> Favicon
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<p class="text-xs text-muted-foreground">
						Format: PNG, JPG, WEBP, SVG, atau ICO (maks 1 MB). Bila dikosongkan, dipakai logo Kemenag.
					</p>
					<div class="flex items-center gap-4 rounded-lg border p-3">
						<img
							src={pengaturan.faviconUrl}
							alt="Pratinjau favicon"
							class="h-12 w-12 rounded-md object-contain"
						/>
						<div class="text-xs text-muted-foreground">
							{#if pengaturan.faviconCustom}
								<p class="font-medium text-foreground">Favicon kustom aktif</p>
							{:else}
								<p class="font-medium text-foreground">Memakai logo Kemenag (bawaan)</p>
							{/if}
							<p class="break-all">{pengaturan.faviconUrl}</p>
						</div>
					</div>
					<form
						{...uploadFaviconForm.enhance(async (form) => {
							const valid = await form.submit();
							if (!valid) {
								notify.error('Berkas favicon tidak valid.');
								return;
							}
							const r = (form as any).result;
							if (r?.ok) {
								notify.success(r.pesan);
								await invalidateAll();
							} else if (r?.error) {
								notify.error(r.error);
							}
						})}
						enctype="multipart/form-data"
						class="flex flex-wrap items-center gap-2"
					>
						<input
							type="file"
							name="favicon"
							accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
							required
							class="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
						/>
						<Button type="submit" size="sm" class="cursor-pointer" disabled={uploadFaviconForm.pending > 0}>
							<UploadIcon class="mr-1 size-4" />
							{uploadFaviconForm.pending > 0 ? 'Mengunggah…' : 'Unggah favicon'}
						</Button>
						{#if pengaturan.faviconCustom}
							<Button
								type="button"
								size="sm"
								variant="outline"
								class="cursor-pointer text-destructive"
								disabled={busy}
								onclick={() => handleReset('favicon')}
							>
								<RotateCcwIcon class="mr-1 size-4" /> Pakai Kemenag
							</Button>
						{/if}
					</form>
				</CardContent>
			</Card>
		{/if}
	</div>
</PageLayout>
