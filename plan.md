# Plan: Website Public + Admin Management

## Overview
Pembangunan website public lengkap dengan modul admin untuk mengelola konten (berita, pengumuman, agenda, galeri, ekskul, prestasi).

---

## Architecture

```
src/
├── modules/
│   ├── berita/
│   │   ├── berita.validation.ts
│   │   ├── berita.service.ts
│   │   └── berita.remote.ts
│   ├── pengumuman/
│   │   ├── pengumuman.validation.ts
│   │   ├── pengumuman.service.ts
│   │   └── pengumuman.remote.ts
│   ├── agenda/
│   │   ├── agenda.validation.ts
│   │   ├── agenda.service.ts
│   │   └── agenda.remote.ts
│   ├── galeri/
│   │   ├── galeri.validation.ts
│   │   ├── galeri.service.ts
│   │   └── galeri.remote.ts
│   ├── ekskul/
│   │   ├── ekskul.validation.ts
│   │   ├── ekskul.service.ts
│   │   └── ekskul.remote.ts
│   └── prestasi/
│       ├── prestasi.validation.ts
│       ├── prestasi.service.ts
│       └── prestasi.remote.ts
│
├── routes/
│   ├── (public)/
│   │   ├── berita/
│   │   ├── pengumuman/
│   │   ├── agenda/
│   │   ├── galeri/
│   │   ├── ekskul/
│   │   └── prestasi/
│   │
│   └── (admin)/
│       ├── berita/
│       ├── pengumuman/
│       ├── agenda/
│       ├── galeri/
│       ├── ekskul/
│       └── prestasi/
│
└── lib/server/db/
    └── schema.ts (add new tables)
```

---

## Phase 1: Database Schema

### New Tables

