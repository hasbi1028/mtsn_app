import { query, command, form, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { requireStaff, requireRole } from '$lib/server/guard';
import {
	siswaListSchema,
	siswaDetailSchema,
	siswaByUserSchema,
	siswaByRefSchema,
	perubahanSchema,
	fotoSchema,
	fotoAdminSchema
} from './siswa.validation';
import {
	getSiswaList, getSiswaDetail, getMyProfile, getSiswaByRefId,
	getSiswaBansos, submitPerubahan, getKartuList, getRekap,
	uploadFotoSiswa, uploadFotoAdminSiswa
} from './siswa.service';
import { getUserFromSession } from '$modules/auth/auth.service';

export const getSiswaListQ = query(siswaListSchema, async (args) => {
	requireStaff();
	return getSiswaList(args);
});
export const getSiswaDetailQ = query(siswaDetailSchema, async ({ id }) => {
	requireStaff();
	return getSiswaDetail(id);
});
export const getMyProfileQ = query(siswaByUserSchema, async ({ userId }) => {
	const user = requireStaff();
	return getMyProfile(userId ?? user.userId);
});
export const getSiswaByRefIdQ = query(siswaByRefSchema, async ({ refId }) => {
	const user = requireStaff();
	return getSiswaByRefId(refId ?? user.ref_id ?? -1);
});
export const getSiswaBansosQ = query(siswaDetailSchema, async ({ id }) => {
	requireStaff();
	return getSiswaBansos(id);
});
export const getKartuListQ = query(async () => {
	requireStaff();
	return getKartuList();
});
export const getRekapQ = query(async () => {
	requireStaff();
	return getRekap();
});

export const getCurrentSiswaQ = query(async () => {
	const { cookies } = getRequestEvent();
	const token = cookies.get('session_id');
	const user = token ? getUserFromSession(token) : null;
	if (!user || user.role !== 'siswa' || !user.ref_id) return null;
	return getSiswaByRefId(user.ref_id);
});

export const submitPerubahanC = command(perubahanSchema, async ({ siswaId, field, nilai_baru }) => {
	const user = requireRole('siswa');
	if (user.ref_id !== siswaId) throw error(403, 'Anda hanya bisa mengubah data Anda sendiri.');
	return submitPerubahan(siswaId, field, nilai_baru);
});

export const uploadFoto = form(fotoSchema, async ({ foto }) => {
	const user = requireRole('siswa');
	if (!user.ref_id) return { error: 'Tidak ada data siswa terkait' };
	return uploadFotoSiswa(user.ref_id, foto);
});

export const uploadFotoAdmin = form(fotoAdminSchema, async ({ id, foto }) => {
	requireRole('admin', 'guru');
	return uploadFotoAdminSiswa(id, foto);
});
