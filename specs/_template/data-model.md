# data-model.md — SIMAD Database Schema

> 20 tabel SQLite via Drizzle ORM. Source of truth: `src/lib/server/db/schema.ts`

---

## Tables Overview

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Login accounts (admin/guru/siswa/orangtua) |
| 2 | `sessions` | Auth tokens (httpOnly cookie) |
| 3 | `ptk` | Guru & tenaga kependidikan |
| 4 | `jtm_semester` | Jam tatap muka per semester |
| 5 | `cuti` | Data cuti PTK |
| 6 | `skmt_ajuan` | SKMT submissions |
| 7 | `skbk_ajuan` | SKBK submissions |
| 8 | `skakpt` | SKAKPT data (11 indikator TPG) |
| 9 | `dokumen` | File attachments per PTK |
| 10 | `roster` | Jadwal mengajar |
| 11 | `siswa` | Data siswa |
| 12 | `rombel` | Rombongan belajar (kelas) |
| 13 | `perubahan_siswa` | Pending data changes (approval) |
| 14 | `activity_log` | Audit trail |
| 15 | `ortu` | Data orang tua |
| 16 | `siswa_ortu` | Siswa ↔ Ortu relation |
| 17 | `jam_bel` | Jadwal bel sekolah |
| 18 | `bel_settings` | Bell master switch |
| 19 | `kartu_cache` | Generated card PNGs metadata |
| 20 | `schema_migrations` | Migration tracking |

---

## Schema Details

### users
```ts
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'), // admin | guru | siswa | orangtua
  refId: integer('ref_id'), // FK → ptk.id / siswa.id / ortu.id
  isActive: integer('is_active').default(1),
  lastLogin: text('last_login'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: text('updated_at')
});
```

### sessions
```ts
export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  userId: integer('user_id').notNull(), // FK → users.id
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
});
```

### ptk
```ts
export const ptk = sqliteTable('ptk', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  pegId: text('peg_id'),
  nip: text('nip'),
  nik: text('nik'),
  nuptk: text('nuptk'),
  fungsi: text('fungsi'), // Guru | Staf
  kepegawaian: text('kepegawaian'), // PNS | P3K | Non PNS
  sertifikasi: integer('sertifikasi', { mode: 'boolean' }).default(false),
  kelengkapan: integer('kelengkapan'), // 0-100
  aktivasi: integer('aktivasi', { mode: 'boolean' }).default(false),
  waliKelas: text('wali_kelas'),
  jabatanStruktural: text('jabatan_struktural'),
  catatan: text('catatan'),
  userEmis: text('user_emis'),
  passEmis: text('pass_emis')
});
```

### jtm_semester
```ts
export const jtmSemester = sqliteTable('jtm_semester', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  periode: text('periode').notNull(),
  mengajar: real('mengajar').default(0),
  tugas: real('tugas').default(0),
  totalS25a: real('total_s25a'),
  dashboardTotal: real('dashboard_total'),
  source: text('source')
});
```

### cuti
```ts
export const cuti = sqliteTable('cuti', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  jenis: text('jenis').notNull(),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai').notNull(),
  keterangan: text('keterangan'),
  createdAt: text('created_at'),
  referencedDari: text('referenced_dari').default('EMISGTK')
});
```

### skmt_ajuan
```ts
export const skmtAjuan = sqliteTable('skmt_ajuan', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  periode: text('periode').notNull(),
  instansi: text('instansi'),
  status: text('status'), // Menunggu | Disetujui Kamad | Disetujui Pengawas | Ditolak
  nilaiPembelajaran: real('nilai_pembelajaran'),
  nilaiBimbingan: real('nilai_bimbingan'),
  tglAjuan: text('tgl_ajuan'),
  ajuanId: integer('ajuan_id')
});
```

### skbk_ajuan
```ts
export const skbkAjuan = sqliteTable('skbk_ajuan', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  periode: text('periode'),
  instansi: text('instansi'),
  status: text('status').default('Belum Diajukan'),
  jtmTotal: integer('jtm_total'),
  tglAjuan: text('tgl_ajuan'),
  keterangan: text('keterangan'),
  skakptStatus: text('skakpt_status')
});
```

### skakpt
```ts
export const skakpt = sqliteTable('skakpt', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  periode: text('periode'),
  bulan: text('bulan'),
  status: text('status').default('Menunggu'),
  tglAjuan: text('tgl_ajuan'),
  tglVerifikasi: text('tgl_verifikasi'),
  detail: text('detail') // JSON: 11 indikator TPG
});
```

### dokumen
```ts
export const dokumen = sqliteTable('dokumen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ptkId: integer('ptk_id').notNull(), // FK → ptk.id
  jenis: text('jenis'),
  filePath: text('file_path').notNull(),
  periode: text('periode'),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp_ms' })
});
```

