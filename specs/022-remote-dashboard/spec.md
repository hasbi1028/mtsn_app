# spec.md — 022 Remote Dashboard

> Dashboard statistics via remote queries. No `+page.server.ts`.

---

## Module: Dashboard

### User Story

As an admin, I want to see school statistics on the dashboard so that I can monitor overall performance at a glance.

### Acceptance Criteria

- [ ] Dashboard loads stats via `getGeneralStatsQ`, `getRombelStatsQ`, `getBansosStatsQ`
- [ ] Shows: total PTK, total siswa, sertifikasi count, pending approvals
- [ ] Shows: rombel allocation stats (teralokasi vs tanpa rombel)
- [ ] Shows: bansos stats (PKH, Sembako, PBI-JK counts)
- [ ] No `+page.server.ts` in root route

### Edge Cases

- Empty database → show zero stats
- Slow query → loading skeleton

---

## Data Model

| Table | Columns Used |
|-------|-------------|
| `ptk` | `fungsi`, `sertifikasi` |
| `siswa` | `kelas`, `rombel`, `bansos_*` |
| `rombel` | `aktif` |
| `skmt_ajuan` | `status` |
| `skbk_ajuan` | `status` |
| `skakpt` | `status` |

---

## Remote Contract

```ts
export const getGeneralStatsQ = query(async () => getGeneralStats());
export const getRombelStatsQ = query(async () => getRombelStats());
export const getBansosStatsQ = query(async () => getBansosStats());
```

---

## E2E Test

- `tests/e2e/dashboard.spec.ts` — already exists, needs enhancement:
  - dashboard shows stats cards
  - stats numbers are visible
  - sidebar navigation present

---

## Migration Checklist

- [x] Service layer created
- [x] Remote wrapper created
- [ ] E2E tests enhanced
- [ ] `npm run check` passes
