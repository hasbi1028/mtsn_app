import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getUserFromSession } from '$modules/auth/auth.service';

// Direktori file upload runtime
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'static', 'uploads');

const MIME: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.pdf': 'application/pdf',
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.m4a': 'audio/mp4',
	'.wma': 'audio/x-ms-wma',
	'.mp4': 'video/mp4'
};

/** Serve file upload runtime dari disk */
async function serveUpload(pathname: string): Promise<Response | null> {
	if (!pathname.startsWith('/uploads/')) return null;
	const rel = pathname.slice('/uploads/'.length);
	const full = path.resolve(UPLOADS_DIR, rel);
	if (!full.startsWith(UPLOADS_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
	try {
		const buf = await readFile(full);
		const ext = path.extname(full).toLowerCase();
		return new Response(new Uint8Array(buf), {
			headers: {
				'Content-Type': MIME[ext] || 'application/octet-stream',
				'Cache-Control': 'public, max-age=600'
			}
		});
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			return new Response('Not Found', { status: 404 });
		}
		return new Response('Internal Error', { status: 500 });
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// File upload runtime
	const uploaded = await serveUpload(event.url.pathname);
	if (uploaded) return uploaded;

	// Check session — support both old (mtsn_session) and new (session_id) cookies
	const token = event.cookies.get('session_id') || event.cookies.get('mtsn_session');
	const user = token ? getUserFromSession(token) : null;

	// Attach user to event.locals
	event.locals.user = user;

	// Public paths
	const pathname = event.url.pathname;
	const isPublic = pathname.startsWith('/login') || pathname.startsWith('/uploads');

	if (!event.locals.user && !isPublic) {
		redirect(302, '/login');
	}

	return resolve(event);
};
