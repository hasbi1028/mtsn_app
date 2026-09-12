# Spec 008: Bel (Bell Schedule)

## User Story
Sebagai admin, saya ingin mengelola jadwal bel sekolah — menambah, mengedit, menghapus jadwal, dan mengontrol pemutaran suara bel.

## Acceptance Criteria
1. **Status bel** — Menampilkan status bel (online/offline, mode)
2. **Jadwal hari ini** — Menampilkan jadwal bel untuk hari ini
3. **Semua jadwal** — Menampilkan semua jadwal bel
4. **CRUD jadwal** — Tambah, edit, hapus jadwal bel
5. **Toggle jadwal** — Aktifkan/nonaktifkan jadwal
6. **Play/Stop** — Putar/hentikan suara bel
7. **Master switch** — Aktifkan/nonaktifkan bel secara keseluruhan

## Data Model
- `jam_bel` — id, hari, jam, jenis, label, sound_path, repeat, aktif
- `bel_settings` — id, enabled

## Remote Functions
- `getBelJadwal()` — Query jadwal with today filter
- `getBelSuara()` — Query available sounds
- Bel worker proxy (status, play, stop, master) via external service
