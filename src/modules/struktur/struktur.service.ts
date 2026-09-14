/**
 * Struktur organisasi — logika bisnis (tanpa import SvelteKit).
 *
 * Tabel dibuat runtime via `ensureStrukturTables()` (pola sama dengan modul pengaturan,
 * spec 028) supaya aman untuk DB lama tanpa menjalankan migrasi terpisah.
 */
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import {
	hitungRekap,
	susunBagan,
	type AnggotaRow,
	type BaganKolom,
	type Rekap,
	type UnitRow
} from './struktur-bagan.util';

export interface PengaturanBagan {
	judul: string;
	tahun: string;
	sk: string;
	kop: string;
	badge: string;
	kamadNama: string;
	kamadNip: string;
	tempatTgl: string;
	catatanKaki: string;
	tampilNip: boolean;
	publikAktif: boolean;
}

export const DEFAULT_BAGAN: PengaturanBagan = {
	judul: 'STRUKTUR ORGANISASI',
	tahun: '2026/2027',
	sk: '',
	kop: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
	badge: '',
	kamadNama: '',
	kamadNip: '',
	tempatTgl: '',
	catatanKaki: '',
	tampilNip: false,
	publikAktif: true
};

const KODE_VALID = /^[a-z0-9][a-z0-9-]*$/;

let ensured = false;

/** Buat tabel struktur bila belum ada (idempoten, aman dipanggil berulang). */
export function ensureStrukturTables() {
	if (ensured) return;
	db.run(sql`
		CREATE TABLE IF NOT EXISTS struktur_unit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			kode TEXT NOT NULL UNIQUE,
			nama TEXT NOT NULL,
			tipe TEXT NOT NULL DEFAULT 'unit',
			kelompok TEXT,
			parent_kode TEXT,
			kolom INTEGER NOT NULL DEFAULT 1,
			urutan INTEGER NOT NULL DEFAULT 0,
			tampil_bagan INTEGER NOT NULL DEFAULT 1,
			aktif INTEGER NOT NULL DEFAULT 1,
			catatan TEXT,
			created_at TEXT DEFAULT (datetime('now','localtime')),
			updated_at TEXT DEFAULT (datetime('now','localtime'))
		)
	`);
	db.run(sql`
	CREATE TABLE IF NOT EXISTS struktur_anggota (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		unit_kode TEXT NOT NULL,
		ptk_id INTEGER,
		nama_manual TEXT,
		nip_manual TEXT,
		gelar TEXT,
		jabatan_tampil TEXT,
		keterangan TEXT,
		kepala INTEGER NOT NULL DEFAULT 0,
		urutan INTEGER NOT NULL DEFAULT 0,
		tampil_bagan INTEGER NOT NULL DEFAULT 1,
		aktif INTEGER NOT NULL DEFAULT 1,
		created_at TEXT DEFAULT (datetime('now','localtime')),
		updated_at TEXT DEFAULT (datetime('now','localtime'))
	)
	`);
	// Migrasi ringan untuk DB yang tabelnya sudah ada sebelum kolom `kepala`.
	try {
		db.run(sql`ALTER TABLE struktur_anggota ADD COLUMN kepala INTEGER NOT NULL DEFAULT 0`);
	} catch {
		/* kolom sudah ada */
	}
	db.run(sql`CREATE INDEX IF NOT EXISTS idx_struktur_anggota_unit ON struktur_anggota(unit_kode)`);
	db.run(sql`CREATE INDEX IF NOT EXISTS idx_struktur_anggota_ptk ON struktur_anggota(ptk_id)`);
	ensured = true;
}

/* ── Baca ────────────────────────────────────────────────── */

export function getStrukturTree(): { units: UnitRow[]; anggota: AnggotaRow[] } {
	ensureStrukturTables();
	const units = db.all(sql`
		SELECT kode, nama, tipe, kelompok, catatan,
		       parent_kode AS parentKode, kolom, urutan,
		       tampil_bagan AS tampilBagan, aktif
		FROM struktur_unit
		ORDER BY kolom, urutan, nama
	`) as UnitRow[];

	const anggota = db.all(sql`
		SELECT a.id, a.unit_kode AS unitKode, a.ptk_id AS ptkId,
		       a.nama_manual AS namaManual, a.nip_manual AS nipManual, a.gelar,
		       a.jabatan_tampil AS jabatanTampil, a.keterangan,
		       a.urutan, a.tampil_bagan AS tampilBagan, a.aktif, a.kepala,
		       p.nama AS namaPtk, p.nip AS nipPtk, p.public_id AS publicId,
		       p.foto_path AS fotoPtk
		FROM struktur_anggota a
		LEFT JOIN ptk p ON p.id = a.ptk_id
		ORDER BY a.unit_kode, a.urutan
	`) as AnggotaRow[];

	return { units, anggota };
}

export function jumlahRombel(): number {
	try {
		const rows = db.all(sql`SELECT COUNT(*) AS c FROM rombel`) as { c: number }[];
		return rows[0]?.c ?? 0;
	} catch {
		return 0;
	}
}

