# data-model.md — Schema Reference

> Referensi Drizzle ORM schema untuk semua tabel.

## Current Schema Location

`src/lib/server/db/schema.ts`

## Tables

### users
```ts
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
```

### sessions
```ts
export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`strftime('%s','now')*1000`)
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
  kelengkapan: integer('kelengkapan'), // persen 0-100
  aktivasi: integer('aktivasi', { mode: 'boolean' }).default(false),
  waliKelas: text('wali_kelas'),
  jabatanStruktural: text('jabatan_struktural'),
  catatan: text('catatan'),
  userEmis: text('user_emis'),
  passEmis: text('pass_emis')
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
  createdAt: text('created_at').default(sql`datetime('now','localtime')`),
  updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});
```

### rombel
```ts
export const rombel = sqliteTable('rombel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull().unique(),
  kelas: integer('kelas').notNull(),
  label: text('label').notNull(),
  waliPtkId: integer('wali_ptk_id').references(() => ptk.id),
  kapasitas: integer('kapasitas').default(40),
  aktif: integer('aktif', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`datetime('now','localtime')`),
  updatedAt: text('updated_at').default(sql`datetime('now','localtime')`)
});
```

> **Note:** Expand schema.ts dengan semua 20 tabel sesuai plan.md Phase 0.
