# spec.md — 020 Remote Siswa Profil & Foto

> Migrasi Milestone A5 dari `plan-full-remote.md`. Tujuan: hapus `actions` di
> `siswa/profil/+page.server.ts`, ganti upload foto ke remote `form()` + `v.file()`,
> dan hapus endpoint `api/siswa/me/foto`.

---

## Module: Siswa Self-Service (Profil, Perubahan Data, Foto)

### User Story

As `siswa`, I want mengajukan perubahan data & mengunggah foto dari halaman profil
so that permintaan saya diproses admin tanpa server action / endpoint REST.

**Roles:** `siswa` (self-service), `admin`/`guru` (upload foto langsung)

### Acceptance Criteria

- [ ] `siswa/profil/+page.server.ts` TIDAK mengandung `export const actions`
- [ ] `siswa/profil/+page.svelte` TIDAK memanggil `fetch('/api/...')`
- [ ] Ajukan perubahan via command `submitPerubahanC` + toast Bahasa Indonesia
- [ ] Upload foto via `<form {...uploadFoto}>` (`enctype="multipart/form-data"`)
- [ ] Upload foto admin via `<form {...uploadFotoAdmin}>` dengan field `id` (hidden)
- [ ] `api/siswa/me/foto/+server.ts` dihapus (404)
- [ ] `GET /api/siswa/me/foto` → 404

### Edge Cases

- File bukan PNG/JPG/WEBP → toast error "Format tidak didukung"
- Ukuran > 2MB → toast error "Ukuran foto maksimal 2MB"
- Belum login / bukan siswa → `{ error: 'Tidak terautentikasi' }`
- Sudah ada perubahan pending untuk field yang sama → error dari service
- Admin bukan role admin/guru → `{ error: 'Akses ditolak' }`

### Out of Scope

- Perubahan alur approval (tetap di modul `approval`)

---

## Data Model

| Table | Columns Used | Relation |
|-------|--------------|----------|
| `siswa` | `id`, `foto_path`, `foto_pending`, `foto_status` | — |
| `perubahan_siswa` | `siswa_id`, `field`, `nilai_lama`, `nilai_baru`, `status` | FK → `siswa.id` |

---

## Remote Contract

```ts
// src/modules/siswa/siswa.remote.ts
export const submitPerubahanC = command(perubahanSchema, async (args) => svcSubmitPerubahan(...));

export const uploadFoto = form(fotoSchema, async ({ foto }) => {
  const user = currentUser();
  if (!user) return { error: 'Tidak terautentikasi' };
  return svcUploadFotoSiswa(user.ref_id, foto);          // status = pending
});

export const uploadFotoAdmin = form(fotoAdminSchema, async ({ id, foto }) => {
  const user = currentUser();
  if (user?.role !== 'admin' && user?.role !== 'guru') return { error: 'Akses ditolak' };
  return svcUploadFotoAdminSiswa(id, foto);               // langsung aktif
});
```

Skema (`siswa.validation.ts`):

```ts
export const fotoSchema = v.object({
  foto: v.pipe(v.file(), v.mimeType([...]), v.maxSize(2_000_000))
});
export const fotoAdminSchema = v.object({ id: v.number(), foto: /* sama */ });
```

---

## E2E Test

- `tests/e2e/siswa.spec.ts` — login siswa, buka `/siswa/profil`, ajukan perubahan,
  upload foto via `setInputFiles`, cek toast.
- `tests/e2e/full-remote.spec.ts` — guard: `api/siswa/me/foto` → 404, tidak ada `actions`.

---

## Migration Checklist

- [x] Spec ditulis
- [x] E2E ditulis
- [x] `fotoSchema` / `fotoAdminSchema` di `siswa.validation.ts`
- [x] `uploadFotoSiswa` / `uploadFotoAdminSiswa` di `siswa.service.ts`
- [x] `uploadFoto` / `uploadFotoAdmin` di `siswa.remote.ts`
- [x] Hapus `actions` di `siswa/profil/+page.server.ts`
- [x] `siswa/profil/+page.svelte` → remote form + command
- [x] `siswa/[id]/profil/+page.svelte` → `uploadFotoAdmin`
- [x] Hapus `api/siswa/me/foto/+server.ts`
- [x] `npm run check` pass
