import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SKAKPT_DIR = path.join(process.cwd(), 'static', 'uploads', 'skakpt');

export const GET: RequestHandler = async ({ params }) => {
	const name = params.name;
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw error(400, 'Filename tidak valid');
	}

	const filepath = path.join(SKAKPT_DIR, name);
	try {
		const buf = await readFile(filepath);
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${name}"`,
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			throw error(404, 'Dokumen tidak ditemukan');
		}
		throw error(500, 'Gagal membaca file');
	}
};