### roster
```ts
export const roster = sqliteTable('roster', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kelas: text('kelas').notNull(),
  hari: text('hari').notNull(),
  jamKe: text('jam_ke').notNull(),
  mapel: text('mapel').notNull(),
  guruNama: text('guru_nama').notNull(),
  guruKode: integer('guru_kode') // FK → ptk.id
});
```

### siswa
```ts
export const siswa = sqliteTable('siswa', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
  rombel: text('rombel'),
  statusEmis: text('status_emis'),
  noHp: text('no_hp'),
  kipPip: text('kip_pip'),
  sumberData: text('sumber_data'),
  emisSyncAt: text('emis_sync_at'),
  asalSekolahNpsn: text('asal_sekolah_npsn'),
  fotoPath: text('foto_path'),
  fotoPending: text('foto_pending'),
  fotoStatus: text('foto_status').default('approved'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at')
});
```

### rombel
```ts
export const rombel = sqliteTable('rombel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().unique(),
  kelas: integer('kelas').notNull(), // 7, 8, 9
  label: text('label').notNull(), // A, B, C, D, E
  waliPtkId: integer('wali_ptk_id'), // FK → ptk.id
  kapasitas: integer('kapasitas').default(40),
  aktif: integer('aktif', { mode: 'boolean' }).default(true),
  createdAt: text('created_at'),
  updatedAt: text('updated_at')
});
```

### perubahan_siswa
```ts
export const perubahanSiswa = sqliteTable('perubahan_siswa', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siswaId: integer('siswa_id').notNull(), // FK → siswa.id
  field: text('field').notNull(),
  nilaiLama: text('nilai_lama'),
  nilaiBaru: text('nilai_baru').notNull(),
  status: text('status').default('pending'), // pending | approved | rejected
  catatan: text('catatan'),
  diajukanBy: text('diajukan_by'),
  diajukanAt: text('diajukan_at'),
  disetujuiAt: text('disetujui_at'),
  disetujuiOleh: text('disetujui_oleh')
});
```

### activity_log
```ts
export const activityLog = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'), // FK → users.id
  action: text('action'),
  detail: text('detail'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
});
```

### ortu
```ts
export const ortu = sqliteTable('ortu', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  nik: text('nik'),
  noHp: text('no_hp'),
  alamat: text('alamat'),
  pekerjaan: text('pekerjaan'),
  createdAt: text('created_at')
});
```

### siswa_ortu
```ts
export const siswaOrtu = sqliteTable('siswa_ortu', {
  siswaId: integer('siswa_id').notNull(), // FK → siswa.id
  ortuId: integer('ortu_id').notNull(), // FK → ortu.id
  hubungan: text('hubungan') // ayah | ibu | wali
});
```

### jam_bel
```ts
export const jamBel = sqliteTable('jam_bel', {
  id: text('id').primaryKey(),
  hari: text('hari').notNull(), // senin..minggu
  jam: text('jam').notNull(), // HH:MM
  jenis: text('jenis').notNull(),
  label: text('label'),
  soundPath: text('sound_path'),
  repeat: integer('repeat').default(2),
  aktif: integer('aktif', { mode: 'boolean' }).default(true),
  createdAt: text('created_at'),
  updatedAt: text('updated_at')
});
```

### bel_settings
```ts
export const belSettings = sqliteTable('bel_settings', {
  key: text('key').primaryKey(),
  value: text('value')
});
```

### kartu_cache
```ts
export const kartuCache = sqliteTable('kartu_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siswaId: integer('siswa_id').notNull(), // FK → siswa.id
  filePath: text('file_path').notNull(),
  fileType: text('file_type').notNull(), // front | back
  generatedAt: text('generated_at'),
  hash: text('hash')
});
```

### schema_migrations
```ts
export const schemaMigrations = sqliteTable('schema_migrations', {
  version: integer('version').primaryKey(),
  appliedAt: text('applied_at')
});
```

---

## Relations Diagram

```
users ──────────┬──→ ptk (ref_id)
                ├──→ siswa (ref_id)
                └──→ ortu (ref_id)

sessions ──────→ users (user_id)

ptk ────────────┬──→ jtm_semester (ptk_id)
                ├──→ skmt_ajuan (ptk_id)
                ├──→ skbk_ajuan (ptk_id)
                ├──→ skakpt (ptk_id)
                ├──→ dokumen (ptk_id)
                └──→ roster (guru_kode)

siswa ──────────┬──→ perubahan_siswa (siswa_id)
                ├──→ kartu_cache (siswa_id)
                └──→ siswa_ortu (siswa_id)

ortu ───────────→ siswa_ortu (ortu_id)

rombel (standalone, nama used in siswa.rombel)

jam_bel (standalone)
bel_settings (standalone)
activity_log → users (user_id)
```
