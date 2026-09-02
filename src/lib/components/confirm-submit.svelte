<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
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
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button type="button" size="sm" {variant} class={buttonClass} {...props}>
				{@render children?.()}
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<form method="POST" {action} class="flex justify-end gap-2">
			{#each Object.entries(fields) as [name, value] (name)}
				<input type="hidden" {name} value={String(value ?? '')} />
			{/each}
			<AlertDialog.Cancel>
				{#snippet child({ props })}
					<Button type="button" variant="outline" size="sm" {...props}>{cancelLabel}</Button>
				{/snippet}
			</AlertDialog.Cancel>
			<Button type="submit" variant="destructive" size="sm">{confirmLabel}</Button>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>
