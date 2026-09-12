# plan-baru.md — Rencana Eksekusi: Full Remote Function, Guardrail, MDD & Vitest

> **STATUS: BELUM DIEKSEKUSI.** Dokumen ini adalah instruksi kerja untuk LLM eksekutor.
> Jangan mulai coding sebelum membaca seluruh dokumen ini.
>
> Metodologi wajib: **Spec-Driven (MDD) → TDD (test RED dulu) → code → GREEN → commit**.
> Basis: review arsitektur + `plan.md` + `plan-full-remote.md`.

---

## 0. Konteks & Kondisi Awal (sudah diverifikasi)

Commit terakhir: `feat(migration): remote functions A1-A4 + bel + hapus Go backend`.

| Item | Status terverifikasi |
|------|----------------------|
| Go backend untuk web (`backend/`, `api.exe`, port 3730) | ✅ Sudah dihapus |
| `worker-bel` (Go, port 8093) | ✅ Sengaja dipertahankan (playback suara) |
| `pm2 list` / `ecosystem.config.cjs` | ✅ Hanya `mtsn-app-bff` (3720) + `simad-bel` (8093) |
| Remote functions A1 Auth, A2 Approval, A3 Skakpt, A4 Rombel, A7 Bel | ✅ Selesai |
| `npm run check` | ✅ 0 error / 0 warning |
| `npm run build` | ✅ Sukses |
| `npx playwright test` | ✅ 88/88 passed |

**Yang belum selesai (menjadi scope dokumen ini):**

| # | Gap | Bukti |
|---|-----|-------|
| G1 | Endpoint `+server.ts` bisnis masih ada | 6 file (daftar di §A6) |
| G2 | `fetch('/api/...')` masih dipakai di client | 8 panggilan di 3 halaman |
| G3 | `+page.server.ts` masih punya `actions` | `src/routes/siswa/profil/+page.server.ts:14` |
| G4 | Upload foto masih lewat `/api/siswa/me/foto` | `siswa/profil/+page.svelte:71` |
| G5 | Guardrail `full-remote.spec.ts` bocor (tidak rekursif + `readIfExists` vakum) | lihat §D1 |
| G6 | `kartu.spec.ts` justru mengunci endpoint legacy | `kartu.spec.ts:11-62` |
| G7 | Spec `017-remote-kartu` & `019-cleanup-go` hilang | dirujuk `plan-full-remote.md` |
| G8 | `specs/README.md` index stale (nomor/status salah) | lihat §D2 |
| G9 | Tidak ada Vitest, padahal `AGENTS.md` mengklaimnya | `package.json` |

---

## 1. Aturan Main untuk Eksekutor (WAJIB)

1. **Baca `AGENTS.md` dulu.** Pola: `validation.ts` (Valibot) → `service.ts` (DB murni) → `remote.ts` (wrapper tipis) → `components/`.
2. **Svelte MCP wajib**: sebelum menulis/mengubah `.svelte` atau `.svelte.ts`, jalankan `svelte_svelte-autofixer` sampai **0 issue**. Sebelum memakai API SvelteKit baru, cek `svelte_get-documentation`.
3. **Toast wajib** untuk semua aksi user (`$lib/toast` → `notify.*`, Bahasa Indonesia).
4. **Valibot** sebagai argumen pertama `query`/`form`/`command`.
5. **Max 150 baris** per `.remote.ts`; jika lebih, pecah domain.
6. **Jangan sentuh**: `worker-bel/`, `src/lib/components/ui/`, endpoint PNG (§A6 "KEEP").
7. **Jangan** pakai `$app/forms` / `use:enhance` / `action="?/..."` untuk fitur baru.
8. **Remote query di-cache.** Polling TIDAK boleh memanggil `getX(arg)` berulang (hasil cached). Gunakan `const q = getX(arg); await q.refresh(); const d = q.current;`.
9. Shell = **Windows PowerShell 5.1**: jangan pakai `&&`, gunakan `;` atau `if ($?) { ... }`.
10. **Satu sub-phase = satu commit** (conventional commit), setelah `npm run check` + test terkait GREEN.

---

# A. Milestone A5 — Foto & Profil Siswa (Full Remote + `form()` upload)

