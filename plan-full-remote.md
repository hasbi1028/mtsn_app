# plan-full-remote.md — Finalisasi Full Remote Function + Cleanup Go Backend

> Lanjutan dari `plan.md` (Phase 0–11). Dokumen ini menutup 2 gap terakhir:
> **(A)** migrasi sisa pola legacy → full remote function, **(B)** cleanup Go backend.
>
> Metodologi: **Spec-driven (MDD)** + **TDD (e2e first)** — setiap sub-phase wajib ada
> spec di `specs/`, e2e di `tests/e2e/`, lalu code, lalu verifikasi.

---

## Status Saat Ini (hasil review)

| Item | Status |
|------|--------|
| Fullstack SvelteKit (tanpa Go API untuk web) | ✅ Sudah — frontend tidak pernah panggil port 3730 |
| Remote functions di 11 domain module | ✅ Sudah ada `.remote.ts` |
| Halaman yang masih pakai `+page.server.ts` actions | ⚠️ login, logout, approval, skakpt, rombel/[id], siswa/profil, bel |
| Endpoint `+server.ts` bisnis (fetch `/api/...`) | ⚠️ 12 file (mayoritas kartu + foto) |
| Dead Go backend (`backend/`, exe, PM2 `mtsn-app-api`) | ❌ Belum dibersihkan (Phase 11 plan.md) |
| Worker-bel (Go, 8093) | ✅ Tetap — intentional playback process |

Bukti review:
- `rg "3730|API_BASE" src/` → kosong (tidak ada fetch ke Go API)
- `fetch(` di `src/` hanya ke `/api/...` hasil SvelteKit sendiri & worker-bel (8093)
- Proses `api.exe` tidak berjalan; node process jalan di 3720

---

## Target Arsitektur

```
Browser → SvelteKit (3720) → Drizzle ORM → SQLite (local.db)
                                └─ worker-bel (8093) — hanya untuk playback suara bel
```

Aturan final:
1. **Semua data bisnis (JSON)** → remote functions `query` / `form` / `command`
2. **Upload file** → remote `form()` (valibot `v.file()`, `enctype="multipart/form-data"`)
3. **Output biner (PNG)** → `+server.ts` streaming file (dibolehkan: bukan business logic)
4. **Worker-bel** → proxy dari `bel.service.ts` (server-side), tetap Go process
5. **`fetch('/api/...')` di client → NOL** (dihilangkan seluruhnya)

---

## Metodologi (wajib per sub-phase)

1. **Spec dulu** — tulis `specs/NNN-name/spec.md` (copy `_template/spec.md`)
2. **E2E dulu** — tulis/update `tests/e2e/xxx.spec.ts`
3. **Run test → RED** (verifikasi gagal karena masih pakai pola lama / endpoint masih ada)
4. **Implement** — remote function + ganti halaman, hapus file legacy
5. **Run test → GREEN**
6. `npm run check` + `npx playwright test`
7. Commit (conventional)

---

# Milestone A — Migrasi Full Remote Function

## A1. Auth (login & logout)

**Spec:** `specs/012-remote-auth/spec.md`
**E2E:** `tests/e2e/auth.spec.ts` (regression, diperluas)

Remote function sudah ada: `login` (form, auth.remote.ts:24), `logout` (command, auth.remote.ts:55).
Yang belum: halaman pakai `+page.server.ts`.

**Tasks:**
- [ ] `src/routes/login/+page.svelte` → `<form {...login.enhance(...)}>` + `.preflight(loginSchema)`
- [ ] Ganti tombol logout di sidebar → panggil `logout()` command biasa
- [ ] DELETE `src/routes/login/+page.server.ts`
- [ ] DELETE `src/routes/logout/+page.server.ts`
- [ ] E2E: tambah test — logout dari UI berhasil kembali ke `/login`

## A2. Approval

**Spec:** `specs/013-remote-approval/spec.md`
**E2E:** `tests/e2e/approval.spec.ts` (extend)

Command sudah ada: `approveFotoC`, `rejectFotoC`, `approvePerubahanC`, `rejectPerubahanC`
(approval.remote.ts:12-20) + query `getApprovalFotoListQ`, `getApprovalPerubahanListQ`.

