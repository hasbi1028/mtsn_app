# spec.md — Modul Struktur Organisasi (SIMAD)

> Spec 029. Rencana lengkap: `.hermes/plans/2026-09-14_104235-modul-struktur-organisasi.md`
> Sumber data awal: **SK No. 023/2026** (13 Juli 2026) + JSON Pusaka `pegawai-backup-2026-08-06.json`.

---

## Module: `struktur`

### User Story

As an `admin`, I want mengelola unit/jabatan dan penugasan pegawai pada struktur organisasi madrasah,
so that bagan resmi (untuk SK, spanduk, dan website) selalu sinkron dengan data kepegawaian yang ada
dan bisa dicetak/diunduh tanpa membuat ulang file HTML manual.
As a `pengunjung` (publik), I want melihat bagan struktur organisasi di website madrasah,
so that saya tahu siapa pimpinan, wakamad, wali kelas, dan tata kelola madrasah.

**Roles:**
- `admin` — akses penuh (kelola unit, kelola anggota, ekspor, pengaturan bagan)
- `kepsek` — baca semua + ekspor (tidak mengubah)
- `guru`, `staf` — baca halaman admin (struktur internal), tanpa tombol ubah
- `siswa`, `ortu` — tidak akses halaman admin; boleh lihat bagan publik
- Publik (tanpa login) — bagan publik (`/profil/struktur`) **tanpa NIP**, hanya bila diaktifkan

### Acceptance Criteria

**Data & CRUD**
- [ ] Admin dapat menambah/mengubah/menghapus/urutkan `struktur_unit` (kode unik, nama, tipe, kelompok, parent, kolom, urutan, tampil_bagan, aktif).
- [ ] Admin dapat menambah/mengubah/menghapus/urutkan `struktur_anggota` untuk sebuah unit.
- [ ] Anggota dapat merujuk ke `ptk` (`ptk_id`) **atau** entri luar (`nama_manual`, mis. Ketua Komite / tenaga pendukung).
- [ ] Satu PTK boleh menempati lebih dari satu unit (mis. Guru BK yang rangkap Bendahara) — ditandai `keterangan`.
- [ ] Gelar tampil diambil dari `struktur_anggota.gelar` (karena `ptk.nama` tidak menyimpan gelar); ada form isian gelar per anggota.
- [ ] Menghapus unit yang masih punya anggota ditolak dengan pesan jelas (atau kaskade setelah konfirmasi eksplisit).

**Bagan & tampilan**
- [ ] `/admin/struktur` menampilkan daftar unit + anggotanya + rekap (jumlah pegawai, jumlah wali kelas, unit kosong).
- [ ] `/admin/struktur/bagan` menampilkan preview bagan (satu komponen yang sama dengan publik & cetak).
- [ ] Rekap menandai selisih bila jumlah wali kelas ≠ jumlah baris `rombel`, dan bila unit tanpa anggota.

**Cetak & ekspor**
- [ ] Halaman `.../cetak/[preset]` mencetak bagan 1 dokumen: `@page` exact-size
      (`529.17mm × 264.58mm` preset spanduk 2:1; varian `2000×1300` untuk 3×2 m), margin 0, tanpa navbar.
- [ ] `GET /api/struktur/bagan.png` menyajikan PNG hasil screenshot server-side (Playwright),
      di-cache di `data/struktur/` dan diregenerasi bila data/versi berubah.
- [ ] Unduhan PNG/PDF lewat tautan `<a href download>` (bukan `fetch('/api/...')`).

**Halaman publik**
- [ ] `/profil/struktur` menampilkan bagan publik **tanpa NIP** (nama + gelar + jabatan saja).
- [ ] Menu publik "Profil" memuat item "Struktur Organisasi" (desktop + mobile).
- [ ] Halaman `/guru` memuat tautan "Lihat Struktur Organisasi" (halaman `/guru` tetap direktori, tidak digabung).
- [ ] `/struktur` mengarahkan (308) ke `/profil/struktur` (untuk QR spanduk).
- [ ] Bila pengaturan `struktur_publik_aktif = 0`, `/profil/struktur` dijawab 404.

