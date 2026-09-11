import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API = process.env.API_BASE || 'http://localhost:3730';

// Direktori file upload runtime (ditulis Go API ke ../static/uploads dari cwd backend).
// File ini TIDAK ikut di-copy ke build SvelteKit, jadi harus diserve manual dari disk.
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

/** Serve file upload runtime dari disk (fallback: null → lanjut ke router SvelteKit). */
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

async function checkSession(token: string | undefined): Promise<{ username: string; role: string; ref_id: number } | null> {
	if (!token) return null;
	try {
		const res = await fetch(`${API}/api/me`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) return null;
		const j = await res.json();
		if (!j.username || !j.role) return null;
		return { username: j.username, role: j.role, ref_id: j.ref_id ?? 0 };
	} catch {
		return null;
	}
}

/** Redirect path based on user role */
function roleRedirect(role: string): string {
	switch (role) {
		case 'siswa': return '/siswa/profil';
		case 'ortu': return '/ortu/profil';
		default: return '/'; // admin, kepsek, guru, staf → dashboard
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// File upload runtime (foto siswa, PDF SKAKPT, suara bel, dll.) diserve dari disk dulu.
	const uploaded = await serveUpload(event.url.pathname);
	if (uploaded) return uploaded;

	const token = event.cookies.get('mtsn_session');
	const user = await checkSession(token);
	event.locals.user = user;

	const path = event.url.pathname;
	const isPublic = path.startsWith('/login') || path.startsWith('/test-ui') || path.startsWith('/api/') || path.startsWith('/uploads');

	if (!event.locals.user && !isPublic) {
		redirect(302, '/login');
	}

	return resolve(event);
};
