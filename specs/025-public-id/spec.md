# Spec 025 — Public ID untuk Master Data

## User Story
Sebagai admin/siswa/guru, saya ingin menggunakan ID yang aman, tidak enumerable, dan user-friendly di URL sehingga data tidak bisa ditebak oleh user lain.

## Problem Statement
Saat ini semua tabel pakai `integer('id').primaryKey({ autoIncrement: true })`. URL seperti `/ptk/1`, `/siswa/5` memungkinkan:
1. **Enumeration** — user bisa akses `/ptk/2`, `/ptk/3` dst
2. **Data leakage** — terlihat berapa banyak PTK/siswa di sistem
3. **Security risk** — tidak ada authorization check di load function

## Solution
Tambah kolom `public_id TEXT UNIQUE` ke 3 tabel master data yang exposed di URL. Internal integer ID tetap dipertahankan untuk FK dan performance.

## Scope

### Tables yang perlu `public_id`
| Table | Route Pattern | Example |
|-------|--------------|---------|
| `ptk` | `/ptk/{publicId}` | `/ptk/PTK-a1b2c3d4` |
| `siswa` | `/siswa/{publicId}/profil` | `/siswa/SIS-e5f6g7h8/profil` |
| `rombel` | `/rombel/{publicId}` | `/rombel/RMB-i9j0k1l2` |

### Tables yang TIDAK perlu `public_id`
| Table | Reason |
|-------|--------|
| `users` | Auth pakai `username`, bukan ID |
| `sessions` | System table, token-based |
| `jtmSemester` | Accessed via `ptkId` FK only |
| `cuti` | Accessed via `ptkId` FK only |
| `skmtAjuan` | Accessed via `ptkId` FK only |
| `skbkAjuan` | Accessed via `ptkId` FK only |
| `skakpt` | Accessed via `ptkId` FK only |
| `dokumen` | Accessed via `ptkId` FK only |
| `roster` | No route, accessed by `guru_nama` |
| `perubahanSiswa` | Accessed via `siswaId` FK only |
| `activityLog` | Internal audit only |
| `ortu` | Accessed via `siswaOrtu` junction |
| `siswaOrtu` | Junction table |
| `jamBel` | Already uses `text('id')` |
| `belSettings` | Key-value store |
| `kartuCache` | Accessed via `siswaId` FK only |
| `schemaMigrations` | System table |

## Format `public_id`
- **Prefix + 8 random alphanumeric chars** (36 chars = a-z0-9)
- Pattern: `{PREFIX}-{random8}`
- Prefix: `PTK`, `SIS`, `RMB`
- Example: `PTK-a1b2c3d4`, `SIS-e5f6g7h8`
- URL-safe, case-sensitive, no special characters
- Entropy: 36^8 = ~2.8 triliun kombinasi (cukup untuk school app)

## Changes Required

### Phase 1: Schema + Migration

#### 1.1 Update `src/lib/server/db/schema.ts`
Tambah kolom ke 3 tabel:

```ts
// ptk table — tambah setelah id
publicId: text('public_id').unique(),

// siswa table — tambah setelah id
publicId: text('public_id').unique(),

// rombel table — tambah setelah id
publicId: text('public_id').unique(),
```

#### 1.2 Buat migration script
File: `scripts/add-public-id.ts`
- Baca semua rows dari 3 tabel
- Generate `publicId` untuk setiap row
- UPDATE table SET public_id = generated
- Tambah UNIQUE constraint

### Phase 2: ID Generator Utility

#### 2.1 Buat `src/lib/server/id.ts`
```ts
function generatePublicId(prefix: string): string
// Returns e.g. "PTK-a1b2c3d4"
// Uses crypto.randomUUID() → extract 8 chars, base36
```

### Phase 3: Service Layer Updates

#### 3.1 `src/modules/ptk/ptk.service.ts`
- `getPtkDetail(id)`: ubah dari `parseInt(id)` → `WHERE public_id = ?`
- Return `publicId` di semua response
- Internal queries tetap pakai `ptk.id` integer

#### 3.2 `src/modules/siswa/siswa.service.ts`
- `getSiswaDetail(id)`: ubah dari `parseInt(id)` → `WHERE public_id = ?`
- `getSiswaBansos(id)`: ubah dari `parseInt(id)` → `WHERE public_id = ?`
- Return `publicId` di semua response

