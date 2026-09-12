# spec.md — PTK Module

## Module: PTK (Pendidik & Tenaga Kependidikan)

### User Story

As an admin, I want to view and manage teacher data so that I can monitor personnel.

### Acceptance Criteria

- [ ] List PTK with pagination (20 per page)
- [ ] Search by name, NIP, NUPTK
- [ ] Filter: belum sertifikasi, wali kelas
- [ ] View PTK detail with JTM, SKMT, SKBK, SKAKPT
- [ ] Show documents and roster

### Out of Scope

- Create/Edit PTK (admin manages via EMIS)
- Delete PTK

---

## Data Model

### Tables Used

| Table | Columns | Purpose |
|-------|---------|---------|
| `ptk` | All columns | Master PTK data |
| `jtm_semester` | `ptkId`, `periode`, `mengajar`, `tugas` | Jam tatap muka |
| `skmt_ajuan` | `ptkId`, `status` | SKMT history |
| `skbk_ajuan` | `ptkId`, `status` | SKBK history |
| `skakpt` | `ptkId`, `bulan`, `status` | SKAKPT data |
| `dokumen` | `ptkId`, `jenis`, `filePath` | Documents |
| `roster` | `guruKode`, `kelas`, `hari`, `jamKe` | Teaching schedule |

---

## Domain Module Structure

```
src/modules/ptk/
├── ptk.validation.ts    # Schemas
├── ptk.service.ts       # DB queries
└── (no remote needed - page load only)
```

### ptk.service.ts

```ts
export function getPtkList(args: { q, filter, page, perPage }) {
  // Returns: { rows: PtkRow[], total, page, perPage }
}

export function getPtkDetail(id: string) {
  // Returns: Ptk with jtm, skmt, skbk, skakpt, dokumen, roster
}
```

---

## E2E Test

```ts
tests/e2e/ptk.spec.ts
- can list PTK
- can search PTK by name
- can view PTK detail
```

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] E2E test written
- [ ] Test runs and fails (red)
- [ ] Validation schema created
- [ ] Service layer created
- [ ] +page.server.ts updated
- [ ] Test passes (green)
- [ ] Committed
