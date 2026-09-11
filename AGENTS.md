# AGENTS.md — SIMAD MTsN 2 Kolaka Utara

## Project Overview
SIMAD — Sistem Informasi Manajemen Madrasah untuk MTsN 2 Kolaka Utara.

## Tech Stack
- **Framework:** SvelteKit 2 + Svelte 5 (runes)
- **Remote Functions:** `$app/server` — `query`, `form`, `command` (experimental, opt-in)
- **UI:** TailwindCSS v4 + shadcn-svelte (nova style)
- **Database:** SQLite via Drizzle ORM (`local.db`)
- **Validation:** Valibot (Standard Schema)
- **Testing:** Playwright (e2e) + Vitest (unit)
- **Runtime:** Node.js on port 3720
- **Process Manager:** PM2 (`ecosystem.config.cjs`)

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run check        # Type check
npm run test         # Run unit tests
npx playwright test  # Run e2e tests
```

## Architecture: Fullstack SvelteKit

```
Browser → SvelteKit (3720) → Drizzle ORM → SQLite (local.db)
```

- **NO separate Go API** — all logic lives in SvelteKit
- **Remote functions** replace `fetch()` — type-safe, validated, auto-deduped
- **Co-located data** — `data.remote.ts` next to `+page.svelte`

## Project Structure
```
src/
├── lib/
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts      # ALL Drizzle table definitions
│   │   │   ├── index.ts       # DB client export
│   │   │   └── migrate.ts     # Migration runner
│   │   ├── auth.ts            # getUser(), requireRole(), createSession()
│   │   └── kartu/
│   │       ├── render.ts      # Playwright HTML→PNG rendering
│   │       └── queue.ts       # In-memory job queue
│   ├── components/
│   │   ├── ui/                # shadcn-svelte primitives (DO NOT MODIFY)
│   │   ├── data-table.svelte  # Shared table component
│   │   ├── page-layout.svelte # Shared page wrapper
│   │   ├── confirm-dialog.svelte
│   │   ├── empty-state.svelte
│   │   └── ...
│   ├── config/
│   │   └── navigation.ts      # Sidebar nav items
│   └── toast.ts               # Sonner helper
├── routes/
│   ├── +layout.svelte         # Root layout (Sidebar.Provider, ModeWatcher, Toaster)
│   ├── +layout.server.ts      # Root session check → { user, isLogin }
│   ├── login/
│   │   ├── +page.svelte
│   │   └── data.remote.ts     # login(), logout()
│   ├── +page.svelte           # Dashboard
│   ├── +page.server.ts        # Dashboard stats (load only)
│   ├── ptk/
│   │   ├── +page.svelte
│   │   ├── data.remote.ts     # getPtkList()
│   │   └── [id]/
│   │       ├── +page.svelte
│   │       └── data.remote.ts # getPtkDetail()
│   ├── siswa/
│   │   ├── +page.svelte
│   │   ├── data.remote.ts     # getSiswaList()
│   │   ├── [id]/
│   │   │   ├── profil/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── data.remote.ts
│   │   │   ├── bansos/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── data.remote.ts
│   │   │   └── kartu/
│   │   │       ├── +page.svelte
│   │   │       └── data.remote.ts
│   │   ├── profil/            # Self-service (siswa login)
│   │   │   ├── +page.svelte
│   │   │   └── data.remote.ts
│   │   └── bansos/            # Self-service (siswa login)
│   │       ├── +page.svelte
│   │       └── data.remote.ts
│   ├── rombel/
│   │   ├── +page.svelte
│   │   ├── data.remote.ts
│   │   └── [id]/
│   │       ├── +page.svelte
│   │       └── data.remote.ts
│   ├── roster/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── skmt/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── skbk/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── skakpt/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── bel/
│   │   ├── +page.svelte
│   │   ├── data.remote.ts
│   │   └── suara/
│   │       ├── +page.svelte
│   │       └── data.remote.ts
│   ├── approval/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── activity/
│   │   ├── +page.svelte
│   │   └── data.remote.ts
│   ├── ortu/
│   │   └── bansos/
│   │       ├── +page.svelte
│   │       └── data.remote.ts
│   └── api/                   # ONLY for proxied external services
│       └── skakpt/bukti/[name]/
│           └── +server.ts     # Proxy bukti images
├── hooks.server.ts            # Auth middleware (session check)
└── app.css                    # TailwindCSS + shadcn theme variables

specs/                         # Markdown-driven specs
├── README.md                  # Index
├── _template/
│   ├── spec.md                # Requirements template
│   ├── data-model.md          # Schema template
│   └── test-plan.md           # Test plan template
├── 001-auth/
├── 002-dashboard/
├── 003-ptk/
├── 004-siswa/
├── 005-rombel/
├── 006-roster/
├── 007-dokumen/               # SKMT + SKBK + SKAKPT
├── 008-kartu/
├── 009-bel/
├── 010-approval/
├── 011-bansos/
└── 012-activity/

