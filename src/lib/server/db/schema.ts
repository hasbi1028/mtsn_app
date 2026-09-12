import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// AUTH
// ============================================

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('admin'), // admin | guru | siswa | orangtua
	refId: integer('ref_id'), // FK ke ptk.id / siswa.id / ortu.id
	isActive: integer('is_active').default(1),
	lastLogin: text('last_login'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`strftime('%s','now')*1000`),
	updatedAt: text('updated_at')
});

export const sessions = sqliteTable('sessions', {
	token: text('token').primaryKey(),
	userId: integer('user_id').notNull(),
	expiresAt: integer('expires_at').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`strftime('%s','now')*1000`)
});

// ============================================
// PTK (Pendidik & Tenaga Kependidikan)
// ============================================

export const ptk = sqliteTable('ptk', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	publicId: text('public_id').unique(),
	nama: text('nama').notNull(),
	pegId: text('peg_id'),
	nip: text('nip'),
	nik: text('nik'),
	nuptk: text('nuptk'),
	jk: text('jk'), // L | P
	fungsi: text('fungsi'), // Guru | Staf
	kepegawaian: text('kepegawaian'), // PNS | P3K | Non PNS
	sertifikasi: integer('sertifikasi', { mode: 'boolean' }).default(false),
	kelengkapan: integer('kelengkapan'), // persen 0-100
	aktivasi: integer('aktivasi', { mode: 'boolean' }).default(false),
	waliKelas: text('wali_kelas'), // VII A dst
	jabatanStruktural: text('jabatan_struktural'), // Wakamad dll
	catatan: text('catatan'),
	userEmis: text('user_emis'),
	passEmis: text('pass_emis'),
	fotoPath: text('foto_path'),
	biografi: text('biografi')
});

export const jtmSemester = sqliteTable('jtm_semester', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	periode: text('periode').notNull().default('2026/2027 Ganjil'),
	mengajar: real('mengajar').default(0),
	tugas: real('tugas').default(0),
	totalS25a: real('total_s25a'),
	dashboardTotal: real('dashboard_total'),
	source: text('source') // emis | sk | manual
});

