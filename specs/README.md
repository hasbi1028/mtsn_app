# specs — SIMAD Module Specifications

> Markdown-Driven Development: Setiap fitur dimulai dari spec, bukan code.

## How to Use

1. Copy `_template/spec.md` ke `specs/NNN-name/spec.md`
2. Isi semua section (user story, data model, remote functions, UI, tests)
3. Review spec → approve → mulai coding
4. AI reads spec → generates remote function + page + test
5. TDD: Write test → FAIL → Write code → PASS → Commit

## Index

| # | Module | Status | Spec | Test | Migrated |
|---|--------|--------|------|------|----------|
| 001 | Auth | Pending | [spec](001-auth/spec.md) | — | ❌ |
| 002 | Dashboard | Pending | [spec](002-dashboard/spec.md) | — | ❌ |
| 003 | PTK | Pending | [spec](003-ptk/spec.md) | — | ❌ |
| 004 | Siswa | Pending | [spec](004-siswa/spec.md) | — | ❌ |
| 005 | Rombel | Pending | [spec](005-rombel/spec.md) | — | ❌ |
| 006 | Roster | Pending | [spec](006-roster/spec.md) | — | ❌ |
| 007 | Dokumen | Pending | [spec](007-dokumen/spec.md) | — | ❌ |
| 008 | Kartu | Pending | [spec](008-kartu/spec.md) | — | ❌ |
| 009 | Bel | Pending | [spec](009-bel/spec.md) | — | ❌ |
| 010 | Approval | Pending | [spec](010-approval/spec.md) | — | ❌ |
| 011 | Bansos | Pending | [spec](011-bansos/spec.md) | — | ❌ |
| 012 | Activity | Pending | [spec](012-activity/spec.md) | — | ❌ |

## Status Legend

- ⏳ Pending — Spec belum ditulis
- 📝 Draft — Spec sedang ditulis
- ✅ Approved — Spec approved, siap coding
- 🚀 In Progress — Sedang di-migrate
- ✅ Done — Selesai, semua test pass

## Templates

- `_template/spec.md` — Requirements + acceptance criteria
- `_template/data-model.md` — Schema reference
- `_template/test-plan.md` — Test strategy + scenarios

## Migration Order

```
Phase 0: Database Foundation (schema.ts)
Phase 1: Auth (login/logout/me)
Phase 2: Dashboard (stats)
Phase 3: PTK (list/detail)
Phase 4: Siswa (list/detail/upload)
Phase 5: Rombel (CRUD + allocate)
Phase 6: Dokumen (SKMT/SKBK/SKAKPT)
Phase 7: Kartu (render + queue)
Phase 8: Bel (control + CRUD)
Phase 9: Approval (foto + perubahan)
Phase 10: Bansos + Activity
Phase 11: Cleanup (delete Go API)
```

## Conventions

- One spec per module
- Spec must include: user story, acceptance criteria, data model, remote functions, UI, tests
- AI reads spec → generates code
- TDD: test first, then code
- MDD: markdown is the source of truth
