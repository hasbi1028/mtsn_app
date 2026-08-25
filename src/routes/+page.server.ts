const API = process.env.API_BASE || 'http://localhost:3730';

async function get(path: string) {
	const res = await fetch(`${API}${path}`);
	if (!res.ok) return null;
	return res.json();
}

export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const [stats] = await Promise.all([
		fetch(`${API}/api/stats`, { headers: h }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
	]);
	return { user: { username: 'hasbi' }, stats };
};
