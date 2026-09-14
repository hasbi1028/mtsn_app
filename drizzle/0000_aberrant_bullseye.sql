CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text,
	`detail` text,
	`created_at` integer DEFAULT (strftime('%s','now')*1000)
);
--> statement-breakpoint
CREATE TABLE `bel_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `cuti` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`jenis` text NOT NULL,
	`tanggal_mulai` text NOT NULL,
	`tanggal_selesai` text NOT NULL,
	`keterangan` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`referenced_dari` text DEFAULT 'EMISGTK'
);
--> statement-breakpoint
CREATE TABLE `dokumen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`jenis` text DEFAULT 'SKMT Rekap',
	`file_path` text NOT NULL,
	`periode` text,
	`uploaded_at` integer DEFAULT (strftime('%s','now')*1000)
);
--> statement-breakpoint
CREATE TABLE `jam_bel` (
	`id` text PRIMARY KEY NOT NULL,
	`hari` text NOT NULL,
	`jam` text NOT NULL,
	`jenis` text NOT NULL,
	`label` text,
	`sound_path` text,
	`repeat` integer DEFAULT 2,
	`aktif` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
CREATE TABLE `jtm_semester` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`periode` text DEFAULT '2026/2027 Ganjil' NOT NULL,
	`mengajar` real DEFAULT 0,
	`tugas` real DEFAULT 0,
	`total_s25a` real,
	`dashboard_total` real,
	`source` text
);
--> statement-breakpoint
CREATE TABLE `kartu_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`generated_at` text DEFAULT (datetime('now','localtime')),
	`hash` text
);
--> statement-breakpoint
CREATE TABLE `ortu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`nik` text,
	`no_hp` text,
	`alamat` text,
	`pekerjaan` text,
	`created_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
CREATE TABLE `perubahan_siswa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`siswa_id` integer NOT NULL,
	`field` text NOT NULL,
	`nilai_lama` text,
	`nilai_baru` text NOT NULL,
	`status` text DEFAULT 'pending',
	`catatan` text,
	`diajukan_by` text DEFAULT 'siswa',
	`diajukan_at` text DEFAULT (datetime('now','localtime')),
	`disetujui_at` text,
	`disetujui_oleh` text
);
--> statement-breakpoint
CREATE TABLE `ptk` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`peg_id` text,
	`nip` text,
	`nik` text,
	`nuptk` text,
	`fungsi` text,
	`kepegawaian` text,
	`sertifikasi` integer DEFAULT false,
	`kelengkapan` integer,
	`aktivasi` integer DEFAULT false,
	`wali_kelas` text,
	`jabatan_struktural` text,
	`catatan` text,
	`user_emis` text,
	`pass_emis` text
);
--> statement-breakpoint
CREATE TABLE `rombel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`kelas` integer NOT NULL,
	`label` text NOT NULL,
	`wali_ptk_id` integer,
	`kapasitas` integer DEFAULT 40,
	`aktif` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rombel_nama_unique` ON `rombel` (`nama`);--> statement-breakpoint
CREATE TABLE `roster` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kelas` text NOT NULL,
	`hari` text NOT NULL,
	`jam_ke` text NOT NULL,
	`mapel` text NOT NULL,
	`guru_nama` text NOT NULL,
	`guru_kode` integer
);
--> statement-breakpoint
CREATE TABLE `schema_migrations` (
	`version` integer PRIMARY KEY NOT NULL,
	`applied_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')*1000)
);
--> statement-breakpoint
CREATE TABLE `siswa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nis` text,
	`nisn` text,
	`nama` text NOT NULL,
	`jk` text,
	`kelas` text,
	`tempat_lahir` text,
	`tgl_lahir` text,
	`ayah` text,
	`ibu` text,
	`kerja_ayah` text,
	`kerja_ibu` text,
	`penghasilan` integer,
	`anak_ke` integer,
	`dari` integer,
	`asal_sekolah` text,
	`alamat` text,
	`nik` text,
	`bansos_desil` text,
	`bansos_sembako` text,
	`bansos_pkh` text,
	`bansos_pbijk` text,
	`bansos_kpd` text,
	`bansos_cek_at` text,
	`rombel` text,
	`status_emis` text,
	`no_hp` text,
	`kip_pip` text,
	`sumber_data` text,
	`emis_sync_at` text,
	`asal_sekolah_npsn` text,
	`foto_path` text,
	`foto_pending` text,
	`foto_status` text DEFAULT 'approved',
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `siswa_nis_unique` ON `siswa` (`nis`);--> statement-breakpoint
CREATE TABLE `siswa_ortu` (
	`siswa_id` integer NOT NULL,
	`ortu_id` integer NOT NULL,
	`hubungan` text
);
--> statement-breakpoint
CREATE TABLE `skakpt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`periode` text DEFAULT '2026/Semester 1',
	`bulan` text DEFAULT 'Juli 2026',
	`status` text DEFAULT 'Menunggu',
	`tgl_ajuan` text,
	`tgl_verifikasi` text,
	`detail` text
);
--> statement-breakpoint
CREATE TABLE `skbk_ajuan` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`periode` text DEFAULT '2026/Semester 1',
	`instansi` text,
	`status` text DEFAULT 'Belum Diajukan',
	`jtm_total` integer,
	`tgl_ajuan` text,
	`keterangan` text DEFAULT '',
	`skakpt_status` text DEFAULT 'Belum'
);
--> statement-breakpoint
CREATE TABLE `skmt_ajuan` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ptk_id` integer NOT NULL,
	`periode` text DEFAULT '2026/Semester 1' NOT NULL,
	`instansi` text DEFAULT 'MTSN 2 KOLAKA UTARA',
	`status` text,
	`nilai_pembelajaran` real,
	`nilai_bimbingan` real,
	`tgl_ajuan` text,
	`ajuan_id` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`ref_id` integer,
	`is_active` integer DEFAULT 1,
	`last_login` text,
	`created_at` integer DEFAULT (strftime('%s','now')*1000),
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);