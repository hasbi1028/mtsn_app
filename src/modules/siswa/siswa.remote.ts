import { query, command, form, getRequestEvent } from '$app/server';
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

export const getSiswaListQ = query(siswaListSchema, async (args) => getSiswaList(args));
export const getSiswaDetailQ = query(siswaDetailSchema, async ({ id }) => getSiswaDetail(id));
export const getMyProfileQ = query(siswaByUserSchema, async ({ userId }) => getMyProfile(userId));
export const getSiswaByRefIdQ = query(siswaByRefSchema, async ({ refId }) => getSiswaByRefId(refId));
export const getSiswaBansosQ = query(siswaDetailSchema, async ({ id }) => getSiswaBansos(id));
export const getKartuListQ = query(async () => getKartuList());
export const getRekapQ = query(async () => getRekap());

export const submitPerubahanC = command(perubahanSchema, async ({ siswaId, field, nilai_baru }) => {
	return submitPerubahan(siswaId, field, nilai_baru);
});

function currentUser() {
	const { cookies } = getRequestEvent();
	const token = cookies.get('session_id');
	return token ? getUserFromSession(token) : null;
}

export const uploadFoto = form(fotoSchema, async ({ foto }) => {
	const user = currentUser();
	if (!user) return { error: 'Tidak terautentikasi' };
	if (!user.ref_id) return { error: 'Tidak ada data siswa terkait' };
	return uploadFotoSiswa(user.ref_id, foto);
});

export const uploadFotoAdmin = form(fotoAdminSchema, async ({ id, foto }) => {
	const user = currentUser();
	if (!user) return { error: 'Tidak terautentikasi' };
	if (user.role !== 'admin' && user.role !== 'guru') return { error: 'Akses ditolak' };
	return uploadFotoAdminSiswa(id, foto);
});
