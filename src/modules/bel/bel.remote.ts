import { query, form, command } from '$app/server';
import * as v from 'valibot';
import {
	getBelJadwal, getBelSuara, createBelJadwal, updateBelJadwal,
	toggleBelJadwal, deleteBelJadwal, getBelStatus, getBelSuaraFromWorker,
	playBell, stopBell, toggleMaster, uploadSuaraToWorker, deleteSuaraFromWorker
} from './bel.service';

export const getBelStatusQ = query(async () => getBelStatus());
export const getBelJadwalQ = query(async () => getBelJadwal());
export const getBelSuaraFilesQ = query(async () => getBelSuaraFromWorker());

export const playBellC = command(v.object({ file: v.string() }), async ({ file }) => {
	return playBell(file);
});

export const stopBellC = command(v.object({}), async () => {
	return stopBell();
});

export const toggleMasterC = command(v.object({ confirm: v.string(), target: v.string() }), async ({ confirm, target }) => {
	const targetStr = target === '1' ? 'AKTIF' : 'NONAKTIF';
	if (confirm.toUpperCase().trim() !== targetStr) {
		return { ok: false, error: `Ketik "${targetStr}" untuk konfirmasi.` };
	}
	return toggleMaster(target === '1');
});

export const createJadwalC = command(v.object({
	hari: v.string(), jam: v.string(), jenis: v.string(),
	label: v.string(), sound_path: v.string(), repeat: v.number()
}), async (data) => {
	createBelJadwal(data);
	return { ok: true, pesan: `Jadwal ${data.hari} ${data.jam} ditambahkan.` };
});

export const updateJadwalC = command(v.object({
	id: v.string(), hari: v.string(), jam: v.string(), jenis: v.string(),
	label: v.string(), sound_path: v.string(), repeat: v.number()
}), async ({ id, ...data }) => {
	updateBelJadwal(id, data);
	return { ok: true, pesan: `Jadwal ${data.hari} ${data.jam} diperbarui.` };
});

export const toggleJadwalC = command(v.object({ id: v.string(), aktif: v.number() }), async ({ id, aktif }) => {
	toggleBelJadwal(id, aktif);
	return { ok: true, pesan: `Jadwal ${aktif ? 'diaktifkan' : 'dinonaktifkan'}.` };
});

export const deleteJadwalC = command(v.object({ id: v.string() }), async ({ id }) => {
	deleteBelJadwal(id);
	return { ok: true, pesan: 'Jadwal dihapus.' };
});

export const uploadSuaraForm = form(v.object({ file: v.instance(File) }), async ({ file }) => {
	if (file.size > 10 << 20) {
		return { ok: false, error: 'Ukuran maksimal 10 MB.' };
	}
	const up = new FormData();
	up.append('file', file, file.name);
	try {
		const data = await uploadSuaraToWorker(up);
		if (!data.ok) {
			return { ok: false, error: data.error || 'Upload gagal.' };
		}
		void getBelSuaraFilesQ().refresh();
		return { ok: true, pesan: data.pesan || `Suara "${data.name}" terupload.` };
	} catch {
		return { ok: false, error: 'Upload gagal — coba lagi.' };
	}
});

export const deleteSuaraC = command(v.object({ name: v.string() }), async ({ name }) => {
	return deleteSuaraFromWorker(name);
});
