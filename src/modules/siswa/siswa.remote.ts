import { query, command } from '$app/server';
import { siswaListSchema, perubahanSchema } from './siswa.validation';
import {
	getSiswaList, getSiswaDetail, getMyProfile, getSiswaByRefId,
	getSiswaBansos, submitPerubahan, getKartuList, getRekap
} from './siswa.service';

export const getSiswaListQ = query(siswaListSchema, async (args) => getSiswaList(args));
export const getSiswaDetailQ = query(async (id: string) => getSiswaDetail(id));
export const getMyProfileQ = query(async (userId: number) => getMyProfile(userId));
export const getSiswaByRefIdQ = query(async (refId: number) => getSiswaByRefId(refId));
export const getSiswaBansosQ = query(async (id: string) => getSiswaBansos(id));
export const getKartuListQ = query(async () => getKartuList());
export const getRekapQ = query(async () => getRekap());

export const submitPerubahanC = command(perubahanSchema, async ({ field, nilai_baru }) => {
	// TODO: get siswaId from session
	return { ok: true, pesan: 'Perubahan dikirim' };
});