**Spec baru:** `specs/016-remote-siswa-profil/spec.md` (buat; belum ada).
**E2E:** `tests/e2e/siswa.spec.ts` (perluas).
**Referensi docs:** remote-functions §form (`v.file()`, `enctype="multipart/form-data"`).

### A5.1 Remote function upload foto
- [ ] Baca dulu `src/routes/api/siswa/me/foto/+server.ts` (masih ada) untuk mem-port logika validasi, penamaan file, direktori tujuan (`static/uploads/foto_siswa/pending/`), dan update kolom `fotoPending` / `fotoStatus`.
- [ ] Tambah di `src/modules/siswa/siswa.remote.ts` (dan skema di `siswa.validation.ts`):
  ```ts
  export const uploadFoto = form(
    v.object({ foto: v.pipe(v.file(), v.mimeType(['image/jpeg','image/png']), v.maxSize(2_000_000)) }),
    async ({ foto }) => { /* simpan + set status pending; return { success: true } */ }
  );
  ```
  - Wajib `getRequestEvent()` untuk mendapatkan user sesi (`locals.user` tidak tersedia di remote; ambil dari cookies/session service).
  - Return Bahasa Indonesia, mis. `{ success: true, pesan: 'Foto berhasil diunggah, menunggu approval.' }`.
- [ ] Pastikan `.remote.ts` tetap < 150 baris.

### A5.2 Halaman self-service `src/routes/siswa/profil/`
- [ ] **Hapus `actions`** di `src/routes/siswa/profil/+page.server.ts` (baris 14-34). Pilih salah satu:
  - ganti seluruh load menjadi `+page.ts` + remote query `getSiswaByRefIdQ({ refId })`, lalu **delete** `+page.server.ts`; ATAU
  - sisakan `load` saja (boleh, sesuai kriteria), tapi `actions` **wajib** dihapus.
- [ ] `src/routes/siswa/profil/+page.svelte`:
  - `ubahData` → panggil command `submitPerubahanC({ siswaId, field, nilai_baru })` (sudah ada di `siswa.remote.ts:16`), tampilkan toast.
  - Upload foto → ganti `fetch('/api/siswa/me/foto')` (baris 71) menjadi `<form {...uploadFoto} enctype="multipart/form-data">`; input pakai `{...uploadFoto.fields.foto.as('file')}`; di `uploadFoto.enhance(...)` tampilkan toast sukses/gagal.
- [ ] Verifikasi `src/routes/siswa/[id]/profil/+page.svelte` (admin) — sudah memakai `+page.ts` + remote; kalau masih ada fetch ke `/api/...`, migrasikan dengan pola sama.

### A5.3 Hapus endpoint legacy
- [ ] DELETE `src/routes/api/siswa/me/foto/+server.ts` (beserta folder kosongnya).

### A5.4 TDD
- [ ] Tulis/luaskan `tests/e2e/siswa.spec.ts` (RED sebelum implementasi):
  - login sebagai siswa → buka `/siswa/profil` → ajukan perubahan field → toast sukses tampil.
  - upload foto via `<input type="file">` (`page.setInputFiles`) → toast sukses tampil.
  - `GET /api/siswa/me/foto` → **404**.
- [ ] Jalankan sampai GREEN.

---

# B. Milestone A6 — Kartu (Full Remote, hapus endpoint bisnis)

**Spec baru:** `specs/017-remote-kartu/spec.md` (buat; dirujuk `plan-full-remote.md`).
**E2E:** `tests/e2e/kartu.spec.ts` — **rewrite total** (lihat §B5).

### B1. Remote functions (`src/modules/kartu/kartu.remote.ts`)
Sesuai `kartu.service.ts` (jangan ubah service kecuali perlu):
- [ ] `getKartuListQ` — sudah ada, pertahankan.
- [ ] `generateAllKartu` — sudah ada, pertahankan (`{ error }` atau `{ batch_id, total, message }`).
- [ ] **Perbaiki** `regenerateKartuCmd`:
  ```ts
  export const regenerateKartuCmd = command(v.string(), async (id) => {
    const sd = getSiswaKartu(id);
    if (!sd) error(404, 'Siswa tidak ditemukan');
    const { job, batch } = enqueueSingle(sd.id, sd.nama);
    return { ok: true, job_id: job.id, batch_id: batch.id, message: 'Regenerate sedang diproses' };
  });
  ```
  (import `error` dari `@sveltejs/kit`, `getSiswaKartu` dari service.)
