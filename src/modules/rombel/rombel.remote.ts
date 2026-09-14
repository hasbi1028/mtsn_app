import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireStaff } from '$lib/server/guard';
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

export const getRombelListQ = query(async () => {
	requireStaff();
	return svcGetList();
});
export const getRombelStatsQ = query(async () => {
	requireStaff();
	return svcGetStats();
});
export const getRombelDetailQ = query(v.string(), async (publicId) => {
	requireStaff();
	return svcGetDetail(publicId);
});

export const createRombelF = form(createRombelSchema, async (data) => {
	requireStaff();
	svcCreate(data);
	return { ok: true, pesan: 'Rombel ditambahkan' };
});

export const updateRombelC = command(v.object({ id: rombelInternalId, data: updateRombelSchema }), async ({ id, data }) => {
	requireStaff();
	svcUpdate(id, data);
	return { ok: true, pesan: 'Rombel diperbarui' };
});

export const deleteRombelC = command(rombelInternalId, async (id) => {
	requireStaff();
	return svcDelete(id);
});

export const allocateSiswaC = command(v.object({ rombelId: rombelInternalId, siswaIds: v.array(v.number()) }), async ({ rombelId, siswaIds }) => {
	requireStaff();
	return svcAllocate(rombelId, siswaIds);
});

export const removeSiswaC = command(v.object({ rombelId: rombelInternalId, siswaId: v.number() }), async ({ rombelId, siswaId }) => {
	requireStaff();
	return svcRemove(rombelId, siswaId);
});

export const setWaliKelasC = command(v.object({ rombelId: rombelInternalId, ptkId: v.pipe(v.number(), v.minValue(1)) }), async ({ rombelId, ptkId }) => {
	requireStaff();
	return svcSetWali(rombelId, ptkId);
});

export const getAvailableSiswaQ = query(async () => {
	requireStaff();
	return svcGetAvailable();
});
export const getAllPtkQ = query(async () => {
	requireStaff();
	return svcGetAllPtk();
});
