<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';

	let { mustChange = false }: { mustChange?: boolean } = $props();

	const SESI_KEY = 'simad_pwd_notice';
	let open = $state(false);

	onMount(() => {
		if (!mustChange) return;
		try {
			if (sessionStorage.getItem(SESI_KEY) !== '1') open = true;
		} catch {
			/* ignore */
		}
	});

	function nanti() {
		open = false;
		try {
			sessionStorage.setItem(SESI_KEY, '1');
		} catch {
			/* ignore */
		}
	}
</script>

{#if mustChange}
	<Alert.Root
		class="rounded-none border-x-0 border-t-0 border-amber-300 bg-amber-50 pr-28 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
	>
		<TriangleAlertIcon />
		<Alert.Title>Kata sandi masih default</Alert.Title>
		<Alert.Description>
			Demi keamanan akun, segera ganti kata sandi Anda.
		</Alert.Description>
		<Alert.Action>
			<a href={resolve('/admin/profil/ganti-password')}>
				<Button size="sm" class="cursor-pointer bg-amber-600 text-white hover:bg-amber-700">
					<KeyRoundIcon class="size-3.5" />
					Ganti
				</Button>
			</a>
		</Alert.Action>
	</Alert.Root>

	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Ganti Kata Sandi</Dialog.Title>
				<Dialog.Description>
					Akun Anda masih memakai kata sandi default
					(<code class="font-mono">2026qwerty!</code>). Anda boleh melewatkannya sekarang, tetapi
					modul PTK, Dokumen, dan Sistem akan terkunci sampai kata sandi diganti.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="flex-col gap-2 sm:flex-row">
				<Button variant="outline" class="w-full cursor-pointer sm:w-auto" onclick={nanti}>
					Nanti saja
				</Button>
				<a href={resolve('/admin/profil/ganti-password')} class="w-full sm:w-auto">
					<Button class="w-full cursor-pointer">
						<KeyRoundIcon class="size-4" />
						Ganti sekarang
					</Button>
				</a>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
