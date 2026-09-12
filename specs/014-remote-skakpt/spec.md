# spec.md — 014 Remote Skakpt

> Migrasi A3 dari `plan-full-remote.md`. Tujuan: hapus `skakpt/+page.server.ts`,
> gunakan remote function dari `dokumen.remote.ts`.

---

## Module: Skakpt (SKAKPT)

### User Story

As admin, I want lihat data SKAKPT via remote function so that tidak ada
server action atau load function di `skakpt/+page.server.ts`.

**Roles:** `admin`

### Acceptance Criteria

- [ ] Load months via `getSkakptMonthsQ()`
- [ ] Load rows via `getSkakptListQ(bulan)` — bulan dari URL search params
- [ ] Switch bulan via `goto('/skakpt?bulan=...')` (sudah ada)
- [ ] Download PDF dilakukan client-side (anchor click, bukan server action)
- [ ] `skakpt/+page.server.ts` TIDAK ada (dihapus)
- [ ] Tidak ada `use:enhance` dari `$app/forms`
- [ ] Tidak ada `action="?/..."` di form
- [ ] `api/skakpt/bukti/[name]/+server.ts` TETAP ADA (static image serving)

### Edge Cases

- Bulan kosong → `getSkakptListQ(undefined)` → return latest per PTK
- Filename tidak valid → validasi client-side sebelum download

---

## Remote Contract

```ts
export const getSkakptMonthsQ = query(async () => getSkakptMonths());
export const getSkakptListQ = query(v.optional(v.string()), async (bulan) =>
  getSkakptList(bulan)
);
```

---

## E2E Test

- `tests/e2e/dokumen.spec.ts` — verify SKAKPT page loads with data
- `tests/e2e/full-remote.spec.ts` — guard: `skakpt/+page.server.ts` tidak ada

---

## Migration Checklist

- [ ] Spec reviewed
- [ ] E2E ditulis → RED
- [ ] `+page.svelte` → remote query + client-side download
- [ ] Hapus `skakpt/+page.server.ts`
- [ ] E2E GREEN
- [ ] `npm run check` pass
