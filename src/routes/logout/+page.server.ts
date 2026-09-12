import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ cookies }) => {
		cookies.delete('session_id', { path: '/' });
		cookies.delete('mtsn_session', { path: '/' });
		redirect(302, '/login');
	}
};
