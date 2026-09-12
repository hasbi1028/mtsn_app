# specs — SIMAD Module Specifications

> Markdown-Driven Development: Setiap fitur dimulai dari spec, bukan code.

## How to Use

1. Copy `_template/spec.md` ke `specs/NNN-name/spec.md`
2. Isi semua section (user story, data model, remote functions, UI, tests)
3. Review spec → approve → mulai coding
4. AI reads spec → generates remote function + page + test
5. TDD: Write test → FAIL → Write code → PASS → Commit

## Index

### Spec modul awal (Go → SvelteKit)

| # | Module | Status | Spec | Test |
|---|--------|--------|------|------|
| 001 | Auth | ✅ Done | [spec](001-auth/spec.md) | `tests/e2e/auth.spec.ts` |
| 002 | Dashboard | ✅ Done | [spec](002-dashboard/spec.md) | `tests/e2e/dashboard.spec.ts` |
| 003 | PTK | ✅ Done | [spec](003-ptk/spec.md) | `tests/e2e/ptk.spec.ts` |
| 004 | Siswa | ✅ Done | [spec](004-siswa/spec.md) | `tests/e2e/siswa.spec.ts` |
| 005 | Rombel | ✅ Done | [spec](005-rombel/spec.md) | `tests/e2e/rombel.spec.ts` |
| 006 | Dokumen (SKMT/SKBK/SKAKPT) | ✅ Done | [spec](006-dokumen/spec.md) | `tests/e2e/dokumen.spec.ts` |
| 008 | Bel | ✅ Done | [spec](008-bel/spec.md) | `tests/e2e/bel.spec.ts` |
| 009 | Approval | ✅ Done | [spec](009-approval/spec.md) | `tests/e2e/approval.spec.ts` |
| 010 | Activity | ✅ Done | [spec](010-activity/spec.md) | `tests/e2e/activity.spec.ts` |
| 011 | Roster | ✅ Done | [spec](011-roster/spec.md) | `tests/e2e/roster.spec.ts` |

### Spec migrasi full remote function

| # | Module | Status | Spec | E2E |
|---|--------|--------|------|-----|
| 012 | Remote Auth | ✅ Done | [spec](012-remote-auth/spec.md) | `auth.spec.ts` |
| 013 | Remote Approval | ✅ Done | [spec](013-remote-approval/spec.md) | `approval.spec.ts` |
| 014 | Remote Skakpt | ✅ Done | [spec](014-remote-skakpt/spec.md) | `dokumen.spec.ts` |
| 015 | Remote Rombel | ✅ Done | [spec](015-remote-rombel/spec.md) | `rombel.spec.ts` |
| 016 | Remote Cetak Kartu | ✅ Done | [spec](016-remote-cetak/spec.md) | `kartu.spec.ts` |
| 017 | Remote Kartu (queue/regenerate) | ✅ Done | [spec](017-remote-kartu/spec.md) | `kartu.spec.ts` |
| 018 | Remote Bel | ✅ Done | [spec](018-remote-bel/spec.md) | `bel.spec.ts` |
| 019 | Cleanup Go Backend | ✅ Done | [spec](019-cleanup-go/spec.md) | `full-remote.spec.ts` |
| 020 | Remote Siswa Profil & Foto | ✅ Done | [spec](020-remote-siswa-profil/spec.md) | `siswa.spec.ts` |

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
Phase 0–10 : DB → Auth → Dashboard → PTK → Siswa → Rombel → Dokumen → Kartu → Bel → Approval → Activity
Phase 11   : Cleanup Go API (spec 019)
Full Remote: spec 012–020 (remote functions, hapus legacy)
```

## Conventions

- One spec per module
- Spec must include: user story, acceptance criteria, data model, remote functions, UI, tests
- AI reads spec → generates code
- TDD: test first, then code
- MDD: markdown is the source of truth
