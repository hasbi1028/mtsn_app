# spec.md — Akun Guru & Staf (Login NIP)

## Module: Akun Guru/Staf

### User Story

As a guru/staf, I want login memakai NIP saya dengan password awal yang seragam, lalu wajib menggantinya, so that akun tidak bisa dipakai orang lain dan saya bisa mengelola password sendiri.

**Roles:**
- `admin` — buat/reset/nonaktifkan/hapus akun, kelola semua user
- `guru`/`staf` — login pakai NIP, ganti password sendiri (self-service)
- `siswa`/`orangtua` — tidak terpengaruh modul ini

### Acceptance Criteria

- [x] Username akun guru/staf = **NIP** (sumber: `pegawai-backup-2026-08-28.json`)
- [x] Password awal semua akun guru/staf = `2026qwerty!`
- [x] Login pertama `must_change_password = 1` → dipaksa ganti sandi
- [x] Akun lama berbasis `guru_<id>` / `staf` dinonaktifkan
- [x] PTK tanpa NIP (non-ASN) → akun dinonaktifkan (tidak bisa login)
- [x] Pegawai di JSON yang belum ada di `ptk` → dibuat baris PTK baru (role staf)
- [x] Admin bisa reset password (kembali ke `2026qwerty!` + wajib ganti), aktif/nonaktif, hapus
- [x] Guru/staf bisa ganti password sendiri kapan saja lewat menu **Ganti Password**
- [x] Duplikat PTK: pertahankan baris ber-EMIS, nonaktifkan duplikat

### Edge Cases

- Password lama salah → error, tidak mengubah apa pun
- Password baru sama dengan lama → ditolak
- Reset password admin → semua sesi user tersebut dicabut, wajib ganti saat login berikutnya
- Nama PTK beda gelar (Drs./Dra./S.Pd/S.Ag) → dicocokkan via normalisasi nama

### Out of Scope

- Lupa password tanpa login (tidak ada email/WA gateway)
- SSO / OAuth

---

## Data Model

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `users` | `username`, `password_hash`, `role`, `ref_id`, `is_active`, `must_change_password` | `ref_id` → `ptk.id` |
| `ptk` | `id`, `nama`, `nip`, `fungsi` | — |
| `sessions` | `token`, `user_id`, `expires_at` | `user_id` → `users.id` |

---

## Domain Module Structure

```
src/modules/user/          # kelola user (admin)
├── user.validation.ts
├── user.service.ts
└── user.remote.ts
src/routes/admin/user/+page.svelte              # UI kelola akun
src/routes/admin/profil/ganti-password/+page.svelte  # self-service ganti sandi
scripts/migrate-guru-login.ts                   # impor NIP + seed akun (sekali jalan)
```

### Migration Script

```bash
node --import tsx scripts/migrate-guru-login.ts           # dry-run
node --import tsx scripts/migrate-guru-login.ts --apply   # tulis ke DB
```

---

## Migration Checklist

- [x] Kolom `users.must_change_password` (schema + runtime migration)
- [x] Script `migrate-guru-login.ts` (NIP dari JSON, akun seragam, deaktivasi lama)
- [x] Auth: redirect paksa ganti sandi + service `changePassword`
- [x] User module + halaman `/admin/user`
- [x] Halaman `/admin/profil/ganti-password` + menu self-service
- [x] `npm run check` lulus
- [x] `npm test` lulus (124 tes)
