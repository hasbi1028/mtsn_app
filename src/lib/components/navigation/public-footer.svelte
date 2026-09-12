<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<footer class="border-t bg-muted/40">
	<div class="mx-auto max-w-5xl px-4 py-8">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<!-- Brand -->
			<div>
				<h3 class="font-semibold text-sm mb-2">MTsN 2 Kolaka Utara</h3>
				<p class="text-xs text-muted-foreground leading-relaxed">Madrasah Tsanawiyah Negeri 2 Kolaka Utara — Mendidik Generasi Berakhlak Mulia</p>
			</div>

			<!-- Profil -->
			<div>
				<h3 class="font-semibold text-sm mb-2">Profil</h3>
				<ul class="space-y-1 text-xs text-muted-foreground">
					<li><a href="/profil" class="hover:underline">Tentang Kami</a></li>
					<li><a href="/profil/visi-misi" class="hover:underline">Visi & Misi</a></li>
					<li><a href="/kurikulum" class="hover:underline">Kurikulum</a></li>
					<li><a href="/guru" class="hover:underline">Daftar Guru</a></li>
					<li><a href="/fasilitas" class="hover:underline">Fasilitas</a></li>
				</ul>
			</div>

			<!-- Akademik -->
			<div>
				<h3 class="font-semibold text-sm mb-2">Akademik</h3>
				<ul class="space-y-1 text-xs text-muted-foreground">
					<li><a href="/kalender" class="hover:underline">Kalender Akademik</a></li>
					<li><a href="/ekskul" class="hover:underline">Ekstrakurikuler</a></li>
					<li><a href="/prestasi" class="hover:underline">Prestasi</a></li>
					<li><a href="/galeri" class="hover:underline">Galeri</a></li>
					<li><a href="/berita" class="hover:underline">Berita</a></li>
				</ul>
			</div>

			<!-- PPDB & Kontak -->
			<div>
				<h3 class="font-semibold text-sm mb-2">PPDB & Kontak</h3>
				<ul class="space-y-1 text-xs text-muted-foreground">
					<li><a href="/ppdb" class="hover:underline">Penerimaan Siswa Baru</a></li>
					<li><a href="/kontak" class="hover:underline">Hubungi Kami</a></li>
					<li class="mt-2">Jl. Pendidikan No. 1, Kolaka Utara</li>
					<li>Sulawesi Tenggara, Indonesia</li>
					<li>Email: info@mtsn2kolut.sch.id</li>
				</ul>
			</div>
		</div>

		<Separator class="my-6" />

		<div class="text-center text-[11px] text-muted-foreground">
			&copy; {new Date().getFullYear()} MTsN 2 Kolaka Utara. Hak Cipta Dilindungi.
		</div>
	</div>
</footer>
