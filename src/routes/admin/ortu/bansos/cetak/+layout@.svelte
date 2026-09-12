<script lang="ts">
	import '../../../../../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />
<svelte:head>
	<meta name="color-scheme" content="light" />
</svelte:head>
{@render children?.()}
