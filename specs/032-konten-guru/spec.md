# spec.md — Konten Guru (Kontributor + Moderasi)

## Module: Konten Publik oleh Guru

### User Story

As a guru, I want membuat/mengubah konten halaman publik (berita, pengumuman, agenda, galeri, prestasi, ekskul) milik saya sebagai draft, so that saya bisa berkontribusi tanpa risiko salah terbit.

**Roles:**
- `admin`/`kepsek` — kelola semua konten, publish/unpublish, hapus siapa pun
- `guru` — buat & kelola konten **miliknya** (selalu draft hingga disetujui)
- `staf`/`siswa`/`ortu` — tidak punya akses grup Konten

### Acceptance Criteria

- [x] Guru punya akses grup "Konten" di sidebar & matriks rute (`access.ts`)
- [x] Setiap konten punya `author_user_id` (pemilik) + `penulis` (nama tampil)
- [x] `create` guru dipaksa `published=false`; hanya admin/kepsek `togglePublish`
- [x] `update`/`delete` dicek kepemilikan (`canManageContent`); guru tidak bisa mengubah status terbit
- [x] Admin/kepsek bebas mengelola semua; guru hanya miliknya
- [x] Tabel menampilkan kolom Penulis, badge Draft/Terbit, filter **Konten Saya**
- [x] Tombol Publish/Edit/Hapus disembunyikan bila tidak berhak
- [x] Halaman publik hanya menampilkan konten `published=1`
- [x] Guard remote (`requireRole`) + moderasi kepemilikan di semua 6 modul

### Edge Cases

- Guru membuka URL edit konten orang lain → `update` menolak 403 (tombol juga disembunyikan)
- Konten lama (pra-migrasi) tetap tampil di publik (`published=1` diisi saat migrasi)
- `staf` tidak bisa mengakses rute Konten (redirect `?e=403`)

---

## Data Model

6 tabel terlibat — masing-masing ditambah:

| Kolom | Fungsi |
|-------|--------|
| `penulis` | Nama penulis (dari PTK/user) |
| `author_user_id` | Pemilik konten (FK logis `users.id`) |
| `published`, `published_at` | Moderasi terbit (agenda/galeri/prestasi/ekskul ditambah) |

Migrasi: `scripts/migrate-konten-author.ts` (idempotent, dengan backup pra-migrasi).

---

## Struktur

```
src/lib/config/access.ts            # + guru pada rute Konten
src/lib/config/navigation.ts        # + guru pada grup Konten
src/lib/server/konten.ts            # canManageContent, isKontributor, actorNama
src/lib/konten.ts                   # helper client-safe
src/lib/server/guard.ts             # requireRole (dipakai remote)
src/modules/{berita,pengumuman,agenda,galeri,prestasi,ekskul}/
  ├─ *.validation.ts               # + mine, published
  ├─ *.service.ts                  # + getById, getAll, create(author), togglePublish
  └─ *.remote.ts                   # moderasi + kepemilikan
src/routes/admin/{modul}/          # list: penulis/badge/filter; form: sembunyikan publish utk guru
```

## Checklist

- [x] Migration dijalankan ke `local.db`
- [x] Svelte autofixer pada komponen yang diubah
- [x] `npm run check` lulus
- [x] `npm test` lulus (136 tes)
- [x] `npm run build` lulus
