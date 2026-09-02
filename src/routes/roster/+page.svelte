<script lang="ts">
	import PageLayout from '$lib/components/page-layout.svelte';
	import DataTable from '$lib/components/data-table.svelte';

	let { data } = $props();
	const rows = $derived(data.rows as any[]);

	const columns = [
		{ key: 'hari', label: 'Hari' },
		{ key: 'jamKe', label: 'Jam' },
		{ key: 'mapel', label: 'Mapel' },
		{ key: 'guru', label: 'Guru' },
	];

	function onChange(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		if (v) window.location.href = `/roster?kelas=${v}`;
	}
</script>

<PageLayout title="Roster" description="Jadwal pelajaran per kelas">
	{#snippet actions()}
		<select
			class="border border-input bg-background rounded-md px-3 py-1.5 text-sm cursor-pointer"
			value={data.kelas}
			onchange={onChange}
		>
			{#each data.daftarKelas as k}
				<option value={k}>{k}</option>
			{/each}
		</select>
	{/snippet}

	<DataTable {columns} data={rows} emptyMessage="Tidak ada jadwal pelajaran" />

	<p class="mt-2 text-xs text-muted-foreground">{rows.length} jam pelajaran/minggu</p>
</PageLayout>