**Seed & pengaturan**
- [ ] `scripts/seed-struktur-sk023.ts` mengisi unit + anggota dari SK 023/2026, **idempoten**
      (`--dry-run` mencetak rencana; jalan kedua tidak menghasilkan duplikat), dan mencetak
      **laporan selisih**: nama di SK yang belum ada di `ptk`, dan `ptk` yang belum masuk struktur.
- [ ] Pengaturan bagan (kop, tahun pelajaran, badge jumlah, tanda tangan) dibaca dari tabel `pengaturan`
      dengan fallback aman bila kosong.
- [ ] Setiap aksi tulis menulis `activity_log` dan menampilkan toast Bahasa Indonesia.

### Edge Cases

- Nama PTK ganda di `ptk` (mis. dua "RATNAWATI") → form memakai pencarian + `public_id`, bukan asumsi nama unik.
- Unit tanpa anggota → tetap tampil di bagan dengan penanda "—" (atau disembunyikan bila `tampil_bagan=0`).
- Anggota dengan `ptk_id` yang sudah dihapus → tampil sebagai entri lama (nama dari `nama_manual` bila ada), ditandai perlu perbaikan.
- `ptk.foto_path` kosong (kondisi sekarang: 0 dari 40) → bagan memakai inisial/label jabatan (foto ditunda ke spec 030).
- Bagan dibuka di HP (layar 360px) → kontainer bagan bisa di-scroll horizontal + tombol "buka penuh/zoom", halaman tetap mobile-first.
- Playwright gagal (Chromium belum terunduh / RAM habis) → endpoint PNG menjawab 503 dengan pesan, halaman tetap bisa dicetak.
- Data bagan berubah saat PNG sedang dibuat → cache di-key oleh hash data (mtime/versi), bukan hanya waktu.

### Out of Scope

- Unggah foto pegawai 3×4 (spec berikutnya; `ptk.foto_path` sudah ada).
- Tanda tangan digital / e-sign, integrasi SK PDF otomatis, QR dinamis.
- Sinkronisasi ke EMIS/SIMPATIKA, atau mengubah data `ptk` (modul ini hanya membaca `ptk`).
- Riwayat versi bagan (versioning) dan approval berjenjang.

---

## Data Model

### Tabel yang terlibat

| Table | Columns Used | Relation |
|-------|--------------|----------|
| `struktur_unit` (baru) | `id`, `kode`, `nama`, `tipe`, `kelompok`, `parent_kode`, `kolom`, `urutan`, `tampil_bagan`, `aktif` | self-ref `parent_kode → struktur_unit.kode` |
| `struktur_anggota` (baru) | `id`, `unit_kode`, `ptk_id`, `nama_manual`, `nip_manual`, `gelar`, `jabatan_tampil`, `keterangan`, `urutan`, `tampil_bagan`, `aktif` | `unit_kode → struktur_unit.kode` (CASCADE), `ptk_id → ptk.id` (SET NULL) |
| `ptk` (baca) | `id`, `public_id`, `nama`, `nip`, `jabatan_struktural`, `wali_kelas`, `fungsi`, `foto_path` | rujukan anggota |
| `rombel` (baca) | `id`, `nama`, `kelas` | pembanding jumlah wali kelas |
| `pengaturan` (baca/tulis) | `key`, `value` | pengaturan bagan |
| `activity_log` (tulis) | `user`, `aksi`, `detail` | audit trail |

### DDL

