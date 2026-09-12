# spec.md — 021 Remote PTK

> Migrasi PTK ke remote functions. Hapus `+page.server.ts`, gunakan `ptk.remote.ts`.

---

## Module: PTK

### User Story

As an admin, I want to view PTK list and detail via remote queries so that the app is fully SvelteKit without legacy server load functions.

### Acceptance Criteria

- [ ] PTK list page uses `getPtkListQ` remote query
- [ ] PTK detail page uses `getPtkDetailQ` remote query
- [ ] No `+page.server.ts` in `/ptk` or `/ptk/[id]`
- [ ] Search and filter work via remote query args
- [ ] Pagination works via remote query

### Edge Cases

- Empty PTK list → show "Belum ada data PTK"
- Invalid PTK ID → show "PTK tidak ditemukan"
- Search with no results → show empty state

---

## Data Model

| Table | Columns Used |
|-------|-------------|
| `ptk` | `id`, `nama`, `nip`, `nuptk`, `fungsi`, `sertifikasi`, `kelengkapan`, `waliKelas` |
| `jtm_semester` | `ptk_id`, `periode`, `mengajar`, `tugas` |
| `skmt_ajuan` | `ptk_id`, `periode`, `instansi`, `status` |
| `skbk_ajuan` | `ptk_id`, `periode`, `jtm_total`, `status` |
| `skakpt` | `ptk_id`, `bulan`, `status`, `detail` |
| `dokumen` | `ptk_id`, `jenis`, `periode`, `file_path` |
| `roster` | `guru_kode`, `hari`, `jam_ke`, `kelas`, `mapel` |

---

## Remote Contract

```ts
// ptk.remote.ts
export const getPtkListQ = query(ptkListSchema, async (args) => getPtkList(args));
export const getPtkDetailQ = query(ptkDetailSchema, async ({ id }) => getPtkDetail(id));
```

---

## E2E Test

- `tests/e2e/ptk.spec.ts` — already exists, needs enhancement:
  - can list PTK
  - can search PTK by name/NIP
  - can view PTK detail
  - empty state when no results
  - role guard: non-admin cannot access

---

## Migration Checklist

- [x] Validation schema created
- [x] Service layer created
- [x] Remote wrapper created
- [x] `+page.server.ts` deleted
- [ ] E2E tests enhanced
- [ ] `npm run check` passes
