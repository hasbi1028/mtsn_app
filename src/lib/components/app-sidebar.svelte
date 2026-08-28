<script lang="ts">
	import { navItems, filterNavByRole } from "$lib/config/navigation.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import ModuleSwitcher from "./module-switcher.svelte";
	import type { ComponentProps } from "svelte";

	let {
		user,
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & { user?: { username: string; role: string; ref_id: number } | null } = $props();

	const filteredItems = $derived(user?.role ? filterNavByRole(navItems, user.role) : navItems);
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<ModuleSwitcher />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={filteredItems} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
