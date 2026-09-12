# spec.md — 018 Remote Bel

> Migrasi A7 dari `plan-full-remote.md`. Tujuan: hapus `bel/+page.server.ts` &
> `bel/suara/+page.server.ts`, proxy worker-bel pindah ke `bel.service.ts`.

---

## Module: Bel Sekolah

### User Story

As admin, I want kelola bel sekolah via remote function so that
jadwal CRUD, play/stop, master switch berjalan tanpa +page.server.ts.

**Roles:** `admin`

### Acceptance Criteria

- [ ] `belProxy()` pindah ke `bel.service.ts` (server-side)
- [ ] Remote functions: `getBelStatusQ`, `playBellC`, `stopBellC`, `toggleMasterC`
- [ ] Remote functions: `createJadwalC`, `updateJadwalC`, `toggleJadwalC`, `deleteJadwalC`
- [ ] Remote form: `uploadSuaraF` (file upload via `v.file()`)
- [ ] Remote command: `deleteSuaraC`
- [ ] `bel/+page.server.ts` TIDAK ada
- [ ] `bel/suara/+page.server.ts` TIDAK ada
- [ ] Worker bel offline → UI tampilkan "offline", tidak crash

---

## E2E Test

- `tests/e2e/bel.spec.ts` — verify bel page loads
- `tests/e2e/full-remote.spec.ts` — guard: `bel/+page.server.ts` tidak ada

---

## Migration Checklist

- [ ] Spec reviewed
- [ ] E2E ditulis
- [ ] `bel.service.ts` — tambah `belProxy()`, `getBelStatus()`
- [ ] `bel.remote.ts` — tambah semua remote functions
- [ ] `bel/+page.svelte` — rewrite pakai remote
- [ ] `bel/suara/+page.svelte` — rewrite pakai remote
- [ ] Hapus `bel/+page.server.ts`
- [ ] Hapus `bel/suara/+page.server.ts`
- [ ] E2E GREEN
- [ ] `npm run check` pass
