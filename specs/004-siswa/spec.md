# spec.md — Siswa Module

## Module: Siswa (Students)

### User Story

As an admin, I want to view and manage student data so that I can monitor enrollment.

### Acceptance Criteria

- [ ] List siswa with pagination (20 per page)
- [ ] Search by name, NIS, NISN
- [ ] Filter by kelas, rombel, status
- [ ] View siswa detail with profile, bansos, kartu
- [ ] Siswa self-service: view profil, submit perubahan
- [ ] Show class summary (rekap: total, L, P per kelas)

### Out of Scope

- Create/Delete siswa (admin manages via EMIS)
- Bulk operations

---

## Data Model

### Tables Used

| Table | Columns | Purpose |
|-------|---------|---------|
| `siswa` | All columns | Master siswa data |
| `perubahan_siswa` | `siswaId`, `field`, `nilaiBaru`, `status` | Change requests |
| `ortu` | Parent data | Via siswa_ortu relation |

---

## Domain Module Structure

```
src/modules/siswa/
├── siswa.validation.ts    # Schemas
├── siswa.service.ts       # DB queries
└── (no remote needed - page load only)
```

### siswa.service.ts

```ts
export function getSiswaList(args) { ... }
export function getSiswaDetail(id) { ... }
export function getSiswaByRefId(refId) { ... }
export function getSiswaBansos(id) { ... }
export function getRekap() { ... }
export function getKartuList() { ... }
export function submitPerubahan(siswaId, field, nilaiBaru) { ... }
```

---

## E2E Test

```ts
tests/e2e/siswa.spec.ts
- can list siswa
- can search siswa by name
- can view siswa detail
- can view class summary (rekap)
```

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] E2E test written
- [ ] Test runs and fails (red)
- [ ] Service layer created
- [ ] +page.server.ts updated
- [ ] Test passes (green)
- [ ] Committed