**Tasks:**
- [ ] `src/routes/approval/+page.svelte` → pakai remote query + command (ganti `form` → `command`, hapus `form` action handling)
- [ ] DELETE `src/routes/approval/+page.server.ts`
- [ ] E2E: approve/reject foto & perubahan via UI tombol (bukan `page.request`)

## A3. Skakpt (modul dokumen)

**Spec:** `specs/014-remote-skakpt/spec.md`
**E2E:** `tests/e2e/dokumen.spec.ts` (update)

`+page.server.ts` punya `load` (bulan + list) dan action `download` (hanya validasi nama file).

**Tasks:**
- [ ] Tambah `getSkakptMonthsQ`, `getSkakptListQ(bulan)` di `dokumen.remote.ts`
- [ ] `src/routes/skakpt/+page.svelte` → query remote; navigasi bulan via URL state (`$app/state`)
- [ ] Action `download` → cukup implementasi di client (string check) atau remote `command`
- [ ] DELETE `src/routes/skakpt/+page.server.ts`
- [ ] KEEP `src/routes/api/skakpt/bukti/[name]/+server.ts` (PNG static, dibolehkan)
- [ ] E2E: buka `/skakpt?bulan=...` → tabel tampil

## A4. Rombel detail

**Spec:** `specs/015-remote-rombel/spec.md`
**E2E:** `tests/e2e/rombel.spec.ts` (extend)

`+page.server.ts` punya `load` (detail + siswa + ptk) dan actions `allocate`, `remove`, `assignWali`.

**Tasks:**
- [ ] Tambah di `rombel.remote.ts`:
  - [ ] `getRombelDetailQ`, `getRombelSiswaQ`, `getAllPtkQ` (query)
  - [ ] `allocateSiswaC`, `removeSiswaC`, `setWaliKelasC` (command, valibot schema `v.number()`/object)
  - [ ] Single-flight: `void getRombelSiswaQ(id).refresh()` di dalam command
- [ ] `src/routes/rombel/[id]/+page.svelte` → ganti actions → command + query
- [ ] DELETE `src/routes/rombel/[id]/+page.server.ts`
- [ ] E2E: alokasi/keluarkan siswa & set wali via UI

## A5. Siswa self-service (profil + foto)

**Spec:** `specs/016-remote-siswa-profil/spec.md`
**E2E:** `tests/e2e/siswa.spec.ts` (update)

**Tasks:**
- [ ] `siswa/profil/+page.svelte` → `getSiswaByRefIdQ`, `submitPerubahanC` (sudah ada di siswa.remote.ts)
- [ ] DELETE `src/routes/siswa/profil/+page.server.ts`
- [ ] Foto upload → **ganti jadi remote `form()`** (dukung `v.file()`, `multipart/form-data`):
  - [ ] Tambah `uploadFoto` di `siswa.remote.ts` — schema `{ foto: v.file() }`, simpan ke `static/uploads/foto_siswa/pending/`, set `fotoPending`/`fotoStatus`
  - [ ] `siswa/profil/+page.svelte` submit via `<form {...uploadFoto}>`
  - [ ] `siswa/[id]/profil/+page.svelte` (admin) → ganti `fetch('/siswa/{id}/profil')` → `uploadFoto` (form) 
  - [ ] DELETE `src/routes/api/siswa/me/foto/+server.ts`
  - [ ] DELETE `src/routes/siswa/[id]/profil/+server.ts`
- [ ] KEEP `siswa/[id]/profil/+page.server.ts` → pindah jadi load via `getSiswaDetailQ` remote query (jika perlu, untuk dedupe)
- [ ] E2E: siswa self-service submit perubahan; admin/kepsek upload foto via UI

## A6. Kartu (hapus endpooint `+server.ts` bisnis)

**Spec:** `specs/017-remote-kartu/spec.md`
**E2E:** `tests/e2e/kartu.spec.ts` — **REWRITE besar-besaran**

Endpoint legacy 12 file. Yang **KEEP** (PNG streaming, bukan business logic):
- `api/siswa/[id]/kartu`, `api/siswa/[id]/kartu-back`, `api/siswa/[id]/kartu-front`
- `api/health`

Yang **MIGRATE → remote, lalu DELETE**:

