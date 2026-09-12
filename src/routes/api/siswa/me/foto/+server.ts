import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { db } from '$lib/server/db';
import { siswa } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'static', 'uploads');
const FOTO_DIR = path.join(UPLOADS_DIR, 'foto_siswa', 'pending');

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'tidak terautentikasi');

	const fd = await request.formData();
	const file = fd.get('foto');
	if (!file || typeof file === 'string') throw error(400, 'Pilih file foto');

	const ext = path.extname(file.name) || '.png';
	const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
	if (!allowedTypes.includes(file.type)) {
		throw error(400, 'Format tidak didukung (hanya PNG, JPG, WEBP)');
	}

	// Get siswa id from user ref_id
	const siswaId = user.ref_id;
	if (!siswaId) throw error(400, 'Tidak ada data siswa terkait');

	// Check siswa exists
	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	if (!s) throw error(404, 'Siswa tidak ditemukan');

	// Ensure directory exists
	await mkdir(FOTO_DIR, { recursive: true });

	// Save file
	const filename = `${siswaId}${ext}`;
	const filepath = path.join(FOTO_DIR, filename);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filepath, buffer);

	// Update DB — set pending
	const relativePath = `uploads/foto_siswa/pending/${filename}`;
	db.update(siswa)
		.set({ fotoPending: relativePath, fotoStatus: 'pending' })
		.where(eq(siswa.id, siswaId))
		.run();

	return json({ ok: true, pesan: 'Foto dikirim untuk persetujuan' });
};
