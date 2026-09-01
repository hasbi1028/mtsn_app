<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Printer from '@lucide/svelte/icons/printer';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { notify } from '$lib/toast';
	import { env } from '$env/dynamic/public';
	import { invalidate } from '$app/navigation';

	const API = env.PUBLIC_API_BASE || 'http://localhost:3730';

	let { data } = $props();
	const list = $derived(data.list as any[]);

	let generating = $state(false);

	function cardUrl(id: number | string) {
		return `${API}/api/siswa/${id}/kartu.png`;
	}

	function roman(k: string) {
		return k || '—';
	}

	async function generateAll() {
		generating = true;
		try {
			const res = await fetch(`${API}/api/siswa/kartu/generate-all`, { method: 'POST' });
			if (!res.ok) throw new Error('Gagal generate');
			const d = await res.json();
			notify.success(`Generate kartu: ${d.generated} berhasil, ${d.failed} gagal`);
			await invalidate('/siswa/kartu');
		} catch (err: any) {
			notify.error('Generate gagal: ' + (err.message || ''));
		} finally {
			generating = false;
		}
	}

	function printAll() {
		window.print();
	}
</script>

<svelte:head>
	<title>Cetak Kartu Siswa — SIMAD</title>
</svelte:head>

<!-- Screen-only toolbar -->
<div class="no-print toolbar">
	<a href="/siswa" class="back">
		<ArrowLeft class="size-4" /> Kembali
	</a>
	<div class="actions">
		<Button variant="outline" size="sm" onclick={generateAll} disabled={generating}>
			<RefreshCw class="size-4" />
			{generating ? 'Generating...' : 'Generate Semua Kartu'}
		</Button>
		<Button size="sm" onclick={printAll} disabled={!list.length}>
			<Printer class="size-4" /> Print Semua Kartu
		</Button>
	</div>
</div>

<div class="page-heading no-print">
	<h1>Kartu Siswa</h1>
	<p>{list.length} siswa dengan foto • kartu disimpan sebagai cache privat • download instan</p>
</div>

{#if list.length}
	<div class="kartu-grid">
		{#each list as row (row.id)}
			<div class="kartu-item print-item">
				<img src={cardUrl(row.id)} alt="Kartu {row.nama}" class="kartu-img" loading="lazy" />
				<div class="caption no-print">
					<span class="name">{row.nama}</span>
					<span class="sub">Kls {roman(row.kelas)}{row.rombel ? ' · ' + row.rombel : ''}</span>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="empty no-print">
		<p>Belum ada siswa yang mengupload foto.</p>
		<p class="hint">Upload foto siswa dulu di halaman profil/kartu siswa, lalu kembali ke sini.</p>
	</div>
{/if}

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid #e5e7eb;
		background: #fff;
	}
	.back {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		color: #64748b;
		font-size: 0.85rem;
		text-decoration: none;
	}
	.actions { display: flex; gap: 0.5rem; }
	.page-heading { padding: 1.25rem 1.5rem 0; }
	.page-heading h1 { font-size: 1.3rem; margin: 0; color: #173d2b; }
	.page-heading p { color: #6b7280; font-size: 0.8rem; margin: 0.3rem 0 0; }

	.kartu-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.25rem;
		padding: 1.5rem;
	}
	.kartu-item {
		text-align: center;
	}
	.kartu-img {
		width: 100%;
		max-width: 300px;
		object-fit: contain;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
	}
	.caption { margin-top: 0.5rem; }
	.caption .name { font-weight: 600; font-size: 0.85rem; display: block; }
	.caption .sub { color: #6b7280; font-size: 0.75rem; }

	.empty { padding: 3rem; text-align: center; color: #6b7280; }
	.empty .hint { font-size: 0.8rem; margin-top: 0.4rem; }

	/* Print: 2 kolom kartu per A4 */
	@media print {
		.no-print, .page-heading { display: none !important; }
		.kartu-grid {
			display: grid !important;
			grid-template-columns: 1fr 1fr !important;
			gap: 6mm !important;
			padding: 6mm !important;
		}
		.kartu-item { break-inside: avoid; page-break-inside: avoid; }
		.kartu-img {
			width: 85mm !important;
			height: 55mm !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			border: 1px solid #ccc !important;
		}
	}
</style>
