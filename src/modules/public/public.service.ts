import { db } from '$lib/server/db';
import { ptk, siswa, rombel, berita, pengumuman, agenda, galeri, ekskul, prestasi } from '$lib/server/db/schema';
import { count, eq, sql, desc } from 'drizzle-orm';

export function getPublicStats() {
	const totalSiswa = db.select({ count: count() }).from(siswa).get();
	const totalPtk = db.select({ count: count() }).from(ptk).get();
	const totalRombel = db.select({ count: count() }).from(rombel).where(eq(rombel.aktif, true)).get();

	const kelasList = db.all(sql`SELECT DISTINCT kelas FROM rombel WHERE aktif=1 ORDER BY kelas`);

	return {
		totalSiswa: totalSiswa?.count ?? 0,
		totalGuru: totalPtk?.count ?? 0,
		totalRombel: totalRombel?.count ?? 0,
		totalKelas: kelasList.length
	};
}

export function getPublicGuruList() {
	return db.all(sql`
		SELECT nama, fungsi, sertifikasi, wali_kelas AS waliKelas, jabatan_struktural AS jabatanStruktural, foto_path AS fotoPath, jk, biografi
		FROM ptk
		WHERE fungsi = 'Guru' OR fungsi = 'Staf' OR fungsi IS NULL
		ORDER BY
			CASE WHEN jabatan_struktural IS NOT NULL AND jabatan_struktural != '' THEN 0 ELSE 1 END,
		nama
	`);
}

export function getBerandaData() {
	const stats = getPublicStats();

	const latestBerita = db
		.select({ id: berita.id, slug: berita.slug, judul: berita.judul, ringkasan: berita.ringkasan, gambar: berita.gambar, penulis: berita.penulis, kategori: berita.kategori, publishedAt: berita.publishedAt })
		.from(berita)
		.where(eq(berita.published, true))
		.orderBy(desc(berita.publishedAt))
		.limit(6)
		.all();

	const latestPengumuman = db
		.select({ id: pengumuman.id, judul: pengumuman.judul, konten: pengumuman.konten, penting: pengumuman.penting, publishedAt: pengumuman.publishedAt })
		.from(pengumuman)
		.where(eq(pengumuman.published, true))
		.orderBy(desc(pengumuman.publishedAt))
		.limit(5)
		.all();

	const upcomingAgenda = db
		.select()
		.from(agenda)
		.orderBy(agenda.tanggalMulai)
		.limit(5)
		.all();

	const latestGaleri = db
		.select({ id: galeri.id, judul: galeri.judul, gambar: galeri.gambar, kategori: galeri.kategori })
		.from(galeri)
		.orderBy(desc(galeri.createdAt))
		.limit(8)
		.all();

	const ekskulList = db
		.select({ id: ekskul.id, nama: ekskul.nama, slug: ekskul.slug, gambar: ekskul.gambar, pembina: ekskul.pembina, jadwal: ekskul.jadwal })
		.from(ekskul)
		.where(eq(ekskul.aktif, true))
		.orderBy(ekskul.nama)
		.limit(6)
		.all();

	const prestasiList = db
		.select()
		.from(prestasi)
		.orderBy(desc(prestasi.tahun))
		.limit(6)
		.all();

	return {
		stats,
		berita: latestBerita,
		pengumuman: latestPengumuman,
		agenda: upcomingAgenda,
		galeri: latestGaleri,
		ekskul: ekskulList,
		prestasi: prestasiList
	};
}
