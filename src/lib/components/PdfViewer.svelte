<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let { src, title = 'PDF Document' } = $props();
	let open = $state(false);
</script>

<button
	onclick={() => open = true}
	class="text-sm text-primary hover:underline cursor-pointer"
>
	{title}
</button>

<Dialog.Root bind:open>
	<Dialog.Content class="w-[calc(100vw-2rem)] max-w-6xl h-[92vh] p-0 gap-0 flex flex-col">
		<Dialog.Header class="px-4 py-2.5 border-b space-y-0 flex flex-row items-center justify-between gap-3">
			<Dialog.Title class="text-sm truncate">{title}</Dialog.Title>
			<a href={src} target="_blank" class="text-xs text-primary hover:underline shrink-0">
				Buka di Tab Baru
			</a>
		</Dialog.Header>
		<iframe {src} {title} class="flex-1 w-full min-h-0 border-0"></iframe>
	</Dialog.Content>
</Dialog.Root>