- [ ] **Tambah** `getBatchStatusQ`:
  ```ts
  export const getBatchStatusQ = query(v.string(), async (batchId) => {
    const batch = getBatchStatus(batchId);
    if (!batch) return null;
    return { batch_id: batch.id, status: batch.status, total: batch.total, done: batch.done, failed: batch.failed };
  });
  ```
- [ ] **Tambah** `cancelBatchC`:
  ```ts
  export const cancelBatchC = command(v.string(), async (batchId) => {
    const cancelled = cancelBatch(batchId);
    return { ok: true, cancelled, message: `${cancelled} job dibatalkan` };
  });
  ```

### B2. Halaman batch `src/routes/siswa/kartu/+page.svelte`
- [ ] Import dari `$modules/kartu/kartu.remote`: `generateAllKartu`, `regenerateKartuCmd`, `getBatchStatusQ`, `cancelBatchC`. Hapus import `invalidate` dari `$app/navigation` (list adalah remote query, bukan load).
- [ ] `generateAll()` → `const d = await generateAllKartu();` lalu `if ('error' in d) { notify.error(d.error); ... }`.
- [ ] `pollStatus()` → ganti `fetch` dengan:
  ```ts
  const q = getBatchStatusQ(batchId);
  await q.refresh();
  const d = q.current;
  if (!d) return;
  ```
  saat selesai: ganti `invalidate('/siswa/kartu')` → `void getKartuListQ().refresh();`
- [ ] `cancelBatch()` → `await cancelBatchC(batchId);` + `void getKartuListQ().refresh();`
- [ ] `handleRegenerateOne(id)` → `const d = await regenerateKartuCmd(String(id));` lalu polling dengan `getBatchStatusQ(d.batch_id).refresh()` + `.current`.
- [ ] **PERTAHANKAN** `cardUrl`/`cardBackUrl` yang menunjuk `/api/siswa/{id}/kartu-front` & `kartu-back` (PNG biner, bukan business logic).

### B3. Halaman single `src/routes/siswa/[id]/kartu/+page.svelte`
- [ ] `handleRegenerate(s)` → ganti `fetch('/api/siswa/${s.id}/kartu-regenerate')` + polling `queue` → `regenerateKartuCmd(String(s.id))` + `getBatchStatusQ(...).refresh()`.
- [ ] Pertahankan img `/api/siswa/{id}/kartu-front|kartu-back`.

### B4. Hapus 6 endpoint bisnis
- [ ] DELETE `src/routes/api/kartu/generate-all/+server.ts`
- [ ] DELETE `src/routes/api/siswa/kartu/list/+server.ts`
- [ ] DELETE `src/routes/api/kartu/queue/[batchId]/+server.ts`
- [ ] DELETE `src/routes/api/kartu/queue/[batchId]/cancel/+server.ts`
- [ ] DELETE `src/routes/api/siswa/[id]/detail/+server.ts`
- [ ] DELETE `src/routes/api/siswa/[id]/kartu-regenerate/+server.ts`

**KEEP (biner/statis — jangan dihapus):**
- `src/routes/api/siswa/[id]/kartu/+server.ts`
- `src/routes/api/siswa/[id]/kartu-front/+server.ts`
- `src/routes/api/siswa/[id]/kartu-back/+server.ts`
- `src/routes/api/skakpt/bukti/[name]/+server.ts`
- `src/routes/api/health/+server.ts`

### B5. Rewrite `tests/e2e/kartu.spec.ts` (UI-only)
Hapus SEMUA `page.request.get('/api/siswa/kartu/list')`, `.../detail`, `kartu-regenerate`, `queue`. Ganti:
- [ ] Ambil id siswa dari DOM: buka `/siswa/kartu`, ambil `img.kartu-img` pertama, parse `src` `/api/siswa/(\d+)/kartu-front` (endpoint PNG tetap boleh).
- [ ] Test UI: heading + grid tampil; tiap item punya Depan+Belakang; front & back image `naturalWidth > 0`; tombol Regenerate ada & enabled.
- [ ] Test regenerate via UI: klik Regenerate → tunggu toast sukses "berhasil" muncul (`toPass`, timeout 60s) → tombol kembali ke "Regenerate".
- [ ] Test single page: `goto /siswa/{id}/kartu`; cek card, toggle belakang/depan, tombol "Generate Ulang" & "Download PNG" ada; kembali ke profil.
- [ ] Test guard 404: `page.request.post('/api/kartu/generate-all')`, `get('/api/siswa/kartu/list')`, `get('/api/siswa/{id}/detail')` → `status() === 404`.

