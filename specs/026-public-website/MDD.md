# MDD — Website Public MTsN 2 Kolaka Utara

## Workflow: Markdown-Driven Development

### Phase 1: Spec (Markdown)
```
specs/026-public-website/spec.md
```
- User story
- Acceptance criteria
- Route structure
- Data model
- API contract
- Test plan

### Phase 2: TDD — Write Tests First
```
src/modules/public/public.service.test.ts  ← Unit tests (6 tests)
tests/e2e/public-website.spec.ts           ← E2E tests (20+ tests)
```
- Write test cases BEFORE implementation
- Tests should FAIL initially (red phase)

### Phase 3: Implementation
```
src/modules/public/public.service.ts       ← Business logic
src/modules/public/public.remote.ts        ← Remote queries
src/routes/(public)/+layout.svelte         ← Public layout
src/routes/(public)/profil/+page.svelte    ← Profil page
src/routes/(public)/guru/+page.svelte      ← Guru page
src/routes/(public)/ppdb/+page.svelte      ← PPDB page
src/routes/(public)/berita/+page.svelte    ← Berita page
src/routes/(public)/kontak/+page.svelte    ← Kontak page
src/routes/(public)/fasilitas/+page.svelte ← Fasilitas page
src/hooks.server.ts                        ← Auth logic
```
- Implement code to make tests PASS (green phase)

### Phase 4: Refactor
- Clean up code
- Ensure all tests pass
- Type check clean

### Phase 5: Verify
```bash
npm run check      # Type check
npm run test       # Unit tests
npm run test:e2e   # E2E tests
```

---

## File Structure

```
specs/026-public-website/
├── spec.md                    ← Full specification
└── MDD.md                     ← This file

src/modules/public/
├── public.service.ts          ← Business logic (getPublicStats, getPublicGuruList)
├── public.remote.ts           ← Remote queries (getPublicStatsQ, getPublicGuruListQ)
└── public.service.test.ts     ← Unit tests (6 tests)

src/routes/(public)/
├── +layout.svelte             ← Public layout (navbar + footer)
├── profil/
│   ├── +page.svelte           ← Profil page
│   └── visi-misi/
│       └── +page.svelte       ← Visi Misi page
├── guru/
│   └── +page.svelte           ← Guru page (from DB)
├── ppdb/
│   └── +page.svelte           ← PPDB page (static)
├── berita/
│   ├── +page.svelte           ← Berita list (placeholder)
│   └── [slug]/
│       └── +page.svelte       ← Berita detail (placeholder)
├── fasilitas/
│   └── +page.svelte           ← Fasilitas page (static)
└── kontak/
    └── +page.svelte           ← Kontak page (static)

tests/e2e/
└── public-website.spec.ts     ← E2E tests (20+ tests)

src/hooks.server.ts            ← Updated auth logic
```

---

## Scenarios & Test Coverage

### Scenario 1: Public pages accessible without login
| Page | Route | Test |
|------|-------|------|
| Profil | `/profil` | ✅ `public pages load without login` |
| Visi Misi | `/profil/visi-misi` | ✅ `public pages load without login` |
| Guru | `/guru` | ✅ `public pages load without login` |
| PPDB | `/ppdb` | ✅ `public pages load without login` |
| Berita | `/berita` | ✅ `public pages load without login` |
| Fasilitas | `/fasilitas` | ✅ `public pages load without login` |
| Kontak | `/kontak` | ✅ `public pages load without login` |

### Scenario 2: Protected pages require login
| Page | Route | Test |
|------|-------|------|
| Dashboard | `/` | ✅ `redirects to login` |
| Dashboard | `/dashboard` | ✅ `redirects to login` |
| PTK | `/ptk` | ✅ `redirects to login` |
| Siswa | `/siswa` | ✅ `redirects to login` |
| Rombel | `/rombel` | ✅ `redirects to login` |

### Scenario 3: Navigation works correctly
| Feature | Test |
|---------|------|
| Navbar links | ✅ `navbar contains all public links` |
| Login button | ✅ `login button links to /dashboard` |
| Mobile menu | ✅ `mobile menu toggles` |
| Footer links | ✅ `footer has navigation links` |

### Scenario 4: Page content correct
| Page | Content | Test |
|------|---------|------|
| Profil | School name | ✅ `profil shows school info` |
| Guru | Guru list | ✅ `guru shows list of guru` |
| PPDB | Registration info | ✅ `ppdb shows PPDB info` |
| Kontak | Contact info | ✅ `kontak shows contact info` |

### Scenario 5: Service layer correct
| Function | Test |
|----------|------|
| `getPublicStats` | ✅ Returns correct shape |
| `getPublicStats` | ✅ Returns non-negative numbers |
| `getPublicGuruList` | ✅ Returns array |
| `getPublicGuruList` | ✅ Returns required fields |
| `getPublicGuruList` | ✅ Only Guru (not Staf) |
| `getPublicGuruList` | ✅ Sorted by nama |

---

## Dependency Graph

```
hooks.server.ts
  └── checks publicPrefixes
      └── allows access to (public) routes

(public)/+layout.svelte
  ├── imports app.css
  ├── imports ModeWatcher
  ├── imports Toaster
  └── renders navbar + footer

(public)/guru/+page.svelte
  └── imports getPublicStatsQ, getPublicGuruListQ
      └── public.remote.ts
          └── public.service.ts
              └── db (ptk, siswa, rombel tables)
```

---

## Migration Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create spec | ✅ Done |
| 2 | Write unit tests | ✅ Done (6 tests) |
| 3 | Write E2E tests | ✅ Done (20+ tests) |
| 4 | Create service layer | ✅ Done |
| 5 | Create remote queries | ✅ Done |
| 6 | Create public layout | ✅ Done |
| 7 | Create public pages | ✅ Done (7 pages) |
| 8 | Update hooks.server.ts | ✅ Done |
| 9 | Type check | ✅ 0 errors |
| 10 | Run unit tests | ✅ 41 passed |
