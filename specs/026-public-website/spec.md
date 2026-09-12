# Spec 026 — Website Public MTsN 2 Kolaka Utara

## User Story
Sebagai pengunjung website, saya ingin mengakses informasi tentang MTsN 2 Kolaka Utara tanpa perlu login.

## Problem Statement
SIMAD hanya bisa diakses oleh user yang login. Informasi publik tentang sekolah (profil, guru, PPDB) tidak tersedia untuk pengunjung umum.

## Solution
Buat halaman public dengan layout terpisah yang tidak memerlukan autentikasi.

## Acceptance Criteria
- [ ] Pengunjung bisa akses `/profil` tanpa login
- [ ] Pengunjung bisa akses `/guru` tanpa login
- [ ] Pengunjung bisa akses `/ppdb` tanpa login
- [ ] Pengunjung bisa akses `/berita` tanpa login
- [ ] Pengunjung bisa akses `/kontak` tanpa login
- [ ] Admin dashboard tetap memerlukan login
- [ ] Layout public berbeda dengan admin (navbar + footer)
- [ ] Responsive design (mobile + desktop)
- [ ] SEO meta tags tersedia

## Route Structure
```
src/routes/(public)/
├── +layout.svelte           ← Navbar + footer public
├── profil/
│   ├── +page.svelte         ← Profil sekolah
│   └── visi-misi/
│       └── +page.svelte
├── guru/
│   └── +page.svelte         ← Daftar guru (from DB)
├── ppdb/
│   └── +page.svelte         ← Info PPDB
├── berita/
│   ├── +page.svelte         ← Daftar berita
│   └── [slug]/
│       └── +page.svelte
├── fasilitas/
│   └── +page.svelte
└── kontak/
    └── +page.svelte
```

## Data Model
### Remote Queries
| Query | Source | Returns |
|-------|--------|---------|
| `getPublicStatsQ` | `ptk`, `siswa`, `rombel` tables | `{ totalSiswa, totalGuru, totalRombel, totalKelas }` |
| `getPublicGuruListQ` | `ptk` table (fungsi='Guru') | Array of `{ nama, fungsi, sertifikasi, waliKelas, jabatanStruktural }` |

### Auth Logic
```ts
// hooks.server.ts
const publicPrefixes = ['/login', '/uploads', '/profil', '/ppdb', '/guru', '/berita', '/fasilitas', '/kontak'];
const isPublic = publicPrefixes.some(p => pathname.startsWith(p));

if (!event.locals.user && !isPublic) {
  redirect(302, '/login');
}
```

## API Contract
### GET /profil
- No auth required
- Returns HTML page with school profile

### GET /guru
- No auth required
- Calls `getPublicGuruListQ()` remote query
- Returns HTML page with guru list

### GET /ppdb
- No auth required
- Returns HTML page with PPDB info (static)

### GET /berita
- No auth required
- Returns HTML page with berita list (placeholder)

### GET /kontak
- No auth required
- Returns HTML page with contact info (static)

## Test Plan

### Unit Tests (`public.service.test.ts`)
| Test | Description |
|------|-------------|
| `getPublicStats returns correct shape` | Stats object has totalSiswa, totalGuru, totalRombel, totalKelas |
| `getPublicStats returns non-negative numbers` | All values >= 0 |
| `getPublicGuruList returns array` | Returns array of guru |
| `getPublicGuruList returns guru with required fields` | Each guru has nama, fungsi, sertifikasi |
| `getPublicGuruList only returns Guru` | No Staf in results |
| `getPublicGuruList returns sorted by nama` | Alphabetical order |

### E2E Tests (`public-website.spec.ts`)
| Test | Description |
|------|-------------|
| `public pages load without login` | Each public page accessible without auth |
| `protected pages redirect to login` | Admin pages require auth |
| `navbar contains all public links` | Navigation has all public links |
| `login button links to /dashboard` | Login CTA correct |
| `profil shows school info` | Profile page has school name |
| `guru shows list of guru` | Guru page has title |
| `ppdb shows PPDB info` | PPDB page has registration info |
| `kontak shows contact info` | Contact page has email |
| `footer has copyright` | Footer shows school name |
| `footer has navigation links` | Footer has links to public pages |

## Implementation Status
| Component | Status |
|-----------|--------|
| `(public)/+layout.svelte` | ✅ Done |
| `profil/+page.svelte` | ✅ Done |
| `profil/visi-misi/+page.svelte` | ✅ Done |
| `guru/+page.svelte` | ✅ Done |
| `ppdb/+page.svelte` | ✅ Done |
| `berita/+page.svelte` | ✅ Done (placeholder) |
| `berita/[slug]/+page.svelte` | ✅ Done (placeholder) |
| `fasilitas/+page.svelte` | ✅ Done |
| `kontak/+page.svelte` | ✅ Done |
| `public.service.ts` | ✅ Done |
| `public.remote.ts` | ✅ Done |
| `hooks.server.ts` | ✅ Updated |
| Unit tests | ✅ 6 tests |
| E2E tests | ✅ 20+ tests |

## Future Enhancements
- [ ] Add `berita` table for dynamic news
- [ ] Add `prestasi` table for achievements
- [ ] Add Google Maps embed to kontak page
- [ ] Add photo gallery to fasilitas page
- [ ] Add SEO sitemap generation
