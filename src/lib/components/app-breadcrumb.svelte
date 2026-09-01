<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { page } from '$app/state';
	import { buildBreadcrumb } from '$lib/breadcrumb-config';

	const items = $derived.by(() => {
		const p = page?.url?.pathname ?? '';
		return buildBreadcrumb(p);
	});
</script>

{#if items.length > 0}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			{#each items as item, i (item.label + i)}
				{#if i > 0}
					<Breadcrumb.Separator />
				{/if}
				<Breadcrumb.Item>
					{#if item.href}
						<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
					{:else}
						<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
					{/if}
				</Breadcrumb.Item>
			{/each}
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}