export const cuti = sqliteTable('cuti', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	jenis: text('jenis').notNull(),
	tanggalMulai: text('tanggal_mulai').notNull(),
	tanggalSelesai: text('tanggal_selesai').notNull(),
	keterangan: text('keterangan'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`),
	referencedDari: text('referenced_dari').default('EMISGTK')
});

// ============================================
// DOKUMEN (SKMT + SKBK + SKAKPT)
// ============================================

export const skmtAjuan = sqliteTable('skmt_ajuan', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	periode: text('periode').notNull().default('2026/Semester 1'),
	instansi: text('instansi').default('MTSN 2 KOLAKA UTARA'),
	status: text('status'), // Menunggu / Disetujui Kamad / Disetujui Pengawas / Ditolak
	nilaiPembelajaran: real('nilai_pembelajaran'),
	nilaiBimbingan: real('nilai_bimbingan'),
	tglAjuan: text('tgl_ajuan'),
	ajuanId: integer('ajuan_id')
});

export const skbkAjuan = sqliteTable('skbk_ajuan', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	periode: text('periode').default('2026/Semester 1'),
	instansi: text('instansi'),
	status: text('status').default('Belum Diajukan'), // Belum Diajukan | Sudah Diajukan
	jtmTotal: integer('jtm_total'),
	tglAjuan: text('tgl_ajuan'),
	keterangan: text('keterangan').default(''),
	skakptStatus: text('skakpt_status').default('Belum')
});

export const skakpt = sqliteTable('skakpt', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	periode: text('periode').default('2026/Semester 1'),
	bulan: text('bulan').default('Juli 2026'),
	status: text('status').default('Menunggu'),
	tglAjuan: text('tgl_ajuan'),
	tglVerifikasi: text('tgl_verifikasi'),
	detail: text('detail') // JSON: 11 indikator TPG
});

export const dokumen = sqliteTable('dokumen', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	jenis: text('jenis').default('SKMT Rekap'),
	filePath: text('file_path').notNull(),
	periode: text('periode'),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp_ms' }).default(sql`strftime('%s','now')*1000`)
});

// ============================================
// ROSTER (Jadwal Mengajar)
// ============================================

export const roster = sqliteTable('roster', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kelas: text('kelas').notNull(),
	hari: text('hari').notNull(),
	jamKe: text('jam_ke').notNull(),
	mapel: text('mapel').notNull(),
	guruNama: text('guru_nama').notNull(),
	guruKode: integer('guru_kode')
});

// ============================================
// SISWA (Students)
// ============================================

export const siswa = sqliteTable('siswa', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	publicId: text('public_id').unique(),
	nis: text('nis').unique(),
	nisn: text('nisn'),
	nama: text('nama').notNull(),
	jk: text('jk'), // L | P
	kelas: text('kelas'),
	tempatLahir: text('tempat_lahir'),
	tglLahir: text('tgl_lahir'),
	ayah: text('ayah'),
	ibu: text('ibu'),
	kerjaAyah: text('kerja_ayah'),
	kerjaIbu: text('kerja_ibu'),
	penghasilan: integer('penghasilan'),
	anakKe: integer('anak_ke'),
	dari: integer('dari'),
	asalSekolah: text('asal_sekolah'),
	alamat: text('alamat'),
	nik: text('nik'),
	bansosDesil: text('bansos_desil'),
	bansosSembako: text('bansos_sembako'),
	bansosPkh: text('bansos_pkh'),
	bansosPbijk: text('bansos_pbijk'),
	bansosKpd: text('bansos_kpd'),
	bansosCekAt: text('bansos_cek_at'),
	rombel: text('rombel'), // e.g. "VII-A"
	statusEmis: text('status_emis'),
	noHp: text('no_hp'),
	kipPip: text('kip_pip'),
	sumberData: text('sumber_data'),
	emisSyncAt: text('emis_sync_at'),
	asalSekolahNpsn: text('asal_sekolah_npsn'),
	fotoPath: text('foto_path'),
	fotoPending: text('foto_pending'),
	fotoStatus: text('foto_status').default('approved'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`),
	updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});

// ============================================
// ROMBEL (Rombongan Belajar)
// ============================================

export const rombel = sqliteTable('rombel', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	publicId: text('public_id').unique(),
	nama: text('nama').notNull().unique(),
	kelas: integer('kelas').notNull(), // 7, 8, 9
	label: text('label').notNull(), // A, B, C, D, E
	waliPtkId: integer('wali_ptk_id'),
	kapasitas: integer('kapasitas').default(40),
	aktif: integer('aktif', { mode: 'boolean' }).default(true),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`),
	updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});

// ============================================
// PERUBAHAN SISWA (Approval Workflow)
// ============================================

export const perubahanSiswa = sqliteTable('perubahan_siswa', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	siswaId: integer('siswa_id').notNull(),
	field: text('field').notNull(), // nama, nisn, nik, ayah, ibu, etc.
	nilaiLama: text('nilai_lama'),
	nilaiBaru: text('nilai_baru').notNull(),
	status: text('status').default('pending'), // pending | approved | rejected
	catatan: text('catatan'),
	diajukanBy: text('diajukan_by').default('siswa'),
	diajukanAt: text('diajukan_at').default(sql`datetime('now','localtime')`),
	disetujuiAt: text('disetujui_at'),
	disetujuiOleh: text('disetujui_oleh')
});

// ============================================
// ACTIVITY LOG
// ============================================

export const activityLog = sqliteTable('activity_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id'),
	action: text('action'),
	detail: text('detail'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`strftime('%s','now')*1000`)
});

// ============================================
// ORTU (Orang Tua)
// ============================================

export const ortu = sqliteTable('ortu', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nama: text('nama').notNull(),
	nik: text('nik'),
	noHp: text('no_hp'),
	alamat: text('alamat'),
	pekerjaan: text('pekerjaan'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});

export const siswaOrtu = sqliteTable('siswa_ortu', {
	siswaId: integer('siswa_id').notNull(),
	ortuId: integer('ortu_id').notNull(),
	hubungan: text('hubungan') // ayah | ibu | wali
});

// ============================================
// BEL SEKOLAH (School Bell)
// ============================================

export const jamBel = sqliteTable('jam_bel', {
	id: text('id').primaryKey(), // e.g. "jb-{timestamp}"
	hari: text('hari').notNull(), // senin..minggu
	jam: text('jam').notNull(), // HH:MM
	jenis: text('jenis').notNull(),
	label: text('label'),
	soundPath: text('sound_path'),
	repeat: integer('repeat').default(2),
	aktif: integer('aktif', { mode: 'boolean' }).default(true),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`),
	updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});

