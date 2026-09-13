import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { BACKUP_NAME_RE, safeJoin } from '$lib/server/backup/guards';
import { BACKUP_DIR } from '$lib/server/paths';

/**
 * Satu-satunya endpoint biner modul backup: unduh arsip.
 * Dipakai lewat <a href="/api/backup/{name}/download"> — bukan fetch().
 *
 * CATATAN: hooks.server.ts melewati seluruh path /api/* (tanpa cek auth),
 * jadi handler ini WAJIB memeriksa sendiri.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Tidak terautentikasi.');
	if (user.role !== 'admin') throw error(403, 'Hanya admin yang boleh mengunduh arsip backup.');

	const name = params.name;
	if (!BACKUP_NAME_RE.test(name)) throw error(400, 'Nama arsip tidak valid.');

	const file = safeJoin(BACKUP_DIR, name);
	if (!existsSync(file)) throw error(404, 'Arsip tidak ditemukan.');

	const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
	return new Response(stream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Length': String(statSync(file).size),
			'Content-Disposition': `attachment; filename="${name}"`,
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'no-store'
		}
	});
};
