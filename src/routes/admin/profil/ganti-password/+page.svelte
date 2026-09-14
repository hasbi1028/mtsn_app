<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { FieldGroup, Field, FieldLabel } from '$lib/components/ui/field/index.js';
	import { notify } from '$lib/toast';
	import { changePasswordF } from '$modules/auth/auth.remote';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';

	let loading = $state(false);
	let showPassword = $state(false);
	let lastResult: unknown = $state(null);
	let passwordLama = $state('');
	let passwordBaru = $state('');
	let konfirmasi = $state('');

	const passwordError = $derived(
		passwordBaru.length > 0 && passwordBaru.length < 6 ? 'Password minimal 6 karakter' : ''
	);
	const matchError = $derived(
		konfirmasi.length > 0 && passwordBaru !== konfirmasi ? 'Konfirmasi tidak cocok' : ''
	);
	const canSubmit = $derived(passwordLama.length > 0 && passwordBaru.length >= 6 && passwordBaru === konfirmasi && !loading);

	$effect(() => {
		const r: any = changePasswordF.result;
		if (!r || r === lastResult) return;
		lastResult = r;
		if (r.ok) {
			notify.success(r.pesan || 'Password berhasil diganti.');
			goto('/admin/dashboard');
		} else {
			notify.error(r.error || 'Gagal mengganti password.');
		}
	});
</script>

<svelte:head><title>Ganti Password — SIMAD</title></svelte:head>

<div class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
	<div class="w-full max-w-sm space-y-6">
		<div class="flex flex-col items-center gap-3 text-center">
			<div class="flex items-center justify-center w-14 h-14 rounded-xl bg-amber-100 text-amber-700">
				<LockKeyholeIcon class="size-7" />
			</div>
			<div>
				<h1 class="text-xl font-bold">Ganti Password</h1>
				<p class="text-sm text-muted-foreground mt-1">
					Anda wajib mengganti password sebelum melanjutkan.
				</p>
			</div>
		</div>

		<form
			{...changePasswordF.enhance(async (form) => {
				if (!canSubmit) return;
				loading = true;
				try {
					await form.submit();
				} finally {
					loading = false;
				}
			})}
			class="space-y-4"
		>
			<FieldGroup>
				<Field>
					<FieldLabel for="passwordLama">Password Lama</FieldLabel>
					<Input
						id="passwordLama"
						name="passwordLama"
						type={showPassword ? 'text' : 'password'}
						bind:value={passwordLama}
						placeholder="Masukkan password lama"
						disabled={loading}
						required
					/>
				</Field>
				<Field>
					<FieldLabel for="passwordBaru">Password Baru</FieldLabel>
					<Input
						id="passwordBaru"
						name="passwordBaru"
						type={showPassword ? 'text' : 'password'}
						bind:value={passwordBaru}
						placeholder="Minimal 6 karakter"
						disabled={loading}
						required
					/>
					{#if passwordError}
						<p class="text-xs text-destructive mt-1">{passwordError}</p>
					{/if}
				</Field>
				<Field>
					<FieldLabel for="konfirmasi">Konfirmasi Password Baru</FieldLabel>
					<Input
						id="konfirmasi"
						name="konfirmasi"
						type={showPassword ? 'text' : 'password'}
						bind:value={konfirmasi}
						placeholder="Ulangi password baru"
						disabled={loading}
						required
					/>
					{#if matchError}
						<p class="text-xs text-destructive mt-1">{matchError}</p>
					{/if}
				</Field>

				<label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
					<input type="checkbox" bind:checked={showPassword} class="cursor-pointer" />
					Tampilkan password
				</label>

				<Button type="submit" class="w-full cursor-pointer" disabled={!canSubmit}>
					{#if loading}
						<LoaderCircleIcon class="size-4 mr-2 animate-spin" />
						Menyimpan...
					{:else}
						Simpan & Lanjutkan
					{/if}
				</Button>
			</FieldGroup>
		</form>
	</div>
</div>