```sql
-- Berita
CREATE TABLE berita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  ringkasan TEXT,
  konten TEXT,
  gambar TEXT,
  penulis TEXT DEFAULT 'Admin',
  kategori TEXT DEFAULT 'umum',
  published INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pengumuman
CREATE TABLE pengumuman (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  penting INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agenda
CREATE TABLE agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT,
  lokasi TEXT,
  warna TEXT DEFAULT '#3b82f6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Galeri
CREATE TABLE galeri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  gambar TEXT NOT NULL,
  kategori TEXT DEFAULT 'kegiatan',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ekstrakurikuler
CREATE TABLE ekskul (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  gambar TEXT,
  pembina TEXT,
  jadwal TEXT,
  aktif INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prestasi
CREATE TABLE prestasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  gambar TEXT,
  pemenang TEXT,
  tingkat TEXT DEFAULT 'sekolah',
  tahun INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 2: Admin Modules

### 2.1 Berita Module

**List Page** (`/admin/berita`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Judul | text | Judul berita |
| Kategori | badge | umum, kegiatan, prestasi |
| Status | badge | Draft, Published |
| Tanggal | date | Tanggal publish |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/berita/new`, `/admin/berita/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Judul | input | required, min:5 |
| Slug | input | auto-generate dari judul |
| Ringkasan | textarea | optional |
| Konten | textarea | required |
| Gambar | file/image | optional |
| Kategori | select | umum, kegiatan, prestasi |
| Publish | switch | boolean |

### 2.2 Pengumuman Module

**List Page** (`/admin/pengumuman`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Judul | text | Judul pengumuman |
| Penting | badge | Ya/Tidak |
| Status | badge | Draft, Published |
| Tanggal | date | Tanggal publish |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/pengumuman/new`, `/admin/pengumuman/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Judul | input | required |
| Konten | textarea | required |
| Penting | switch | boolean |
| Publish | switch | boolean |

### 2.3 Agenda Module

**List Page** (`/admin/agenda`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Judul | text | Judul agenda |
| Tanggal | date | Tanggal mulai - selesai |
| Lokasi | text | Lokasi kegiatan |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/agenda/new`, `/admin/agenda/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Judul | input | required |
| Deskripsi | textarea | optional |
| Tanggal Mulai | date | required |
| Tanggal Selesai | date | optional |
| Lokasi | input | optional |
| Warna | color | default #3b82f6 |

### 2.4 Galeri Module

**List Page** (`/admin/galeri`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Gambar | thumbnail | Preview |
| Judul | text | Judul foto |
| Kategori | badge | kegiatan, wisata, olahraga |
| Tanggal | date | Tanggal upload |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/galeri/new`, `/admin/galeri/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Judul | input | required |
| Deskripsi | textarea | optional |
| Gambar | file/image | required |
| Kategori | select | kegiatan, wisata, olahraga, lainnya |

### 2.5 Ekstrakurikuler Module

**List Page** (`/admin/ekskul`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Gambar | thumbnail | Preview |
| Nama | text | Nama ekskul |
| Pembina | text | Guru pembina |
| Status | badge | Aktif, Nonaktif |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/ekskul/new`, `/admin/ekskul/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Nama | input | required |
| Slug | input | auto-generate |
| Deskripsi | textarea | optional |
| Gambar | file/image | optional |
| Pembina | input | optional |
| Jadwal | input | optional |
| Aktif | switch | boolean |

### 2.6 Prestasi Module

**List Page** (`/admin/prestasi`):
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Gambar | thumbnail | Preview |
| Judul | text | Judul prestasi |
| Pemenang | text | Nama pemenang |
| Tingkat | badge | sekolah, kabupaten, nasional |
| Tahun | number | Tahun prestasi |
| Aksi | button | Edit, Hapus |

**Form Page** (`/admin/prestasi/new`, `/admin/prestasi/[id]/edit`):
| Field | Tipe | Validasi |
|-------|------|----------|
| Judul | input | required |
| Deskripsi | textarea | optional |
| Gambar | file/image | optional |
| Pemenang | input | optional |
| Tingkat | select | sekolah, kabupaten, provinsi, nasional |
| Tahun | number | required |

---

## Phase 3: Public Pages

### 3.1 Berita Pages

**List** (`/berita`):
- Grid layout (2-3 columns)
- Card dengan gambar, judul, ringkasan, tanggal
- Kategori badge
- Pagination
- Search/filter

**Detail** (`/berita/[slug]`):
- Gambar hero
- Judul, penulis, tanggal
- Konten lengkap
- Share buttons
- Berita terkait

### 3.2 Pengumuman Pages

**List** (`/pengumuman`):
- List layout (vertical)
- Card dengan badge "Penting" jika penting
- Judul, konten preview, tanggal
- Pagination

**Detail** (`/pengumuman/[id]`):
- Badge "Penting" jika penting
- Judul, tanggal publish
- Konten lengkap

### 3.3 Agenda Page

**Calendar View** (`/agenda`):
- Kalender bulanan
- Event dots pada tanggal
- Klik tanggal → list agenda hari itu
- Filter: bulan, kategori

### 3.4 Galeri Page

**Grid View** (`/galeri`):
- Masonry grid layout
- Filter by kategori
- Lightbox untuk preview
- Lazy loading gambar

### 3.5 Ekstrakurikuler Page

**List** (`/ekskul`):
- Grid layout (2-3 columns)
- Card dengan gambar, nama, pembina, jadwal
- Status badge (Aktif/Nonaktif)

### 3.6 Prestasi Page

**List** (`/prestasi`):
- Grid layout
- Card dengan gambar, judul, pemenang, tingkat, tahun
- Filter by tahun, tingkat

---

## Phase 4: Components

### Admin Components
```
src/lib/components/admin/
├── data-table.svelte           ← Reusable table
├── form-field.svelte           ← Form field wrapper
├── image-upload.svelte         ← Image upload component
├── rich-text-editor.svelte     ← Rich text editor
├── status-badge.svelte         ← Status badge
├── confirm-dialog.svelte       ← Delete confirmation
└── search-input.svelte         ← Search input
```

### Public Components
```
src/lib/components/public/
├── berita-card.svelte          ← Card berita
├── pengumuman-card.svelte      ← Card pengumuman
├── agenda-calendar.svelte      ← Kalender agenda
├── galeri-grid.svelte          ← Grid galeri
├── ekskul-card.svelte          ← Card ekskul
├── prestasi-card.svelte        ← Card prestasi
├── pagination.svelte           ← Pagination
├── search-filter.svelte        ← Search & filter
└── lightbox.svelte             ← Image lightbox
```

---

## Phase 5: Navigation Updates

### Admin Sidebar
```typescript
// src/lib/config/navigation.ts
{
  title: "Konten",
  url: "/admin/berita",
  icon: NewspaperIcon,
  group: "Konten",
  roles: ["admin"],
  children: [
    { title: "Berita", url: "/admin/berita", icon: NewspaperIcon },
    { title: "Pengumuman", url: "/admin/pengumuman", icon: MegaphoneIcon },
    { title: "Agenda", url: "/admin/agenda", icon: CalendarIcon },
    { title: "Galeri", url: "/admin/galeri", icon: ImageIcon },
    { title: "Ekstrakurikuler", url: "/admin/ekskul", icon: TrophyIcon },
    { title: "Prestasi", url: "/admin/prestasi", icon: MedalIcon },
  ],
}
```

### Public Navbar
```typescript
const navItems = [
  { href: '/profil', label: 'Profil' },
  { href: '/berita', label: 'Berita' },
  { href: '/ppdb', label: 'PPDB' },
  { href: '/kontak', label: 'Kontak' },
];
```

### Public Footer
```typescript
const footerLinks = [
  { label: 'Profil', href: '/profil' },
  { label: 'Berita', href: '/berita' },
  { label: 'Pengumuman', href: '/pengumuman' },
  { label: 'PPDB', href: '/ppdb' },
  { label: 'Kontak', href: '/kontak' },
];
```

---

## Phase 6: Implementation Checklist

### Database
- [ ] Add new tables to schema.ts
- [ ] Create migration
- [ ] Seed sample data

### Admin Modules
- [ ] Berita module (validation, service, remote, pages)
- [ ] Pengumuman module
- [ ] Agenda module
- [ ] Galeri module
- [ ] Ekskul module
- [ ] Prestasi module

### Public Pages
- [ ] Berita list + detail
- [ ] Pengumuman list + detail
- [ ] Agenda calendar
- [ ] Galeri grid
- [ ] Ekskul list
- [ ] Prestasi list

### Components
- [ ] Admin components
- [ ] Public components

### Navigation
- [ ] Update admin sidebar
- [ ] Update public navbar
- [ ] Update public footer

### Testing
- [ ] Unit tests
- [ ] E2E tests

---

## Phase 7: File Structure

```
src/modules/
├── berita/
│   ├── berita.validation.ts
│   ├── berita.service.ts
│   └── berita.remote.ts
├── pengumuman/
│   ├── pengumuman.validation.ts
│   ├── pengumuman.service.ts
│   └── pengumuman.remote.ts
├── agenda/
│   ├── agenda.validation.ts
│   ├── agenda.service.ts
│   └── agenda.remote.ts
├── galeri/
│   ├── galeri.validation.ts
│   ├── galeri.service.ts
│   └── galeri.remote.ts
├── ekskul/
│   ├── ekskul.validation.ts
│   ├── ekskul.service.ts
│   └── ekskul.remote.ts
└── prestasi/
    ├── prestasi.validation.ts
    ├── prestasi.service.ts
    └── prestasi.remote.ts

