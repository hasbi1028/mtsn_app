<script lang="ts">
	import { getBerandaDataQ } from '$modules/public/public.remote';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Users from '@lucide/svelte/icons/users';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Building from '@lucide/svelte/icons/building';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Images from '@lucide/svelte/icons/images';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Star from '@lucide/svelte/icons/star';
import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Phone from '@lucide/svelte/icons/phone';
	import Mail from '@lucide/svelte/icons/mail';
	import Clock from '@lucide/svelte/icons/clock';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import BookMarked from '@lucide/svelte/icons/book-marked';
	import Globe from '@lucide/svelte/icons/globe';

	const dataQ = $derived(getBerandaDataQ());

	// Slider
	let currentSlide = $state(0);
	const slides = [
		{ title: 'Selamat Datang', subtitle: 'di MTsN 2 Kolaka Utara', desc: 'Mencetak generasi cerdas, berkarakter, dan beriman', bg: 'from-emerald-800 via-emerald-700 to-teal-700' },
		{ title: 'Kepala Madrasah', subtitle: 'Menyapa Siswa & Orang Tua', desc: 'Selamat belajar, semoga sukses', bg: 'from-blue-800 via-blue-700 to-indigo-700' },
		{ title: 'Kegiatan Belajar', subtitle: 'Pembelajaran Aktif & Inovatif', desc: 'Kurikulum Merdeka berpusat pada siswa', bg: 'from-purple-800 via-purple-700 to-violet-700' },
		{ title: 'Prestasi Siswa', subtitle: 'Berprestasi di Tingkat Nasional', desc: 'Mengharumkan nama madrasah', bg: 'from-amber-700 via-amber-600 to-orange-600' },
	];
	let slideInterval: ReturnType<typeof setInterval>;

	function startSlider() {
		slideInterval = setInterval(() => {
			currentSlide = (currentSlide + 1) % slides.length;
		}, 5000);
	}
	function stopSlider() { clearInterval(slideInterval); }
	function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; stopSlider(); startSlider(); }
	function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; stopSlider(); startSlider(); }
	function goToSlide(i: number) { currentSlide = i; stopSlider(); startSlider(); }

	$effect(() => { startSlider(); return () => stopSlider(); });

	function formatDate(d: string | null) {
		if (!d) return '';
		return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
	}
	function getKategoriBadge(k: string | null) {
		const m: Record<string, string> = { umum: 'bg-blue-100 text-blue-700', kegiatan: 'bg-green-100 text-green-700', prestasi: 'bg-amber-100 text-amber-700' };
		return m[k ?? ''] ?? 'bg-gray-100 text-gray-700';
	}
	function getTingkatBadge(t: string | null) {
		const m: Record<string, string> = { nasional: 'bg-red-100 text-red-700', provinsi: 'bg-purple-100 text-purple-700', kabupaten: 'bg-sky-100 text-sky-700', sekolah: 'bg-gray-100 text-gray-700' };
		return m[t ?? ''] ?? 'bg-gray-100 text-gray-700';
	}
</script>

<svelte:head>
	<title>MTsN 2 Kolaka Utara — Beranda</title>
	<meta name="description" content="Madrasah Tsanawiyah Negeri 2 Kolaka Utara — Sekolah unggulan berbasis agama Islam" />
</svelte:head>