#### 3.3 `src/modules/rombel/rombel.service.ts`
- `getRombelDetail(id)`: ubah dari `WHERE id = ?` → `WHERE public_id = ?`
- `updateRombel`, `deleteRombel`, `allocateSiswa`, `removeSiswa`, `setWaliKelas`: 
  - Input tetap `number` (internal ID) karena dipanggil dari FK
  - Atau tambah lookup: `publicId → id` di awal function

#### 3.4 `src/modules/rombel/rombel.remote.ts`
- `getRombelDetailQ`: ubah input dari `v.number()` → `v.string()`
- `updateRombelC`, `deleteRombelC`: input tetap `v.number()` (internal ID dari parent)
- `allocateSiswaC`, `removeSiswaC`, `setWaliKelasC`: input tetap `v.number()` (internal)

### Phase 4: Validation Schema Updates

#### 4.1 `src/modules/ptk/ptk.validation.ts`
```ts
// Ubah dari number ke string
ptkDetailSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty())
});
// SUDAH string — tidak perlu ubah
```

#### 4.2 `src/modules/siswa/siswa.validation.ts`
```ts
// SUDAH string — tidak perlu ubah
siswaDetailSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty())
});
```

#### 4.3 `src/modules/rombel/rombel.validation.ts`
```ts
// Ubah dari number ke string
rombelIdSchema = v.pipe(v.string(), v.nonEmpty());
```

### Phase 5: Route Pages Updates

#### 5.1 `src/routes/ptk/[id]/+page.svelte`
```ts
// BEFORE:
const p = $derived(await getPtkDetailQ({ id: params.id }));

// AFTER: (tidak berubah — params.id sekarang berisi publicId)
const p = $derived(await getPtkDetailQ({ id: params.id }));
```
- `params.id` otomatis berisi publicId dari URL
- Service layer yang convert publicId → integer id

#### 5.2 `src/routes/siswa/[id]/profil/+page.svelte`
```ts
// BEFORE:
const siswa = $derived(await getSiswaDetailQ({ id: params.id }));

// AFTER: (tidak berubah)
const siswa = $derived(await getSiswaDetailQ({ id: params.id }));
```

#### 5.3 `src/routes/siswa/[id]/bansos/+page.svelte`
```ts
// BEFORE:
const [siswa, bansosRaw] = $derived(await Promise.all([
  getSiswaDetailQ({ id: params.id }),

// AFTER: (tidak berubah)
```

#### 5.4 `src/routes/siswa/[id]/kartu/+page.svelte`
```ts
// BEFORE:
const siswaQuery = $derived(getSiswaDetailQ({ id: page.params.id ?? '' }));

// AFTER: (tidak berubah)
```

#### 5.5 `src/routes/rombel/[id]/+page.svelte`
```ts
// BEFORE:
const rombelId = $derived(Number(page.params.id));
const detailQuery = $derived(getRombelDetailQ(rombelId));

// AFTER:
const detailQuery = $derived(getRombelDetailQ(page.params.id));
// Remove Number() conversion — service now accepts publicId string
```

### Phase 6: Link Updates (ALL `href` yang pakai numeric ID)

#### 6.1 PTK list → Detail
| File | Before | After |
|------|--------|-------|
| `ptk/+page.svelte:67` | `href="/ptk/{row.id}"` | `href="/ptk/{row.publicId}"` |
| `skbk/+page.svelte:34` | `href="/ptk/{row.ptkId}"` | `href="/ptk/{ptkPublicId}"` (need join) |
| `skmt/+page.svelte:24` | `href="/ptk/{row.ptkId}"` | `href="/ptk/{ptkPublicId}"` (need join) |

#### 6.2 Siswa list → Detail
| File | Before | After |
|------|--------|-------|
| `siswa/+page.svelte:166` | `href="/siswa/{row.id}/profil"` | `href="/siswa/{row.publicId}/profil"` |
| `siswa/[id]/profil/+page.svelte:151` | `href="/siswa/{siswa.id}/bansos"` | `href="/siswa/{siswa.publicId}/bansos"` |
| `siswa/[id]/profil/+page.svelte:154` | `href="/siswa/{siswa.id}/kartu"` | `href="/siswa/{siswa.publicId}/kartu"` |
| `siswa/[id]/bansos/+page.svelte:35` | `href="/siswa/{siswa?.id}/profil"` | `href="/siswa/{siswa?.publicId}/profil"` |
| `siswa/[id]/bansos/+page.svelte:45` | `href="/siswa/{siswa?.id}/bansos/cetak"` | `href="/siswa/{siswa?.publicId}/bansos/cetak"` |
| `siswa/[id]/kartu/+page.svelte:136` | `href={resolve(\`/siswa/${siswa.id}/profil\`)}` | `href={resolve(\`/siswa/${siswa.publicId}/profil\`)}` |

