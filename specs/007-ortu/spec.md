# spec.md — 007 Ortu Module

## Module: Ortu (Orang Tua)

### User Story

As a parent (ortu), I want to view my child's school data so that I can monitor their academic progress and welfare information.

**Roles:**
- `ortu` — View data anak only (self-service)
- `admin` — Full access (not in scope for this spec)

### Acceptance Criteria

- [ ] Ortu can see their child's profile (nama, NISN, kelas, alamat, foto)
- [ ] Ortu can see bansos status of their child
- [ ] Data is filtered by ortu's user account (via `siswa_ortu` relation)
- [ ] If no child linked, show fallback message
- [ ] Page requires `ortu` role login

### Edge Cases

- Ortu login but no `ref_id` → show "Tidak ada data anak terkait"
- Ortu login but `siswa_ortu` record missing → fallback to first siswa (dev mode)
- Ortu tries to access admin pages → redirect to `/ortu`

### Out of Scope

- Ortu registration (admin creates accounts)
- Ortu editing child data
- Multiple child support (currently limited to 1 child per ortu)

---

## Data Model

### Tables

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `users` | `id`, `username`, `role`, `ref_id` | — |
| `siswa` | `id`, `nama`, `nis`, `nisn`, `jk`, `kelas`, `rombel`, `alamat`, `foto_path` | — |
| `siswa_ortu` | `siswa_id`, `ortu_user_id` | FK → `users.id` |

### Query Pattern

```sql
-- Get siswa for ortu (via siswa_ortu relation)
SELECT s.id, s.nama, s.nis, s.nisn, s.jk, s.kelas, s.rombel,
       s.tempat_lahir, s.tgl_lahir, s.alamat, s.no_hp, s.foto_path
FROM siswa s
JOIN siswa_ortu so ON s.id = so.siswa_id
WHERE so.ortu_user_id = ?
LIMIT 1;
```

---

## Domain Module Structure

```
src/modules/ortu/
├── ortu.service.ts       # getSiswaForOrtu, getSiswaList
└── ortu.remote.ts        # getOrtuSiswaQ (query)
```

### ortu.service.ts

```ts
export function getSiswaForOrtu(userId: number) { ... }
export function getSiswaList() { ... }
```

### ortu.remote.ts

```ts
export const getOrtuSiswaQ = query(async () => {
  // Get current user from session
  // Filter siswa by ortu_user_id
  // Return { siswa, ortu: { nama } }
});
```

---

## E2E Test

- `tests/e2e/ortu.spec.ts`
  - ortu login → can see profil anak
  - ortu login → can see data siswa
  - admin login → redirect from /ortu (role guard)
  - unauthenticated → redirect to /login

---

## Migration Checklist

- [x] Service layer created (`ortu.service.ts`)
- [x] Remote wrapper created (`ortu.remote.ts`)
- [ ] E2E test written & passing
- [ ] `npm run check` passes
