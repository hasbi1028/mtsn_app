import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Proxy upload foto siswa → Go API (port 3730)
// Meneruskan raw multipart body agar file terbawa dengan benar.
const API = process.env.API_BASE || 'http://localhost:3730';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const token = cookies.get('mtsn_session');
	if (!token) throw error(401, 'tidak terautentikasi');

	const contentType = request.headers.get('content-type') || 'multipart/form-data';
	let upstreamRes: Response;
	try {
		upstreamRes = await fetch(`${API}/api/siswa/me/foto`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': contentType,
			},
			body: request.body,
			// @ts-ignore duplex required for stream body in undici
			duplex: 'half'
		});
	} catch (e) {
		throw error(502, 'gagal terhubung ke server API');
	}

	const data = await upstreamRes.json().catch(() => ({}));
	if (!upstreamRes.ok) {
		return json({ ok: false, error: data?.message || data?.error || 'Gagal upload foto' }, { status: upstreamRes.status });
	}
	return json({ ok: true, pesan: data.message || 'Foto dikirim untuk persetujuan' });
};