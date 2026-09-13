# test-plan.md — Backup & Restore (spec 027)

> Semua modul harus punya test sebelum release. Test ditulis **sebelum** implementasi (TDD).

---

## Test Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest (`src/**/*.test.ts`) | Guard murni (zip-slip, manifest, sha256, exclude), service backup, logika apply/rollback |
| E2E | Playwright (`tests/e2e/backup.spec.ts`) | Alur admin: buat/list/unduh/hapus + guard role |
| Structural | Playwright (`tests/e2e/full-remote.spec.ts`) | Tidak ada `fetch('/api/...')` di `src/`; endpoint biner terdaftar; endpoint legacy tetap 404 |

---

## E2E Scenarios

```gherkin
Scenario: Admin membuat backup
  Given admin sudah login
  When buka /admin/backup dan klik "Buat Backup Sekarang"
  Then toast sukses muncul
  And baris arsip baru muncul dengan pola nama simad-backup-*
  And ukuran arsip > 0

Scenario: Daftar arsip menampilkan isi arsip
  Given ada arsip di data/backups
  When buka /admin/backup
  Then kolom ukuran, jumlah file, dan baris siswa terisi

Scenario: Unduh arsip
  Given ada arsip di daftar
  When klik "Unduh"
  Then file .zip terunduh dengan nama berpola simad-backup-*

Scenario: Hapus arsip
  Given ada arsip manual (source ui)
  When klik "Hapus" dan konfirmasi
  Then toast sukses muncul
  And baris arsip hilang dari daftar

Scenario: Non-admin ditolak
  Given user bergole guru sudah login
  When buka /admin/backup
  Then halaman tidak menampilkan daftar arsip (ditolak)

Scenario: Tanpa login
  Given user tidak login
  When buka /admin/backup
  Then redirect ke /login
```

---

## Role-Based Access Control

| Halaman / aksi | admin | kepsek | guru | staf | siswa | ortu |
|---|---|---|---|---|---|---|
| `/admin/backup` (lihat daftar) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `createBackupC` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `deleteBackupC` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/api/backup/[name]/download` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `uploadRestoreZipC` / `inspectRestoreC` / `prepareRestoreC` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Unit Test Scenarios

### `src/lib/server/backup/guards.ts`
- `assertSafeZipEntry` menolak `../evil.txt`, `C:\evil.txt`, `/abs/evil`, `uploads/../../x`
- `assertSafeZipEntry` menerima `uploads/bel/1.mp3`, `manifest.json`, `local.db`
- `safeJoin` menolak path keluar dari root
- `validateManifest` menolak `app` salah, `formatVersion` lebih baru, `files` bukan array
- `validateManifest` menerima manifest valid dan mengembalikan objek bertipe
- `sha256Buffer`/`sha256File` cocok dengan `crypto.createHash('sha256')` untuk fixture
- `shouldExclude` menolak `*.log`, `Thumbs.db`, `nul`, `*.replaced-*`, entri > 200 MB
- `shouldExclude` menerima `uploads/bel/1.mp3`, `uploads/foto_siswa/185.jpg`
- `BACKUP_NAME_RE` menerima nama sah & menolak `../local.db` / nama tanpa pola
- `formatStamp`/`parseStamp` bolak-balik konsisten (waktu lokal)

### `src/modules/backup/backup.service.ts` (fixture DB kecil + folder uploads temp)
- `buildManifest` → `files` terurut, `filesTotal`/`filesBytes` konsisten dengan isi ZIP
- `createBackup` → arsip berisi `manifest.json` sebagai entri **pertama**, `local.db`, folder `uploads/`
- `createBackup` → `manifest.dbRowCounts` cocok dengan `COUNT(*)` DB sumber
- `verifyArchive` lolos untuk arsip buatan sendiri
- `verifyArchive` **gagal** bila isi arsip diubah setelah dibuat (sha256 mismatch)
- `listBackups` menandai `broken: true` untuk ZIP tanpa manifest
- `listBackups` + `deleteBackup` menolak nama di luar pola (path traversal)
- `pruneBackups` menyisakan 30 `cron` + 5 `pre-restore`, dan **tidak** memangkas arsip `ui`
- `inspectArchive` mengembalikan preview (baris DB & jumlah file) atau gagal dengan pesan jelas

### `src/lib/server/backup/apply.ts`
- `detectDbLock` mengembalikan `locked: false` untuk file bebas dan pesan instruksi pm2 saat terkunci
- `planSwap` menghasilkan urutan langkah (rename DB → hapus `-wal`/`-shm` → pindah DB → pindah uploads) dengan target `*.replaced-<stamp>`
- `compareRowCounts` mendeteksi tabel yang jumlah barisnya tidak cocok manifest
- `applyRestore({dryRun:true})` tidak mengubah file apa pun
- `applyRestore` pada fixture: memulihkan DB + uploads dan menghapus `-wal`/`-shm` lama
- `applyRestore` dengan DB staged rusak → rollback: file asli kembali utuh, `last-result.json` menandai gagal

---

## Structural Guards (full-remote.spec.ts)

- [ ] Tidak ada `fetch('/api/...')` di seluruh `src/` (UI backup memakai remote functions + `<a href>`)
- [ ] Tidak ada `+page.server.ts` dengan `export const actions`
- [ ] `/api/backup/[name]/download/+server.ts` terdaftar sebagai endpoint biner yang diizinkan (`export const GET`)
- [ ] Endpoint bisnis legacy tetap 404
- [ ] `ecosystem.config.cjs` tetap bersih dari service Go API

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Unit test (guard + service + apply) | ≥ 18 test, semua hijau |
| E2E happy paths | 100% |
| E2E role guards | 100% |
| Structural guards | 100% |
| Drill restore (manual, terbukti) | 1× sukses + 1× rollback |

---

## Running Tests

```bash
# Unit test modul backup
npx vitest run src/lib/server/backup src/modules/backup

# E2E modul backup
npx playwright test tests/e2e/backup.spec.ts

# Guard struktural
npx playwright test tests/e2e/full-remote.spec.ts

# Semua
npm run test && npm run check && npx playwright test
```
