# Spec 006: Dokumen (SKMT + SKBK + SKAKPT)

## User Story
Sebagai admin, saya ingin melihat daftar SKMT, SKBK, dan SKAKPT beserta statusnya supaya saya bisa memantau proses persetujuan dokumen PTK.

## Acceptance Criteria
1. **SKMT list** — Menampilkan semua SKMT ajuan dengan status, nama PTK, instansi
2. **SKBK list** — Menampilkan semua SKBK ajuan dengan status, JTM total
3. **SKAKPT list** — Menampilkan data SKAKPT per PTK sertifikasi dengan status indikator
4. **SKAKPT filter bulan** — Filter berdasarkan bulan
5. **SKAKPT download** — Download PDF SKAKPT jika sudah terbit

## Data Model
- `skmt_ajuan` — id, ptk_id, instansi, status, nilai_pembelajaran, nilai_bimbingan
- `skbk_ajuan` — id, ptk_id, instansi, status, jtm_total
- `skakpt` — id, ptk_id, bulan, status, tgl_ajuan, detail (JSON)
- `dokumen` — id, ptk_id (count for ndok)

## Remote Functions
- `getSkmtList()` — Query all SKMT
- `getSkbkList()` — Query all SKBK
- `getSkakptMonths()` — Query distinct months
- `getSkakptList(bulan?)` — Query SKAKPT with optional month filter
