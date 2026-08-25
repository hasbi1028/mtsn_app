import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get('mtsn_session');
		if (token) {
			await fetch(`${API}/api/logout`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			}).catch(() => {});
		}
		cookies.delete('mtsn_session', { path: '/' });
		redirect(302, '/login');
	}
};
