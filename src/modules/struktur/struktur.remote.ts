import { command, form, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	daftarPtkRingkas,
	getBagan,
	getPengaturanBagan,
	getStrukturTree,
	hapusAnggota,
	hapusUnit,
	simpanAnggota,
	simpanPengaturanBagan,
	simpanUnit,
	urutkanAnggota
} from './struktur.service';
import {
	anggotaFormSchema,
	idAnggotaSchema,
	kodeUnitSchema,
	pengaturanBaganSchema,
	unitFormSchema,
	urutkanSchema,
	type AnggotaFormInput,
	type PengaturanBaganInput,
	type UnitFormInput
} from './struktur.validation';

interface Aktor {
	username: string;
	role: string;
}

function userAktif(): Aktor | null {
	const { locals } = getRequestEvent();
	return (locals as unknown as { user?: Aktor }).user ?? null;
}

/** Halaman admin struktur: admin, kepsek, guru, staf boleh melihat. */
function requirePembaca(): Aktor {
	const user = userAktif();
	if (!user) throw error(401, 'Tidak terautentikasi.');
	const boleh = ['admin', 'kepsek', 'guru', 'staf'];
	if (!boleh.includes(user.role)) throw error(403, 'Tidak punya akses ke struktur organisasi.');
	return user;
}

/** Perubahan data hanya admin. */
function requireAdmin(): Aktor {
	const user = userAktif();
	if (!user) throw error(401, 'Tidak terautentikasi.');
	if (user.role !== 'admin') throw error(403, 'Hanya admin yang boleh mengubah struktur organisasi.');
	return user;
}

function pesanError(e: unknown, fallback: string): string {
	return (e as { body?: { message?: string } })?.body?.message ?? (e instanceof Error ? e.message : fallback);
}

/** Nilai FormData bisa string/number/boolean/array → jadikan string aman. */
function str(x: unknown): string {
	if (x == null) return '';
	if (Array.isArray(x)) return str(x[0]);
	return String(x);
}

/** Nilai FormData → angka aman ('' → null bila opsional). */
function num(x: unknown): number | null {
	const n = Number(str(x));
	return Number.isFinite(n) && n > 0 ? n : null;
}

const bolehUbah = query(async () => {
	const user = userAktif();
	return user?.role === 'admin';
});

export const bolehUbahStrukturQ = bolehUbah;

/* ── Read ────────────────────────────────────────────────── */

export const getStrukturQ = query(async () => {
	requirePembaca();
	return getStrukturTree();
});

export const getRekapStrukturQ = query(async () => {
	requirePembaca();
	return getBagan({ publik: false });
});

export const getDaftarPtkQ = query(async () => {
	requirePembaca();
	return daftarPtkRingkas();
});

export const getPengaturanBaganQ = query(async () => {
	requirePembaca();
	return getPengaturanBagan();
});

/** Dipakai halaman publik (tanpa login) — hanya bila admin menyalakan "publik aktif". */
export const getBaganPublikQ = query(async () => {
	const bagan = getBagan({ publik: true });
	if (!bagan.pengaturan.publikAktif) {
		return { ...bagan, kolom: [], nonaktif: true };
	}
	return { ...bagan, nonaktif: false };
});

/* ── Tulis: unit ─────────────────────────────────────────── */

/**
 * Skema dikirim apa adanya; skema di sini menerima nilai mentah FormData (string/null)
 * lalu menormalkannya, sehingga tipe boolean keluaran tidak memicu batasan tipe
 * `form()` SvelteKit (boolean wajib optional). Karena itu pengecekan tipe dilakukan
 * lewat anotasi parameter `data`.
 */
export const simpanUnitF = form(unitFormSchema as any, async (data: UnitFormInput) => {
	try {
		requireAdmin();
		const hasil = simpanUnit({
			kode: str(data.kode),
			nama: str(data.nama),
			tipe: str(data.tipe),
			kelompok: str(data.kelompok),
			parentKode: str(data.parentKode),
			kolom: Number(str(data.kolom)) || 1,
			urutan: Number(str(data.urutan)) || 0,
			tampilBagan: data.tampilBagan !== false,
			catatan: str(data.catatan)
		});
		return { ok: true as const, pesan: hasil.pesan, refresh: true };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Unit gagal disimpan.') };
	}
});

export const hapusUnitC = command(kodeUnitSchema, async (kode) => {
	try {
		requireAdmin();
		const hasil = hapusUnit(kode);
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Unit gagal dihapus.') };
	}
});

/* ── Tulis: anggota ──────────────────────────────────────── */

export const simpanAnggotaF = form(anggotaFormSchema as any, async (data: AnggotaFormInput) => {
	try {
		requireAdmin();
		const hasil = simpanAnggota({
			id: num(data.id) ?? undefined,
			unitKode: str(data.unitKode),
			ptkId: num(data.ptkId),
			namaManual: str(data.namaManual),
			nipManual: str(data.nipManual),
			gelar: str(data.gelar),
			jabatanTampil: str(data.jabatanTampil),
			keterangan: str(data.keterangan),
			urutan: Number(str(data.urutan)) || 0,
			tampilBagan: data.tampilBagan !== false,
			kepala: data.kepala === true
		});
		return { ok: true as const, pesan: hasil.pesan, id: hasil.id };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Anggota gagal disimpan.') };
	}
});

export const hapusAnggotaC = command(idAnggotaSchema, async (id) => {
	try {
		requireAdmin();
		const hasil = hapusAnggota(id);
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Anggota gagal dihapus.') };
	}
});

export const urutkanAnggotaC = command(urutkanSchema, async ({ unitKode, urutan }) => {
	try {
		requireAdmin();
		const hasil = urutkanAnggota(unitKode, urutan);
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Urutan gagal disimpan.') };
	}
});

/* ── Pengaturan bagan ────────────────────────────────────── */

export const simpanPengaturanBaganF = form(
	pengaturanBaganSchema as any,
	async (data: PengaturanBaganInput) => {
	try {
		requireAdmin();
		const values: Record<string, string> = {
			struktur_judul: str(data.struktur_judul),
			struktur_tahun: str(data.struktur_tahun),
			struktur_sk: str(data.struktur_sk),
			struktur_kop: str(data.struktur_kop),
			struktur_badge: str(data.struktur_badge),
			struktur_kamad_nama: str(data.struktur_kamad_nama),
			struktur_kamad_nip: str(data.struktur_kamad_nip),
			struktur_tempat_tgl: str(data.struktur_tempat_tgl),
			struktur_tampil_nip: data.struktur_tampil_nip ? '1' : '0',
			struktur_publik_aktif: data.struktur_publik_aktif ? '1' : '0'
		};
		const hasil = simpanPengaturanBagan(values);
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Pengaturan gagal disimpan.') };
	}
});
