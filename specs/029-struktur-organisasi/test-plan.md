# test-plan.md — Spec 029 Modul Struktur Organisasi

> Pasangan dari `spec.md`. Ditulis SEBELUM implementasi (TDD): skenario di bawah harus **FAIL**
> dulu, baru implementasi dibuat sampai hijau.

---

## Test Strategy

| Level | Tool | Cakupan untuk modul ini |
|-------|------|--------------------------|
| E2E | Playwright (`tests/e2e/struktur.spec.ts`) | alur admin CRUD, guard role, cetak/unduh, bagan publik, alias, pengaturan nonaktif |
| Unit | Vitest (`src/modules/struktur/*.test.ts`) | penyusunan pohon bagan, pengurutan, rekap, konsistensi wali↔rombel, resolusi nama+gelar, validator |
| Structural | Playwright (`tests/e2e/full-remote.spec.ts`) | daftar endpoint biner (tambah `/api/struktur/bagan.png`), larangan `fetch('/api/...')` |

**Target coverage:** service `struktur.service.ts` + `struktur-bagan.util.ts` ≥ 80% baris (fungsi murni
penyusun bagan 100%), semua remote function punya minimal 1 tes (unit atau e2e).

---

## RBAC Matrix

| Aksi | admin | kepsek | guru | staf | siswa | ortu | publik |
|------|-------|--------|------|------|-------|------|--------|
| Buka `/admin/struktur` | ✅ | ✅ | ✅ | ✅ | – | – | – |
| Lihat tombol tambah/ubah/hapus | ✅ | – | – | – | – | – | – |
| `simpanUnitF` / `hapusUnitC` / `simpanAnggotaF` / `hapusAnggotaC` / `urutkanAnggotaC` | ✅ | 403 | 403 | 403 | 403 | 403 | 401 |
| Buka `/admin/struktur/bagan` + cetak + unduh PNG | ✅ | ✅ | – | – | – | – | – |
| Buka `/profil/struktur` (jika aktif) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buka `/profil/struktur` (jika nonaktif) | 404 | 404 | 404 | 404 | 404 | 404 | 404 |
| NIP tampil di halaman publik | – | – | – | – | – | – | tidak ada |

---

## E2E Scenarios

```gherkin
Scenario: 029-01 admin melihat daftar unit dan anggota
  Given saya login sebagai admin
  When saya membuka /admin/struktur
  Then tampil daftar unit (accordion) beserta anggotanya
  And tampil rekap jumlah pegawai, jumlah wali kelas, dan jumlah unit kosong

Scenario: 029-02 admin menambah unit baru
  Given saya login sebagai admin dan berada di /admin/struktur
  When saya menambah unit "Wakamad Kurikulum" dengan kelompok KURIKULUM
  Then unit muncul di daftar dengan urutan terakhir
  And tidak ada toast error

Scenario: 029-03 admin menugaskan PTK ke unit (dengan gelar)
  Given unit "wali-kelas" ada dan saya login sebagai admin
  When saya menugaskan PTK "ABDILLAH" ke unit itu dengan gelar "S.Pd" dan urutan 1
  Then anggota tersimpan dan tampil di bagan pada kotak VII-A sebagai "Abdillah, S.Pd"

Scenario: 029-04 admin menambah anggota luar (komite)
  Given saya login sebagai admin
  When saya menambah anggota tanpa memilih PTK dengan nama "Sabaruddin, S.IP"
  And keterangan "Ketua Komite"
  Then anggota tersimpan sebagai entri luar (ptk_id kosong)

Scenario: 029-05 hapus unit yang masih berisi anggota ditolak
  Given unit "guru-mapel" masih punya anggota aktif
  When saya menghapus unit itu
  Then sistem menolak dengan pesan jelas
  And unit tetap ada di daftar

Scenario: 029-06 guru tidak boleh mengubah struktur
  Given saya login sebagai guru
  When saya membuka /admin/struktur
  Then tombol tambah/ubah/hapus tidak ada
  And halaman tetap menampilkan bagan (read-only)

Scenario: 029-07 command tanpa hak dijawab 403
  Given saya login sebagai guru
  When remote command simpanUnitF dipanggil langsung
  Then dijawab error 403

Scenario: 029-08 rekap menandai wali kelas tidak sinkron dengan rombel
  Given jumlah anggota unit "wali-kelas" berbeda dari jumlah baris rombel
  When saya membuka /admin/struktur
  Then muncul penanda peringatan selisih pada rekap

Scenario: 029-09 halaman cetak memakai ukuran kanvas spanduk
  Given bagan sudah berisi data
  When saya membuka /admin/struktur/bagan/cetak/spanduk-2x1
  Then halaman memakai @page size 529.17mm x 264.58mm dengan margin 0
  And tanpa navbar/sidebar admin

Scenario: 029-10 unduh PNG bagan berhasil
  Given saya login sebagai admin
  When saya membuka /api/struktur/bagan.png
  Then respons 200 dengan Content-Type image/png
  And ukuran berkas > 100 KB

Scenario: 029-11 bagan publik tampil tanpa NIP
  Given pengaturan struktur_publik_aktif = 1
  When pengunjung membuka /profil/struktur
  Then bagan tampil dengan nama + gelar + jabatan
  And tidak ada teks NIP satu pun di halaman

Scenario: 029-12 bagan publik nonaktif
  Given pengaturan struktur_publik_aktif = 0
  When pengunjung membuka /profil/struktur
  Then dijawab 404

Scenario: 029-13 navigasi publik ke struktur
  Given pengunjung membuka /guru
  Then ada tautan "Lihat Struktur Organisasi" menuju /profil/struktur
  And menu "Profil" memuat item "Struktur Organisasi"

Scenario: 029-14 alias /struktur
  Given pengunjung membuka /struktur
  Then diarahkan (308) ke /profil/struktur

Scenario: 029-15 seed idempoten
  Given seed SK 023/2026 sudah pernah dijalankan
  When seed dijalankan ulang
  Then jumlah unit dan anggota tidak bertambah (tidak ada duplikat)
  And laporan selisih konsisten dengan hasil jalan pertama
```

