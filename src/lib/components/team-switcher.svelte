<script lang="ts">
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let { team }: { team: { name: string; logo: any; plan: string } } = $props();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton size="lg">
			{#snippet child({ props })}
				<a {...props}>
					<div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
						<team.logo class="size-4" />
					</div>
					<div class="grid flex-1 text-left text-sm leading-tight">
						<span class="truncate font-medium">{team.name}</span>
						<span class="truncate text-xs">{team.plan}</span>
					</div>
					<ChevronsUpDownIcon class="ms-auto" />
				</a>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
