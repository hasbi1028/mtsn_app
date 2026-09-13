# spec.md — Pengaturan Branding (Logo & Favicon)

> Spec 028. Dibuat setelah patch insiden (dashboard 500 + favicon 404) untuk
> mendokumentasikan fitur branding yang dapat diatur admin.

---

## Module: `pengaturan`

### User Story

As an `admin`, I want to mengatur logo, favicon, nama aplikasi, dan subjudul
aplikasi dari halaman pengaturan, so that identitas SIMAD dapat disesuaikan
dengan madrasah tanpa mengubah kode/kapabilitas build ulang.

**Roles:**
- `admin` — Full akses (baca & ubah branding)
- `kepsek`, `guru`, `staf`, `siswa`, `orangtua` — Hanya melihat branding (read-only)

### Acceptance Criteria

- [x] Admin dapat mengubah `app_name` dan `app_subtitle`.
- [x] Admin dapat mengunggah logo (PNG/JPG/WEBP/SVG, maks 2 MB).
- [x] Admin dapat mengunggah favicon (PNG/JPG/WEBP/SVG/ICO, maks 1 MB).
- [x] Logo/favicon kustom disimpan di `static/uploads/branding/` dan berkas lama dihapus.
- [x] Bila branding belum diatur, sistem memakai **logo Kemenag**
      (`/uploads/logo-kemenag.png`) sebagai fallback.
- [x] Ada aksi "Pakai Kemenag" untuk menghapus branding kustom.
- [x] Favicon aktif diterapkan via `<link rel="icon">` di root layout.
- [x] `/favicon.ico` selalu 200 dan menyajikan favicon aktif (fallback logo Kemenag).
- [x] Logo tampil di sidebar admin, header mobile, halaman login, navbar & footer publik.
- [x] Non-admin tidak dapat mengubah (guard `requireAdmin` di remote functions).

### Edge Cases

- Ekstensi tidak diizinkan atau isi tidak cocok magic bytes → error validasi.
- Ukuran melebihi batas → ditolak Valibot (`maxSize`).
- Tabel `pengaturan` belum ada di DB lama → dibuat otomatis (`CREATE TABLE IF NOT EXISTS`).
- Favicon `.ico` — MIME ditambahkan di `hooks.server.ts` (`image/x-icon`).
- Berkas branding lama harus dibersihkan agar tidak menumpuk.

### Out of Scope

- Multi-tema / warna dinamis TIDAK termasuk.
- CRUD pengaturan lain (mis. konfigurasi bel, backup) TIDAK termasuk — sudah punya modul sendiri.

---

## Data Model

### Tabel yang terlibat

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `pengaturan` | `key`, `value`, `updated_at` | key-value (tanpa FK) |

Key yang dipakai: `app_name`, `app_subtitle`, `logo_path`, `favicon_path`.

### Query Pattern

```sql
-- Read
SELECT key, value FROM pengaturan;

-- Upsert
INSERT INTO pengaturan (key, value, updated_at)
VALUES (?, ?, datetime('now','localtime'))
ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now','localtime');

-- Bootstrap (aman untuk DB lama)
CREATE TABLE IF NOT EXISTS pengaturan (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);
```

---

## Domain Module Structure

```
src/modules/pengaturan/
├── pengaturan.validation.ts    # Valibot schemas (teks, logo, favicon, kind)
├── pengaturan.service.ts       # Pure business logic (DB + file upload)
├── pengaturan.remote.ts        # Thin wrapper (query/form/command)
└── pengaturan.service.test.ts  # Unit test
```

### Validation (`pengaturan.validation.ts`)

- `brandingTextSchema` — `app_name` (2..60), `app_subtitle` (0..80)
- `logoUploadSchema` — file maks 2 MB
- `faviconUploadSchema` — file maks 1 MB
- `brandingKindSchema` — picklist `logo | favicon`

### Service (`pengaturan.service.ts`)

- `ensurePengaturanTable()` — bootstrap tabel.
- `getPengaturan()` — resolve branding + fallback Kemenag.
- `setPengaturanValues(values)` — upsert.
- `saveBrandingFile(kind, file)` — validasi ekstensi + magic bytes, simpan, hapus lama.
- `resetBrandingFile(kind)` — hapus berkas kustom, kembali ke fallback.
- `getBrandingContentType(webPath)` — pemetaan MIME.

### Remote (`pengaturan.remote.ts`)

- `getPengaturanQ` — `query`
- `updateBrandingTextForm` — `form`
- `uploadLogoForm` — `form` (multipart)
- `uploadFaviconForm` — `form` (multipart)
- `resetBrandingC` — `command`
- Semua mutasi lewat `requireAdmin()`.

### Integrasi UI

- `src/routes/+layout.server.ts` — memuat `pengaturan` (SSR).
- `src/routes/+layout.svelte` — `<link rel="icon">` dinamis.
- `src/routes/favicon.ico/+server.ts` — penyajian favicon aktif.
- `src/routes/admin/pengaturan/+page.svelte` — halaman admin.
- `src/lib/config/navigation.ts` — menu **Sistem → Pengaturan** (khusus admin).
- `module-switcher.svelte`, `admin/+layout.svelte`, `login-form.svelte`,
  `public-navbar.svelte`, `public-footer.svelte` — menampilkan logo/nama.

---

## E2E Test

```ts
// tests/e2e/pengaturan.spec.ts
test('halaman pengaturan tampil untuk admin');
test('menu Pengaturan muncul di sidebar admin');
test('favicon dapat diakses dengan fallback logo Kemenag');
```

---

## Migration Checklist

- [x] Spec ditulis (`specs/028-branding-pengaturan/spec.md`)
- [x] Validation schema (`pengaturan.validation.ts`)
- [x] Service layer (`pengaturan.service.ts`)
- [x] Remote wrapper (`pengaturan.remote.ts`)
- [x] Page admin (`/admin/pengaturan`) + menu navigasi
- [x] Unit test (`pengaturan.service.test.ts`)
- [x] E2E test (`tests/e2e/pengaturan.spec.ts`)
- [x] Svelte autofixer dijalankan pada file `.svelte`
- [x] `npm run check` lulus (0 error)
- [ ] Commit dengan conventional commit message