| Endpoint (`+server.ts`) | Remote function | Status |
|---|---|---|
| `api/siswa/kartu/list` | `getKartuListQ` | ada (siswa.remote.ts:13, kartu.remote.ts:15) |
| `api/kartu/generate-all` | `generateAllKartu` | ada (kartu.remote.ts:17) |
| `api/siswa/[id]/kartu-regenerate` | `regenerateKartuCmd` | ada (kartu.remote.ts:30) |
| `api/kartu/queue/[batchId]` | `getBatchStatusQ` | **baru** — tambah di kartu.remote.ts |
| `api/kartu/queue/[batchId]/cancel` | `cancelBatchC` | **baru** — tambah di kartu.remote.ts |
| `api/siswa/[id]/detail` | `getSiswaDetailQ` | ada (siswa.remote.ts:9) |

**Tasks:**
- [ ] Tambah `getBatchStatusQ` + `cancelBatchC` di `kartu.remote.ts` (valibot `v.string()` batch_id)
- [ ] `siswa/kartu/+page.svelte` — ganti semua `fetch('/api/...')` → remote function:
  - [ ] Generate all → `await generateAllKartu()`
  - [ ] Polling status → `getBatchStatusQ(batchId)` (query re-mount atau `refresh()`)
  - [ ] Cancel → `cancelBatchC(batchId)`
  - [ ] Regenerate → `regenerateKartuCmd(id)`
- [ ] `siswa/[id]/kartu/+page.svelte` — ganti fetch `kartu-regenerate` & `queue` → remote function
- [ ] DELETE 9 file `+server.ts`: `generate-all`, `kartu/list`, `kartu-regenerate`, `queue/[batchId]`, `queue/[batchId]/cancel`, `siswa/[id]/detail`, `siswa/me/foto` (A5)
- [ ] E2E kartu.spec.ts: ganti semua `page.request.get('/api/...')` → interaksi UI:
  - [ ] Grid tile tampil (depan+belaang, gambar load)
  - [ ] Tombol "Generate Semua" → muncul batch card + status selesai
  - [ ] Tombol regenerate per siswa → status berubah
  - [ ] PNG masih bisa diakses via `<img src="/api/siswa/{id}/kartu-front">`

## A7. Bel (proxy worker via remote functions)

**Spec:** `specs/018-remote-bel/spec.md`
**E2E:** `tests/e2e/bel.spec.ts` (update)

`bel/+page.server.ts` & `bel/suara/+page.server.ts` mem-proxy ke worker-bel (8093). Ini BUKAN Go backend web — worker-bel tetap.
Tapi proxy-nya pindah dari `+page.server.ts` → `bel.service.ts` + remote function.

**Tasks:**
- [ ] Pindah `belProxy()` (bel/+page.server.ts:6-13) → `bel.service.ts` (fetch server-side ke 8093)
- [ ] Tambah di `bel.remote.ts`:
  - [ ] `getBelStatusQ`, `getBelJadwalQ` (ada), `getBelSuaraQ` (ada)
  - [ ] `playBellC`, `stopBellC`, `toggleMasterC`, `createJadwalC`, `updateJadwalC`, `toggleJadwalC`, `deleteJadwalC`
  - [ ] `createJadwalC` dsb → single-flight refresh `getBelJadwalQ`
- [ ] Upload suara → remote `form()` `uploadSuara` (`v.file()`) + `deleteSuaraC`
- [ ] DELETE `src/routes/bel/+page.server.ts`, `src/routes/bel/suara/+page.server.ts`
- [ ] E2E: jadwal CRUD via UI berjalan tanpa +page.server.ts (worker-bel offline → tampil "offline", tidak crash)

---

# Milestone B — Cleanup Go Backend

## B1. PM2 — matikan & hapus service Go ✅ DONE

- [x] `pm2 delete mtsn-app-api`
- [x] `pm2 save`
- [x] Edit `ecosystem.config.cjs`:
  - [x] Hapus blok `mtsn-app-api` (lines 4-18)
  - [x] Hapus env `API_BASE` dari `mtsn-app-bff`
  - [x] Update komentar header (line 1) → `// PM2 ecosystem — mtsn_app: SvelteKit (3720) + worker-bel (8093)`
- [x] Verifikasi: `pm2 list` → hanya `mtsn-app-bff` + `simad-bel`

## B2. Hapus artifact Go ✅ DONE

- [x] `Remove-Item -Recurse backend/` (Go source + `api.exe` + `local.db` + `api_log.txt`)
- [x] `Remove-Item backend-api.exe`, `backend.exe` (root)
- [x] `Remove-Item -Recurse bin/` (berisi `api.exe`)
- [x] Update `.gitignore` — ignore `backend/`, `*.exe`

