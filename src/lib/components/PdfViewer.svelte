<script lang="ts">
	let { src, title = 'PDF Document' } = $props();
	let showViewer = $state(false);
</script>

{#if showViewer}
	<div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
		<div class="bg-background rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
			<div class="flex items-center justify-between p-3 border-b">
				<span class="text-sm font-medium truncate">{title}</span>
				<div class="flex gap-2">
					<a href={src} target="_blank" class="text-xs text-primary hover:underline">Buka di Tab Baru</a>
					<button onclick={() => showViewer = false} class="text-xs text-muted-foreground hover:text-foreground">✕ Tutup</button>
				</div>
			</div>
			<iframe src={src} class="flex-1 w-full border-0"></iframe>
		</div>
	</div>
{:else}
	<button onclick={() => showViewer = true} class="text-sm text-primary hover:underline cursor-pointer">
		{title}
	</button>
{/if}
