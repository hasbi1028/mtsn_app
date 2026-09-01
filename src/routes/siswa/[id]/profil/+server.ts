import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const API = env.API_BASE || 'http://localhost:3730';

export const POST = async ({ cookies, params, request, fetch }) => {
	const token = cookies.get('mtsn_session');
	const body = await request.formData();
	const res = await fetch(`${API}/api/siswa/${params.id}/foto`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body
	});
	const payload = await res.json().catch(() => ({ error: 'Upload foto gagal.' }));
	return json(payload, { status: res.status });
};
