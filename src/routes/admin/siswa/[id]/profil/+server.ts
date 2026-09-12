import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { db } from '$lib/server/db';
import { siswa } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'static', 'uploads');
const FOTO_DIR = path.join(UPLOADS_DIR, 'foto_siswa');

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'tidak terautentikasi');

	const id = Number(params.id);
	if (!id) throw error(400, 'ID tidak valid');

	const fd = await request.formData();
	const file = fd.get('foto');
	if (!file || typeof file === 'string') throw error(400, 'Pilih file foto');

	const ext = path.extname(file.name) || '.png';
	const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
	if (!allowedTypes.includes(file.type)) {
		throw error(400, 'Format tidak didukung (hanya PNG, JPG, WEBP)');
	}

	// Check siswa exists
	const s = db.select().from(siswa).where(eq(siswa.id, id)).get();
	if (!s) throw error(404, 'Siswa tidak ditemukan');

	// Ensure directory exists
	await mkdir(FOTO_DIR, { recursive: true });

	// Save file — immediately approved
	const filename = `${id}${ext}`;
	const filepath = path.join(FOTO_DIR, filename);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filepath, buffer);

	// Update DB — approved immediately
	const relativePath = `uploads/foto_siswa/${filename}`;
	db.update(siswa)
		.set({ fotoPath: relativePath, fotoStatus: 'approved', fotoPending: null })
		.where(eq(siswa.id, id))
		.run();

	return json({ ok: true, foto_path: relativePath });
};