## B3. Update dokumentasi & konfigurasi ✅ DONE

- [x] `AGENTS.md` — section PM2: hanya `mtsn-app-bff` (3720) + `simad-bel` (8093)
- [x] `plan.md` — centang Phase 11 (cleanup) + tambah link ke `plan-full-remote.md`

## B4. Guardrails — spec `019-cleanup-go`

**Spec:** `specs/019-cleanup-go/spec.md`
**E2E:** `tests/e2e/full-remote.spec.ts` (**baru**) — bukti mesin:

- [ ] `npx playwright test` endpoint bisnis lama → **404** (sudah tidak ada): `/api/kartu/generate-all`, `/api/siswa/kartu/list`, `/api/siswa/[id]/detail`, `/api/kartu/queue/*`
- [ ] Scan `src/**` via `node:fs` di spec: **0** referensi `fetch('/api/` & `page.server.ts` dengan `actions` (kecuali bel upload jika masih perlu)
- [ ] Scan `ecosystem.config.cjs`: **tidak** ada `mtsn-app-api` / port 3730
- [ ] Verifikasi manual (bukan playwright): `pm2 list`, `rg "3730|api\.exe" .` bersih di source

---

# Ringkasan E2E (TDD Map)

| Spec file | E2E file | RED trigger | Target GREEN |
|---|---|---|---|
| 012-remote-auth | `auth.spec.ts` | UI masih pakai actions lama | login/logout via remote |
| 013-remote-approval | `approval.spec.ts` | approve via action lama | approve via command |
| 014-remote-skakpt | `dokumen.spec.ts` | load pakai page.server | list via query remote |
| 015-remote-rombel | `rombel.spec.ts` | actions lama | command via UI |
| 016-remote-siswa-profil | `siswa.spec.ts` | upload via `+server.ts` | upload via remote `form()` |
| 017-remote-kartu | `kartu.spec.ts` (rewrite) | endpoint `/api/kartu/*` masih 200 | endpoint 404, UI pakai remote |
| 018-remote-bel | `bel.spec.ts` | proxy di page.server | proxy di service |
| 019-cleanup-go | `full-remote.spec.ts` (baru) | endpoint bisnis masih ada | 404 + scan bersih |

---

# Success Criteria

- [ ] 0 `fetch('/api/...')` di seluruh `src/routes` (ganti remote function)
- [ ] 0 `+page.server.ts` yang mengandung `actions` (kecuali jika ada I/O biner via load)
- [ ] Folder `backend/` + exe + `mtsn-app-api` dihapus dari disk & PM2
- [ ] `pm2 list`: hanya `mtsn-app-bff` + `simad-bel`
- [ ] `rg "3730|api\.exe|API_BASE"` → hanya muncul di dokumen sejarah, bukan source
- [ ] Semua e2e pass: `npx playwright test` (target 25+ test)
- [ ] `npm run check` → 0 error
- [ ] Login, dashboard, bel (worker offline-safe) tetap berfungsi

---

# Risk & Mitigation

| Risk | Mitigasi |
|------|----------|
| Remote functions eksperimental | Sudah dipakai prod (11 modul); versi SvelteKit di-pin `^2.70` |
| Kartu queue polling (long polling) | `getBatchStatusQ` dipanggil ulang / `.refresh()` berkala di client |
| Remote `form()` + file upload belum dipakai | Proof via A5 dulu; fallback: pertahankan `+server.ts` hanya untuk upload biner |
| Halaman yang SSR (networkidle e2e) berubah perilaku | Jaga struktur halaman sama; hanya sumber data berubah; e2e regression |
| Worker-bel offline saat migrasi bel | UI tampilkan offline state; jangan crash load |
| E2E kartu rewrite sulit (queue async) | polling `toPass({ timeout: 60_000 })` seperti test lama |

---

# Execution Order

```
A1 Auth → A2 Approval → A3 Skakpt → A4 Rombel → A5 Siswa →
A6 Kartu (terbesar) → A7 Bel → B1 PM2 → B2 Delete → B3 Docs →
B4 Guardrail e2e + verifikasi penuh → commit terakhir
```

Setiap sub-phase: spec → e2e RED → code → GREEN → `npm run check` → commit.
Akhir B4: run seluruh `npx playwright test` + `pm2 list`.