#!/usr/bin/env node
/**
 * Status backup & restore SIMAD (spec 027).
 *
 *   npm run backup:status            # ringkasan arsip + hasil restore terakhir
 *   npm run backup:status -- --json
 */
import { listBackups, readPending, readRestoreStatus } from '../src/modules/backup/backup.service';
import { humanBytes } from '../src/lib/server/backup/guards';
import { BACKUP_DIR, RESULT_FILE } from '../src/lib/server/paths';

const json = process.argv.includes('--json');
const items = await listBackups();
const terakhir = await readRestoreStatus();
const pending = await readPending();
const totalBytes = items.reduce((a, i) => a + i.bytes, 0);

if (json) {
	console.log(
		JSON.stringify(
			{
				backupDir: BACKUP_DIR,
				resultFile: RESULT_FILE,
				jumlah: items.length,
				totalBytes,
				items: items.map((i) => ({
					name: i.name,
					bytes: i.bytes,
					source: i.source,
					broken: i.broken,
					waktu: i.mtime,
					filesTotal: i.manifest?.filesTotal ?? null,
					siswa: i.manifest?.dbRowCounts?.siswa ?? null
				})),
				lastResult: terakhir,
				pending: pending ? { stagedName: pending.stagedName, actor: pending.actor, createdAtLocal: pending.createdAtLocal } : null
			},
			null,
			2
		)
	);
	process.exit(0);
}

console.log(`Folder arsip : ${BACKUP_DIR}`);
console.log(`Jumlah arsip : ${items.length} (${humanBytes(totalBytes)})`);
console.log('');
if (items.length === 0) {
	console.log('Belum ada arsip. Jalankan: npm run backup:create');
} else {
	for (const i of items.slice(0, 10)) {
		const tanda = i.broken ? '⚠️ ' : '   ';
		console.log(
			`${tanda}${i.name}  ${humanBytes(i.bytes)}  [${i.source}]  ${i.manifest?.filesTotal ?? '?'} berkas  ${i.manifest?.dbRowCounts?.siswa ?? '?'} siswa`
		);
	}
	if (items.length > 10) console.log(`   … dan ${items.length - 10} arsip lain`);
}
if (pending) {
	console.log('');
	console.log(`⏳ Restore siap dieksekusi: ${pending.stagedName} (disiapkan ${pending.actor} pada ${pending.createdAtLocal})`);
	console.log('   pm2 stop simad-bel mtsn-app-bff && node --import tsx scripts/restore-apply.ts && pm2 start ecosystem.config.cjs');
}
console.log('');
if (terakhir) {
	console.log(`Restore terakhir: ${terakhir.ok ? 'BERHASIL' : 'GAGAL'} — ${terakhir.restoredAtLocal} (${terakhir.totalBytesLabel ?? ''}${terakhir.actor})`);
	if (terakhir.error) console.log(`   Kesalahan: ${terakhir.error}`);
	if (terakhir.rolledBack) console.log('   Data lama dipulihkan otomatis (rollback).');
} else {
	console.log('Restore terakhir: belum pernah dijalankan dari sistem ini.');
}
