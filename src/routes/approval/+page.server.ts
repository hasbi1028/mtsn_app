import { fail } from '@sveltejs/kit';
import { getApprovalFotoList, approveFoto, rejectFoto, getApprovalPerubahanList, approvePerubahan, rejectPerubahan } from '$modules/approval/approval.service';

export const load = async () => {
	const [fotoPending, perubahanPending] = await Promise.all([getApprovalFotoList(), getApprovalPerubahanList()]);
	return { fotoPending, perubahanPending };
};

export const actions = {
	approveFoto: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id')), 10);
		const result = approveFoto(id);
		if (!result.ok) return fail(400, { ok: false, error: result.error });
		return { ok: true, pesan: result.pesan };
	},

	rejectFoto: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id')), 10);
		const result = rejectFoto(id);
		if (!result.ok) return fail(400, { ok: false, error: result.error });
		return { ok: true, pesan: result.pesan };
	},

	approvePerubahan: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id')), 10);
		const result = approvePerubahan(id, 'admin');
		if (!result.ok) return fail(400, { ok: false, error: result.error });
		return { ok: true, pesan: result.pesan };
	},

	rejectPerubahan: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id')), 10);
		const catatan = String(form.get('catatan') || '');
		const result = rejectPerubahan(id, catatan);
		return { ok: true, pesan: result.pesan };
	}
};
