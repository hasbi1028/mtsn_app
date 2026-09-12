import { query, command } from '$app/server';
import { siswaListSchema, siswaDetailSchema, siswaByUserSchema, siswaByRefSchema, perubahanSchema } from './siswa.validation';
import {
	getSiswaList, getSiswaDetail, getMyProfile, getSiswaByRefId,
	getSiswaBansos, submitPerubahan, getKartuList, getRekap
} from './siswa.service';

export const getSiswaListQ = query(siswaListSchema, async (args) => getSiswaList(args));
export const getSiswaDetailQ = query(siswaDetailSchema, async ({ id }) => getSiswaDetail(id));
export const getMyProfileQ = query(siswaByUserSchema, async ({ userId }) => getMyProfile(userId));
export const getSiswaByRefIdQ = query(siswaByRefSchema, async ({ refId }) => getSiswaByRefId(refId));
export const getSiswaBansosQ = query(siswaDetailSchema, async ({ id }) => getSiswaBansos(id));
export const getKartuListQ = query(async () => getKartuList());
export const getRekapQ = query(async () => getRekap());

export const submitPerubahanC = command(perubahanSchema, async ({ field, nilai_baru }) => {
	// TODO: get siswaId from session
	return { ok: true, pesan: 'Perubahan dikirim' };
});
