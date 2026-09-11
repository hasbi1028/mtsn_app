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

## Architecture: Domain-Centric Modular Monolith

```
Browser → SvelteKit (3720) → Drizzle ORM → SQLite (local.db)
```

- **NO separate Go API** — all logic lives in SvelteKit
- **Remote functions** replace `fetch()` — type-safe, validated, auto-deduped
- **Domain modules** — feature-based colocation, not type-based

### Thin Remote Wrapper & Service Layer Pattern

```
src/modules/[domain]/
├── [domain].validation.ts   # Valibot schemas (types + validation)
├── [domain].service.ts      # Pure business logic (DB queries, no SvelteKit)
├── [domain].remote.ts       # Thin wrapper (SvelteKit bridge, ~30 lines)
└── components/
    └── *.svelte             # UI components
```

**Why this pattern?**
- `service.ts` — AI reads this for DB logic (~50 lines, no SvelteKit noise)
- `validation.ts` — AI reads this for schemas (~20 lines)
- `remote.ts` — AI reads this for API contract (~30 lines)
- **Total: ~100 lines per domain** — minimal tokens, no attention drift

**File size limit:** Max 150 lines per `.remote.ts`. If exceeded, split the domain.

## Project Structure
```
src/
├── modules/                          # Domain modules (feature-based)
│   ├── auth/
│   │   ├── auth.validation.ts        # loginSchema, UserSession
│   │   ├── auth.service.ts           # hashPassword, createSession, getUserFromSession
│   │   ├── auth.remote.ts            # login(), logout(), getMe()
│   │   └── components/
│   │       └── login-form.svelte
│   ├── ptk/
│   │   ├── ptk.validation.ts
│   │   ├── ptk.service.ts
│   │   ├── ptk.remote.ts
│   │   └── components/
│   ├── siswa/
│   │   ├── siswa.validation.ts
│   │   ├── siswa.service.ts
│   │   ├── siswa.remote.ts
│   │   └── components/
│   ├── rombel/
│   ├── dokumen/                      # SKMT + SKBK + SKAKPT
│   ├── kartu/
│   ├── bel/
│   ├── approval/
│   └── activity/
├── lib/
│   ├── server/
│   │   └── db/
│   │       ├── schema.ts             # ALL Drizzle table definitions
│   │       ├── index.ts              # DB client export
│   │       └── migrate.ts
│   ├── components/
│   │   ├── ui/                       # shadcn-svelte primitives (DO NOT MODIFY)
│   │   ├── data-table.svelte         # Shared table component
│   │   ├── page-layout.svelte        # Shared page wrapper
│   │   └── ...
│   ├── config/
│   │   └── navigation.ts
│   └── toast.ts
├── routes/                           # SvelteKit pages (thin, delegate to modules)
│   ├── +layout.svelte
│   ├── +layout.server.ts             # Root session check → { user }
│   ├── login/
│   │   └── +page.svelte              # Just renders LoginForm from auth module
│   ├── ptk/
│   │   ├── +page.svelte
│   │   └── [id]/
│   │       └── +page.svelte
│   └── ...
├── hooks.server.ts                   # Auth middleware (calls auth.service)
└── app.css

## Remote Functions Pattern

### File Naming
- `*.remote.ts` — in `src/modules/[domain]/`, contains query/form/command exports
- Must NOT be in `$lib/server/` directory

### Domain Module Pattern
```
src/modules/[domain]/
├── [domain].validation.ts   # Valibot schemas (types + validation)
├── [domain].service.ts      # Pure business logic (DB queries, no SvelteKit)
├── [domain].remote.ts       # Thin wrapper (SvelteKit bridge, ~30 lines)
└── components/
    └── *.svelte             # UI components
```

### Four Flavors (in remote.ts)
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

### Svelte MCP + Autofixer (WAJIB)
- **Selalu gunakan Svelte MCP tools** untuk fetch dokumentasi Svelte 5 terbaru
- Tools tersedia:
  - `svelte_list-sections` — list semua dokumentasi yang tersedia
  - `svelte_get-documentation` — fetch konten dokumentasi berdasarkan section
  - `svelte_svelte-autofixer` — analisis & fix issue Svelte code
  - `svelte_playground-link` — generate playground link (jika user minta)
- **Sebelum menulis/mengubah file `.svelte` atau `.svelte.ts/.svelte.js`:**
  1. Panggil `svelte_svelte-autofixer` untuk analisis code
  2. Apply fixes berdasarkan suggestions
  3. Ulangi sampai tidak ada issues
- **Sebelum menggunakan API SvelteKit baru:**
  1. Panggil `svelte_list-sections` untuk cari section yang relevan
  2. Panggil `svelte_get-documentation` untuk fetch detail API
- **Jika ada error/uncertain tentang Svelte syntax:**
  1. Cari di documentation pakai MCP tools
  2. Jangan assume — verifikasi dari docs resmi

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
