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
	<Dialog.Content class="max-w-4xl h-[90vh] p-0 gap-0">
		<Dialog.Header class="px-3 py-2 border-b space-y-0">
			<Dialog.Title class="text-sm truncate">{title}</Dialog.Title>
			<a href={src} target="_blank" class="text-xs text-primary hover:underline">
				Buka di Tab Baru
			</a>
		</Dialog.Header>
		<iframe {src} {title} class="flex-1 w-full border-0"></iframe>
	</Dialog.Content>
</Dialog.Root>
