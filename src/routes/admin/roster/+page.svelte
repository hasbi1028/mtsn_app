<script lang="ts">
	import PageLayout from '$lib/components/page-layout.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import { getRosterListQ } from '$modules/roster/roster.remote';
	import { page } from '$app/state';

	let kelasParam = $derived(page.url.searchParams.get('kelas') || '');
	const rosterQuery = $derived(getRosterListQ(kelasParam) as Promise<any>);

	const columns = [
		{ key: 'hari', label: 'Hari' },
		{ key: 'jamKe', label: 'Jam' },
		{ key: 'mapel', label: 'Mapel' },
		{ key: 'guru', label: 'Guru' },
	];

	function onChange(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		if (v) window.location.href = `/admin/roster?kelas=${v}`;
	}
</script>

{#await rosterQuery}
	<p class="text-sm text-muted-foreground">Memuat jadwal...</p>
{:then rosterData}
	{@const rows = rosterData.rows as any[]}
	<PageLayout title="Roster" description="Jadwal pelajaran per kelas">
		{#snippet actions()}
			<select
				class="border border-input bg-background rounded-md px-3 py-1.5 text-sm cursor-pointer"
				value={rosterData.kelas}
				onchange={onChange}
			>
				{#each rosterData.daftarKelas as k}
					<option value={k}>{k}</option>
				{/each}
			</select>
		{/snippet}

		<DataTable {columns} data={rows} emptyMessage="Tidak ada jadwal pelajaran" />

		<p class="mt-2 text-xs text-muted-foreground">{rows.length} jam pelajaran/minggu</p>
	</PageLayout>
{/await}
