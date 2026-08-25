<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	
	let { children, data } = $props();
</script>

<ModeWatcher />

<svelte:head>
	<meta name="color-scheme" content="light dark" />
</svelte:head>

{#if data.isLogin}
	<main>{@render children()}</main>
{:else}
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			<SiteHeader user={data.user} />
			<main class="mx-auto w-full max-w-5xl px-4 py-4">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
