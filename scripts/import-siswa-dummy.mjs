// Import data siswa dummy + rombel + user uji (idempoten: kosongkan tabel siswa/rombel dulu)
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
function pid(prefix) {
	const b = randomBytes(8);
	let s = '';
	for (let i = 0; i < 8; i++) s += ALPHABET[b[i] % ALPHABET.length];
	return `${prefix}-${s}`;
}
function hashPassword(pw) {
	const salt = randomBytes(16).toString('hex');
	return `${salt}:${scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')}`;
}

const db = new Database('local.db');
const siswaSeed = JSON.parse(fs.readFileSync('data/siswa.json', 'utf8')).siswa;
const plan = { 7: ['A', 'B', 'C', 'D', 'E'], 8: ['A', 'B', 'C', 'D'], 9: ['A', 'B', 'C'] };
const roman = { 7: 'VII', 8: 'VIII', 9: 'IX' };

db.exec('DELETE FROM siswa; DELETE FROM rombel;');

const insR = db.prepare('INSERT INTO rombel (public_id,nama,kelas,label,kapasitas,aktif) VALUES (?,?,?,?,40,1)');
for (const k of [7, 8, 9]) for (const l of plan[k]) insR.run(pid('RMB'), `${roman[k]}-${l}`, k, l);

const byKelas = { 7: [], 8: [], 9: [] };
for (const s of siswaSeed) { const k = Number(s.kelas); if (byKelas[k]) byKelas[k].push(s); }

const insS = db.prepare(`INSERT INTO siswa
 (public_id,nis,nisn,nama,jk,kelas,tempat_lahir,tgl_lahir,ayah,ibu,kerja_ayah,kerja_ibu,penghasilan,anak_ke,dari,asal_sekolah,alamat,rombel,bansos_pbijk,bansos_pkh,bansos_sembako,bansos_desil,bansos_cek_at,sumber_data)
 VALUES (@public_id,@nis,@nisn,@nama,@jk,@kelas,@tempat_lahir,@tgl_lahir,@ayah,@ibu,@kerja_ayah,@kerja_ibu,@penghasilan,@anak_ke,@dari,@asal_sekolah,@alamat,@rombel,@bansos_pbijk,@bansos_pkh,@bansos_sembako,@bansos_desil,@bansos_cek_at,@sumber_data)`);

let n = 0, nPbijk = 0;
for (const k of [7, 8, 9]) {
	const list = plan[k];
	byKelas[k].forEach((s, i) => {
		const pen = Number(s.penghasilan || 0);
		// Data bansos dummy diturunkan dari penghasilan (bukan data riil).
		const pbijk = pen > 0 && pen <= 1500000 ? 'YA' : 'TIDAK';
		const pkh = pen > 0 && pen <= 1200000 ? 'YA' : 'TIDAK';
		const sembako = pen > 0 && pen <= 1000000 ? 'YA' : 'TIDAK';
		const desil = pen <= 1000000 ? '1' : pen <= 2000000 ? '2' : '3';
		if (pbijk === 'YA') nPbijk++;
		insS.run({
			public_id: pid('SIS'), nis: String(s.nis ?? ''), nisn: String(s.nisn ?? ''), nama: s.nama,
			jk: s.jk ?? '', kelas: String(k), tempat_lahir: s.tempat_lahir ?? '', tgl_lahir: s.tgl_lahir ?? '',
			ayah: s.ayah ?? '', ibu: s.ibu ?? '', kerja_ayah: s.kerja_ayah ?? '', kerja_ibu: s.kerja_ibu ?? '',
			penghasilan: pen, anak_ke: Number(s.anak_ke || 0), dari: Number(s.dari || 0),
			asal_sekolah: s.asal_sekolah ?? '', alamat: s.alamat ?? '',
			rombel: `${roman[k]}-${list[i % list.length]}`,
			bansos_pbijk: pbijk, bansos_pkh: pkh, bansos_sembako: sembako, bansos_desil: desil,
			bansos_cek_at: '2026-01-01 00:00:00', sumber_data: 'import-dummy'
		});
		n++;
	});
}

// ── Fixture login ──────────────────────────────────────────────────
// Siswa self-service (spec: SISWA_USER/SISWA_PASS = NISN/NIK)
const fSiswa = insS.run({
	public_id: pid('SIS'), nis: '129999000000000001', nisn: '0128522954', nama: 'Siswa Uji Coba', jk: 'L',
	kelas: '9', tempat_lahir: 'Lasusua', tgl_lahir: '2012-01-01', ayah: 'Ayah Uji', ibu: 'Ibu Uji',
	kerja_ayah: 'Petani', kerja_ibu: 'IRT', penghasilan: 1500000, anak_ke: 1, dari: 1,
	asal_sekolah: 'SDN 1 Pakue', alamat: 'Lasusua', rombel: 'IX-A',
	bansos_pbijk: 'YA', bansos_pkh: 'YA', bansos_sembako: 'YA', bansos_desil: '1',
	bansos_cek_at: '2026-01-01 00:00:00', sumber_data: 'fixture'
}).lastInsertRowid;

const upsertUser = db.prepare(`INSERT INTO users (username,password_hash,role,ref_id,is_active) VALUES (?,?,?,?,1)
 ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash, role=excluded.role, ref_id=excluded.ref_id, is_active=1`);
upsertUser.run('0128522954', hashPassword('7408024108120002'), 'siswa', fSiswa);

const ptkRow = db.prepare('SELECT id FROM ptk ORDER BY id LIMIT 1').get();
if (ptkRow) upsertUser.run('guru_79', hashPassword('guru123'), 'guru', ptkRow.id);
upsertUser.run('hasbi', hashPassword('admin123'), 'admin', null);

// Backfill public_id untuk PTK (seed drizzle tidak mengisinya) supaya link detail
// /admin/ptk/{publicId} tidak menjadi "/admin/ptk/".
{
	const upd = db.prepare('UPDATE ptk SET public_id = ? WHERE id = ?');
	for (const r of db.prepare("SELECT id FROM ptk WHERE public_id IS NULL OR public_id = ''").all()) {
		upd.run(pid('PTK'), r.id);
	}
}

console.log(JSON.stringify({
	siswa: n, ptk_ya_pbijk: nPbijk,
	rombel: db.prepare('SELECT COUNT(*) c FROM rombel').get().c,
	per_rombel_sample: db.prepare("SELECT rombel, COUNT(*) c FROM siswa GROUP BY rombel ORDER BY rombel LIMIT 4").all(),
	users: db.prepare('SELECT username, role FROM users ORDER BY id').all()
}, null, 1));
