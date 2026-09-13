# test-plan.md — Spec 028 Pengaturan Branding

> Strategi uji untuk modul `pengaturan` (logo, favicon, identitas aplikasi).

---

## Test Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Service: bootstrap tabel, fallback, MIME |
| E2E | Playwright | Halaman admin, menu sidebar, favicon |
| Structural | Playwright | Full remote (bagian dari suite `full-remote.spec.ts`) |
| Manual/SSR | `npm run check` + build/preview | Tidak ada warning `node_invalid_placement_ssr` |

---

## Unit Test Scenarios (`pengaturan.service.test.ts`)

- `ensurePengaturanTable` tidak melempar error saat tabel belum ada.
- `getPengaturan` mengembalikan fallback **logo Kemenag** saat `logo_path`/`favicon_path` kosong.
- `getBrandingContentType` memetakan `.png`, `.ico`, `.svg`, dan ekstensi tak dikenal.

## E2E Scenarios (`tests/e2e/pengaturan.spec.ts`)

```gherkin
Scenario: Halaman pengaturan tampil untuk admin
  Given admin sudah login
  When buka /admin/pengaturan
  Then heading "Pengaturan" visible
  And card "Logo Aplikasi" visible
  And card "Favicon" visible

Scenario: Menu Pengaturan di sidebar
  Given admin sudah login
  When buka /admin/dashboard
  And klik toggle grup "Sistem"
  Then link "Pengaturan" visible

Scenario: Favicon dapat diakses
  Given siapa saja
  When GET /favicon.ico
  Then status 200
  And content-type diawali "image/"
```

## Role Guard (wajib)

| Aksi | admin | non-admin |
|------|-------|-----------|
| Lihat halaman `/admin/pengaturan` | ✅ | ✅ (pesan akses ditolak) |
| `updateBrandingTextForm` | ✅ | ❌ 403 |
| `uploadLogoForm` / `uploadFaviconForm` | ✅ | ❌ 403 |
| `resetBrandingC` | ✅ | ❌ 403 |

## SSR / Hydration Guard

- Semua `Trigger` bits-ui (`Sheet`, `Dialog`, `DropdownMenu`, `AlertDialog`, `Tooltip`)
  yang membungkus tombol WAJIB memakai `{#snippet child({ props })}` agar tidak
  menghasilkan nested `<button>` → mencegah `node_invalid_placement_ssr` dan
  `hydration_mismatch`.

## Running Tests

```bash
npm run check
npm run test
npx playwright test tests/e2e/pengaturan.spec.ts tests/e2e/full-remote.spec.ts
```