```sql
CREATE TABLE struktur_unit (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kode          TEXT NOT NULL UNIQUE,
  nama          TEXT NOT NULL,
  tipe          TEXT NOT NULL,              -- pimpinan|unit|sub|mitra|pendukung|grup
  kelompok      TEXT,                       -- PIMPINAN|TU|KURIKULUM|KESISWAAN|SARPRAS|HUMAS|LUAR
  parent_kode   TEXT,
  kolom         INTEGER NOT NULL DEFAULT 1,
  urutan        INTEGER NOT NULL DEFAULT 0,
  tampil_bagan  INTEGER NOT NULL DEFAULT 1,
  aktif         INTEGER NOT NULL DEFAULT 1,
  catatan       TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE struktur_anggota (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_kode      TEXT NOT NULL REFERENCES struktur_unit(kode) ON DELETE CASCADE,
  ptk_id         INTEGER REFERENCES ptk(id) ON DELETE SET NULL,
  nama_manual    TEXT,
  nip_manual     TEXT,
  gelar          TEXT,
  jabatan_tampil TEXT,
  keterangan     TEXT,
  urutan         INTEGER NOT NULL DEFAULT 0,
  tampil_bagan   INTEGER NOT NULL DEFAULT 1,
  aktif          INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_struktur_anggota_unit ON struktur_anggota(unit_kode);
CREATE INDEX idx_struktur_anggota_ptk  ON struktur_anggota(ptk_id);
```

### Query Pattern

```sql
-- Bagan (2 query, disusun jadi pohon di service)
SELECT kode, nama, tipe, kelompok, parent_kode, kolom, urutan, tampil_bagan
FROM struktur_unit WHERE aktif = 1 ORDER BY kolom, urutan, nama;

SELECT a.id, a.unit_kode, a.ptk_id, a.nama_manual, a.gelar, a.jabatan_tampil,
       a.keterangan, a.urutan, a.tampil_bagan,
       p.nama AS nama_ptk, p.nip AS nip_ptk, p.public_id
FROM struktur_anggota a LEFT JOIN ptk p ON p.id = a.ptk_id
WHERE a.aktif = 1 ORDER BY a.unit_kode, a.urutan, COALESCE(p.nama, a.nama_manual);

-- Rekap
SELECT (SELECT COUNT(*) FROM struktur_anggota WHERE aktif = 1) AS anggota,
       (SELECT COUNT(DISTINCT ptk_id) FROM struktur_anggota WHERE aktif = 1 AND ptk_id IS NOT NULL) AS pegawai,
       (SELECT COUNT(*) FROM rombel) AS rombel,
       (SELECT COUNT(*) FROM struktur_anggota WHERE aktif = 1 AND unit_kode = 'wali-kelas') AS wali;
```

---

## Domain Module Structure

```
src/modules/struktur/
├── struktur.validation.ts   # valibot: unitSchema, anggotaSchema, urutkanSchema, pagarSchema
├── struktur.service.ts      # baca/tulis unit+anggota, susun pohon, rekap, konsistensi
├── struktur.remote.ts       # query/form/command (≤150 baris; pecah bila lebih)
├── struktur-bagan.util.ts   # builder data bagan (kolom, baris, label) — murni, mudah diuji
└── components/
    ├── bagan.svelte                 # SATU komponen bagan: mode admin | publik | cetak
    ├── struktur-unit-form.svelte
    ├── struktur-anggota-form.svelte
    └── struktur-rekap.svelte
```

### Remote Functions

| Nama | Jenis | Argumen | Role | Fungsi |
|------|-------|---------|------|--------|
| `getStrukturQ` | query | — | admin/kepsek/guru/staf | tree unit + anggota + rekap |
| `getStrukturPublikQ` | query | — | publik (tanpa auth) | tree bagan tanpa NIP; kosong bila `struktur_publik_aktif=0` |
| `simpanUnitF` | form | `id?`, `kode`, `nama`, `tipe`, `kelompok`, `parent_kode`, `kolom`, `urutan`, `tampil_bagan` | admin | tambah/ubah unit |
| `hapusUnitC` | command | `kode` | admin | hapus unit (tolak bila masih ada anggota) |
| `simpanAnggotaF` | form | `id?`, `unit_kode`, `ptk_id?`, `nama_manual?`, `gelar?`, `jabatan_tampil?`, `keterangan?`, `urutan` | admin | tambah/ubah anggota |
| `hapusAnggotaC` | command | `id` | admin | hapus anggota |
| `urutkanAnggotaC` | command | `unit_kode`, `urutan[]` | admin | simpan urutan |
| `simpanPengaturanBaganF` | form | kop/tahun/badge/kamad/ttd/publik_aktif | admin | simpan pengaturan bagan |

