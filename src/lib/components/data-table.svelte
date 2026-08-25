<script lang="ts">
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import type { Snippet } from 'svelte';

	let {
		columns,
		data,
		emptyMessage = "Tidak ada data",
		onRowClick,
		children,
	}: {
		columns: { key: string; label: string; class?: string; hideOnMobile?: boolean }[];
		data: any[];
		emptyMessage?: string;
		onRowClick?: (row: any) => void;
		children?: Snippet<[{ row: any; column: typeof columns[0] }]>;
	} = $props();
</script>

<Card>
	<CardContent class="p-0">
		<Table>
			<TableHeader>
				<TableRow>
					{#each columns as col}
						<TableHead class="text-xs {col.class || ''} {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
							{col.label}
						</TableHead>
					{/each}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.length === 0}
					<TableRow>
						<TableCell colspan={columns.length} class="text-center text-muted-foreground py-8">
							{emptyMessage}
						</TableCell>
					</TableRow>
				{:else}
					{#each data as row}
						<TableRow 
							class={onRowClick ? 'cursor-pointer' : ''}
							onclick={() => onRowClick?.(row)}
						>
							{#each columns as col}
								<TableCell class="text-sm {col.class || ''} {col.hideOnMobile ? 'hidden sm:table-cell' : ''}">
									{#if children}
										{@render children({ row, column: col })}
									{:else}
										{row[col.key] ?? '—'}
									{/if}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</CardContent>
</Card>
