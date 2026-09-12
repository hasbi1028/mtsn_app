# spec.md — 013 Remote Approval

> Migrasi A2 dari `plan-full-remote.md`. Tujuan: hapus `approval/+page.server.ts`
> actions, gunakan remote function dari `approval.remote.ts`.

---

## Module: Approval

### User Story

As admin, I want approve/reject foto & perubahan data siswa via remote function
so that semua aksi berjalan di server-side SvelteKit tanpa Go API.

**Roles:** `admin` (full approve/reject)

### Acceptance Criteria

- [ ] Load data via remote query: `getApprovalFotoListQ()` + `getApprovalPerubahanListQ()`
- [ ] Approve/reject via remote command: `approveFotoC`, `rejectFotoC`, `approvePerubahanC`, `rejectPerubahanC`
- [ ] Setelah aksi berhasil → toast success + auto refresh data
- [ ] `approval/+page.server.ts` TIDAK ada (dihapus)
- [ ] Tidak ada `use:enhance` dari `$app/forms`
- [ ] Tidak ada `action="?/..."` di form
- [ ] Tidak ada `fetch('/api/...')`

### Edge Cases

- Foto tidak ditemukan → command return `{ ok: false, error }` → toast error
- Perubahan sudah diproses → command return error
- Network error → toast error

### Out of Scope

- Real-time update (hanya refresh on action)

---

## Data Model

| Table | Columns | Relation |
|-------|---------|----------|
| `siswa` | `id`, `foto_pending`, `foto_path`, `foto_status` | — |
| `perubahan_siswa` | `id`, `siswa_id`, `field`, `nilai_lama`, `nilai_baru`, `status`, `catatan` | FK → `siswa.id` |

---

## Remote Contract

```ts
// queries
export const getApprovalFotoListQ = query(async () => getApprovalFotoList());
export const getApprovalPerubahanListQ = query(async () => getApprovalPerubahanList());

// commands
export const approveFotoC = command(v.number(), async (id) => approveFoto(id));
export const rejectFotoC = command(v.number(), async (id) => rejectFoto(id));
export const approvePerubahanC = command(v.number(), async (id) =>
  approvePerubahan(id, 'admin')
);
export const rejectPerubahanC = command(
  v.object({ id: v.number(), catatan: v.optional(v.string(), '') }),
  async ({ id, catatan }) => rejectPerubahan(id, catatan)
);
```

---

## E2E Test

- `tests/e2e/approval.spec.ts` — extend: approve/reject via UI tombol
- `tests/e2e/full-remote.spec.ts` — guard: `approval/+page.server.ts` tidak ada

---

## Migration Checklist

- [ ] Spec reviewed
- [ ] E2E ditulis → RED
- [ ] `+page.svelte` → remote query + command
- [ ] Hapus `approval/+page.server.ts`
- [ ] E2E GREEN
- [ ] `npm run check` pass
