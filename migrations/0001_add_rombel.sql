-- Migration: Modul Rombel — normalisasi nama rombel + tabel master
-- Target format: "VII-A" (Kelas + hyphen + label)
-- Tanggal: 2026-09-02

-- 1) Buat tabel rombel master
CREATE TABLE IF NOT EXISTS rombel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,        -- "VII-A", "VIII-B", "IX-C"
  kelas INTEGER NOT NULL,           -- 7, 8, 9
  label TEXT NOT NULL,              -- "A", "B", "C", "D", "E"
  wali_ptk_id INTEGER,              -- FK ptk.id (wali kelas)
  kapasitas INTEGER DEFAULT 40,
  aktif INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 2) Normalisasi siswa.rombel (VIIA -> VII-A, dst)
UPDATE siswa SET rombel = 'VII-A'  WHERE rombel IN ('VIIA','VII A');
UPDATE siswa SET rombel = 'VII-B'  WHERE rombel IN ('VIIB','VII B');
UPDATE siswa SET rombel = 'VII-C'  WHERE rombel IN ('VIIC','VII C');
UPDATE siswa SET rombel = 'VII-D'  WHERE rombel IN ('VIID','VII D');
UPDATE siswa SET rombel = 'VII-E'  WHERE rombel IN ('VIIE','VII E');
UPDATE siswa SET rombel = 'VIII-A' WHERE rombel IN ('VIIIA','VIII A');
UPDATE siswa SET rombel = 'VIII-B' WHERE rombel IN ('VIIIB','VIII B');
UPDATE siswa SET rombel = 'VIII-C' WHERE rombel IN ('VIIIC','VIII C');
UPDATE siswa SET rombel = 'VIII-D' WHERE rombel IN ('VIIID','VIII D');
UPDATE siswa SET rombel = 'IX-A'   WHERE rombel IN ('IXA','IX A');
UPDATE siswa SET rombel = 'IX-B'   WHERE rombel IN ('IXB','IX B');
UPDATE siswa SET rombel = 'IX-C'   WHERE rombel IN ('IXC','IX C');

-- 3) Normalisasi ptk.wali_kelas (VII A -> VII-A, dst)
UPDATE ptk SET wali_kelas = 'VII-A'  WHERE wali_kelas LIKE 'VII A%';
UPDATE ptk SET wali_kelas = 'VII-B'  WHERE wali_kelas LIKE 'VII B%';
UPDATE ptk SET wali_kelas = 'VII-C'  WHERE wali_kelas LIKE 'VII C%';
UPDATE ptk SET wali_kelas = 'VII-D'  WHERE wali_kelas LIKE 'VII D%';
UPDATE ptk SET wali_kelas = 'VII-E'  WHERE wali_kelas LIKE 'VII E%';
UPDATE ptk SET wali_kelas = 'VIII-A' WHERE wali_kelas LIKE 'VIII A%';
UPDATE ptk SET wali_kelas = 'VIII-B' WHERE wali_kelas LIKE 'VIII B%';
UPDATE ptk SET wali_kelas = 'VIII-C' WHERE wali_kelas LIKE 'VIII C%';
UPDATE ptk SET wali_kelas = 'VIII-D' WHERE wali_kelas LIKE 'VIII D%';
UPDATE ptk SET wali_kelas = 'IX-A'   WHERE wali_kelas LIKE 'IX A%';
UPDATE ptk SET wali_kelas = 'IX-B'   WHERE wali_kelas LIKE 'IX B%';
UPDATE ptk SET wali_kelas = 'IX-C'   WHERE wali_kelas LIKE 'IX C%';

-- 4) Normalisasi roster.kelas (VIIA -> VII-A, dst)
UPDATE roster SET kelas = 'VII-A'  WHERE kelas IN ('VIIA','VII A');
UPDATE roster SET kelas = 'VII-B'  WHERE kelas IN ('VIIB','VII B');
UPDATE roster SET kelas = 'VII-C'  WHERE kelas IN ('VIIC','VII C');
UPDATE roster SET kelas = 'VII-D'  WHERE kelas IN ('VIID','VII D');
UPDATE roster SET kelas = 'VII-E'  WHERE kelas IN ('VIIE','VII E');
UPDATE roster SET kelas = 'VIII-A' WHERE kelas IN ('VIIIA','VIII A');
UPDATE roster SET kelas = 'VIII-B' WHERE kelas IN ('VIIIB','VIII B');
UPDATE roster SET kelas = 'VIII-C' WHERE kelas IN ('VIIIC','VIII C');
UPDATE roster SET kelas = 'VIII-D' WHERE kelas IN ('VIIID','VIII D');
UPDATE roster SET kelas = 'IX-A'   WHERE kelas IN ('IXA','IX A');
UPDATE roster SET kelas = 'IX-B'   WHERE kelas IN ('IXB','IX B');
UPDATE roster SET kelas = 'IX-C'   WHERE kelas IN ('IXC','IX C');

-- 5) Seed tabel rombel dari roster yang sudah ternormalisasi (12 rombel)
INSERT OR IGNORE INTO rombel (nama, kelas, label) VALUES
  ('VII-A', 7, 'A'), ('VII-B', 7, 'B'), ('VII-C', 7, 'C'),
  ('VII-D', 7, 'D'), ('VII-E', 7, 'E'),
  ('VIII-A', 8, 'A'), ('VIII-B', 8, 'B'), ('VIII-C', 8, 'C'), ('VIII-D', 8, 'D'),
  ('IX-A', 9, 'A'), ('IX-B', 9, 'B'), ('IX-C', 9, 'C');

-- 6) Sync wali_kelas dari ptk ke rombel.wali_ptk_id
UPDATE rombel SET wali_ptk_id = (
  SELECT p.id FROM ptk p WHERE p.wali_kelas = rombel.nama
);