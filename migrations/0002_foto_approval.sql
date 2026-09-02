-- Migration: Approval foto siswa
-- Menambah kolom untuk foto menunggu persetujuan admin
ALTER TABLE siswa ADD COLUMN foto_pending TEXT;
ALTER TABLE siswa ADD COLUMN foto_status TEXT DEFAULT 'approved';

-- Foto yang sudah ada dianggap approved
UPDATE siswa SET foto_status = 'approved' WHERE foto_path IS NOT NULL AND foto_path != '';