# spec.md — 015 Remote Rombel

> Migrasi A4 dari `plan-full-remote.md`. Tujuan: hapus `rombel/[id]/+page.server.ts`,
> gunakan remote function dari `rombel.remote.ts`.

---

## Module: Rombel Detail

### User Story

As admin/wali, I want kelola rombel detail via remote function so that
alokasi siswa, remove siswa, dan assign wali berjalan tanpa server action.

**Roles:** `admin`, `guru` (wali kelas)

### Acceptance Criteria

- [ ] Load rombel detail via `getRombelDetailQ(id)`
- [ ] Load available siswa via `getAvailableSiswaQ()`
- [ ] Load all PTK via `getAllPtkQ()`
- [ ] Allocate siswa via `allocateSiswaC`
- [ ] Remove siswa via `removeSiswaC`
- [ ] Assign wali via `setWaliKelasC`
- [ ] `rombel/[id]/+page.server.ts` TIDAK ada (dihapus)
- [ ] Tidak ada `use:enhance` dari `$app/forms`
- [ ] Tidak ada `action="?/..."` di form

### Edge Cases

- Rombel tidak found → tampilkan pesan "tidak ditemukan"
- Kapasitas penuh → tombol alokasi disabled
- Siswa tidak ada yang available → pesan "belum ada siswa tanpa rombel"

---

## Remote Contract

```ts
export const getRombelDetailQ = query(rombelIdSchema, async (id) => svcGetDetail(id));
export const getAvailableSiswaQ = query(async () => svcGetAvailable());
export const getAllPtkQ = query(async () => svcGetAllPtk());
export const allocateSiswaC = command(v.object({ rombelId, siswaIds }), ...);
export const removeSiswaC = command(v.object({ rombelId, siswaId }), ...);
export const setWaliKelasC = command(v.object({ rombelId, ptkId }), ...);
```

---

## E2E Test

- `tests/e2e/rombel.spec.ts` — verify rombel detail page loads
- `tests/e2e/full-remote.spec.ts` — guard: `rombel/[id]/+page.server.ts` tidak ada

---

## Migration Checklist

- [ ] Spec reviewed
- [ ] E2E ditulis → RED
- [ ] Tambah `getAvailableSiswaQ`, `getAllPtkQ` ke rombel.remote.ts
- [ ] `+page.svelte` → remote query + command
- [ ] Hapus `rombel/[id]/+page.server.ts`
- [ ] E2E GREEN
- [ ] `npm run check` pass
