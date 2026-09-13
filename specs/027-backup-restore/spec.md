# Spec 027 — Modul Backup & Restore

## Module: Backup & Restore

### User Story

Sebagai **admin** madrasah, saya ingin mem-backup database beserta seluruh file unggahan SIMAD dan memulihkannya saat data rusak/salah input, supaya data madrasah (siswa, PTK, dokumen, foto, suara bel) tidak hilang dan tidak perlu diketik ulang.

**Roles:**
- `admin` — satu-satunya role yang boleh membuat/mengunduh/menghapus arsip dan menyiapkan restore
- `kepsek` — tidak punya akses (data arsip memuat seluruh DB)
- `guru` — tidak punya akses
- `siswa` — tidak punya akses
- `orangtua` — tidak punya akses

### Acceptance Criteria

- [ ] Admin bisa membuat backup dengan 1 klik dari `/admin/backup`
- [ ] Arsip memuat `manifest.json` (berversi) + `local.db` (snapshot konsisten) + seluruh `static/uploads/**`
- [ ] Arsip bisa diunduh dan dihapus dari UI
- [ ] Backup otomatis harian 23:00 WITA + ringkasan ke Telegram
- [ ] Restore divalidasi (sha256 tiap entri, manifest, `PRAGMA integrity_check`, tabel wajib) sebelum menyentuh data
- [ ] Restore menampilkan preview perbandingan (baris & file sekarang vs arsip) sebelum dieksekusi
- [ ] Restore selalu membuat snapshot pengaman lebih dulu
- [ ] Restore gagal verifikasi → rollback otomatis, data lama utuh
- [ ] Non-admin (guru/kepsek/siswa/ortu) ditolak saat membuka halaman & menjalankan aksi
- [ ] Retensi otomatis: 30 arsip `cron`, 5 `pre-restore`, arsip `ui` tidak dipangkas

### Edge Cases

- Arsip korup / terpotong → sha256 mismatch → **ditolak**, tidak dipulihkan
- ZIP berisi entri `../evil.txt`, path absolut, atau `C:\evil` → ditolak (zip-slip guard)
- ZIP tanpa `manifest.json` atau `app` bukan `simad-mtsn2kolut` → ditolak
- `manifest.formatVersion` lebih baru dari yang didukung → ditolak dengan pesan versi
- ZIP lebih besar dari 200 MB → ditolak sebelum ditulis penuh
- Disk bebas < 3× ukuran arsip → ditolak dengan pesan disk
- Restore dijalankan saat `local.db` masih terkunci proses lain → script berhenti dengan instruksi `pm2 stop simad-bel mtsn-app-bff`
- Setelah swap, DB baru gagal `integrity_check` atau jumlah baris tidak cocok manifest → rollback otomatis
- Tabel `sessions` ikut ter-replace → sesi admin pelaku disisipkan ulang best-effort; sesi lain logout
- `data/kartu/` tidak dipulihkan (derived) → kartu di-generate ulang saat dibuka
- Log/artefak (`*.log`, `Thumbs.db`, `nul`, `*.replaced-*`) tidak pernah masuk arsip

### Out of Scope

- Backup inkremental/differensial
- Ekspor JSON per tabel
- Cloud sync dua arah / point-in-time recovery
- Enkripsi arsip
- Backup `data/kartu/`, `node_modules`, `build`, `.svelte-kit`

---

## Data Model

### Tabel yang terlibat

Modul ini **tidak menambah tabel**. Relasi baca seluruh tabel, dan tulis penuh saat restore.

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `siswa` | `id` (+ seluruh kolom saat restore) | — |
| `ptk` | `id` | — |
| `users` | `id`, `username`, `role` | dipakai cek sesi pelaku |
| `sessions` | `token`, `user_id`, `expires_at` | sisip ulang sesi admin pelaku |
| `schema_migrations` | `version` | ditulis ke manifest |
| seluruh 26 tabel | `count(*)` | `manifest.dbRowCounts` |

### Query Pattern

```sql
-- Row counts untuk manifest
SELECT COUNT(*) AS c FROM "siswa";

-- Integritas
PRAGMA integrity_check;

-- Sesi pelaku (best-effort setelah restore)
INSERT OR IGNORE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?);
```

### Artefak runtime (bukan tabel)

| Path | Isi |
|---|---|
| `data/backups/simad-backup-<stamp>-<source>.zip` | arsip |
| `data/restore/incoming/<stamp>.zip` | ZIP yang baru diunggah |
| `data/restore/staged/<stamp>/` | hasil ekstraksi terverifikasi |
| `data/restore/pending.json` | rencana restore yang siap dieksekusi CLI |
| `data/restore/last-result.json` | hasil eksekusi terakhir (dibaca UI) |
| `data/restore/history.log` | riwayat restore |

---

## Domain Module Structure