---

## UI

| Route | Isi | Role |
|-------|-----|------|
| `/admin/struktur` | daftar unit (accordion) + anggota + rekap + tombol tambah | admin (ubah), lainnya baca |
| `/admin/struktur/[kode]` | kelola anggota satu unit (urut, aktif, tampil di bagan) | admin |
| `/admin/struktur/bagan` | preview bagan + tombol Cetak (preset) + Unduh PNG | admin/kepsek |
| `/admin/struktur/bagan/cetak/[preset]` | versi cetak (`@page` exact-size) + `+layout@.svelte` | admin/kepsek |
| `/(public)/profil/struktur` | bagan publik tanpa NIP | publik |
| `/(public)/struktur` | redirect 308 → `/profil/struktur` | publik |

Navigasi: grup baru **Kepegawaian → Struktur Organisasi** (`src/lib/config/navigation.ts`), ikon `network`.
Publik: item baru di `public-navbar.svelte` (child "Profil"), tautan di `/guru` dan `/profil`.

---

## Ekspor & cetak

- **PDF**: halaman cetak memakai CSS `@page { size: 529.17mm 264.58mm; margin: 0 }` (preset `spanduk-2x1`),
  alternatif `529.17mm 343.96mm` (preset `spanduk-3x2`, kanvas 2000×1300) dan `A2 landscape` (preset `a2`).
- **PNG**: `GET /api/struktur/bagan.png?preset=spanduk-2x1&nip=0` →
  `scripts/struktur-bagan-screenshot.mjs` (Playwright, `deviceScaleFactor` dari env `STRUKTUR_SCALE`, default 2),
  hasil di-cache di `data/struktur/bagan-<preset>-<hash>.png` (hash dari isi bagan + preset + nip).
- **Guard**: `/api/struktur/bagan.png` wajib didaftarkan di `tests/e2e/full-remote.spec.ts`
  (assert `existsSync` + `export const GET`) — guard tidak dilonggarkan.

---

## Pengaturan (tabel `pengaturan`)

| Key | Default | Arti |
|-----|---------|------|
| `struktur_judul` | `STRUKTUR ORGANISASI` | judul bagan |
| `struktur_tahun` | `2026/2027` | tahun pelajaran di header |
| `struktur_kop` | `KEMENTERIAN AGAMA REPUBLIK INDONESIA` | baris kop |
| `struktur_badge` | (otomatis) | angka jumlah pegawai; auto bila kosong |
| `struktur_kamad_nama` / `struktur_kamad_nip` | dari unit `kamad` | blok tanda tangan |
| `struktur_tempat_tgl` | `Lasusua, …` | tempat/tanggal tanda tangan |
| `struktur_tampil_nip` | `0` | tampilkan NIP di bagan cetak |
| `struktur_publik_aktif` | `0` | aktifkan halaman publik |

---

## Layout bagan (kanvas cetak 2000×1000 — acuan `struktur-foto-v4-nip.html`)

Tampilan cetak/spanduk mengikuti bagan resmi versi v4:

| Unsur | Sumber data |
|---|---|
| Logo Kemenag kiri + badge jumlah pegawai kanan | `static/uploads/logo-kemenag.png` + `struktur_badge` |
| Sub judul "Tahun Pelajaran … • SK …" | `struktur_tahun` + `struktur_sk` |
| Baris puncak (Ketua Komite **putus-putus** + Kepala Madrasah) | unit dengan **`kolom = 0`**; `kelompok = MITRA` → gaya mitra |
| Header kotak tiap kolom (foto + jabatan + nama + NIP) | anggota dengan **`kepala = 1`** pada unit kolom tersebut |
| Bar judul isi kotak (mis. "TATA USAHA", "DEWAN GURU MATA PELAJARAN (31)") | `struktur_unit.nama` |
| Bentuk isi kotak | `struktur_unit.tipe`: `daftar` (1 orang/baris), `grid` (3 sub-kolom, untuk 31 guru & 12 wali), `catatan` (paragraf, mis. Humas) |
| Kartu orang | foto 3:4 (placeholder inisial bila `ptk.foto_path` kosong) + nama/gelar + NIP + mapel/kelas |
| NIP | `ptk.nip`, atau **`struktur_anggota.nip_manual`** bila `ptk` belum punya (tabel `ptk` tidak diubah) |
| Kotak catatan (Humas / pembina ekskul) | `struktur_unit.catatan`, atau rangkuman "keterangan: nama" anggotanya |
| Band SISWA, catatan kaki, blok tanda tangan | `struktur_catatan_kaki`, `struktur_kamad_nama/nip`, `struktur_tempat_tgl` |

