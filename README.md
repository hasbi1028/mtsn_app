# SIMAD — Sistem Informasi Manajemen Madrasah

**MTsN 2 Kolaka Utara** · aplikasi **produksi / aktif dipakai** (bukan deprecated).

> Catatan repo: [`mtsnsuper`](../mtsnsuper) adalah **proyek terpisah** (CBT Madrasah / Super Web App,
> SvelteKit 3) — bukan pengganti dan bukan versi baru SIMAD. SIMAD tetap dipakai dan dikembangkan.

---

## Stack

- **SvelteKit 2** + Svelte 5 (runes) + **remote functions** (`query`/`form`/`command`) — tanpa Go API
- **Drizzle ORM + SQLite** (`local.db`, mode WAL)
- TailwindCSS v4 + shadcn-svelte (nova), Lucide icons, mode-watcher
- Valibot (Standard Schema) untuk validasi
- Vitest (unit) + Playwright (e2e)
- Runtime produksi: Node + `@sveltejs/adapter-node` di **:3720**, worker bel Go (`worker-bel.exe`) di **:8093**

## Modul

Admin: dashboard, PTK, Kesiswaan (siswa, kartu siswa, rombel), Dokumen (SKMT, SKBK, SKAKPT),
Konten (berita, pengumuman, agenda, galeri, prestasi, ekskul), Jadwal (roster), Bel (monitoring +
perpustakaan suara), Aktivitas, Persetujuan, Sistem (pengaturan, backup & restore).
Publik: beranda, berita, profil, guru, kurikulum, PPDB, galeri, prestasi, ekskul, fasilitas,
kalender, kontak. Peran login: admin, kepsek, guru, staf, siswa, ortu.

## Menjalankan

```sh
bun run dev -- --port 3720     # pengembangan (WAJIB bun, bukan npm run dev)
npm run check                  # svelte-check
npx vitest run                 # unit test
npx playwright test            # e2e (butuh build)
npm run build                  # build produksi
```

Produksi (PM2):

```sh
# Linux server (MTsN 2 Kolut): config utama
pm2 start ecosystem.config.cjs && pm2 save

# Windows (dev lokal): pakai config khusus Windows
#   catatan PM2 5.x: file config HANYA dikenali bila namanya memuat literal ".config.cjs",
#   jadi `ecosystem.config.windows.cjs` tidak bisa di-start langsung — pakai
#   `pm2 restart mtsn-app-bff simad-bel` (per nama app) atau rename ke `ecosystem-windows.config.cjs`.
pm2 start mtsn-app-bff simad-bel
```

Backup & restore: halaman `/admin/backup` + `npm run backup:create|status|drill`
(restore 2 tahap lewat CLI — lihat `AGENTS.md` §Backup & Restore).

## Dokumentasi

- `AGENTS.md` — arsitektur, konvensi modul, aturan test
- `specs/NNN-nama/` — spec + test plan + MDD per modul (index: `specs/README.md`)
- `.hermes/plans/` — rencana fitur yang menunggu persetujuan
