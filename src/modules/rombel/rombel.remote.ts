import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { createRombelSchema, updateRombelSchema } from './rombel.validation';
import {
	getRombelList as svcGetList,
	getRombelStats as svcGetStats,
	getRombelDetail as svcGetDetail,
	createRombel as svcCreate,
	updateRombel as svcUpdate,
	deleteRombel as svcDelete,
	allocateSiswa as svcAllocate,
	removeSiswa as svcRemove,
	setWaliKelas as svcSetWali,
	getAvailableSiswa as svcGetAvailable,
	getAllPtk as svcGetAllPtk
} from './rombel.service';

const rombelInternalId = v.pipe(v.number(), v.minValue(1));

export const getRombelListQ = query(async () => svcGetList());
export const getRombelStatsQ = query(async () => svcGetStats());
export const getRombelDetailQ = query(v.string(), async (publicId) => svcGetDetail(publicId));

export const createRombelF = form(createRombelSchema, async (data) => {
	svcCreate(data);
	return { ok: true, pesan: 'Rombel ditambahkan' };
});

export const updateRombelC = command(v.object({ id: rombelInternalId, data: updateRombelSchema }), async ({ id, data }) => {
	svcUpdate(id, data);
	return { ok: true, pesan: 'Rombel diperbarui' };
});

export const deleteRombelC = command(rombelInternalId, async (id) => svcDelete(id));

export const allocateSiswaC = command(v.object({ rombelId: rombelInternalId, siswaIds: v.array(v.number()) }), async ({ rombelId, siswaIds }) => {
	return svcAllocate(rombelId, siswaIds);
});

export const removeSiswaC = command(v.object({ rombelId: rombelInternalId, siswaId: v.number() }), async ({ rombelId, siswaId }) => {
	return svcRemove(rombelId, siswaId);
});

export const setWaliKelasC = command(v.object({ rombelId: rombelInternalId, ptkId: v.pipe(v.number(), v.minValue(1)) }), async ({ rombelId, ptkId }) => {
	return svcSetWali(rombelId, ptkId);
});

export const getAvailableSiswaQ = query(async () => svcGetAvailable());
export const getAllPtkQ = query(async () => svcGetAllPtk());
