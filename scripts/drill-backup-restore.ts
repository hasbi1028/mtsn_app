#!/usr/bin/env node
/**
 * DRILL backup & restore (spec 027) — LATIHAN, tidak menyentuh data produksi.
 *
 *   npm run backup:drill
 *
 * Yang diuji (semua di dalam sandbox `data/drill/<stamp>/`):
 *   1. createBackup menghasilkan arsip yang lolos verifyArchive
 *   2. applyRestore memulihkan DB + folder uploads persis seperti manifest
 *   3. arsip terpotong (korup) DITOLAK tanpa mengubah apa pun
 *   4. bila verifikasi pasca-swap gagal → rollback otomatis, data lama utuh
 *
 * Sumber data latihan = SALINAN `local.db` + `static/uploads` produksi.
 */
import {
	copyFileSync,
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	truncateSync,
	writeFileSync
} from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { applyRestore } from '../src/lib/server/backup/apply';
import { createBackup, inspectDatabase } from '../src/modules/backup/backup.service';
import { MANIFEST_ENTRY, formatStamp, humanBytes } from '../src/lib/server/backup/guards';
import { DB_FILE, ROOT, UPLOADS_DIR } from '../src/lib/server/paths';

const sandbox = path.join(ROOT, 'data', 'drill', formatStamp());
const dbFile = path.join(sandbox, 'local.db');
const uploadsDir = path.join(sandbox, 'uploads');
const backupDir = path.join(sandbox, 'backups');
const restoreDir = path.join(sandbox, 'restore');

const hasil: Record<string, unknown> = {};

function jumlahSiswa(file: string): number {
	const db = new Database(file, { readonly: true });
	try {
		return (db.prepare('SELECT COUNT(*) AS c FROM siswa').get() as { c: number }).c;
	} finally {
		db.close();
	}
}

function jumlahFileUpload(): number {
	let n = 0;
	const walk = (dir: string) => {
		if (!existsSync(dir)) return;
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, e.name);
			if (e.isDirectory()) walk(full);
			else n++;
		}
	};
	walk(uploadsDir);
	return n;
}

console.log(`🧪 Sandbox drill: ${sandbox}`);
mkdirSync(sandbox, { recursive: true });

// ── Persiapan: salinan data produksi ──────────────────────────────
copyFileSync(DB_FILE, dbFile);
cpSync(UPLOADS_DIR, uploadsDir, { recursive: true });
const siswaAwal = jumlahSiswa(dbFile);
const fileAwal = jumlahFileUpload();
console.log(`   Salinan produksi: ${siswaAwal} siswa, ${fileAwal} berkas upload`);
hasil.sandbox = sandbox;
hasil.salinanProduksi = { siswa: siswaAwal, files: fileAwal };

// ── 1. Backup ─────────────────────────────────────────────────────
const arsip = await createBackup({ source: 'ui', by: 'drill', dbFile, uploadsDir, outDir: backupDir });
console.log(`✅ 1. Backup: ${arsip.name} (${humanBytes(arsip.bytes)}, ${arsip.manifest.filesTotal} berkas)`);
hasil.backup = {
	ok: true,
	name: arsip.name,
	bytes: arsip.bytes,
	filesTotal: arsip.manifest.filesTotal,
	siswa: arsip.manifest.dbRowCounts.siswa ?? 0
};

// ── 2. Rusak data sandbox, lalu restore ───────────────────────────
{
	const db = new Database(dbFile);
	db.prepare('DELETE FROM siswa WHERE id > 230').run();
	db.close();
	const fotoDir = path.join(uploadsDir, 'foto_siswa');
	const korban = existsSync(fotoDir) ? readdirSync(fotoDir).slice(0, 5) : [];
	for (const f of korban) rmSync(path.join(fotoDir, f), { force: true });
	writeFileSync(path.join(uploadsDir, 'berkas-sampah.txt'), 'harus hilang setelah restore');
}
const siswaRusak = jumlahSiswa(dbFile);
console.log(`   Data sandbox dirusak: siswa ${siswaAwal} → ${siswaRusak}, +1 berkas sampah`);

