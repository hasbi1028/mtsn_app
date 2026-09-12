<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import { getMe } from '$modules/auth/auth.remote';

	const userQuery = $derived(getMe());
	const user = $derived(userQuery.current);
</script>

<svelte:head><title>Profil Anak — SIMAD</title></svelte:head>

<div class="flex flex-col gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<UsersRoundIcon class="size-5" />
				Profil Anak
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-center">
					<div class="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
						{user?.username?.slice(0, 2).toUpperCase() ?? 'OR'}
					</div>
				</div>
				<div class="text-center">
					<p class="text-lg font-semibold">{user?.username ?? '-'}</p>
					<p class="text-sm text-muted-foreground">Orang Tua</p>
				</div>
				<Separator />
				<p class="text-sm text-muted-foreground text-center">
					Halaman profil anak sedang dalam pengembangan.
				</p>
			</div>
		</Card.Content>
	</Card.Root>
</div>
