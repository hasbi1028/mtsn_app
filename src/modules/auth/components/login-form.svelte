<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { notify } from '$lib/toast';
	import { Button } from '$lib/components/ui/button/index.js';
	import { FieldGroup, Field, FieldLabel, FieldSeparator } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { enhance } from '$app/forms';
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
</script>

<div class={cn('flex flex-col gap-6 animate-in fade-in duration-500', className)} {...restProps}>
	<Card.Root class="overflow-hidden p-0">
		<div class="grid grid-cols-1 md:grid-cols-2 p-0">
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					formError = '';
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							await update();
						} else if (result.type === 'failure') {
							formError = (result.data?.error as string) || 'Username atau kata sandi salah';
							notify.error(formError);
						}
						loading = false;
					};
				}}
				class="p-6 md:p-8"
				aria-label="Formulir masuk"
			>
				<FieldGroup>
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground mb-2">
							<SchoolIcon class="size-6" />
						</div>
						<h1 class="text-2xl font-bold">Selamat Datang</h1>
						<p class="text-balance text-muted-foreground">Masuk ke akun MTsN 2 Kolaka Utara Anda</p>
					</div>

					{#if formError}
						<p class="text-sm text-destructive text-center">{formError}</p>
					{/if}

					<Field>
						<FieldLabel for="username">Username</FieldLabel>
						<Input
							id="username"
							name="username"
							bind:value={username}
							placeholder="username"
							autocomplete="username"
							disabled={loading}
						/>
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
								class="pr-10"
							/>
							<button
								type="button"
								class="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
								onclick={() => showPassword = !showPassword}
								aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
								tabindex={-1}
								disabled={loading}
							>
								{#if showPassword}
									<EyeOffIcon class="size-4" />
								{:else}
									<EyeIcon class="size-4" />
								{/if}
							</button>
						</div>
					</Field>
					<Button type="submit" class="w-full cursor-pointer" disabled={loading}>
						{#if loading}
							<LoaderCircleIcon class="size-4 mr-2 animate-spin" />
							Memasuki...
						{:else}
							Masuk
						{/if}
					</Button>
				</FieldGroup>
			</form>
			<div class="relative hidden bg-muted md:block">
				<img
					src="/uploads/logo-kemenag.png"
					alt="Logo Kementerian Agama"
					class="absolute inset-0 h-full w-full object-cover opacity-10 dark:opacity-5"
				/>
				<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
					<div class="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary">
						<SchoolIcon class="size-10" />
					</div>
					<p class="text-lg font-semibold">MTsN 2 Kolaka Utara</p>
					<p class="text-sm text-muted-foreground">SIMAD — MTsN 2 Kolaka Utara</p>
				</div>
			</div>
		</div>
	</Card.Root>
	<FieldSeparator class="hidden md:block" />
	<p class="text-xs text-muted-foreground text-center">
		Dokumen resmi — data bersumber dari EMIS GTK, SK Pembagian Tugas, dan Roster Pelajaran
	</p>
</div>