Kepadatan: kartu ≈34 px, kotak dengan >8 anggota memakai 2 sub-kolom CSS (`columns:2`),
lebar kolom proporsional dengan jumlah entri dan tidak boleh sempit (basis 90 px, min. 3 bagian).
NIP tampil bila `struktur_tampil_nip=1` (dokumen internal) — **halaman publik selalu tanpa NIP**.

## Seed awal (SK 023/2026 — acuan tampilan `struktur-foto-v4-nip.html`)

Acuan data & NIP: `C:\Users\LENOVO\Downloads\struktur-foto-v4-nip.html`
(data personel identik dengan `v2-premium`; v4 memuat NIP 51 orang).
Parser: `scripts/struktur-dari-html.mjs` → `scripts/struktur-sk023.json` → `scripts/seed-struktur-sk023.ts`.
Audit lengkap bagan ↔ `ptk` (47 orang, 10 nama belum ada di `ptk`, baris `ptk` duplikat):
lihat `.hermes/plans/2026-09-14_104235-modul-struktur-organisasi.md` §13.

Unit awal: `komite` (mitra), `kamad` (pimpinan), `kaur-tu`, `wakamad-kurikulum`, `wakamad-kesiswaan`,
`wakamad-sarpras`, `wakamad-humas`, `tu-staf`, `guru-mapel`, `wali-kelas`, `guru-bk`,
`pembina-ekskul`, `kepala-perpustakaan`, `kepala-lab`, `pendukung`.
Anggota awal: 44 pegawai (6 pimpinan + 7 TU inti + 31 guru) + 12 wali kelas + Ketua Komite + 2 pendukung,
lengkap dengan gelar dari SK. `scripts/seed-struktur-sk023.ts`:

```bash
node --import tsx scripts/seed-struktur-sk023.ts --dry-run   # cetak rencana + laporan selisih
node --import tsx scripts/seed-struktur-sk023.ts             # tulis (idempoten)
```
Laporan selisih wajib berisi: (a) nama SK yang tidak ketemu di `ptk`, (b) PTK yang belum masuk struktur,
(c) konflik gelar/NIP. **Keputusan menambah/mengubah `ptk` tetap milik user.**

---

## E2E Test

- `tests/e2e/struktur.spec.ts` — skenario 029-01 … 029-09 (lihat `test-plan.md`).
- `tests/e2e/full-remote.spec.ts` — daftar endpoint biner ditambah `/api/struktur/bagan.png`.

---

## Migration Checklist

- [ ] `npm run db:generate` → `drizzle/000X_struktur.sql` (2 tabel + 2 index).
- [ ] **Backup produksi lebih dulu** (`npm run backup:create`) sebelum `npm run db:migrate`.
- [ ] `npm run check` bersih (0 error 0 warning).
- [ ] `npx vitest run` + `npx playwright test tests/e2e/struktur.spec.ts tests/e2e/full-remote.spec.ts` hijau.
- [ ] `npm run build` bersih, PM2 restart, health 200.
- [ ] Audit browser E2E: crawl halaman baru (0 href 404/405) + klik CRUD + cetak/unduh + halaman publik.
- [ ] `specs/README.md` diperbarui (status 029).
- [ ] `specs/029-struktur-organisasi/MDD.md` diperbarui tiap fase.
- [ ] Update skill `struktur-organisasi-madrasah` bila ada pelajaran baru (mis. cara impor & cache PNG).
