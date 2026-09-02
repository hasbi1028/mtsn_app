import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Proxy bukti screenshot dari Go API (port 3730) → browser via BFF (port 3720)
const API = process.env.API_BASE || 'http://localhost:3730';

export const GET: RequestHandler = async ({ params, fetch, cookies }) => {
	const token = cookies.get('mtsn_session');
	const name = params.name;
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw error(400, 'Filename tidak valid');
	}
	const res = await fetch(`${API}/api/skakpt/bukti/${encodeURIComponent(name)}`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) {
		throw error(res.status, 'Bukti tidak ditemukan');
	}
	const contentType = res.headers.get('content-type') || 'image/png';
	const body = await res.arrayBuffer();
	return new Response(body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
