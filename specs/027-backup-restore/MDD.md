# MDD — Modul Backup & Restore (spec 027)

## Workflow: Markdown-Driven Development

### Phase 1: Spec (Markdown)
```
specs/027-backup-restore/spec.md        ← user story, AC, edge cases, data model, kontrak service/remote
specs/027-backup-restore/test-plan.md   ← strategi + skenario Gherkin + RBAC + unit scenario + coverage
```
- Disetujui user 13 Sep 2026 (mode restore: CLI satu baris; cron 23:00; retensi 30 + 5; Drive ditunda)

### Phase 2: TDD — Tulis Test Dulu (RED)
```
src/lib/server/backup/guards.test.ts             ← 10 test (zip-slip, manifest, sha256, exclude, stamp)
src/modules/backup/backup.service.test.ts        ← 12 test (create/verify/list/delete/prune/inspect/prepare)
src/lib/server/backup/apply.test.ts              ← 10 test (deteksi lock, planSwap, dry-run, apply, rollback, sesi)
tests/e2e/backup.spec.ts                         ← 4 test (tanpa login, endpoint 401, admin buat/unduh/hapus, guru ditolak)
```
- Setiap file test dijalankan **sebelum** implementasi dan harus FAIL dulu
- Perintah: `npx vitest run src/lib/server/backup src/modules/backup`

### Phase 3: Implementation (GREEN)
```
src/lib/server/paths.ts                          ← ROOT/DB_FILE/UPLOADS/BACKUP_DIR/RESTORE_DIR (hanya node:*)
src/lib/server/backup/guards.ts                  ← guard murni: assertSafeZipEntry, safeJoin, sha256, validateManifest, walkFiles, formatStamp
src/lib/server/backup/apply.ts                   ← detectDbLock, planSwap, compareRowCounts, applyRestore (swap + rollback)
src/modules/backup/backup.validation.ts          ← Valibot: backupNameSchema, stagedNameSchema, emptySchema
src/modules/backup/backup.service.ts             ← createBackup, verifyArchive, listBackups, deleteBackup, pruneBackups, inspectArchive, prepareRestore, readRestoreStatus
src/modules/backup/backup.remote.ts              ← query/command/form (thin wrapper)
src/routes/admin/backup/+page.svelte             ← UI admin (tanpa +page.server.ts)
src/routes/api/backup/[name]/download/+server.ts ← satu-satunya endpoint biner (unduh arsip)
scripts/backup-create.ts · backup-status.ts · restore-apply.ts
```
- Implementasi minimum agar test hijau; tidak ada kode produksi sebelum ada test merah

### Phase 4: Refactor & Integrasi
- `src/lib/config/navigation.ts` → grup **Sistem → Backup & Restore** (`roles: ['admin']`)
- `ecosystem.config.cjs` → `BODY_SIZE_LIMIT=209715200`, `BACKUP_DIR=data/backups`
- `.gitignore` → `data/backups/`, `data/restore/`, `local.db.replaced-*`, `static/uploads.replaced-*`
- `package.json` → `adm-zip`, `@types/adm-zip`, script `backup:create|status|restore`
- `tests/e2e/full-remote.spec.ts` → endpoint binari `/api/backup/[name]/download` didaftarkan resmi
- `specs/README.md` → index 027
- `AGENTS.md` → section Backup & Restore + pitfall

### Phase 5: Verify
```bash
npx vitest run src/lib/server/backup src/modules/backup     # 32 test hijau
npm run check                                              # 0 error
npm run build                                              # build produksi sukses
npx playwright test tests/e2e/backup.spec.ts tests/e2e/full-remote.spec.ts
npm run backup:create && npm run backup:status              # arsip nyata + ringkasan
node --import tsx scripts/restore-apply.ts --dry-run        # validasi arsip tanpa mengubah berkas
```

---

## File Structure

```
specs/027-backup-restore/
├── spec.md
├── test-plan.md
├── MDD.md
└── drill.md                    ← bukti drill restore (sukses + rollback)

src/lib/server/
├── paths.ts
└── backup/{guards.ts,guards.test.ts,apply.ts,apply.test.ts}

src/modules/backup/
├── backup.validation.ts
├── backup.service.ts
├── backup.service.test.ts
└── backup.remote.ts

src/routes/admin/backup/+page.svelte
src/routes/api/backup/[name]/download/+server.ts
tests/e2e/backup.spec.ts
scripts/{backup-create,backup-status,restore-apply}.ts
```

