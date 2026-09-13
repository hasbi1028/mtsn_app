# specs — SIMAD Module Specifications

> Markdown-Driven Development: Setiap fitur dimulai dari spec, bukan code.

## How to Use

1. Copy `_template/spec.md` ke `specs/NNN-name/spec.md`
2. Isi semua section (user story, data model, remote functions, UI, tests)
3. Review spec → approve → mulai coding
4. AI reads spec → generates remote function + page + test
5. TDD: Write test → FAIL → Write code → PASS → Commit

## Index

### Core Module Specs

| # | Module | Status | Spec | Test |
|---|--------|--------|------|------|
| 001 | Auth | ✅ Done | [spec](001-auth/spec.md) | `auth.spec.ts` |
| 002 | Dashboard | ✅ Done | [spec](002-dashboard/spec.md) | `dashboard.spec.ts` |
| 003 | PTK | ✅ Done | [spec](003-ptk/spec.md) | `ptk.spec.ts` |
| 004 | Siswa | ✅ Done | [spec](004-siswa/spec.md) | `siswa.spec.ts` |
| 005 | Rombel | ✅ Done | [spec](005-rombel/spec.md) | `rombel.spec.ts` |
| 006 | Dokumen (SKMT/SKBK/SKAKPT) | ✅ Done | [spec](006-dokumen/spec.md) | `dokumen.spec.ts` |
| 007 | Ortu | ✅ Done | [spec](007-ortu/spec.md) | `ortu.spec.ts` |
| 008 | Bel | ✅ Done | [spec](008-bel/spec.md) | `bel.spec.ts` |
| 009 | Approval | ✅ Done | [spec](009-approval/spec.md) | `approval.spec.ts` |
| 010 | Activity | ✅ Done | [spec](010-activity/spec.md) | `activity.spec.ts` |
| 011 | Roster | ✅ Done | [spec](011-roster/spec.md) | `roster.spec.ts` |

### Remote Function Migration Specs

| # | Module | Status | Spec | Test |
|---|--------|--------|------|------|
| 012 | Remote Auth | ✅ Done | [spec](012-remote-auth/spec.md) | `auth.spec.ts` |
| 013 | Remote Approval | ✅ Done | [spec](013-remote-approval/spec.md) | `approval.spec.ts` |
| 014 | Remote Skakpt | ✅ Done | [spec](014-remote-skakpt/spec.md) | `dokumen.spec.ts` |
| 015 | Remote Rombel | ✅ Done | [spec](015-remote-rombel/spec.md) | `rombel.spec.ts` |
| 016 | Remote Cetak Kartu | ✅ Done | [spec](016-remote-cetak/spec.md) | `kartu.spec.ts` |
| 017 | Remote Kartu | ✅ Done | [spec](017-remote-kartu/spec.md) | `kartu.spec.ts` |
| 018 | Remote Bel | ✅ Done | [spec](018-remote-bel/spec.md) | `bel.spec.ts` |
| 019 | Cleanup Go Backend | ✅ Done | [spec](019-cleanup-go/spec.md) | `full-remote.spec.ts` |
| 020 | Remote Siswa Profil | ✅ Done | [spec](020-remote-siswa-profil/spec.md) | `siswa.spec.ts` |
| 021 | Remote PTK | ✅ Done | [spec](021-remote-ptk/spec.md) | `ptk.spec.ts` |
| 022 | Remote Dashboard | ✅ Done | [spec](022-remote-dashboard/spec.md) | `dashboard.spec.ts` |
| 023 | Remote Roster | ✅ Done | [spec](023-remote-roster/spec.md) | `roster.spec.ts` |
| 024 | Remote Activity | ✅ Done | [spec](024-remote-activity/spec.md) | `activity.spec.ts` |
| 027 | Backup & Restore | ✅ Done | [spec](027-backup-restore/spec.md) · [MDD](027-backup-restore/MDD.md) · [test plan](027-backup-restore/test-plan.md) · [drill](027-backup-restore/drill.md) | `backup.spec.ts` |

### Structural Guards

| # | Test | Status | File |
|---|------|--------|------|
| — | Full Remote Guards | ✅ Done | `full-remote.spec.ts` |
| — | Breadcrumb | ✅ Done | `breadcrumb.spec.ts` |
| — | Hydration | ✅ Done | `hydration.spec.ts` |
| — | Responsive | ✅ Done | `responsive.spec.ts` |
| — | Sidebar | ✅ Done | `sidebar.spec.ts` |

## Status Legend

- ⏳ Pending — Spec belum ditulis
- 📝 Draft — Spec sedang ditulis
- ✅ Approved — Spec approved, siap coding
- 🚀 In Progress — Sedang di-migrate
- ✅ Done — Selesai, semua test pass

## Templates

- `_template/spec.md` — Requirements + acceptance criteria
- `_template/data-model.md` — Full database schema (20 tables)
- `_template/test-plan.md` — Test strategy + scenarios

## Migration Order

```
Phase 0–10 : DB → Auth → Dashboard → PTK → Siswa → Rombel → Dokumen → Bel → Approval → Activity → Roster
Phase 11   : Cleanup Go API (spec 019)
Full Remote: spec 012–024 (remote functions, hapus legacy)
```

## Conventions

- One spec per module
- Spec must include: user story, acceptance criteria, data model, remote functions, UI, tests
- AI reads spec → generates code
- TDD: test first, then code
- MDD: markdown is the source of truth
