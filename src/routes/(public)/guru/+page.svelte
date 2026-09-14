<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import { getPublicGuruListQ } from '$modules/public/public.remote';
	import { Input } from '$lib/components/ui/input/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';
	import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
	import AwardIcon from '@lucide/svelte/icons/award';

	const allData = $derived(getPublicGuruListQ() as Promise<any[]>);

	let search = $state('');
	let filterRole = $state<'all' | 'guru' | 'staf'>('all');

	const filtered = $derived.by(async () => {
		const data = await allData;
		let list = data || [];
		if (filterRole === 'guru') list = list.filter((g: any) => g.fungsi === 'Guru');
		else if (filterRole === 'staf') list = list.filter((g: any) => g.fungsi !== 'Guru');
		if (search) {
			const q = search.toLowerCase();
			list = list.filter((g: any) => g.nama?.toLowerCase().includes(q) || g.jabatanStruktural?.toLowerCase().includes(q));
		}
		return list;
	});

	function getInitials(name: string) {
		return name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '??';
	}

	function fotoUrl(p: any) {
		if (p.fotoPath) return `/${p.fotoPath}`;
		return '';
	}
</script>

<svelte:head>
	<title>Guru & Staf — MTsN 2 Kolaka Utara</title>
</svelte:head>

<div class="min-h-screen">
<PublicPageHeader
	icon={UsersIcon}
	title="Guru & Staf"
	subtitle="Tenaga pendidik dan kependidikan yang berdedikasi untuk mencerdaskan generasi bangsa"
	accent="primary"
/>

<div class="mx-auto max-w-5xl px-4 pt-6">
	<a
		href="/profil/struktur"
		class="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted"
	>
		<span class="font-medium">Lihat Struktur Organisasi madrasah</span>
		<span class="text-xs text-muted-foreground">pimpinan · TU · wali kelas →</span>
	</a>
</div>

<div class="mx-auto max-w-5xl px-4 py-8">
	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-3 mb-8">
		<div class="relative flex-1">
			<SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				placeholder="Cari nama atau jabatan..."
				bind:value={search}
				class="pl-9"
			/>
		</div>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer {filterRole === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}"
				onclick={() => filterRole = 'all'}
			>Semua</button>
			<button
				class="px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer {filterRole === 'guru' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}"
				onclick={() => filterRole = 'guru'}
			>Guru</button>
			<button
				class="px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer {filterRole === 'staf' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}"
				onclick={() => filterRole = 'staf'}
			>Staf</button>
		</div>
	</div>

	{#await filtered}
		<!-- Loading skeleton -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each [1,2,3,4,5,6,7,8] as _, i (i)}
				<Card class="animate-pulse">
					<CardContent class="p-5">
						<div class="flex flex-col items-center text-center">
							<div class="size-24 rounded-full bg-muted mb-3"></div>
							<div class="h-4 w-32 bg-muted rounded mb-2"></div>
							<div class="h-3 w-20 bg-muted rounded mb-2"></div>
							<div class="h-5 w-16 bg-muted rounded"></div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:then data}
		{#if data.length === 0}
			<div class="text-center py-12">
				<UsersIcon class="size-12 text-muted-foreground mx-auto mb-3" />
				<p class="text-muted-foreground">Tidak ditemukan guru atau staf</p>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground mb-4">{data.length} orang terdaftar</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each data as person (person.nama)}
					<Card class="group hover:shadow-md transition-shadow overflow-hidden">
						<CardContent class="p-5">
							<div class="flex flex-col items-center text-center">
								<!-- Foto / Placeholder -->
								<div class="relative size-28 rounded-full overflow-hidden mb-3 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
									{#if fotoUrl(person)}
										<img src={fotoUrl(person)} alt={person.nama} class="size-full object-cover" />
									{:else}
										<!-- Gendered SVG silhouette placeholder -->
										<div class="size-full flex items-center justify-center {person.jk === 'P' ? 'bg-pink-50 dark:bg-pink-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}">
											{#if person.jk === 'P'}
												<!-- Female silhouette -->
												<svg viewBox="0 0 80 80" class="size-16 text-pink-300 dark:text-pink-700">
													<circle cx="40" cy="24" r="14" fill="currentColor"/>
													<path d="M40 40 C20 40 12 56 10 70 L30 70 C30 62 34 58 40 58 C46 58 50 62 50 70 L70 70 C68 56 60 40 40 40Z" fill="currentColor"/>
												</svg>
											{:else}
												<!-- Male silhouette -->
												<svg viewBox="0 0 80 80" class="size-16 text-blue-300 dark:text-blue-700">
													<circle cx="40" cy="24" r="14" fill="currentColor"/>
													<path d="M40 40 C22 40 14 54 12 68 L30 68 C30 60 34 56 40 56 C46 56 50 60 50 68 L68 68 C66 54 58 40 40 40Z" fill="currentColor"/>
												</svg>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Info -->
								<h3 class="font-semibold text-sm leading-tight">{person.nama}</h3>
								<p class="text-xs text-muted-foreground mt-0.5">
									{person.fungsi || 'Guru'}
								</p>

								<!-- Badges -->
								<div class="flex flex-wrap gap-1 justify-center mt-2">
									{#if person.jabatanStruktural}
										<Badge variant="secondary" class="text-[10px]">
											<BriefcaseIcon class="size-2.5 mr-0.5" />
											{person.jabatanStruktural}
										</Badge>
									{/if}
									{#if person.waliKelas}
										<Badge variant="outline" class="text-[10px]">
											Wali {person.waliKelas}
										</Badge>
									{/if}
									{#if person.sertifikasi}
										<Badge class="text-[10px] bg-emerald-600 hover:bg-emerald-600">
											<AwardIcon class="size-2.5 mr-0.5" />
											Sertifikasi
										</Badge>
									{/if}
								</div>

								<!-- Biografi -->
								{#if person.biografi}
									<p class="text-[11px] text-muted-foreground mt-2 line-clamp-2">{person.biografi}</p>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{:catch}
		<div class="text-center py-12">
			<p class="text-sm text-muted-foreground">Gagal memuat data guru</p>
		</div>
	{/await}
</div>
</div>