#### 6.3 Rombel list → Detail
| File | Before | After |
|------|--------|-------|
| `rombel/+page.svelte:69` | `href="/rombel/{rombel.id}"` | `href="/rombel/{rombel.publicId}"` |

#### 6.4 Rombel detail → Siswa profil
| File | Before | After |
|------|--------|-------|
| `rombel/[id]/+page.svelte:143` | `href={resolve(\`/siswa/${row.id}/profil\`)}` | `href={resolve(\`/siswa/${row.publicId}/profil\`)}` |

### Phase 7: Service Response Format

Semua service yang return data perlu sertakan `publicId`:

```ts
// ptk.service.ts — getPtkList
return {
  rows: rows.map(r => ({ ...r, publicId: r.publicId })),
  total, page, perPage
};

// ptk.service.ts — getPtkDetail
return { ...p, publicId: p.publicId, jtm, skmt, skbk, skakpt, dokumen, roster };

// siswa.service.ts — getSiswaList
return { rows: rows.map(r => ({ ...r, publicId: r.publicId })), total, page, perPage };

// siswa.service.ts — getSiswaDetail
return { ...siswaRecord, publicId: siswaRecord.publicId };

// rombel.service.ts — getRombelList
// sudah return r.id — tambah r.public_id
```

### Phase 8: SKBK/SKMT List Join

`skbk/+page.svelte` dan `skmt/+page.svelte` perlu join ke `ptk` untuk dapat `public_id`:

```sql
-- skbk: SELECT ..., p.public_id as ptk_public_id FROM skbk_ajuan s 
--   LEFT JOIN ptk p ON s.ptk_id = p.id

-- skmt: SELECT ..., p.public_id as ptk_public_id FROM skmt_ajuan s 
--   LEFT JOIN ptk p ON s.ptk_id = p.id
```

### Phase 9: Tests

#### 9.1 Unit tests
- `src/lib/server/id.test.ts`: test `generatePublicId()` return format `{PREFIX}-xxxxxxxx`
- Update `validation.test.ts`: test rombelIdSchema accepts string

#### 9.2 E2E tests
- Update `tests/e2e/ptk.spec.ts`: use publicId in URLs
- Update `tests/e2e/siswa.spec.ts`: use publicId in URLs
- Update `tests/e2e/rombel.spec.ts`: use publicId in URLs
- Test: akses `/ptk/1` → 404 (tidak bisa enumerate)
- Test: akses `/ptk/PTK-xxxxxxxx` → 200 (harus pakai publicId)

## Execution Order

| Step | Task | Estimasi | Dependencies |
|------|------|----------|--------------|
| 1 | Buat `src/lib/server/id.ts` + test | 10 min | — |
| 2 | Update schema (tambah kolom) | 10 min | — |
| 3 | Buat migration script, jalankan | 15 min | Step 1, 2 |
| 4 | Update `ptk.service.ts` | 15 min | Step 3 |
| 5 | Update `siswa.service.ts` | 15 min | Step 3 |
| 6 | Update `rombel.service.ts` + remote | 15 min | Step 3 |
| 7 | Update `rombel.validation.ts` | 5 min | Step 6 |
| 8 | Update route pages (5 files) | 15 min | Step 4, 5, 6 |
| 9 | Update ALL links (13 files) | 20 min | Step 4, 5, 6, 8 |
| 10 | Update SKBK/SKMT list (join + links) | 15 min | Step 4 |
| 11 | Run `npm run check` | 2 min | All |
| 12 | Run tests | 5 min | All |
| **Total** | | **~140 min** | |

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing URLs | Old numeric URLs will 404 — acceptable, no production users yet |
| FK integrity | FK tetap pakai integer `id`, tidak berubah |
| Migration data loss | Backup `local.db` sebelum migration |
| Performance | `public_id` punya UNIQUE index — lookup tetap O(1) |
| Import EMIS | EMIS import tetap pakai integer `id` via service layer |

## Success Criteria
1. ✅ `/ptk/PTK-xxxxxxxx` bisa diakses
2. ✅ `/ptk/1` return 404
3. ✅ `/siswa/SIS-xxxxxxxx/profil` bisa diakses
4. ✅ `/rombel/RMB-xxxxxxxx` bisa diakses
5. ✅ Semua internal FK tetap integer
6. ✅ `npm run check` 0 errors
7. ✅ Semua tests pass