---

# C. Milestone A7 — Verifikasi Bel (sudah selesai, sekadar cek)

- [ ] Pastikan `src/routes/bel/+page.server.ts` & `src/routes/bel/suara/+page.server.ts` **tidak ada** (sudah).
- [ ] Pastikan `bel.remote.ts` memuat `playBellC`, `stopBellC`, `toggleMasterC`, `createJadwalC`, `uploadSuaraC`, `deleteSuaraC`.
- [ ] E2E `bel.spec.ts` tetap lulus saat worker-bel offline (UI menampilkan status offline, tidak crash).

---

# D. Milestone B4/B5 — Guardrail, Spec & Vitest

## D1. Perkuat `tests/e2e/full-remote.spec.ts`
Masalah saat ini: hanya scan `src/routes/{modul}/+page.svelte` satu level, dan `readIfExists()` → `''` membuat assertion vakum. Ganti dengan helper rekursif:
- [ ] `walk(dir)` rekursif mengumpulkan semua `.svelte`, `.ts`, `+page.server.ts`, `+server.ts`.
- [ ] Assert **tidak ada** `fetch(\s*['"\`]\/api\/` di file **selain** allowlist PDF/PNG (sebenarnya `fetch('/api/')` harus 0 sama sekali; img `src` boleh `/api/`).
- [ ] Assert **tidak ada** `+page.server.ts` yang mengandung `export const actions`.
- [ ] Assert endpoint bisnis legacy → 404: `/api/kartu/generate-all`, `/api/siswa/kartu/list`, `/api/kartu/queue/x`, `/api/siswa/1/detail`, `/api/siswa/1/kartu-regenerate`, `/api/siswa/me/foto`.
- [ ] Assert `ecosystem.config.cjs` tidak memuat `mtsn-app-api` / `3730`; `backend/`, `api.exe` tidak ada.
- [ ] Tambah test "KEEP endpoints masih ada": `api/health`, `api/skakpt/bukti/[name]`.

## D2. Spec & README (MDD)
- [ ] Buat `specs/017-remote-kartu/spec.md` (user story, acceptance criteria, remote contract sesuai §B1, file yang dihapus/dipertahankan, test plan).
- [ ] Buat `specs/019-cleanup-go/spec.md` (bukti mesin: 404 endpoint bisnis, scan source bersih, PM2 bersih).
- [ ] Perbaiki `specs/README.md`:
  - Index harus cocok folder nyata: `001-auth, 002-dashboard, 003-ptk, 004-siswa, 005-rombel, 006-dokumen, 008-bel, 009-approval, 010-activity, 011-roster, 012-remote-auth, 013-remote-approval, 014-remote-skakpt, 015-remote-rombel, 016-remote-cetak, 018-remote-bel, (017-remote-kartu, 019-cleanup-go)`.
  - Update kolom Status/Migrated sesuai kenyataan (bukan semua "Pending").
- [ ] Update `plan-full-remote.md`: tandai Milestone A5/A6 selesai setelah dikerjakan.

## D3. Tambah Vitest (unit test service layer)
- [ ] `npm i -D vitest` (dan `@vitest/coverage-v8` opsional).
- [ ] Buat `vitest.config.ts` (environment `node`, `include: ['src/**/*.test.ts']`).
- [ ] Tambah script `package.json`:
  ```json
  "test": "vitest run",
  "test:unit": "vitest run",
  "test:e2e": "playwright test"
  ```
  Selaraskan `AGENTS.md` (saat ini `npm run test` tertulis "unit test", tapi isinya Playwright).
