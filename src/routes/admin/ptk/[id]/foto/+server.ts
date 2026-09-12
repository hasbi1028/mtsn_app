import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { db } from '$lib/server/db';
import { ptk } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'static', 'uploads');
const FOTO_DIR = path.join(UPLOADS_DIR, 'foto_ptk');
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'tidak terautentikasi');

	const publicId = params.id;
	const ptkRow = db.select().from(ptk).where(eq(ptk.publicId, publicId)).get();
	if (!ptkRow) throw error(404, 'PTK tidak ditemukan');

	const fd = await request.formData();
	const file = fd.get('foto');
	if (!file || typeof file === 'string') throw error(400, 'Pilih file foto');
	if (!ALLOWED.includes(file.type)) throw error(400, 'Format tidak didukung (hanya PNG, JPG, WEBP)');

	await mkdir(FOTO_DIR, { recursive: true });

	const ext = path.extname(file.name) || '.png';
	const filename = `${ptkRow.id}${ext}`;
	const filepath = path.join(FOTO_DIR, filename);
	await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

	const relativePath = `uploads/foto_ptk/${filename}`;
	db.update(ptk)
		.set({ fotoPath: relativePath })
		.where(eq(ptk.id, ptkRow.id))
		.run();

	return json({ ok: true, foto_path: relativePath });
};
