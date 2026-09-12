import { db } from '$lib/server/db';
import { siswa, perubahanSiswa, ortu, siswaOrtu, users } from '$lib/server/db/schema';
import { eq, or, like, sql, count, and, isNull } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { SiswaListInput } from './siswa.validation';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'static', 'uploads');
const FOTO_PENDING_DIR = path.join(UPLOADS_DIR, 'foto_siswa', 'pending');
const FOTO_ACTIVE_DIR = path.join(UPLOADS_DIR, 'foto_siswa');
const ALLOWED_FOTO = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const MAGIC_BYTES: Record<string, number[][]> = {
	'image/png': [[0x89, 0x50, 0x4E, 0x47]],
	'image/jpeg': [[0xFF, 0xD8, 0xFF]],
	'image/jpg': [[0xFF, 0xD8, 0xFF]],
	'image/webp': [[0x52, 0x49, 0x46, 0x46]]
};

async function validateMagicBytes(file: File, expectedType: string): Promise<boolean> {
	const buffer = Buffer.from(await file.arrayBuffer());
	const signatures = MAGIC_BYTES[expectedType];
	if (!signatures) return true;

	return signatures.some((sig) => {
		if (buffer.length < sig.length) return false;
		return sig.every((byte, i) => buffer[i] === byte);
	});
}

/**
 * Siswa service — pure business logic
 */

// ============================================
// LIST SISWA
// ============================================