- [ ] Unit test contoh (murni, tanpa server): `src/modules/kartu/kartu.service.test.ts`
  - `enqueueBatch` menghasilkan `batch.total` sesuai input.
  - `getBatchStatus` mengembalikan status; `cancelBatch` menandai job pending `failed`.
  - Catatan: modul service mengimpor DB native `better-sqlite3`; untuk test murni queue, pisahkan logika queue ke fungsi yang tidak menyentuh DB, atau mock modul DB. Pilih pendekatan paling kecil risikonya.
- [ ] Unit test `bel.service.ts` bila memungkinkan (mock `fetch`).

---

# E. Urutan Eksekusi

```
1. Spec A5 (016) + test RED
2. Implement A5 → GREEN → check → commit
3. Spec A6 (017) + rewrite kartu.spec.ts (RED: endpoint masih 200)
4. Implement A6 (§B1-B4) → GREEN (endpoint 404)
5. Perkuat full-remote.spec.ts (§D1) → GREEN
6. Spec 019 + rapikan specs/README.md + plan-full-remote.md (§D2) → commit docs
7. Tambah Vitest + unit test (§D3) → commit
8. Verifikasi penuh (§F) → commit akhir
```

Setiap langkah: `npm run check` → test terkait → commit conventional (`feat(kartu): ...`, `test(guardrail): ...`, `docs(specs): ...`, `chore(test): ...`).

---

# F. Kriteria Sukses (Definition of Done)

- [ ] `rg "fetch\(['\"\`]/api/" src` → **0** hasil.
- [ ] `rg "export const actions" src/routes` → **0** hasil.
- [ ] 6 endpoint bisnis legacy → **404**; endpoint PNG/health tetap **200**.
- [ ] `npx playwright test` → **semua lulus** (tanpa test yang memanggil endpoint legacy).
- [ ] `npm run test` (Vitest) → lulus.
- [ ] `npm run check` → 0 error.
- [ ] `npm run build` → sukses.
- [ ] `specs/README.md` akurat; `specs/017-remote-kartu` & `specs/019-cleanup-go` ada.
- [ ] `plan-full-remote.md` ditandai selesai.
- [ ] `git status` bersih (semua ter-commit).

---

# G. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Query remote di-cache → polling tidak update | Selalu `await q.refresh()` lalu baca `q.current` |
| `form()` + `v.file()` belum pernah dipakai di repo | Kerjakan A5 lebih dulu sebagai proof; fallback: pertahankan `+server.ts` upload (bukan bisnis JSON) bila gagal |
| Regenerate kartu memicu render Chromium (lambat/flaky) | Gunakan `toPass({ timeout: 60_000 })`; test UI cukup menunggu toast |
| Endpoint 404 test bentrok dengan route dinamis `[id]` | Pastikan path legacy benar-benar dihapus; `/api/siswa/[id]/...` tersisa hanya PNG |
| Vitest menyentuh DB native saat import | Pisahkan logika murni atau mock `$lib/server/db` |
| Windows PowerShell tidak support `&&` | Pakai `;` / `if ($?) {}` |

---

# H. Referensi Cepat (fakta dari review, jangan diasumsikan ulang)

- Remote module kartu: `src/modules/kartu/kartu.remote.ts` (38 baris saat ini).
- Service kartu: `src/modules/kartu/kartu.service.ts` (835 baris) — `getSiswaKartu`, `enqueueBatch`, `enqueueSingle`, `getBatchStatus`, `cancelBatch`, `getKartuList`, `getAllActiveSiswaWithFoto`.
- Remote siswa: `src/modules/siswa/siswa.remote.ts` — sudah ada `getSiswaByRefIdQ`, `submitPerubahanC`, `getSiswaDetailQ`, `getKartuListQ`.
- `siswa/kartu/+page.svelte` fetch legacy di baris 45, 70, 102, 118, 128.
- `siswa/[id]/kartu/+page.svelte` fetch legacy di baris 91, 103.
- `siswa/profil/+page.svelte` fetch legacy di baris 71; `actions` di `+page.server.ts:14`.
- Allowlist biner: `/api/siswa/[id]/kartu`, `kartu-front`, `kartu-back`, `/api/skakpt/bukti/[name]`, `/api/health`.
- SvelteKit remote docs: `query` punya `.refresh()`; `form` mendukung `v.file()` + `enctype="multipart/form-data"`; `command` tidak bisa redirect (return `{ redirect }` bila perlu).