export function getRekapStruktur(): Rekap {
	const { units, anggota } = getStrukturTree();
	const rekap = hitungRekap(units, anggota, jumlahRombel());
	const kamad = anggota.find((a) => a.unitKode === 'kamad' && a.aktif === 1);
	const hasil: Rekap & { badge?: number } = { ...rekap };
	hasil.badge = rekap.anggotaAktif;
	if (kamad) hasil.pegawaiUnik = rekap.pegawaiUnik;
	return hasil;
}

export function getPengaturanBagan(): PengaturanBagan {
	let map: Record<string, string> = {};
	try {
		const rows = db.all(sql`SELECT key, value FROM pengaturan`) as {
			key: string;
			value: string | null;
		}[];
		for (const r of rows) if (r.value != null) map[r.key] = r.value;
	} catch {
		map = {};
	}
	const bool = (key: string, def: boolean) => {
		const v = map[key];
		if (v == null || v === '') return def;
		return v === '1' || v === 'true';
	};
	return {
		judul: map.struktur_judul || DEFAULT_BAGAN.judul,
		tahun: map.struktur_tahun || DEFAULT_BAGAN.tahun,
		sk: map.struktur_sk || DEFAULT_BAGAN.sk,
		kop: map.struktur_kop || DEFAULT_BAGAN.kop,
		badge: map.struktur_badge || '',
		kamadNama: map.struktur_kamad_nama || DEFAULT_BAGAN.kamadNama,
		kamadNip: map.struktur_kamad_nip || DEFAULT_BAGAN.kamadNip,
		tempatTgl: map.struktur_tempat_tgl || DEFAULT_BAGAN.tempatTgl,
		catatanKaki: map.struktur_catatan_kaki || DEFAULT_BAGAN.catatanKaki,
		tampilNip: bool('struktur_tampil_nip', DEFAULT_BAGAN.tampilNip),
		publikAktif: bool('struktur_publik_aktif', DEFAULT_BAGAN.publikAktif)
	};
}

export function simpanPengaturanBagan(values: Record<string, string>): { ok: true; pesan: string } {
	ensureStrukturTables();
	for (const [key, value] of Object.entries(values)) {
		db.run(sql`
			INSERT INTO pengaturan (key, value, updated_at)
			VALUES (${key}, ${value}, datetime('now','localtime'))
			ON CONFLICT(key) DO UPDATE SET value = ${value}, updated_at = datetime('now','localtime')
		`);
	}
	return { ok: true, pesan: 'Pengaturan bagan disimpan.' };
}

/** Data siap tayang untuk halaman admin/publik/cetak. */
export function getBagan(opts: { publik?: boolean } = {}) {
	const publik = opts.publik === true;
	const pengaturan = getPengaturanBagan();
	const { units, anggota } = getStrukturTree();
	const kolom: BaganKolom[] = susunBagan(units, anggota, { publik });
	const rekap = hitungRekap(units, anggota, jumlahRombel());
	return {
		pengaturan,
		kolom,
		rekap,
		totalAnggota: rekap.anggotaAktif,
		badge: pengaturan.badge || String(rekap.anggotaAktif)
	};
}

/** Daftar PTK ringkas untuk pilihan di form anggota. */
export function daftarPtkRingkas(): { id: number; publicId: string; nama: string; waliKelas: string | null }[] {
	try {
		return db.all(sql`
			SELECT id, public_id AS publicId, nama, wali_kelas AS waliKelas
			FROM ptk ORDER BY nama
		`) as { id: number; publicId: string; nama: string; waliKelas: string | null }[];
	} catch {
		return [];
	}
}

/* ── Unit ────────────────────────────────────────────────── */

export interface UnitInput {
	kode: string;
	nama: string;
	tipe?: string;
	kelompok?: string | null;
	parentKode?: string | null;
	kolom?: number;
	urutan?: number;
	tampilBagan?: boolean;
	catatan?: string | null;
}

export function simpanUnit(input: UnitInput): { ok: true; pesan: string } {
	ensureStrukturTables();
	const kode = (input.kode ?? '').trim().toLowerCase();
	if (!KODE_VALID.test(kode)) {
		throw new Error('Kode unit hanya huruf kecil, angka, dan tanda hubung (contoh: wakamad-kurikulum).');
	}
	const nama = (input.nama ?? '').trim();
	if (!nama) throw new Error('Nama unit wajib diisi.');

	const kolom = Number.isFinite(input.kolom) ? Number(input.kolom) : 1;
	const urutan = Number.isFinite(input.urutan) ? Number(input.urutan) : 0;
	const tampilBagan = input.tampilBagan === false ? 0 : 1;
	const tipe = (input.tipe ?? 'unit').trim() || 'unit';
	const kelompok = input.kelompok?.trim() || null;
	const parentKode = input.parentKode?.trim() || null;
	const catatan = input.catatan?.trim() || null;

	const ada = db.get(sql`SELECT kode FROM struktur_unit WHERE kode = ${kode}`) as
		| { kode: string }
		| undefined;

	if (ada) {
		db.run(sql`
			UPDATE struktur_unit SET nama = ${nama}, tipe = ${tipe}, kelompok = ${kelompok},
				parent_kode = ${parentKode}, kolom = ${kolom}, urutan = ${urutan},
				tampil_bagan = ${tampilBagan}, catatan = ${catatan},
				updated_at = datetime('now','localtime')
			WHERE kode = ${kode}
		`);
		return { ok: true, pesan: `Unit "${nama}" diperbarui.` };
	}

	db.run(sql`
		INSERT INTO struktur_unit (kode, nama, tipe, kelompok, parent_kode, kolom, urutan, tampil_bagan, catatan)
		VALUES (${kode}, ${nama}, ${tipe}, ${kelompok}, ${parentKode}, ${kolom}, ${urutan}, ${tampilBagan}, ${catatan})
	`);
	return { ok: true, pesan: `Unit "${nama}" ditambahkan.` };
}

