# spec.md — 019 Cleanup Go Backend

> Guardrail akhir migrasi fullstack. Membuktikan backend Go untuk web benar-benar
> dihapus dan tidak ada sisa pola legacy. Worker-bel (port 8093) dikecualikan.

---

## Module: Cleanup & Guardrails

### User Story

As maintainer, I want bukti otomatis bahwa tidak ada backend Go/logic web yang
tersisa so that arsitektur fullstack SvelteKit terjaga dari regresi.

### Acceptance Criteria

- [ ] `backend/`, `api.exe`, `backend.exe`, `backend-api.exe` tidak ada di disk
- [ ] `ecosystem.config.cjs` tidak memuat `mtsn-app-api` / port `3730`
- [ ] `pm2 list` hanya `mtsn-app-bff` (3720) + `simad-bel` (8093)
- [ ] `worker-bel/` dipertahankan (playback suara, bukan backend web)
- [ ] Tidak ada `fetch('/api/...')` di seluruh `src` (rekursif)
- [ ] Tidak ada `+page.server.ts` dengan `export const actions`
- [ ] Tidak ada `use:enhance` / `action="?/..."` di route
- [ ] Endpoint bisnis legacy → 404
- [ ] Endpoint biner/statis (PNG/health) tetap tersedia

### Out of Scope

- Migrasi `worker-bel` (proses Go independen, sengaja dipertahankan)

---

## Endpoint yang Dipertahankan

| Endpoint | Alasan |
|---|---|
| `GET /api/health` | health check |
| `GET /api/skakpt/bukti/[name]` | serving gambar bukti |
| `GET /api/siswa/[id]/kartu` | streaming PNG kartu |
| `GET /api/siswa/[id]/kartu-front` | streaming PNG kartu |
| `GET /api/siswa/[id]/kartu-back` | streaming PNG kartu |

---

## E2E Test

`tests/e2e/full-remote.spec.ts`:
- Structural Guards: scan rekursif source, `backend/`, exe, ecosystem
- Endpoint Guards: 404 endpoint legacy + 200 endpoint biner/statis

---

## Migration Checklist

- [x] Spec ditulis
- [x] `tests/e2e/full-remote.spec.ts` rekursif
- [x] Endpoint legacy 404
- [x] Endpoint biner/statis tervalidasi
- [x] `npm run check` pass
