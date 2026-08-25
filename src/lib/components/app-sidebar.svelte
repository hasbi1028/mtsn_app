<script lang="ts" module>
	import { navItems } from "$lib/config/navigation.js";
	const data = { navItems };
</script>

<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import ModuleSwitcher from "./module-switcher.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<ModuleSwitcher />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navItems} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
