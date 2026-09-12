# spec.md — 017 Remote Kartu (Queue, Batch & Regenerate)

> Migrasi Milestone A6 dari `plan-full-remote.md`. Tujuan: hapus endpoint bisnis
> `/api/kartu/*` dan `/api/siswa/[id]/{detail,kartu-regenerate}`, ganti ke remote
> function. Endpoint PNG tetap (bukan business logic).

---

## Module: Kartu Siswa

### User Story

As admin/guru, I want generate & regenerate kartu siswa lewat remote function
so that tidak ada lagi endpoint REST bisnis dan polling status batch berjalan type-safe.

**Roles:** `admin`, `guru`

### Acceptance Criteria

- [ ] `generateAllKartu` (command) menggantikan `POST /api/kartu/generate-all`
- [ ] `regenerateKartuCmd(id)` menggantikan `POST /api/siswa/[id]/kartu-regenerate`
- [ ] `getBatchStatusQ(batchId)` menggantikan `GET /api/kartu/queue/[batchId]`
- [ ] `cancelBatchC(batchId)` menggantikan `POST /api/kartu/queue/[batchId]/cancel`
- [ ] `getKartuListQ()` menggantikan `GET /api/siswa/kartu/list`
- [ ] `getSiswaDetailQ({ id })` menggantikan `GET /api/siswa/[id]/detail`
- [ ] `siswa/kartu/+page.svelte` & `siswa/[id]/kartu/+page.svelte` TIDAK `fetch('/api/...')`
- [ ] 6 endpoint bisnis di atas dihapus → semua 404
- [ ] Endpoint PNG dipertahankan: `kartu`, `kartu-front`, `kartu-back`
- [ ] Polling memakai `getBatchStatusQ(batchId).refresh()` + `.current` (query di-cache)

### Edge Cases

- Batch tidak ditemukan → `getBatchStatusQ` return `null`
- Siswa tidak ditemukan saat regenerate → `error(404, 'Siswa tidak ditemukan')`
- Tidak ada siswa berfoto → `generateAllKartu` return `{ error }`, toast tampil

### Out of Scope

- Perubahan proses render Chromium (`scripts/kartu-screenshot.mjs`)
- Halaman cetak (`016-remote-cetak`)

---

## Remote Contract

```ts
export const getKartuListQ = query(async () => svcGetKartuList());
export const generateAllKartu = command(async () => svcEnqueueBatch());
export const regenerateKartuCmd = command(v.string(), async (id) => svcEnqueueSingle(...));
export const getBatchStatusQ = query(v.string(), async (batchId) => { /* null | status */ });
export const cancelBatchC = command(v.string(), async (batchId) => svcCancelBatch(...));
```

---

## Endpoint yang Dihapus

| Endpoint lama | Pengganti |
|---|---|
| `POST /api/kartu/generate-all` | `generateAllKartu` |
| `GET /api/siswa/kartu/list` | `getKartuListQ` |
| `GET /api/kartu/queue/[batchId]` | `getBatchStatusQ` |
| `POST /api/kartu/queue/[batchId]/cancel` | `cancelBatchC` |
| `GET /api/siswa/[id]/detail` | `getSiswaDetailQ` |
| `POST /api/siswa/[id]/kartu-regenerate` | `regenerateKartuCmd` |

**Dipertahankan (PNG):** `GET /api/siswa/[id]/kartu`, `kartu-front`, `kartu-back`.

---

## E2E Test

- `tests/e2e/kartu.spec.ts` — UI-only (grid, toggle, regenerate toast, 404 guard)
- `tests/e2e/full-remote.spec.ts` — guard rekursif + 404

---

## Migration Checklist

- [x] Spec ditulis
- [x] `getBatchStatusQ` + `cancelBatchC` di `kartu.remote.ts`
- [x] `regenerateKartuCmd` lookup siswa + `error(404)`
- [x] `siswa/kartu/+page.svelte` → remote
- [x] `siswa/[id]/kartu/+page.svelte` → remote
- [x] Hapus 6 endpoint bisnis
- [x] Rewrite `kartu.spec.ts` (UI-only)
- [x] `npm run check` pass
