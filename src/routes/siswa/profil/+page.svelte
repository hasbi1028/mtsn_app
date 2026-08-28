<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import UserIcon from '@lucide/svelte/icons/user';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let { data } = $props();
	const user = $derived(data.user);
</script>

<svelte:head><title>Profil Saya — SIMAD</title></svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UserIcon class="size-5" />
				Profil Saya
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-center">
					<div class="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
						{user?.username?.slice(0, 2).toUpperCase() ?? 'SI'}
					</div>
				</div>
				<div class="text-center">
					<p class="text-lg font-semibold">{user?.username ?? '-'}</p>
					<p class="text-sm text-muted-foreground">Siswa</p>
				</div>
				<Separator />
				<p class="text-sm text-muted-foreground text-center">
					Halaman profil siswa sedang dalam pengembangan.
				</p>
			</div>
		</Card.Content>
	</Card.Root>

	<form method="POST" action="/logout" class="flex justify-center">
		<Button variant="outline" type="submit" class="cursor-pointer">
			<LogOutIcon class="size-4 mr-2" />
			Keluar
		</Button>
	</form>
</div>
