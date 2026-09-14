<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { getActiveModule } from './module-active.svelte.js';
	import NavSubItem from './nav-sub-item.svelte';

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			icon?: any;
			group?: string;
			isActive?: boolean;
			children?: { title: string; url: string; icon?: any }[];
		}[];
	} = $props();

	const modul = $derived(getActiveModule());
	// Item grup "semua" (Dashboard, Aktivitas, Persetujuan) selalu tampil.
	const visible = $derived(
		modul === 'semua' ? items : items.filter((i) => i.group === modul || i.group === 'semua')
	);

	// Dibaca di top-level komponen (bukan dalam #each) -> hydration-safe
	const pathname = $derived(page?.url?.pathname ?? '');

	function isActive(url: string): boolean {
		if (url === '/') return pathname === '/';
		return pathname === url || pathname.startsWith(url + '/');
	}

	function hasActiveChild(children: { url: string }[]): boolean {
		if (!children?.length) return false;
		return children.some(c => isActive(c.url));
	}

	const openGroups = $state<Record<string, boolean>>({});

	function isOpen(title: string, children: { url: string }[] | undefined): boolean {
		if (openGroups[title] !== undefined) return openGroups[title];
		return hasActiveChild(children ?? []);
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{modul === 'semua' ? 'Menu' : 'Menu ' + modul}</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each visible as item (item.title)}
				{#if item.children && item.children.length > 0}
					{@const open = isOpen(item.title, item.children)}
					<Sidebar.MenuItem>
						<div class="flex w-full items-center gap-1">
							<Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.url) || hasActiveChild(item.children)} class="flex-1">
								{#snippet child({ props })}
									<a href={resolve(item.url as '/admin/dashboard')} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
							<button
								type="button"
								onclick={() => { openGroups[item.title] = !open; }}
								class="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
								aria-label="Toggle {item.title}"
							>
								<ChevronRightIcon class="size-4 transition-transform duration-200 {open ? 'rotate-90' : ''}" />
							</button>
						</div>
						{#if open}
							<Sidebar.MenuSub>
								{#each item.children as child (child.url)}
									<NavSubItem url={child.url} label={child.title} />
								{/each}
							</Sidebar.MenuSub>
						{/if}
					</Sidebar.MenuItem>
				{:else}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.url)}>
							{#snippet child({ props })}
								<a href={resolve(item.url as '/admin/dashboard')} {...props}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>