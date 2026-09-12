import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const FIELD_LABELS: Record<string, string> = {
	nama: 'Nama', nik: 'NIK', nisn: 'NISN', nis: 'NIS',
	jk: 'Jenis Kelamin', ayah: 'Nama Ayah', ibu: 'Nama Ibu',
	kerja_ayah: 'Pekerjaan Ayah', kerja_ibu: 'Pekerjaan Ibu',
	tempat_lahir: 'Tempat Lahir', tgl_lahir: 'Tanggal Lahir',
	alamat: 'Alamat', no_hp: 'No HP', kip_pip: 'KIP/PIP'
};

export function getApprovalFotoList() {
	return db.all(sql`
		SELECT id, nama, nisn, kelas, rombel, foto_pending, foto_path
		FROM siswa
		WHERE foto_status='pending' AND foto_pending IS NOT NULL AND foto_pending != ''
		ORDER BY nama
	`);
}

export function approveFoto(id: number) {
	const rows = db.all(sql`SELECT foto_pending, foto_path FROM siswa WHERE id=${id}`);
	if (!rows.length) return { ok: false, error: 'Tidak ada foto pending' };

	const pending = (rows[0] as any).foto_pending;
	if (!pending) return { ok: false, error: 'Tidak ada foto pending' };

	const ext = path.extname(pending);
	const baseDir = path.join('static', 'uploads', 'foto_siswa');
	const oldPath = path.join('static', pending);
	const newPath = path.join(baseDir, `${id}${ext}`);

	try {
		if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
	} catch {}

	const newRel = `uploads/foto_siswa/${id}${ext}`;
	db.run(sql`UPDATE siswa SET foto_path=${newRel}, foto_pending='', foto_status='approved', updated_at=datetime('now','localtime') WHERE id=${id}`);
	return { ok: true, pesan: 'Foto disetujui' };
}

export function rejectFoto(id: number) {
	const rows = db.all(sql`SELECT foto_pending FROM siswa WHERE id=${id}`);
	if (!rows.length) return { ok: false, error: 'Tidak ada foto pending' };

	const pending = (rows[0] as any).foto_pending;
	if (pending) {
		try { fs.unlinkSync(path.join('static', pending)); } catch {}
	}

	db.run(sql`UPDATE siswa SET foto_pending='', foto_status='rejected' WHERE id=${id}`);
	return { ok: true, pesan: 'Foto ditolak' };
}

export function getApprovalPerubahanList() {
	return db.all(sql`
		SELECT p.id, p.siswa_id, s.nama, p.field, p.nilai_lama, p.nilai_baru, p.status, p.diajukan_at
		FROM perubahan_siswa p JOIN siswa s ON p.siswa_id = s.id
		WHERE p.status='pending' ORDER BY p.diajukan_at DESC
	`);
}

export function approvePerubahan(id: number, approvedBy: string) {
	const rows = db.all(sql`SELECT siswa_id, field, nilai_baru FROM perubahan_siswa WHERE id=${id} AND status='pending'`);
	if (!rows.length) return { ok: false, error: 'Permintaan tidak ditemukan atau sudah diproses' };

	const { siswa_id, field, nilai_baru } = rows[0] as any;
	const col = FIELD_LABELS[field] ? field : null;
	if (!col) return { ok: false, error: 'Field tidak valid' };

	db.run(sql`UPDATE siswa SET ${sql.identifier(col)}=${nilai_baru}, updated_at=datetime('now','localtime') WHERE id=${siswa_id}`);
	db.run(sql`UPDATE perubahan_siswa SET status='approved', disetujui_at=datetime('now','localtime'), disetujui_oleh=${approvedBy} WHERE id=${id}`);
	return { ok: true, pesan: 'Perubahan disetujui & diterapkan' };
}

export function rejectPerubahan(id: number, catatan: string) {
	db.run(sql`UPDATE perubahan_siswa SET status='rejected', catatan=${catatan} WHERE id=${id} AND status='pending'`);
	return { ok: true, pesan: 'Perubahan ditolak' };
}