---

## Unit Test (Vitest)

`src/modules/struktur/struktur-bagan.util.test.ts`
- menyusun pohon unit dari daftar datar (parent_kode) + urutan `kolom` lalu `urutan`;
- menyembunyikan unit/anggota `tampil_bagan = 0`;
- resolver nama tampil: `ptk.nama` + `gelar` (tanpa gelar → nama saja), `nama_manual` untuk entri luar;
- mode publik: seluruh field `nip*` tidak ikut keluar dari builder.

`src/modules/struktur/struktur.service.test.ts`
- rekap: hitung anggota aktif, pegawai unik (`DISTINCT ptk_id`), unit kosong;
- konsistensi: wali kelas vs `count(rombel)` → flag bila beda;
- hapus unit: ditolak bila masih ada anggota aktif, diterima bila kosong (mock DB);
- guard: `requireStrukturAdmin()` melempar 403 untuk role selain admin.

`src/modules/struktur/struktur.validation.test.ts`
- `kode`: wajib, huruf kecil/angka/dash, unik (validasi bentuk);
- `ptk_id` boleh kosong **hanya bila** `nama_manual` diisi;
- `urutan`/`kolom` integer ≥ 0.

---

## Structural Guards (jangan dilonggarkan)

- `tests/e2e/full-remote.spec.ts` → daftar endpoint biner ditambah:
  `['GET', '/api/struktur/bagan.png']` (assert `existsSync('src/routes/api/struktur/bagan.png/+server.ts')` + `export const GET`).
- Larangan `fetch('/api/...')` di `src/` → semua unduhan memakai `<a href download>`.
- Larangan `export const actions` di `+page.server.ts` → halaman `/struktur` (alias) hanya `redirect()` di `load`.

---

## Data Uji

- `local.db` lokal (40 PTK, 12 rombel) — unit & anggota uji ditulis lalu dihapus di `afterEach`
  agar `npm run db:migrate` tidak mengotori data user.
- Nama PTK uji: `ABDILLAH` (ada), entri luar `Sabaruddin, S.IP`.
- Untuk skenario 029-12, pengaturan `struktur_publik_aktif` dikembalikan ke nilai semula setelah tes.

## Menjalankan

```bash
npx vitest run src/modules/struktur                 # unit
npx playwright test tests/e2e/struktur.spec.ts      # e2e modul
npx playwright test tests/e2e/full-remote.spec.ts   # guard struktural
npm run check && npm run build                      # gerbang akhir
```
Catatan mesin ini: jalankan e2e dengan `--workers=1..2` (Chromium sering crash bila paralel penuh).
