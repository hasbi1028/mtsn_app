# AGENTS.md — MTsN 2 Kolaka Utara App

## Project Overview
Smart Digital School — Sistem Informasi Manajemen Sekolah untuk MTsN 2 Kolaka Utara.

## Tech Stack
- **Frontend:** SvelteKit 2, Svelte 5, TailwindCSS v4, shadcn-svelte (nova style)
- **Backend:** Go API (port 3730)
- **Database:** SQLite via Drizzle ORM (local.db)
- **Runtime:** Node.js (SvelteKit BFF on port 3720)
- **Process Manager:** PM2 (ecosystem.config.cjs)

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run check        # Type check
pm2 start ecosystem.config.cjs  # Start all services
```

## Project Structure
```
src/
├── routes/           # Pages
│   ├── +layout.svelte      # Root layout (ModeWatcher, Sidebar.Provider, conditional login/main)
│   ├── +layout.server.ts   # Session check, provides { user, isLogin }
│   ├── +page.svelte        # Dashboard
│   ├── ptk/                # Data PTK
│   ├── skmt/               # SKMT
│   ├── skbk/               # SKBK
│   ├── skakpt/             # SKAKPT
│   ├── roster/             # Roster
│   ├── activity/           # Aktivitas
│   ├── login/              # Login page
│   └── logout/             # Logout handler
├── lib/
│   ├── components/
│   │   ├── app-sidebar.svelte     # Main sidebar component (sidebar-07 pattern)
│   │   ├── module-switcher.svelte # Module switcher dropdown
│   │   ├── nav-main.svelte        # Navigation menu items
│   │   ├── nav-user.svelte        # User dropdown in sidebar footer
│   │   ├── site-header.svelte     # Top header bar with dark mode toggle
│   │   ├── data-table.svelte      # Shared data table component
│   │   ├── page-layout.svelte     # Shared page layout with title/description
│   │   ├── login-form.svelte      # Login form component
│   │   ├── PdfViewer.svelte       # PDF viewer modal
│   │   └── ui/                    # shadcn-svelte components
│   ├── config/
│   │   └── navigation.ts          # Nav items and team configuration
│   ├── hooks/
│   │   └── is-mobile.svelte.ts    # MediaQuery for mobile detection
│   └── server/                    # Server-side utilities
├── hooks.server.ts        # Session middleware, redirects to /login
└── app.css                # TailwindCSS + shadcn theme variables
```

## Key Architecture Decisions

### Sidebar (sidebar-07 pattern)
- Uses `sidebar-07` block from shadcn-svelte
- `Sidebar.Root` with `collapsible="icon"` for icon-only collapsed mode
- `Sidebar.Provider` wraps the app in `+layout.svelte`
- Components: `ModuleSwitcher` → header, `NavMain` → menu, `NavUser` → footer
- Menu uses `<Sidebar.Group>` + `<Sidebar.GroupLabel>` + `<Sidebar.GroupContent>` + `<Sidebar.Menu>`
- Menu items use `child` snippet pattern with `<a>` tags for navigation
- `tooltipContent` prop (not `tooltip`) for sidebar-menu-button
- `data-active` attribute only rendered when `true` (fixed bug where `data-active="false"` matched CSS `[data-active]`)

### Module Switcher
- Dropdown di sidebar header untuk switch antar modul
- Modul aktif: Dashboard, Kepegawaian, Jadwal, Dokumen
- Modul mendatang: Kesiswaan, Perpustakaan, Sarana & Prasarana, Pengaturan
- Menampilkan icon, nama, dan description setiap modul

### Navigation Config
- Navigation items defined in `$lib/config/navigation.ts`
- Easy to add new sections/modules by extending the config array
- Team/instansi configuration centralized

### Shared Components
- `data-table.svelte` - Reusable table with columns, custom cell rendering, empty state
- `page-layout.svelte` - Consistent page wrapper with title/description
- All pages use these shared components for consistency

### Dark Mode
- Uses `mode-watcher` library (per shadcn-svelte docs)
- `<ModeWatcher />` in root layout
- `toggleMode` from `mode-watcher` in site-header.svelte
- Sun/Moon Lucide icons in header (not emoji)
- CSS variables: `:root` for light, `.dark` for dark, `@theme inline` for Tailwind v4

### Authentication
- Session check via `/api/me` in `hooks.server.ts`
- Redirects unauthenticated users to `/login`
- `{ user, isLogin }` passed from `+layout.server.ts`
- Logout via POST to `/logout` endpoint
- Default credentials: `hasbi` / `admin123`

### Icons
- Use Lucide icons (`@lucide/svelte`) throughout
- No emoji in UI components

## CSS Theme Variables
Defined in `src/app.css`:
- `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, etc.
- Mapped via `@theme inline` for Tailwind v4 compatibility
- Light/dark mode variants for all sidebar colors

## Known Warnings (non-blocking)
- `state_referenced_locally` in `skakpt/+page.svelte` and `skbk/+page.svelte` (pre-existing)
- `a11y_missing_attribute` in `PdfViewer.svelte` (pre-existing)
- `config.kit.csrf.checkOrigin` deprecated in favor of `csrf.trustedOrigins`

## PM2 Services
1. **mtsn-app-api** — Go API on port 3730
2. **mtsn-app-bff** — SvelteKit build on port 3720

## Conventions
- Follow shadcn-svelte patterns exactly (do not hack/modify UI components)
- Use `pnpm dlx shadcn-svelte@latest add <component>` to install components
- Use `--overwrite` flag when reinstalling components
- Prefer Lucide icons over emoji
- Keep sidebar flat (no sub-items) unless explicitly needed
- Use shared components (`data-table`, `page-layout`) for new pages
- Add new navigation items to `$lib/config/navigation.ts`

## Future Modules (Mendatang)
- Kesiswaan — Data Siswa & Kelas
- Perpustakaan — Buku & Peminjaman
- Sarana & Prasarana — Inventaris Sekolah
- Pengaturan — Konfigurasi Sistem