export function hapusUnit(kode: string): { ok: true; pesan: string } {
	ensureStrukturTables();
	const clean = (kode ?? '').trim().toLowerCase();
	if (!clean) throw new Error('Kode unit tidak valid.');
	const rows = db.all(sql`
		SELECT COUNT(*) AS c FROM struktur_anggota WHERE unit_kode = ${clean} AND aktif = 1
	`) as { c: number }[];
	const jumlah = rows[0]?.c ?? 0;
	if (jumlah > 0) {
		throw new Error(`Unit masih punya ${jumlah} anggota aktif — pindahkan/hapus anggotanya dulu.`);
	}
	db.run(sql`DELETE FROM struktur_anggota WHERE unit_kode = ${clean}`);
	db.run(sql`DELETE FROM struktur_unit WHERE kode = ${clean}`);
	return { ok: true, pesan: 'Unit dihapus.' };
}

/* ── Anggota ─────────────────────────────────────────────── */

export interface AnggotaInput {
	id?: number;
	unitKode: string;
	ptkId?: number | null;
	namaManual?: string | null;
	nipManual?: string | null;
	gelar?: string | null;
	jabatanTampil?: string | null;
	keterangan?: string | null;
	urutan?: number;
	tampilBagan?: boolean;
	/** true = kepala unit (tampil di header kotak bagan). */
	kepala?: boolean;
}

export function simpanAnggota(input: AnggotaInput): { ok: true; pesan: string; id?: number } {
	ensureStrukturTables();
	const unitKode = (input.unitKode ?? '').trim().toLowerCase();
	if (!unitKode) throw new Error('Unit wajib dipilih.');
	const ptkId = input.ptkId && Number(input.ptkId) > 0 ? Number(input.ptkId) : null;
	const namaManual = input.namaManual?.trim() || null;
	if (!ptkId && !namaManual) {
		throw new Error('Pilih PTK atau isi nama (untuk entri luar seperti komite/tenaga pendukung).');
	}
	const gelar = input.gelar?.trim() || null;
	const jabatanTampil = input.jabatanTampil?.trim() || null;
	const keterangan = input.keterangan?.trim() || null;
	const nipManual = input.nipManual?.trim() || null;
	const urutan = Number.isFinite(input.urutan) ? Number(input.urutan) : 0;
	const tampilBagan = input.tampilBagan === false ? 0 : 1;
	const kepala = input.kepala === true ? 1 : 0;

	if (input.id) {
		const id = Number(input.id);
		db.run(sql`
			UPDATE struktur_anggota SET unit_kode = ${unitKode}, ptk_id = ${ptkId},
				nama_manual = ${namaManual}, nip_manual = ${nipManual}, gelar = ${gelar},
				jabatan_tampil = ${jabatanTampil}, keterangan = ${keterangan},
				kepala = ${kepala}, urutan = ${urutan}, tampil_bagan = ${tampilBagan},
				updated_at = datetime('now','localtime')
			WHERE id = ${id}
		`);
		return { ok: true, pesan: 'Anggota diperbarui.', id };
	}

	db.run(sql`
		INSERT INTO struktur_anggota
			(unit_kode, ptk_id, nama_manual, nip_manual, gelar, jabatan_tampil, keterangan, kepala, urutan, tampil_bagan)
		VALUES (${unitKode}, ${ptkId}, ${namaManual}, ${nipManual}, ${gelar}, ${jabatanTampil}, ${keterangan}, ${kepala}, ${urutan}, ${tampilBagan})
	`);
	return { ok: true, pesan: 'Anggota ditambahkan.' };
}

export function hapusAnggota(id: number): { ok: true; pesan: string } {
	ensureStrukturTables();
	db.run(sql`DELETE FROM struktur_anggota WHERE id = ${Number(id)}`);
	return { ok: true, pesan: 'Anggota dihapus.' };
}

export function urutkanAnggota(unitKode: string, urutan: number[]): { ok: true; pesan: string } {
	ensureStrukturTables();
	const kode = (unitKode ?? '').trim().toLowerCase();
	urutan.forEach((id, i) => {
		db.run(sql`
			UPDATE struktur_anggota SET urutan = ${i + 1}, updated_at = datetime('now','localtime')
			WHERE id = ${Number(id)} AND unit_kode = ${kode}
		`);
	});
	return { ok: true, pesan: 'Urutan disimpan.' };
}
