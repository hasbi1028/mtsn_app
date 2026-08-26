<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { page } from '$app/state';
	import { activeModule } from './module-active.svelte.js';

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			icon?: any;
			group?: string;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();

	const modul = $derived($activeModule);
	const visible = $derived(modul === 'semua' ? items : items.filter((i) => i.group === modul));

	function isActive(url: string) {
		if (url === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(url);
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{modul === 'semua' ? 'Menu' : 'Menu ' + modul}</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each visible as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.url)}>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>