export function getSiswaList(args: SiswaListInput) {
	const { q, kelas, nisn, ortu: ortuFilter, rombel, status, page, perPage } = args;
	const offset = (page - 1) * perPage;

	const conditions = [];

	if (q) {
		conditions.push(
			or(
				like(siswa.nama, `%${q}%`),
				like(siswa.nis, `%${q}%`),
				like(siswa.nisn, `%${q}%`)
			)
		);
	}
	if (kelas) conditions.push(eq(siswa.kelas, kelas));
	if (nisn) conditions.push(eq(siswa.nisn, nisn));
	if (rombel) conditions.push(eq(siswa.rombel, rombel));
	if (status === 'tanpa_rombel') {
		conditions.push(sql`(${siswa.rombel} IS NULL OR ${siswa.rombel} = '')`);
	} else if (status === 'aktif') {
		conditions.push(sql`${siswa.statusEmis} = 'AKTIF'`);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const totalResult = db
		.select({ count: count() })
		.from(siswa)
		.where(whereClause)
		.get();

	const rows = db
		.select()
		.from(siswa)
		.where(whereClause)
		.limit(perPage)
		.offset(offset)
		.all();

	return {
		rows,
		total: totalResult?.count ?? 0,
		page,
		perPage
	};
}

// ============================================
// DETAIL SISWA
// ============================================

export function getSiswaDetail(publicId: string) {
	return db.select().from(siswa).where(eq(siswa.publicId, publicId)).get() ?? null;
}

// ============================================
// MY PROFILE (siswa self-service)
// ============================================

export function getMyProfile(userId: number) {
	const user = db
		.select({ refId: users.refId })
		.from(users)
		.where(eq(users.id, userId))
		.get();

	if (!user?.refId) return null;

	return db.select().from(siswa).where(eq(siswa.id, user.refId)).get() ?? null;
}

// ============================================
// SISWA ME (from session)
// ============================================

export function getSiswaByRefId(refId: number) {
	return db.select().from(siswa).where(eq(siswa.id, refId)).get() ?? null;
}

// ============================================
// BANSOS DETAIL
// ============================================

export function getSiswaBansos(publicId: string) {
	const s = db.select().from(siswa).where(eq(siswa.publicId, publicId)).get();
	if (!s) return null;

	// Interpret bansos data
	const bansos = {
		desil: s.bansosDesil,
		pkh: s.bansosPkh === 'LAYAK',
		sembako: s.bansosSembako === 'AKTIF',
		pbijk: s.bansosPbijk === 'LAYAK',
		kpd: s.bansosKpd,
		cekAt: s.bansosCekAt
	};

	return { ...s, bansosInterpretasi: bansos };
}

// ============================================
// SUBMIT PERUBAHAN
// ============================================

export function submitPerubahan(siswaId: number, field: string, nilaiBaru: string) {
	// Check for existing pending request
	const existing = db
		.select()
		.from(perubahanSiswa)
		.where(
			and(
				eq(perubahanSiswa.siswaId, siswaId),
				eq(perubahanSiswa.field, field),
				eq(perubahanSiswa.status, 'pending')
			)
		)
		.get();

	if (existing) {
		return { error: 'Sudah ada permintaan perubahan yang pending untuk field ini' };
	}

	// Get current value
	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	if (!s) {
		return { error: 'Siswa tidak ditemukan' };
	}

	const nilaiLama = String(s[field as keyof typeof s] ?? '');

	// Insert perubahan
	db.insert(perubahanSiswa)
		.values({
			siswaId,
			field,
			nilaiLama,
			nilaiBaru,
			status: 'pending',
			diajukanBy: 'siswa'
		})
		.run();

	return { success: true };
}

// ============================================
// UPLOAD FOTO SISWA
// ============================================

async function simpanFoto(siswaId: number, file: File, dir: string, relPrefix: string) {
	if (!ALLOWED_FOTO.includes(file.type)) {
		return { error: 'Format tidak didukung (hanya PNG, JPG, WEBP)' };
	}

	const magicValid = await validateMagicBytes(file, file.type);
	if (!magicValid) {
		return { error: 'File tidak valid — format tidak sesuai' };
	}

	const ext = path.extname(file.name) || '.png';
	await mkdir(dir, { recursive: true });
	const filename = `${siswaId}${ext}`;
	await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
	return { filename, relativePath: `${relPrefix}/${filename}` };
}

/** Self-service: simpan sebagai pending, tunggu approval admin */
export async function uploadFotoSiswa(siswaId: number, file: File) {
	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	if (!s) return { error: 'Siswa tidak ditemukan' };

	const saved = await simpanFoto(siswaId, file, FOTO_PENDING_DIR, 'uploads/foto_siswa/pending');
	if ('error' in saved) return saved;

	db.update(siswa)
		.set({ fotoPending: saved.relativePath, fotoStatus: 'pending' })
		.where(eq(siswa.id, siswaId))
		.run();

	return { success: true, pesan: 'Foto dikirim untuk persetujuan' };
}

/** Admin/kepsek: langsung aktifkan foto */
export async function uploadFotoAdminSiswa(siswaId: number, file: File) {
	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	if (!s) return { error: 'Siswa tidak ditemukan' };

	const saved = await simpanFoto(siswaId, file, FOTO_ACTIVE_DIR, 'uploads/foto_siswa');
	if ('error' in saved) return saved;

	db.update(siswa)
		.set({ fotoPath: saved.relativePath, fotoPending: null, fotoStatus: 'approved' })
		.where(eq(siswa.id, siswaId))
		.run();

	return { success: true, pesan: 'Foto siswa berhasil diperbarui' };
}

// ============================================
// KARTU LIST
// ============================================

export function getKartuList() {
	return db
		.select({
			id: siswa.id,
			nama: siswa.nama,
			nis: siswa.nis,
			nisn: siswa.nisn,
			kelas: siswa.kelas,
			rombel: siswa.rombel,
			fotoPath: siswa.fotoPath
		})
		.from(siswa)
		.where(
			and(
				or(eq(siswa.statusEmis, 'AKTIF'), eq(siswa.statusEmis, 'Aktif'), isNull(siswa.statusEmis)),
				sql`${siswa.fotoPath} IS NOT NULL AND ${siswa.fotoPath} != ''`
			)
		)
		.all();
}

// ============================================
// REKAP (Class Summary)
// ============================================

export function getRekap() {
	const rows = db
		.select({
			kelas: siswa.kelas,
			jk: siswa.jk,
			count: count()
		})
		.from(siswa)
		.groupBy(siswa.kelas, siswa.jk)
		.all();

	// Group by kelas
	const kelasMap: Record<string, { kelas: string; total: number; l: number; p: number }> = {};
	for (const row of rows) {
		const k = row.kelas || 'Tanpa Kelas';
		if (!kelasMap[k]) {
			kelasMap[k] = { kelas: k, total: 0, l: 0, p: 0 };
		}
		kelasMap[k].total += row.count;
		if (row.jk === 'L') kelasMap[k].l += row.count;
		if (row.jk === 'P') kelasMap[k].p += row.count;
	}

	return Object.values(kelasMap).sort((a, b) => a.kelas.localeCompare(b.kelas));
}

// ============================================
// ORTU INFO
// ============================================

export function getOrtuInfo(refId: number) {
	const siswaRecord = db.select().from(siswa).where(eq(siswa.id, refId)).get();
	if (!siswaRecord) return null;

	// Get ortu via siswa_ortu relation
	const ortuList = db
		.select({
			nama: ortu.nama,
			nik: ortu.nik,
			noHp: ortu.noHp,
			pekerjaan: ortu.pekerjaan
		})
		.from(siswaOrtu)
		.innerJoin(ortu, eq(siswaOrtu.ortuId, ortu.id))
		.where(eq(siswaOrtu.siswaId, refId))
		.all();

	return { siswa: siswaRecord, ortu: ortuList };
}