```
src/lib/server/
├── paths.ts                      # ROOT, DB_FILE, UPLOADS, BACKUP_DIR, RESTORE_DIR (hanya node:*)
└── backup/
    ├── guards.ts                 # guard murni: zip-slip, path, sha256, manifest, exclude (hanya node:*)
    ├── guards.test.ts            # unit test guard
    ├── apply.ts                  # validasi arsip + swap + rollback (dipakai CLI, hanya node:*)
    └── apply.test.ts             # unit test logika apply

src/modules/backup/
├── backup.validation.ts          # Valibot: nama arsip, argumen command
├── backup.service.ts             # createBackup, verifyArchive, listBackups, deleteBackup, pruneBackups,
│                                 # inspectArchive, prepareRestore, readRestoreStatus, requireAdmin
├── backup.remote.ts              # thin wrapper (query/command)
└── backup.service.test.ts        # unit test service

src/routes/admin/backup/
└── +page.svelte                  # UI (tanpa +page.server.ts)

src/routes/api/backup/[name]/download/
└── +server.ts                    # SATU-SATUNYA endpoint biner (unduh arsip)

scripts/
├── backup-create.ts              # CLI pembuat arsip (dipakai cron 23:00)
├── backup-status.ts              # ringkasan arsip terakhir
└── restore-apply.ts              # eksekutor restore (server berhenti)
```

### Validation (validation.ts)

```ts
import * as v from 'valibot';

export const backupNameSchema = v.pipe(
  v.string(),
  v.regex(/^simad-backup-\d{8}-\d{6}-(ui|cron|pre-restore)\.zip$/, 'Nama arsip tidak valid')
);

export const stagedNameSchema = v.pipe(v.string(), v.regex(/^[\w.-]+\.zip$/));
export const emptySchema = v.object({});
```

### Service (service.ts) — kontrak

```ts
createBackup(opts: { source: 'ui'|'cron'|'pre-restore'; by?: string }): Promise<BackupInfo>
verifyArchive(zipPath: string): Promise<BackupManifest>            // throw bila tidak valid
listBackups(): Promise<BackupListItem[]>                            // broken: true bila manifest rusak
deleteBackup(name: string): Promise<{ ok: true }>
pruneBackups(opts?: { keepCron?: number; keepPre?: number }): Promise<string[]>  // arsip yang dihapus
inspectArchive(staged: string): Promise<RestoreInspection>          // validasi + preview
prepareRestore(staged: string, by: string): Promise<RestorePending> // snapshot pengaman + pending.json
readRestoreStatus(): Promise<RestoreResult | null>
requireAdmin(locals): User                                          // throw 401/403
```

### Remote (remote.ts)

```ts
export const getBackupsQ       = query(async () => listBackups());
export const createBackupC     = command(emptySchema, async () => createBackup({ source: 'ui', by: actor() }));
export const deleteBackupC     = command(v.object({ name: backupNameSchema }), async ({ name }) => deleteBackup(name));
export const uploadRestoreZipC = command(v.object({ fileName: v.string(), fileSize: v.number() }), async (...) => ...);
export const inspectRestoreC   = command(v.object({ staged: stagedNameSchema }), async ({ staged }) => inspectArchive(staged));
export const prepareRestoreC   = command(v.object({ staged: stagedNameSchema }), async ({ staged }) => prepareRestore(staged, actor()));
export const getRestoreStatusQ = query(async () => readRestoreStatus());
```

### Component (+page.svelte)

- Tabel arsip (nama, ukuran, tanggal WITA, sumber, jumlah file, baris siswa/ptk, badge rusak)
- Tombol **Buat Backup Sekarang**, **Unduh** (`<a href="/api/backup/{name}/download">`), **Hapus** (AlertDialog)
- Panel Restore: pilih ZIP → unggah → preview → **Siapkan Restore** → blok perintah siap-salin
- Panel hasil restore terakhir
- Mobile-first compact (max 480px), shadcn murni, toast via `$lib/toast.ts`

---

## E2E Test

```ts
// tests/e2e/backup.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test('admin membuat backup', async ({ page }) => {
  await loginAs(page);
  await page.goto('/admin/backup');
  await page.getByRole('button', { name: /Buat Backup/i }).click();
  await expect(page.getByText(/berhasil|sukses/i)).toBeVisible();
});
```

---

## Migration Checklist

- [x] Spec reviewed & approved (13 Sep 2026)
- [ ] `adm-zip` terpasang + npm script `backup:*`
- [ ] `src/lib/server/backup/guards.ts` + test (RED → GREEN)
- [ ] `src/lib/server/paths.ts`
- [ ] `src/modules/backup/backup.service.ts` + test (RED → GREEN)
- [ ] `src/modules/backup/backup.remote.ts`
- [ ] `src/routes/admin/backup/+page.svelte`
- [ ] `src/routes/api/backup/[name]/download/+server.ts` + daftar izin structural guard
- [ ] `src/lib/server/backup/apply.ts` + test (RED → GREEN)
- [ ] `scripts/{backup-create,backup-status,restore-apply}.ts`
- [ ] E2E `tests/e2e/backup.spec.ts` PASS
- [ ] Drill restore terbukti (`drill.md`)
- [ ] Cron 23:00 terpasang & terbukti sekali jalan
- [ ] `AGENTS.md` + `MDD.md` + index `specs/README.md`
- [ ] `npm run check` bersih · `npm run test` hijau · guard struktural hijau