src/routes/(admin)/
├── berita/
│   ├── +page.svelte              ← List
│   ├── new/+page.svelte          ← Create
│   └── [id]/edit/+page.svelte    ← Edit
├── pengumuman/
│   ├── +page.svelte
│   ├── new/+page.svelte
│   └── [id]/edit/+page.svelte
├── agenda/
│   ├── +page.svelte
│   ├── new/+page.svelte
│   └── [id]/edit/+page.svelte
├── galeri/
│   ├── +page.svelte
│   ├── new/+page.svelte
│   └── [id]/edit/+page.svelte
├── ekskul/
│   ├── +page.svelte
│   ├── new/+page.svelte
│   └── [id]/edit/+page.svelte
└── prestasi/
    ├── +page.svelte
    ├── new/+page.svelte
    └── [id]/edit/+page.svelte

src/routes/(public)/
├── berita/
│   ├── +page.svelte              ← List
│   └── [slug]/+page.svelte       ← Detail
├── pengumuman/
│   ├── +page.svelte              ← List
│   └── [id]/+page.svelte         ← Detail
├── agenda/
│   └── +page.svelte              ← Calendar
├── galeri/
│   └── +page.svelte              ← Grid
├── ekskul/
│   └── +page.svelte              ← List
└── prestasi/
    └── +page.svelte              ← List
```

---

## References

- [shadcn-svelte docs](https://www.shadcn-svelte.com)
- [SvelteKit routing](https://kit.svelte.dev/docs/routing)
- [Svelte 5 runes](https://svelte.dev/docs/svelte/$state)
- Website sekolah Indonesia typical patterns
