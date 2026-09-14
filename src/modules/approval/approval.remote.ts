import { query, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import {
	getApprovalFotoList, approveFoto, rejectFoto,
	getApprovalPerubahanList, approvePerubahan, rejectPerubahan
} from './approval.service';

const APPROVAL_ROLES = ['admin', 'kepsek', 'staf'];

export const getApprovalFotoListQ = query(async () => {
	requireRole(...APPROVAL_ROLES);
	return getApprovalFotoList();
});
export const getApprovalPerubahanListQ = query(async () => {
	requireRole(...APPROVAL_ROLES);
	return getApprovalPerubahanList();
});

export const approveFotoC = command(v.number(), async (id) => {
	requireRole(...APPROVAL_ROLES);
	return approveFoto(id);
});
export const rejectFotoC = command(v.number(), async (id) => {
	requireRole(...APPROVAL_ROLES);
	return rejectFoto(id);
});
export const approvePerubahanC = command(v.number(), async (id) => {
	const user = requireRole(...APPROVAL_ROLES);
	return approvePerubahan(id, user.username || 'admin');
});
export const rejectPerubahanC = command(v.object({ id: v.number(), catatan: v.optional(v.string(), '') }), async ({ id, catatan }) => {
	requireRole(...APPROVAL_ROLES);
	return rejectPerubahan(id, catatan);
});
