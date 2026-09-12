<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { logoutForm } from '$modules/auth/auth.remote';

	let { user } = $props();
</script>

<header class="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
	<div class="min-w-0 flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
		<h1 class="truncate text-sm font-semibold">SIMAD - Rekonsiliasi Data TA 2026/2027</h1>
	</div>
	<div class="ms-auto flex items-center gap-2 px-4">
		<Button onclick={toggleMode} variant="ghost" size="icon" class="cursor-pointer" title="Ganti tema">
			<Sun class="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon class="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span class="sr-only">Toggle theme</span>
		</Button>
		<span class="hidden text-xs text-muted-foreground sm:inline">{user?.username}</span>
		<form {...logoutForm}>
			<Button variant="ghost" size="sm" type="submit" class="h-7 px-2 text-xs cursor-pointer">
				<LogOutIcon class="size-3.5" />
				<span class="hidden sm:inline">Keluar</span>
			</Button>
		</form>
	</div>
</header>
