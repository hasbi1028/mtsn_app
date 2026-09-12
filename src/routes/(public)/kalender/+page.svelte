<script lang="ts">
	import { getAgendaUpcomingQ } from '$modules/agenda/agenda.remote';
	import { Card } from '$lib/components/ui/card/index.js';
	import PublicPageHeader from '$lib/components/public-page-header.svelte';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import MapPin from '@lucide/svelte/icons/map-pin';

	function formatDate(d: string | null) {
		if (!d) return '';
		const date = new Date(d);
		return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}

	function getMonth(d: string) {
		return new Date(d).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
	}

	function getDay(d: string) {
		return new Date(d).getDate();
	}
</script>

<svelte:head>
	<title>Kalender Akademik — MTsN 2 Kolaka Utara</title>
	<meta name="description" content="Kalender kegiatan dan agenda MTsN 2 Kolaka Utara" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<PublicPageHeader icon={CalendarDays} title="Kalender Akademik" subtitle="Jadwal kegiatan dan agenda madrasah" accent="blue" />

	<!-- Agenda List -->
	<section class="py-8">
		<div class="max-w-5xl mx-auto px-4">
			{#await getAgendaUpcomingQ()}
				<p class="text-center text-muted-foreground py-12">Memuat agenda...</p>
			{:then agenda}
				{#if agenda.length > 0}
					<div class="space-y-4">
						{#each agenda as a (a.id)}
							<Card class="p-4 hover:shadow-md transition-shadow">
								<div class="flex gap-4">
								<div class="shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-sm" style="background-color: {a.warna ?? '#3b82f6'}">
									<span class="text-[10px] font-bold leading-none tracking-wider">{getMonth(a.tanggalMulai)}</span>
									<span class="text-2xl font-bold leading-none mt-0.5">{getDay(a.tanggalMulai)}</span>
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-semibold text-base mb-1">{a.judul}</h3>
									{#if a.deskripsi}
										<p class="text-sm text-muted-foreground mb-2 line-clamp-2">{a.deskripsi}</p>
									{/if}
									<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
										<span class="flex items-center gap-1">
											<CalendarDays class="size-3.5" />
											{formatDate(a.tanggalMulai)}
											{#if a.tanggalSelesai}
												- {formatDate(a.tanggalSelesai)}
											{/if}
										</span>
										{#if a.lokasi}
											<span class="flex items-center gap-1">
												<MapPin class="size-3.5" />
												{a.lokasi}
											</span>
										{/if}
									</div>
								</div>
								</div>
							</Card>
						{/each}
					</div>
				{:else}
					<div class="text-center py-16">
						<CalendarDays class="size-12 mx-auto text-muted-foreground/40 mb-3" />
						<p class="text-muted-foreground">Belum ada agenda kegiatan</p>
					</div>
				{/if}
			{/await}
		</div>
	</section>
</div>
