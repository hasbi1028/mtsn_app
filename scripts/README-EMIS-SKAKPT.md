# EMIS GTK SKAKPT Scraper (Reusable Bulanan)

Script Playwright untuk login ke EMIS GTK (kemenag pusat), cek kelayakan
TPG **SKAKPT** (11 indikator) per PTK bersertifikasi, lalu simpan hasil ke
database SIMAD (mtsn_app) + screenshot bukti.

> ⚠️ Ini web app Kemenag PUSAT — di-SCRAPE, bukan akses langsung ke DB lokal.
> Data hasil scrape disimpan ke `local.db` SIMAD (tabel `skakpt`).

## Cara Pakai

```bash
# Cek bulan Agustus 2026 (semua 16 PTK bersertifikasi)
node scripts/emis-skakpt-scrape.mjs --bulan="Agustus 2026"

# Cek bulan lain, misal September
node scripts/emis-skakpt-scrape.mjs --bulan="September 2026"

# Cek hanya 1 PTK (untuk debug)
node scripts/emis-skakpt-scrape.mjs --bulan="Agustus 2026" --nama="ANDI RASNIA"

# Headless (tanpa buka jendela browser) — TAPI sering diblokir EMIS GTK
node scripts/emis-skakpt-scrape.mjs --bulan="Agustus 2026" --headless=true
```

## Argumen

| Argumen | Default | Keterangan |
|---------|---------|------------|
| `--bulan` | `Agustus 2026` | Nama bulan sesuai dropdown di EMIS GTK |
| `--nama` | (kosong) | Filter 1 PTK (substring nama) |
| `--headless` | `true` | `false` = buka jendela browser (lebih andal, dibutuhkan oleh EMIS GTK) |
| `--db` | `local.db` | Path database SIMAD |

> **Catatan penting:** EMIS GTK sering memblokir headless/bot. Kalau login
> gagal (`#email` tidak muncul), PAKAI `--headless=false` (browser terlihat).

## Akun & Password

Dibaca otomatis dari tabel `ptk` di `local.db`:
```sql
SELECT id, nama, user_emis, pass_emis FROM ptk
WHERE sertifikasi = 1 AND user_emis IS NOT NULL AND pass_emis IS NOT NULL;
```
Pastikan kolom `user_emis` (username EMIS) dan `pass_emis` (password) terisi
untuk semua PTK bersertifikasi.

## Output

| Output | Lokasi |
|--------|--------|
| Screenshot bukti per PTK | `output/bukti-skakpt/skakpt-<bulan>-<nama>.png` |
| JSON hasil lengkap | `output/skakpt-<bulan>-<tanggal>.json` |
| Laporan TXT (siapa belum layak + indikator merah) | `output/laporan-skakpt-<bulan>-<tanggal>.txt` |
| Data tersimpan di DB | tabel `skakpt` (kolom `status`, `detail` JSON 11 indikator) |

## 11 Indikator SKAKPT / Kelayakan TPG

1. Sertifikasi
2. NRG (Nomor Registrasi Guru)
3. Kualifikasi S1/D4
4. Verval Ijazah
5. NPK (Nomor Peserta Khusus)
6. MKG dan Golongan (sinkron SIMPEG)
7. JTM (24-40)
8. SKBK (Surat Keterangan Beban Kerja)
9. SKMT Disetujui Pengawas
10. Absensi (Alpha < 3x/bulan)
11. Status Pensiun

## Cara Baca Laporan

- `✓` = layak (11/11 hijau)
- `✗` = belum layak → laporan akan sebutkan **indikator mana** yang merah
  dan **PTK siapa** (bagian "PTK YANG BELUM LAYAK")
- `detail` di tabel `skakpt` menyimpan JSON lengkap 11 indikator per PTK
  per bulan, sehingga bisa di-tampilkan di halaman web `/skakpt`.

## Troubleshooting

- **Login gagal `#email` tidak muncul** → pakai `--headless=false`
- **`net::ERR_TIMED_OUT`** → situs lambat/rata-limit, script punya retry otomatis (2x)
- **Akun login gagal** → cek `user_emis`/`pass_emis` di local.db
- **Opsi bulan tidak ada di dropdown** → script pakai bulan default halaman
  (log akan menampilkan "Dropdown bulan tak tersedia")
