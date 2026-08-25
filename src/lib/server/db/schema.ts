import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('admin'),
	createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow()
});

export const sessions = sqliteTable('sessions', {
	token: text('token').primaryKey(),
	userId: integer('user_id').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow()
});

// Data PTK master
export const ptk = sqliteTable('ptk', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nama: text('nama').notNull(),
	pegId: text('peg_id'),
	nip: text('nip'),
	nik: text('nik'),
	nuptk: text('nuptk'),
	fungsi: text('fungsi'), // Guru / Staf
	kepegawaian: text('kepegawaian'), // PNS / P3K / Non PNS
	sertifikasi: integer('sertifikasi', { mode: 'boolean' }).default(false),
	kelengkapan: integer('kelengkapan'), // persen 0-100
	aktivasi: integer('aktivasi', { mode: 'boolean' }).default(false),
	waliKelas: text('wali_kelas'), // VII A dst (dari SK)
	jabatanStruktural: text('jabatan_struktural'), // Wakamad dll (dari SK)
	catatan: text('catatan')
});

// Snapshot JTM per semester (versi SATMINKAL MTsN2)
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

// Riwayat ajuan SKMT per guru per periode/instansi
export const skmtAjuan = sqliteTable('skmt_ajuan', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	periode: text('periode').notNull().default('2026/Semester 1'),
	instansi: text('instansi').default('MTSN 2 KOLAKA UTARA'),
	status: text('status'), // Menunggu / Disetujui Kamad / Disetujui Pengawas / Ditolak
	nilaiPembelajaran: real('nilai_pembelajaran'),
	nilaiBimbingan: real('nilai_bimbingan'),
	tglAjuan: text('tgl_ajuan'),
	ajuanId: integer('ajuan_id') // id ajuan di EMIS
});

// Dokumen PDF arsip
export const dokumen = sqliteTable('dokumen', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ptkId: integer('ptk_id').notNull(),
	jenis: text('jenis').default('SKMT Rekap'),
	filePath: text('file_path').notNull(),
	periode: text('periode'),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).defaultNow()
});

// Roster jadwal pelajaran
export const roster = sqliteTable('roster', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kelas: text('kelas').notNull(),
	hari: text('hari').notNull(),
	jamKe: text('jam_ke').notNull(),
	mapel: text('mapel').notNull(),
	guruNama: text('guru_nama').notNull(),
	guruKode: integer('guru_kode')
});