---

## Scenarios & Test Coverage

### Skenario E2E
| Skenario | Test | Status |
|---|---|---|
| Tanpa login → redirect `/login` | `backup.spec.ts` | ✅ |
| Endpoint unduh tanpa auth → 401 | `backup.spec.ts` | ✅ |
| Admin buat backup (toast + baris baru + kolom isi terisi) | `backup.spec.ts` | ✅ |
| Unduh arsip (nama berpola) | `backup.spec.ts` | ✅ |
| Hapus arsip (AlertDialog + baris hilang) | `backup.spec.ts` | ✅ |
| Role guru ditolak ("Akses ditolak", tombol tidak ada) | `backup.spec.ts` | ✅ |
| Guard struktural (endpoint biner terdaftar, legacy 404) | `full-remote.spec.ts` | ✅ |

### Skenario Unit
| Fungsi | Test |
|---|---|
| `assertSafeZipEntry` / `safeJoin` (zip-slip, absolut, drive letter) | 3 test ✅ |
| `validateManifest` (app salah, versi lebih baru, db/files hilang) | 2 test ✅ |
| `sha256File/Buffer`, `shouldExclude`, `formatStamp/humanBytes` | 5 test ✅ |
| `createBackup` (isi zip, row counts, tanpa file .tmp-) | 2 test ✅ |
| `verifyArchive` (lolos, DB diubah, file hilang) | 3 test ✅ |
| `listBackups` / `deleteBackup` (broken, path traversal) | 3 test ✅ |
| `pruneBackups` (30 cron + 5 pre-restore, `ui` aman) | 1 test ✅ |
| `inspectArchive` (preview + tolak ZIP palsu), `prepareRestore` (snapshot + pending) | 3 test ✅ |
| `detectDbLock` (bebas vs terkunci + instruksi pm2) | 2 test ✅ |
| `planSwap` + `compareRowCounts` | 2 test ✅ |
| `applyRestore` (dry-run, sukses, rollback, sesi, arsip rusak, DB terkunci) | 6 test ✅ |

---

## Dependency Graph

```
src/routes/admin/backup/+page.svelte
  └── $modules/backup/backup.remote.ts (getBackupStateQ, createBackupC, deleteBackupC,
      uploadRestoreForm, inspectRestoreC, prepareRestoreC, hapusUnggahanC)
        └── $modules/backup/backup.service.ts
              ├── src/lib/server/paths.ts        (ROOT, DB_FILE, UPLOADS_DIR, BACKUP_DIR, RESTORE_DIR)
              ├── src/lib/server/backup/guards.ts (zip-slip, sha256, manifest, walk, exclude)
              └── better-sqlite3 / adm-zip

src/routes/api/backup/[name]/download/+server.ts
  └── guards.ts + paths.ts (BACKUP_DIR)

scripts/restore-apply.ts
  └── src/lib/server/backup/apply.ts ── verifyArchive/inspectDatabase ── backup.service.ts
        └── guards.ts + paths.ts
```

---

## Migration Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Spec + test plan (disetujui user) | ✅ Done |
| 2 | Unit test guard (10 test, RED → GREEN) | ✅ Done |
| 3 | Unit test service (12 test, RED → GREEN) | ✅ Done |
| 4 | Unit test apply/rollback (10 test, RED → GREEN) | ✅ Done |
| 5 | Service + guards + paths | ✅ Done |
| 6 | Remote functions (query/command/form) | ✅ Done |
| 7 | Halaman `/admin/backup` + navigasi | ✅ Done |
| 8 | Endpoint unduh arsip + daftar izin guard struktural | ✅ Done |
| 9 | E2E `backup.spec.ts` (4 skenario) | ✅ Done |
| 10 | CLI `backup-create` / `backup-status` / `restore-apply` | ✅ Done |
| 11 | Drill restore nyata + rollback (bukti `drill.md`) | ✅ Done |
| 12 | Cron 23:00 + notifikasi Telegram | ✅ Done |
| 13 | `AGENTS.md`, `specs/README.md`, skill | ✅ Done |
| 14 | `npm run check` · build · seluruh test | ✅ Done |
