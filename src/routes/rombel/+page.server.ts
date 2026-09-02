const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

	const [rombelRes, statsRes] = await Promise.all([
		fetch(`${API}/api/rombel`, { headers: h }),
		fetch(`${API}/api/rombel/stats`, { headers: h }),
	]);

	const rombels = rombelRes.ok ? (await rombelRes.json()).rombels : [];
	const stats = statsRes.ok ? await statsRes.json() : {};

	return { rombels, stats };
};