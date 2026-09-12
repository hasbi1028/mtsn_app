# Spec 005: Rombel (Class Groups)

## User Story
Sebagai admin, saya ingin mengelola rombel (kelas) — membuat, mengedit, mengalokasi siswa, dan menetapkan wali kelas — supaya data kelas terorganisir.

## Acceptance Criteria
1. **List rombel** — Menampilkan semua rombel dengan info jumlah siswa dan wali
2. **Detail rombel** — Melihat detail rombel beserta daftar siswa di dalamnya
3. **Create rombel** — Membuat rombel baru (nama kelas, tahun ajaran)
4. **Edit rombel** — Mengubah nama rombel
5. **Hapus rombel** — Menghapus rombel (jika tidak ada siswa)
6. **Alokasi siswa** — Memindahkan siswa ke dalam rombel
7. **Keluarkan siswa** — Mengeluarkan siswa dari rombel
8. **Set wali kelas** — Menetapkan PTK sebagai wali kelas

## API Endpoints (Go API)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/rombel | List all rombel |
| GET | /api/rombel/stats | Rombel statistics |
| GET | /api/rombel/:id | Detail rombel |
| POST | /api/rombel | Create rombel |
| PUT | /api/rombel/:id | Update rombel |
| DELETE | /api/rombel/:id | Delete rombel |
| POST | /api/rombel/:id/siswa | Allocate siswa |
| DELETE | /api/rombel/:id/siswa/:sid | Remove siswa |
| POST | /api/rombel/:id/wali | Set wali kelas |

## Data Model
- `rombel` table: id, nama_kelas, tingkat, tahun_ajaran, wali_ptk_id
- `siswa` table: rombel_id (foreign key)
- `ptk` table: id (for wali kelas)

## Remote Functions
- `getRombelList()` — Query all rombel with stats
- `getRombelDetail(id)` — Query single rombel with siswa list
- `createRombel(data)` — Form mutation
- `updateRombel(id, data)` — Command mutation
- `deleteRombel(id)` — Command mutation
- `allocateSiswa(rombelId, siswaIds)` — Command mutation
- `removeSiswa(rombelId, siswaId)` — Command mutation
- `setWaliKelas(rombelId, ptkId)` — Command mutation
