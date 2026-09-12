import { query, form, command } from '$app/server';
import * as v from 'valibot';
import {
	getApprovalFotoList, approveFoto, rejectFoto,
	getApprovalPerubahanList, approvePerubahan, rejectPerubahan
} from './approval.service';
import { getRequestEvent } from '$app/server';

export const getApprovalFotoListQ = query(async () => getApprovalFotoList());
export const getApprovalPerubahanListQ = query(async () => getApprovalPerubahanList());

export const approveFotoC = command(v.number(), async (id) => approveFoto(id));
export const rejectFotoC = command(v.number(), async (id) => rejectFoto(id));
export const approvePerubahanC = command(v.number(), async (id) => {
	const { locals } = getRequestEvent();
	const user = (locals as any).user;
	return approvePerubahan(id, user?.username || 'admin');
});
export const rejectPerubahanC = command(v.object({ id: v.number(), catatan: v.optional(v.string(), '') }), async ({ id, catatan }) => {
	return rejectPerubahan(id, catatan);
});