export const belSettings = sqliteTable('bel_settings', {
	key: text('key').primaryKey(), // e.g. "bel_master"
	value: text('value') // "0" or "1"
});

// ============================================
// KARTU CACHE (Generated Card PNGs)
// ============================================

export const kartuCache = sqliteTable('kartu_cache', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	siswaId: integer('siswa_id').notNull(),
	filePath: text('file_path').notNull(),
	fileType: text('file_type').notNull(), // front | back
	generatedAt: text('generated_at').default(sql`datetime('now','localtime')`),
	hash: text('hash') // based on foto_path mtime
});

// ============================================
// SCHEMA MIGRATIONS
// ============================================

export const schemaMigrations = sqliteTable('schema_migrations', {
	version: integer('version').primaryKey(),
	appliedAt: text('applied_at').default(sql`datetime('now','localtime')`)
});

// ============================================
// KONTEN PUBLIC (Berita, Pengumuman, Agenda, Galeri, Ekskul, Prestasi)
// ============================================

export const berita = sqliteTable('berita', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').unique().notNull(),
	judul: text('judul').notNull(),
	ringkasan: text('ringkasan'),
	konten: text('konten'),
	gambar: text('gambar'),
	penulis: text('penulis').default('Admin'),
	kategori: text('kategori').default('umum'), // umum | kegiatan | prestasi
	published: integer('published', { mode: 'boolean' }).default(false),
	publishedAt: text('published_at'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`),
	updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});

export const pengumuman = sqliteTable('pengumuman', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	judul: text('judul').notNull(),
	konten: text('konten').notNull(),
	penting: integer('penting', { mode: 'boolean' }).default(false),
	published: integer('published', { mode: 'boolean' }).default(false),
	publishedAt: text('published_at'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});

export const agenda = sqliteTable('agenda', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	judul: text('judul').notNull(),
	deskripsi: text('deskripsi'),
	tanggalMulai: text('tanggal_mulai').notNull(),
	tanggalSelesai: text('tanggal_selesai'),
	lokasi: text('lokasi'),
	warna: text('warna').default('#3b82f6'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});

export const galeri = sqliteTable('galeri', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	judul: text('judul').notNull(),
	deskripsi: text('deskripsi'),
	gambar: text('gambar').notNull(),
	kategori: text('kategori').default('kegiatan'), // kegiatan | wisata | olahraga | lainnya
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});

export const ekskul = sqliteTable('ekskul', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nama: text('nama').notNull(),
	slug: text('slug').unique().notNull(),
	deskripsi: text('deskripsi'),
	gambar: text('gambar'),
	pembina: text('pembina'),
	jadwal: text('jadwal'),
	aktif: integer('aktif', { mode: 'boolean' }).default(true),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});

export const prestasi = sqliteTable('prestasi', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	judul: text('judul').notNull(),
	deskripsi: text('deskripsi'),
	gambar: text('gambar'),
	pemenang: text('pemenang'),
	tingkat: text('tingkat').default('sekolah'), // sekolah | kabupaten | provinsi | nasional
	tahun: integer('tahun'),
	createdAt: text('created_at').default(sql`datetime('now','localtime')`)
});
