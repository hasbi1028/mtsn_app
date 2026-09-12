# spec.md — 023 Remote Roster

> Roster (jadwal mengajar) via remote query. No `+page.server.ts`.

---

## Module: Roster

### User Story

As a teacher or admin, I want to view the class schedule (roster) so that I can see teaching assignments per day and period.

### Acceptance Criteria

- [ ] Roster page uses `getRosterListQ` remote query
- [ ] Class selector filters roster by kelas
- [ ] Shows: hari, jam ke, mata pelajaran, guru
- [ ] Sorted by day (Senin→Sabtu) then period
- [ ] Empty state when no roster data

### Edge Cases

- No rombel in DB → fallback to default class list
- Empty roster for selected class → show "Belum ada jadwal"
- Invalid class selector → show first available class

---

## Data Model

| Table | Columns Used |
|-------|-------------|
| `roster` | `kelas`, `hari`, `jam_ke`, `mapel`, `guru_nama` |
| `rombel` | `nama`, `kelas`, `aktif` |

---

## Remote Contract

```ts
export const getRosterListQ = query(
  v.optional(v.string(), ''),
  async (kelas) => getRosterList(kelas)
);
```

---

## E2E Test

- `tests/e2e/roster.spec.ts` — already exists, needs enhancement:
  - roster page loads with heading
  - class selector visible
  - roster table shows data or empty state
  - switching class updates roster

---

## Migration Checklist

- [x] Service layer created
- [x] Remote wrapper created
- [ ] E2E tests enhanced
- [ ] `npm run check` passes
