-- Migration: Approval perubahan data siswa (permintaan ubah data → disetujui admin)
CREATE TABLE IF NOT EXISTS perubahan_siswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siswa_id INTEGER NOT NULL,
  field TEXT NOT NULL,          -- kolom yang diubah (nama, nisn, nik, ayah, ibu, ...)
  nilai_lama TEXT,              -- nilai sebelum (snapshot)
  nilai_baru TEXT NOT NULL,     -- nilai yang diajukan
  status TEXT DEFAULT 'pending',-- pending / approved / rejected
  catatan TEXT,                 -- alasan/tolak
  diajukan_by TEXT DEFAULT 'siswa',
  diajukan_at TEXT DEFAULT (datetime('now','localtime')),
  disetujui_at TEXT,
  disetujui_oleh TEXT
);
CREATE INDEX IF NOT EXISTS idx_perubahan_siswa_status ON perubahan_siswa (status);
CREATE INDEX IF NOT EXISTS idx_perubahan_siswa_siswa ON perubahan_siswa (siswa_id);