{#await dataQ}
	<div class="min-h-screen flex items-center justify-center"><p class="text-muted-foreground">Memuat...</p></div>
{:then data}
<div class="min-h-screen">

	<!-- ==================== HERO SLIDER ==================== -->
	<section class="relative w-full h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden">
		{#each slides as slide, i}
			<div
				class="absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-r {slide.bg}
					{i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
			>
				<div class="absolute inset-0 bg-black/20"></div>
				<div class="relative z-10 h-full flex items-center">
					<div class="max-w-5xl mx-auto px-4 w-full">
						<div class="max-w-xl">
							<p class="text-white/70 text-sm mb-2 tracking-wider uppercase">{slide.title}</p>
							<h1 class="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">{slide.subtitle}</h1>
							<p class="text-white/80 text-base md:text-lg mb-6">{slide.desc}</p>
							<div class="flex flex-wrap gap-3">
								<a href="/ppdb" class="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
									DAFTAR SEKARANG <ChevronRight class="size-4" />
								</a>
								<a href="/profil" class="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors">
									Profil Sekolah
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}

		<!-- Slider controls -->
		<button class="absolute left-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer" onclick={prevSlide}>
			<ChevronLeft class="size-5" />
		</button>
		<button class="absolute right-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer" onclick={nextSlide}>
			<ChevronRight class="size-5" />
		</button>
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
			{#each slides as _, i}
				<button aria-label="Slide {i + 1}" class="size-2.5 rounded-full transition-colors cursor-pointer {i === currentSlide ? 'bg-white' : 'bg-white/40'}" onclick={() => goToSlide(i)}></button>
			{/each}
		</div>
	</section>

	<!-- ==================== STATISTIK ==================== -->
	<section class="relative -mt-8 z-20">
		<div class="max-w-5xl mx-auto px-4">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#each [
					{ icon: Users, value: data.stats.totalSiswa, label: 'Siswa', color: 'bg-blue-500' },
					{ icon: BookOpen, value: data.stats.totalGuru, label: 'Guru & Tendik', color: 'bg-emerald-500' },
					{ icon: Building, value: data.stats.totalRombel, label: 'Rombel', color: 'bg-amber-500' },
					{ icon: GraduationCap, value: data.stats.totalKelas, label: 'Kelas', color: 'bg-purple-500' },
				] as s}
					<div class="bg-white dark:bg-card rounded-xl shadow-lg border p-4 text-center hover:shadow-xl transition-shadow">
						<div class="inline-flex items-center justify-center size-10 rounded-full {s.color} text-white mb-2">
							<s.icon class="size-5" />
						</div>
						<div class="text-2xl md:text-3xl font-bold">{s.value}</div>
						<div class="text-xs text-muted-foreground">{s.label}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ==================== PROFIL SINGKAT ==================== -->
	<section class="py-12 md:py-16">
		<div class="max-w-5xl mx-auto px-4">
			<div class="grid md:grid-cols-2 gap-8 items-center">
				<div>
					<Badge variant="outline" class="mb-3 text-xs">Tentang Kami</Badge>
					<h2 class="text-2xl font-bold mb-4">MTsN 2 Kolaka Utara</h2>
					<p class="text-muted-foreground leading-relaxed mb-4">
						Madrasah Tsanawiyah Negeri 2 Kolaka Utara adalah lembaga pendidikan menengah yang bernaung di bawah Kementerian Agama Republik Indonesia. Berdiri dengan visi mencerdaskan kehidupan bangsa melalui pendidikan yang berkualitas, berakhlak mulia, dan berwawasan keagamaan.
					</p>
					<p class="text-muted-foreground leading-relaxed mb-6">
						Kami berkomitmen memberikan pendidikan terbaik bagi putra-putri Anda dengan tenaga pengajar profesional, kurikulum terkini, dan lingkungan belajar yang kondusif.
					</p>
					<a href="/profil" class="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline">
						Selengkapnya <ChevronRight class="size-4" />
					</a>
				</div>
				<div class="rounded-xl overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
					<!-- Placeholder: Admin bisa ganti dengan foto gedung sekolah -->
					<div class="text-center p-8">
						<Building class="size-16 text-muted-foreground/30 mx-auto mb-3" />
						<p class="text-xs text-muted-foreground">Foto Gedung Sekolah</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ==================== PROGRAM UNGGULAN ==================== -->
	<section class="py-10 bg-muted/30 border-y">
		<div class="max-w-5xl mx-auto px-4">
			<div class="text-center mb-8">
				<Badge variant="outline" class="mb-3 text-xs">Unggulan</Badge>
				<h2 class="text-2xl font-bold">Program Unggulan</h2>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				{#each [
					{ icon: BookMarked, title: 'Tahfidz Al-Qur\'an', desc: 'Hafalan Al-Qur\'an' },
					{ icon: Globe, title: 'Bahasa Arab', desc: 'Bahasa internasional' },
					{ icon: BookOpen, title: 'BTQ', desc: 'Baca Tulis Al-Qur\'an' },
					{ icon: CheckCircle, title: 'Projek P5', desc: 'Profil Pelajar Pancasila' },
					{ icon: Globe, title: 'Bahasa Inggris', desc: 'English proficiency' },
					{ icon: Star, title: 'Leadership', desc: 'Kepemimpinan' },
				] as p}
					<div class="rounded-xl border bg-card p-4 text-center hover:shadow-md transition-shadow hover:border-primary/50">
						<div class="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-3">
							<p.icon class="size-6" />
						</div>
						<h3 class="font-semibold text-sm mb-1">{p.title}</h3>
						<p class="text-xs text-muted-foreground">{p.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ==================== BERITA + PENGUMUMAN ==================== -->
	<section class="py-10 md:py-14">
		<div class="max-w-5xl mx-auto px-4">
			<div class="grid lg:grid-cols-[1fr_1.4fr] gap-8">
				<!-- Pengumuman -->
				<div>
					<div class="flex items-center gap-2 mb-4">
						<Megaphone class="size-5 text-red-600" />
						<h2 class="text-lg font-bold">Pengumuman</h2>
					</div>
					<div class="space-y-3">
						{#each data.pengumuman as p (p.id)}
							<div class="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow">
								<div class="flex items-start gap-2">
									{#if p.penting}
										<Badge variant="destructive" class="shrink-0 mt-0.5 text-[10px]">Penting</Badge>
									{/if}
									<div class="min-w-0">
										<h3 class="font-medium text-sm leading-snug">{p.judul}</h3>
										<p class="text-xs text-muted-foreground mt-1 line-clamp-2">{p.konten}</p>
										<p class="text-[10px] text-muted-foreground mt-1.5">{formatDate(p.publishedAt)}</p>
									</div>
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground text-center py-4">Belum ada pengumuman</p>
						{/each}
					</div>
				</div>

				<!-- Berita -->
				<div>
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<Newspaper class="size-5 text-primary" />
							<h2 class="text-lg font-bold">Berita Terbaru</h2>
						</div>
						<a href="/berita" class="text-sm text-primary hover:underline flex items-center gap-1">
							Lihat Semua <ChevronRight class="size-3.5" />
						</a>
					</div>
					<div class="grid sm:grid-cols-2 gap-3">
						{#each data.berita.slice(0, 4) as b (b.id)}
							<a href="/berita/{b.slug}" class="group block">
								<div class="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
									{#if b.gambar}
										<div class="aspect-video bg-muted overflow-hidden">
											<img src={b.gambar} alt={b.judul} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
										</div>
									{:else}
										<div class="aspect-video bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 flex items-center justify-center">
											<Newspaper class="size-8 text-emerald-300" />
										</div>
									{/if}
									<div class="p-3">
										<div class="flex items-center gap-2 mb-1.5">
											<span class="text-[10px] font-medium px-1.5 py-0.5 rounded {getKategoriBadge(b.kategori)}">{b.kategori}</span>
											<span class="text-[10px] text-muted-foreground">{formatDate(b.publishedAt)}</span>
										</div>
										<h3 class="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{b.judul}</h3>
										{#if b.ringkasan}
											<p class="text-xs text-muted-foreground mt-1 line-clamp-2">{b.ringkasan}</p>
										{/if}
									</div>
								</div>
							</a>
						{:else}
							<div class="sm:col-span-2 text-center py-8 text-muted-foreground text-sm">Belum ada berita</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ==================== AGENDA ==================== -->
	{#if data.agenda.length > 0}
		<section class="py-10 bg-muted/30 border-y">
			<div class="max-w-5xl mx-auto px-4">
				<div class="flex items-center justify-between mb-5">
					<div class="flex items-center gap-2">
						<CalendarDays class="size-5 text-blue-600" />
						<h2 class="text-lg font-bold">Agenda Kegiatan</h2>
					</div>
					<a href="/kalender" class="text-sm text-primary hover:underline flex items-center gap-1">Lihat Kalender <ChevronRight class="size-3.5" /></a>
				</div>
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each data.agenda as a (a.id)}
						<div class="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
							<div class="flex items-start gap-3">
								<div class="shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white" style="background-color: {a.warna ?? '#3b82f6'}">
									<span class="text-[10px] font-medium leading-none">{new Date(a.tanggalMulai).toLocaleDateString('id-ID', { month: 'short' })}</span>
									<span class="text-lg font-bold leading-none">{new Date(a.tanggalMulai).getDate()}</span>
								</div>
								<div class="min-w-0">
									<h3 class="font-medium text-sm">{a.judul}</h3>
									{#if a.lokasi}
										<p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin class="size-3" /> {a.lokasi}</p>
									{/if}
									{#if a.tanggalSelesai}
										<p class="text-[10px] text-muted-foreground mt-1">s/d {formatDate(a.tanggalSelesai)}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ==================== GALERI ==================== -->
	{#if data.galeri.length > 0}
		<section class="py-10 md:py-14">
			<div class="max-w-5xl mx-auto px-4">
				<div class="flex items-center justify-between mb-5">
					<div class="flex items-center gap-2">
						<Images class="size-5 text-purple-600" />
						<h2 class="text-lg font-bold">Galeri Foto</h2>
					</div>
					<a href="/galeri" class="text-sm text-primary hover:underline flex items-center gap-1">Lihat Semua <ChevronRight class="size-3.5" /></a>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
					{#each data.galeri as g (g.id)}
						<div class="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
							<img src={g.gambar} alt={g.judul} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
							<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
								<span class="text-white text-xs font-medium">{g.judul}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ==================== PRESTASI ==================== -->
	{#if data.prestasi.length > 0}
		<section class="py-10 bg-muted/30 border-y">
			<div class="max-w-5xl mx-auto px-4">
				<div class="flex items-center justify-between mb-5">
					<div class="flex items-center gap-2">
						<Trophy class="size-5 text-amber-600" />
						<h2 class="text-lg font-bold">Prestasi Terbaru</h2>
					</div>
					<a href="/prestasi" class="text-sm text-primary hover:underline flex items-center gap-1">Lihat Semua <ChevronRight class="size-3.5" /></a>
				</div>
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each data.prestasi as p (p.id)}
						<div class="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
							{#if p.gambar}
								<div class="aspect-[2/1] bg-muted overflow-hidden">
									<img src={p.gambar} alt={p.judul} class="w-full h-full object-cover" />
								</div>
							{:else}
								<div class="aspect-[2/1] bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center">
									<Trophy class="size-10 text-amber-300" />
								</div>
							{/if}
							<div class="p-3">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="text-[10px] font-medium px-1.5 py-0.5 rounded {getTingkatBadge(p.tingkat)}">{p.tingkat}</span>
									{#if p.tahun}<span class="text-[10px] text-muted-foreground">{p.tahun}</span>{/if}
								</div>
								<h3 class="font-medium text-sm">{p.judul}</h3>
								{#if p.pemenang}<p class="text-xs text-muted-foreground mt-1">{p.pemenang}</p>{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ==================== EKSKUL ==================== -->
	{#if data.ekskul.length > 0}
		<section class="py-10 md:py-14">
			<div class="max-w-5xl mx-auto px-4">
				<div class="flex items-center justify-between mb-5">
					<div class="flex items-center gap-2">
						<Star class="size-5 text-orange-600" />
						<h2 class="text-lg font-bold">Ekstrakurikuler</h2>
					</div>
					<a href="/ekskul" class="text-sm text-primary hover:underline flex items-center gap-1">Lihat Semua <ChevronRight class="size-3.5" /></a>
				</div>
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each data.ekskul as e (e.id)}
						<div class="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
							<div class="flex items-start gap-3">
								{#if e.gambar}
									<div class="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
										<img src={e.gambar} alt={e.nama} class="w-full h-full object-cover" />
									</div>
								{:else}
									<div class="shrink-0 w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
										<Star class="size-5 text-orange-500" />
									</div>
								{/if}
								<div class="min-w-0">
									<h3 class="font-medium text-sm">{e.nama}</h3>
									{#if e.pembina}
										<p class="text-xs text-muted-foreground mt-0.5">Pembina: {e.pembina}</p>
									{/if}
									{#if e.jadwal}
										<p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock class="size-3" /> {e.jadwal}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- ==================== CTA PPDB ==================== -->
	<section class="py-10 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white">
		<div class="max-w-5xl mx-auto px-4">
			<div class="flex flex-col md:flex-row items-center justify-between gap-6">
				<div>
					<Badge class="bg-white/20 text-white border-0 mb-3 text-xs">PPDB 2026/2027</Badge>
					<h2 class="text-2xl font-bold mb-2">Penerimaan Peserta Didik Baru</h2>
					<p class="text-emerald-200 max-w-lg">Daftarkan putra-putri Anda di MTsN 2 Kolaka Utara. Pendaftaran dibuka untuk siswa baru tahun ajaran 2026/2027.</p>
				</div>
				<a href="/ppdb" class="shrink-0 inline-flex items-center gap-2 bg-white text-emerald-800 px-8 py-3 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-colors">
					DAFTAR SEKARANG <ChevronRight class="size-4" />
				</a>
			</div>
		</div>
	</section>

	<!-- ==================== LOKASI / MAPS ==================== -->
	<section class="py-10">
		<div class="max-w-5xl mx-auto px-4">
			<div class="text-center mb-6">
				<h2 class="text-lg font-bold">Lokasi Kami</h2>
				<p class="text-sm text-muted-foreground">MTsN 2 Kolaka Utara</p>
			</div>
			<div class="grid md:grid-cols-[1fr_1.5fr] gap-6">
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="p-2 rounded-lg bg-primary/10"><MapPin class="size-5 text-primary" /></div>
						<div>
							<h3 class="font-medium text-sm">Alamat</h3>
							<p class="text-xs text-muted-foreground mt-0.5">Kolaka Utara, Sulawesi Tenggara, Indonesia</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="p-2 rounded-lg bg-primary/10"><Phone class="size-5 text-primary" /></div>
						<div>
							<h3 class="font-medium text-sm">Telepon</h3>
							<p class="text-xs text-muted-foreground mt-0.5">Hubungi sekolah</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="p-2 rounded-lg bg-primary/10"><Mail class="size-5 text-primary" /></div>
						<div>
							<h3 class="font-medium text-sm">Email</h3>
							<p class="text-xs text-muted-foreground mt-0.5">info@mtsn2kolut.sch.id</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="p-2 rounded-lg bg-primary/10"><Clock class="size-5 text-primary" /></div>
						<div>
							<h3 class="font-medium text-sm">Jam Kerja</h3>
							<p class="text-xs text-muted-foreground mt-0.5">Senin — Sabtu, 07:00 — 15:00 WITA</p>
						</div>
					</div>
				</div>
				<div class="rounded-xl overflow-hidden border bg-muted aspect-[16/9]">
					<!-- Placeholder: Admin bisa embed Google Maps -->
					<div class="w-full h-full flex items-center justify-center">
						<div class="text-center">
							<MapPin class="size-10 text-muted-foreground/30 mx-auto mb-2" />
							<p class="text-xs text-muted-foreground">Google Maps — Kolaka Utara</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

</div>
{/await}