const restore = await applyRestore({
	zipPath: arsip.path,
	actor: 'drill',
	dbFile,
	uploadsDir,
	restoreDir,
	backupDir,
	preRestoreName: 'snapshot-simulasi'
});
const siswaPulih = jumlahSiswa(dbFile);
const filePulih = jumlahFileUpload();
console.log(
	`${restore.ok ? '✅' : '❌'} 2. Restore: ok=${restore.ok} siswa ${siswaPulih}/${siswaAwal} berkas ${filePulih}/${fileAwal}`
);
console.log(`      · ${(restore.log ?? []).slice(-3).join('\n      · ')}`);
hasil.restoreSukses = {
	ok: restore.ok,
	rolledBack: restore.rolledBack ?? false,
	siswa: siswaPulih,
	siswaDiharapkan: siswaAwal,
	files: filePulih,
	filesDiharapkan: fileAwal,
	sampahHilang: !existsSync(path.join(uploadsDir, 'berkas-sampah.txt')),
	walTerhapus: !existsSync(dbFile + '-wal') && !existsSync(dbFile + '-shm')
};

// ── 3. Arsip terpotong harus ditolak ──────────────────────────────
const rusakPath = path.join(backupDir, arsip.name.replace('-ui.zip', '-ui-rusak.zip'));
copyFileSync(arsip.path, rusakPath);
truncateSync(rusakPath, Math.floor(statSync(rusakPath).size * 0.6));
const siswaSebelumRusak = jumlahSiswa(dbFile);
const restoreRusak = await applyRestore({
	zipPath: rusakPath,
	actor: 'drill',
	dbFile,
	uploadsDir,
	restoreDir,
	backupDir
});
console.log(`${!restoreRusak.ok ? '✅' : '❌'} 3. Arsip terpotong: ok=${restoreRusak.ok} — "${restoreRusak.error}"`);
hasil.arsipRusakDitolak = {
	ok: restoreRusak.ok,
	error: restoreRusak.error,
	dataTidakBerubah: jumlahSiswa(dbFile) === siswaSebelumRusak
};

// ── 4. Rollback otomatis saat verifikasi pasca-swap gagal ─────────
const zipRollback = path.join(backupDir, arsip.name.replace('-ui.zip', '-ui-rollback.zip'));
copyFileSync(arsip.path, zipRollback);
{
	const zip = new AdmZip(zipRollback);
	const m = JSON.parse((zip.readFile(MANIFEST_ENTRY) as Buffer).toString('utf-8'));
	m.dbRowCounts.siswa = 999999; // mustahil → verifikasi pasca-swap pasti gagal
	zip.addFile(MANIFEST_ENTRY, Buffer.from(JSON.stringify(m, null, 2)));
	zip.writeZip(zipRollback);
}
const siswaSebelumRollback = jumlahSiswa(dbFile);
const restoreRollback = await applyRestore({
	zipPath: zipRollback,
	actor: 'drill',
	dbFile,
	uploadsDir,
	restoreDir,
	backupDir
});
const siswaSetelahRollback = jumlahSiswa(dbFile);
console.log(
	`${!restoreRollback.ok && restoreRollback.rolledBack ? '✅' : '❌'} 4. Rollback: ok=${restoreRollback.ok} rolledBack=${restoreRollback.rolledBack} siswa ${siswaSetelahRollback}/${siswaSebelumRollback}`
);
hasil.rollback = {
	ok: restoreRollback.ok,
	rolledBack: restoreRollback.rolledBack ?? false,
	error: restoreRollback.error,
	dataUtuh: siswaSetelahRollback === siswaSebelumRollback
};

// ── Ringkasan ─────────────────────────────────────────────────────
const lulus =
	hasil.backup && // backup dibuat
	(hasil.restoreSukses as { ok: boolean }).ok &&
	(hasil.restoreSukses as { siswa: number }).siswa === siswaAwal &&
	(hasil.arsipRusakDitolak as { ok: boolean }).ok === false &&
	(hasil.arsipRusakDitolak as { dataTidakBerubah: boolean }).dataTidakBerubah &&
	(hasil.rollback as { rolledBack: boolean }).rolledBack &&
	(hasil.rollback as { dataUtuh: boolean }).dataUtuh;

hasil.lulus = lulus;
writeFileSync(path.join(restoreDir, 'drill-result.json'), JSON.stringify(hasil, null, 2), 'utf-8');

console.log('');
console.log(lulus ? '🎉 DRILL LULUS — semua skenario terbukti.' : '❌ DRILL GAGAL — periksa detail di atas.');
console.log(`   Ringkasan JSON: ${path.join(restoreDir, 'drill-result.json')}`);
console.log(`   (sandbox boleh dihapus kapan saja: ${sandbox})`);
process.exit(lulus ? 0 : 1);
