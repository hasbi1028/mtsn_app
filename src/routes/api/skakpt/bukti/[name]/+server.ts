import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BUKTI_DIR = path.join(process.cwd(), 'output', 'bukti-skakpt');

export const GET: RequestHandler = async ({ params }) => {
	const name = params.name;
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw error(400, 'Filename tidak valid');
	}

	const filepath = path.join(BUKTI_DIR, name);
	try {
		const buf = await readFile(filepath);
		return new Response(buf, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			throw error(404, 'Bukti tidak ditemukan');
		}
		throw error(500, 'Gagal membaca file');
	}
};
