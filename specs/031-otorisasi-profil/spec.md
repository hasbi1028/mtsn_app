# spec.md — Otorisasi Role, Soft Force Password, Sidebar & Profil

## Module: Otorisasi & Profil

### User Story

As a staf madrasah, I want hanya bisa membuka halaman sesuai hak saya dan diminta (bukan dipaksa) mengganti kata sandi default, so that data aman tanpa menghambat pekerjaan.

**Roles:** `admin`, `kepsek`, `guru`, `staf`, `siswa`, `orangtua`

### Acceptance Criteria

- [x] Otorisasi rute terpusat di `src/lib/config/access.ts` (matriks prefix → role)
- [x] `hooks.server.ts` redirect ke halaman rumah + `?e=403` bila role tidak berhak
- [x] Toast "tidak punya akses" via `flash-toast.svelte`
- [x] Semua remote **write** memakai `requireRole`/`requireAdmin` (`$lib/server/guard`)
- [x] Remote **read** admin-only memakai `requireStaff`/`requireRole`; remote publik tetap terbuka
- [x] Wajib ganti sandi bersifat **soft**: bisa di-skip (banner + modal sekali per sesi)
- [x] Selama belum diganti, modul sensitif diblokir (PTK, Dokumen, Sistem) → `?e=wajib`
- [x] Sidebar module switcher diturunkan dari `navItems` + difilter role
- [x] Modul aktif sinkron dengan URL + persist `localStorage`
- [x] Item grup `semua` (Dashboard/Aktivitas/Persetujuan) selalu tampil
- [x] Halaman **Profil Saya** `/admin/profil` (identitas PTK + akun + roster)

### Edge Cases

- Role tidak dikenal → hanya rute staf yang diizinkan
- Modul terpilih tak lagi valid untuk role → kembali ke "Semua"
- Admin tanpa `ref_id` → halaman profil tampilkan info akun saja
- Remote function tidak terkena guard hooks (endpoint bukan `/admin/*`) → wajib guard di remote

### Out of Scope

- Reset password mandiri tanpa login (tidak ada gateway email/WA)
- SSO/OAuth

---

## Data Model

| Table | Columns Used |
|-------|-------------|
| `users` | `role`, `ref_id`, `must_change_password`, `last_login`, `is_active` |
| `ptk` | `id`, `nama`, `nip`, `nuptk`, `fungsi`, `jabatan_struktural`, `wali_kelas`, `foto_path` |
| `roster` | `guru_nama`, `kelas`, `hari`, `jam_ke`, `mapel` |

---

## Struktur

```
src/lib/config/access.ts            # matriks rute → role, homeFor, isSensitive
src/lib/server/guard.ts             # requireUser/requireRole/requireStaff/requireAdmin
src/lib/components/flash-toast.svelte
src/lib/components/must-change-password-banner.svelte
src/lib/components/module-switcher.svelte   # diturunkan dari navItems + role
src/lib/components/module-active.svelte.js  # persist localStorage
src/modules/profil/profil.service.ts|remote.ts
src/routes/admin/profil/+page.svelte
```

## Checklist

- [x] `npm run check` lulus
- [x] `npm test` lulus (124 tes)
- [x] `npm run build` lulus
- [x] Svelte autofixer dijalankan pada seluruh komponen yang diubah