tests/
└── e2e/
    ├── helpers.ts             # Shared test utilities
    ├── auth.spec.ts
    ├── ptk.spec.ts
    ├── siswa.spec.ts
    ├── rombel.spec.ts
    ├── kartu.spec.ts
    └── ...
```

## Remote Functions Pattern

### File Naming
- `data.remote.ts` — co-located with page, contains query/form/command exports
- Must NOT be in `$lib/server/` directory

### Four Flavors
```ts
import { query, form, command, prerender } from '$app/server';

// READ — auto-deduped, cached per argument
export const getItems = query(schema, async (args) => { ... });

// WRITE (form) — tied to <form>, progressive enhancement
export const createItem = form(schema, async (data) => { ... });

// WRITE (command) — callable from anywhere (event handler, etc.)
export const deleteItem = command(schema, async (id) => { ... });

// STATIC — built at build time
export const getStatic = prerender(async () => { ... });
```

### Validation
- Always use Valibot (Standard Schema) as first argument
- Server-side validation is automatic
- Client-side preflight: `.preflight(schema)` on forms

### Single-Flight Mutations
```ts
// In form/command handler:
void getItems().refresh();           // refresh all instances
getItem(id).set(updatedData);       // set specific instance
```

### Auth in Remote Functions
```ts
import { getRequestEvent } from '$app/server';

export const getProfile = query(async () => {
  const { cookies } = getRequestEvent();
  const user = await findUser(cookies.get('session_id'));
  return user;
});
```

## Data Model (20 Tables)

| Table | Purpose |
|-------|---------|
| `users` | Login accounts (admin/guru/siswa/orangtua) |
| `sessions` | Auth tokens |
| `ptk` | Guru & tenaga kependidikan |
| `jtm_semester` | Jam tatap muka per semester |
| `skmt_ajuan` | SKMT submissions |
| `skbk_ajuan` | SKBK submissions |
| `skakpt` | SKAKPT data (11 indikator TPG) |
| `dokumen` | File attachments per PTK |
| `roster` | Jadwal mengajar |
| `siswa` | Data siswa |
| `rombel` | Rombongan belajar (kelas) |
| `perubahan_siswa` | Pending data changes (approval) |
| `activity_log` | Audit trail |
| `ortu` | Data orang tua |
| `siswa_ortu` | Siswa ↔ Ortu relation |
| `jam_bel` | Jadwal bel sekolah |
| `bel_settings` | Bell master switch |
| `cuti` | Data cuti PTK |
| `schema_migrations` | Migration tracking |
| `kartu_cache` | Generated card PNGs metadata |

## Key Conventions

### UI Components
- shadcn-svelte primitives: `pnpm dlx shadcn-svelte@latest add <component>`
- Shared components: `data-table.svelte`, `page-layout.svelte`
- Lucide icons only (no emoji)
- Dark mode via `mode-watcher`

### Toast / Notifikasi (WAJIB)
- Library: Sonner (`svelte-sonner`), `<Toaster />` in root layout
- Helper: `$lib/toast.ts` → `notify.success/error/info/warning`
- SEMUA aksi user WAJIB pakai toast
- Remote form pattern: `createItem.enhance(async (form) => { ... showToast('...'); })`
- Pesan dalam Bahasa Indonesia

### Testing (TDD)
- Write spec (markdown) → Write test → FAIL → Write code → PASS → Commit
- E2E: `tests/e2e/[module].spec.ts` (Playwright)
- Unit: `src/lib/server/**/*.test.ts` (Vitest)

### Markdown-Driven Development (MDD)
- Every feature starts in `specs/NNN-name/spec.md`
- AI reads spec → generates remote function + page + test
- Spec includes: user story, acceptance criteria, data model, API contract

### Svelte Validation (WAJIB)
- Run `npx @sveltejs/mcp svelte-autofixer <file> --svelte-version 5` before completing
- Then run `npm run check`

### State Management
- Remote queries: auto-cached, auto-deduped
- Component state: `$state()` runes
- URL state: `$app/state` for search params, page data
- NO stores (use runes or remote queries instead)

## PM2 Services
1. **mtsn-app-bff** — SvelteKit on port 3720 (ONLY service needed)
2. ~~mtsn-app-api~~ — DELETED (migrated to remote functions)
3. **simad-bel** — Worker bel sekolah (port 8093, independent Go process)

## Database
- SQLite file: `local.db`
- ORM: Drizzle with `drizzle-kit` for migrations
- Schema: `src/lib/server/db/schema.ts`
- Migrations: `drizzle/` (auto-generated)

## Migration Status
See `plan.md` for full migration plan from Go API → SvelteKit remote functions.
