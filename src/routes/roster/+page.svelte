<script lang="ts">
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
		let { data } = $props();
	const rows = $derived(data.rows as any[]);
	function onChange(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		if (v) window.location.href = `/roster?kelas=${v}`;
	}
</script>

<svelte:head><title>Roster — MTsN App</title></svelte:head>

<div class="flex items-center gap-3 mb-3">
	<h1 class="text-lg font-semibold">Roster {data.kelas}</h1>
	<select class="border border-input bg-background rounded-md px-3 py-1.5 text-sm ml-auto cursor-pointer" value={data.kelas} onchange={onChange}>
		{#each data.daftarKelas as k}
			<option value={k}>{k}</option>
		{/each}
	</select>
</div>

<Card>
	<CardContent class="p-0">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead class="text-xs">Hari</TableHead>
					<TableHead class="text-xs">Jam</TableHead>
					<TableHead class="text-xs">Mapel</TableHead>
					<TableHead class="text-xs">Guru</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each rows as r}
					<TableRow>
						<TableCell class="text-xs whitespace-nowrap">{r.hari}</TableCell>
						<TableCell class="text-xs">{r.jamKe}</TableCell>
						<TableCell class="text-xs">{r.mapel}</TableCell>
						<TableCell class="text-xs">{r.guru}</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
<p class="mt-2 text-xs text-muted-foreground">{rows.length} jam pelajaran/minggu</p>
