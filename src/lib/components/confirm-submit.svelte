<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';

	let {
		action,
		fields = {},
		title = 'Konfirmasi aksi',
		description = 'Aksi ini akan diproses.',
		confirmLabel = 'Lanjutkan',
		cancelLabel = 'Batal',
		variant = 'destructive',
		buttonClass = '',
		children
	}: {
		action: string;
		fields?: Record<string, string | number | boolean | null | undefined>;
		title?: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
		buttonClass?: string;
		children?: Snippet;
	} = $props();

	let open = $state(false);
</script>

<Button type="button" size="sm" {variant} class={buttonClass} onclick={() => (open = true)}>
	{@render children?.()}
</Button>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="presentation">
		<div class="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
			<div class="space-y-1">
				<h2 id="confirm-title" class="text-base font-semibold">{title}</h2>
				<p id="confirm-description" class="text-sm text-muted-foreground">{description}</p>
			</div>
			<form method="POST" {action} class="mt-4 flex justify-end gap-2">
				{#each Object.entries(fields) as [name, value] (name)}
					<input type="hidden" {name} value={String(value ?? '')} />
				{/each}
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>{cancelLabel}</Button>
				<Button type="submit" variant="destructive" size="sm">{confirmLabel}</Button>
			</form>
		</div>
	</div>
{/if}
