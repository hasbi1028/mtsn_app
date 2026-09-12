<script lang="ts">
	import { notify } from '$lib/toast';
	import { Button } from '$lib/components/ui/button/index.js';
	import { FieldGroup, Field, FieldLabel, FieldSeparator } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { login } from '../auth.remote';
	import { cn } from '$lib/utils.js';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	let loading = $state(false);
	let showPassword = $state(false);
	let username = $state('');
	let password = $state('');
	let formError = $state('');
	let touched = $state({ username: false, password: false });

	interface LoginResult {
		error?: string;
	}

	const usernameError = $derived(touched.username && username.length < 3 ? 'Username minimal 3 karakter' : '');
	const passwordError = $derived(touched.password && password.length < 3 ? 'Kata sandi minimal 3 karakter' : '');
	const hasErrors = $derived(!!usernameError || !!passwordError);

	function handleSubmit() {
		touched = { username: true, password: true };
		if (hasErrors || !username || !password) {
			notify.error('Mohon lengkapi semua field');
			return false;
		}
		return true;
	}
</script>

<div class={cn('flex min-h-[calc(100vh-3.5rem)] flex-col md:flex-row', className)} {...restProps}>
	<!-- Left side: branding -->
	<div class="hidden bg-muted md:flex md:w-1/2 flex-col items-center justify-center p-10">
		<div class="flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground mb-6">
			<SchoolIcon class="size-8" />
		</div>
		<div class="text-center space-y-2">
			<h2 class="text-xl font-semibold">MTsN 2 Kolaka Utara</h2>
			<p class="text-sm text-muted-foreground max-w-xs">
				Sistem Informasi Manajemen Madrasah — akses data PTK, kesiswaan, dan administrasi sekolah.
			</p>
		</div>
	</div>

	<!-- Right side: form -->
	<div class="flex w-full md:w-1/2 items-center justify-center p-6 md:p-10">
		<div class="w-full max-w-sm space-y-6">
			<div class="flex flex-col items-center gap-2 text-center md:hidden">
				<div class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
					<SchoolIcon class="size-6" />
				</div>
				<h1 class="text-xl font-bold">MTsN 2 Kolaka Utara</h1>
				<p class="text-sm text-muted-foreground">SIMAD</p>
			</div>

			<div class="hidden md:block text-center">
				<h1 class="text-2xl font-bold">Selamat Datang</h1>
				<p class="text-balance text-muted-foreground">Masuk ke akun MTsN 2 Kolaka Utara Anda</p>
			</div>

			{#if formError}
				<div class="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
					{formError}
				</div>
			{/if}

			<form
				{...login.enhance(async (form) => {
					if (!handleSubmit()) return;

					loading = true;
					formError = '';
					try {
						await form.submit();
						const result = (form as any).result as LoginResult | undefined;
						if (result?.error) {
							formError = result.error;
							notify.error(result.error);
						}
					} finally {
						loading = false;
					}
				})}
				class="space-y-4"
				aria-label="Formulir masuk"
			>
				<FieldGroup>
					<Field>
						<FieldLabel for="username">Username</FieldLabel>
						<Input
							id="username"
							name="username"
							bind:value={username}
							placeholder="username"
							autocomplete="username"
							disabled={loading}
							class={touched.username && usernameError ? 'border-destructive' : ''}
						/>
						{#if usernameError}
							<p class="text-xs text-destructive mt-1">{usernameError}</p>
						{/if}
					</Field>
					<Field>
						<FieldLabel for="password">Kata Sandi</FieldLabel>
						<div class="relative">
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								autocomplete="current-password"
								disabled={loading}
								class={cn('pr-10', touched.password && passwordError ? 'border-destructive' : '')}
							/>
							<button
								type="button"
								class="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
								onclick={() => showPassword = !showPassword}
								aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
								disabled={loading}
							>
								{#if showPassword}
									<EyeOffIcon class="size-4" />
								{:else}
									<EyeIcon class="size-4" />
								{/if}
							</button>
						</div>
						{#if passwordError}
							<p class="text-xs text-destructive mt-1">{passwordError}</p>
						{/if}
					</Field>
					<Button type="submit" class="w-full cursor-pointer" disabled={loading || hasErrors}>
						{#if loading}
							<LoaderCircleIcon class="size-4 mr-2 animate-spin" />
							Memasuki...
						{:else}
							Masuk
						{/if}
					</Button>
				</FieldGroup>
			</form>

			<FieldSeparator class="hidden md:block" />
			<p class="text-xs text-muted-foreground text-center">
				Dokumen resmi — data bersumber dari EMIS GTK, SK Pembagian Tugas, dan Roster Pelajaran
			</p>
		</div>
	</div>
</div>
