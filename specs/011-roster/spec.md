# Spec 011: Roster (Jadwal Pelajaran)

## User Story
Sebagai admin, saya ingin melihat jadwal pelajaran per kelas.

## Acceptance Criteria
1. **Roster list** — Menampilkan jadwal pelajaran untuk kelas yang dipilih
2. **Filter kelas** — Memilih kelas dari dropdown
3. **Sorted by hari + jam** — Urut berdasarkan hari dan jam ke

## Data Model
- `roster` — kelas, hari, jam_ke, mapel, guru_nama
- `rombel` — nama (for kelas list)

## Remote Functions
- `getRosterList(kelas?)` — Query roster with kelas filter
