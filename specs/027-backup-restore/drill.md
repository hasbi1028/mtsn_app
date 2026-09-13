# drill.md — Bukti Drill Backup & Restore (spec 027)

> Perintah: `npm run backup:drill` (`scripts/drill-backup-restore.ts`)
> Sandbox: `data/drill/<stamp>/` — memakai **salinan** `local.db` + `static/uploads` produksi.
> **Data produksi tidak disentuh** oleh drill ini.

## Hasil eksekusi — 13 Sep 2026, 12:21:42 WITA

```
🧪 Sandbox drill: C:\Users\LENOVO\webapp\mtsn_app\data\drill\20260913-122142
   Salinan produksi: 232 siswa, 153 berkas upload
✅ 1. Backup: simad-backup-20260913-122142-ui.zip (9.9 MB, 153 berkas)
   Data sandbox dirusak: siswa 232 → 221, +1 berkas sampah
✅ 2. Restore: ok=true siswa 232/232 berkas 153/153
      · Database & folder uploads diganti dengan isi arsip.
      · Verifikasi pasca-restore lolos — jumlah baris cocok manifest.
      · Cadangan sementara (.replaced-*) dibersihkan.
✅ 3. Arsip terpotong: ok=false — "ADM-ZIP: Invalid or unsupported zip format. No END header found"
✅ 4. Rollback: ok=false rolledBack=true siswa 232/232

🎉 DRILL LULUS — semua skenario terbukti.
```

## Skenario yang dibuktikan

| # | Skenario | Perilaku yang diharapkan | Hasil nyata |
|---|---|---|---|
| 1 | `createBackup` atas salinan produksi | arsip lolos `verifyArchive`, sha256 DB & 153 berkas cocok | ✅ arsip 9,9 MB (153 berkas, 232 siswa) |
| 2 | Data dirusak (11 siswa dihapus + 5 foto dihapus + 1 berkas sampah), lalu restore | DB & uploads kembali persis seperti manifest; `-wal`/`-shm` lama hilang | ✅ siswa 221 → **232**, berkas **153/153**, berkas sampah hilang |
| 3 | Arsip terpotong 60% (korup) | **ditolak** sebelum menyentuh data | ✅ `ok=false`, "No END header found", jumlah siswa tidak berubah |
| 4 | Verifikasi pasca-swap gagal (manifest diklaim 999999 siswa) | **rollback otomatis**, data sebelum swap utuh | ✅ `ok=false`, `rolledBack=true`, siswa tetap 232 |

## Bukti pendukung (arsip produksi nyata)

```
$ npm run backup:create
✅ Backup selesai: simad-backup-20260913-121420-cron.zip
   Ukuran   : 9.9 MB
   Uploads  : 153 berkas (11 MB)
   Data     : 232 siswa · 40 PTK · 503 roster

$ npm run backup:status
Folder arsip : C:\Users\LENOVO\webapp\mtsn_app\data\backups
Jumlah arsip : 1 (9.9 MB)
   simad-backup-20260913-121420-cron.zip  9.9 MB  [cron]  153 berkas  232 siswa
```

## Cara mengulang

```bash
npm run backup:drill        # aman: selalu berjalan di sandbox data/drill/<stamp>/
```

Ringkasan JSON tiap drill tersimpan di `data/drill/<stamp>/restore/drill-result.json`.
Sandbox boleh dihapus kapan saja (`data/drill/` sudah masuk `.gitignore`).

## Catatan restore produksi

Restore ke data produksi **hanya** dijalankan saat server berhenti:

```bash
pm2 stop simad-bel mtsn-app-bff
node --import tsx scripts/restore-apply.ts        # atau: npm run backup:restore
pm2 start ecosystem.config.cjs
```

Snapshot pengaman (`simad-backup-<stamp>-pre-restore.zip`) dibuat otomatis sebelum swap;
bila verifikasi gagal, data lama dikembalikan dari `*.replaced-<stamp>` tanpa intervensi manual.
