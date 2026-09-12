# spec.md — 016 Remote Cetak Kartu

> Migrasi A5 dari `plan-full-remote.md`. Tujuan: hapus `siswa/[id]/kartu/+page.server.ts`,
> pastikan kartu page berjalan tanpa load function.

---

## Module: Cetak Kartu Siswa

### User Story

As admin/guru, I want cetak kartu siswa via remote function so that
preview kartu berjalan tanpa server-side load.

**Roles:** `admin`, `guru`

### Acceptance Criteria

- [ ] Load siswa detail via `getSiswaDetailQ` dari `$modules/siswa/siswa.remote`
- [ ] `siswa/[id]/kartu/+page.server.ts` TIDAK ada (dihapus)
- [ ] Tidak ada `use:enhance` dari `$app/forms`
- [ ] Tidak ada `action="?/..."` di form
- [ ] Download memakai endpoint PNG; Regenerate memakai remote (lihat `017-remote-kartu`)

### Edge Cases

- Siswa tidak ditemukan → pesan "Siswa tidak ditemukan"
- Download gagal → toast error
- Regenerate gagal → toast error

---

## Remote Contract

```ts
export const getSiswaDetailQ = query(siswaDetailSchema, async ({ id }) => getSiswaDetail(id));
```

---

## E2E Test

- `tests/e2e/kartu.spec.ts` — verify kartu page loads
- `tests/e2e/full-remote.spec.ts` — guard: `siswa/[id]/kartu/+page.server.ts` tidak ada

---

## Migration Checklist

- [ ] Spec reviewed
- [ ] E2E ditulis → RED
- [ ] Hapus `siswa/[id]/kartu/+page.server.ts`
- [ ] `+page.svelte` → pastikan pakai `$app/state` untuk params
- [ ] E2E GREEN
- [ ] `npm run check` pass
