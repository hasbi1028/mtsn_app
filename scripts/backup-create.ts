#!/usr/bin/env node
/**
 * Backup SIMAD (spec 027) — dipakai cron harian 23:00 WITA.
 *
 *   npm run backup:create            # arsip source=cron
 *   npm run backup:create -- --json  # keluaran JSON (dipakai cron/notifikasi)
 *   npm run backup:create -- --source ui --by hasbi
 */
import { createBackup } from '../src/modules/backup/backup.service';
import { humanBytes } from '../src/lib/server/backup/guards';

function arg(nama: string): string | undefined {
	const i = process.argv.indexOf(nama);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

const json = process.argv.includes('--json');
const source = (arg('--source') as 'cron' | 'ui' | 'pre-restore') ?? 'cron';
const by = arg('--by') ?? 'cron';

try {
	const info = await createBackup({ source, by });
	if (json) {
		console.log(
			JSON.stringify(
				{
					ok: true,
					name: info.name,
					path: info.path,
					bytes: info.bytes,
					humanBytes: humanBytes(info.bytes),
					createdAtLocal: info.manifest.createdAtLocal,
					filesTotal: info.manifest.filesTotal,
					dbRowCounts: info.manifest.dbRowCounts,
					gitCommit: info.manifest.gitCommit
				},
				null,
				2
			)
		);
	} else {
		console.log(`✅ Backup selesai: ${info.name}`);
		console.log(`   Ukuran   : ${humanBytes(info.bytes)}`);
		console.log(`   Waktu    : ${info.manifest.createdAtLocal}`);
		console.log(`   Uploads  : ${info.manifest.filesTotal} berkas (${humanBytes(info.manifest.filesBytes)})`);
		console.log(
			`   Data     : ${info.manifest.dbRowCounts.siswa ?? 0} siswa · ${info.manifest.dbRowCounts.ptk ?? 0} PTK · ${info.manifest.dbRowCounts.roster ?? 0} roster`
		);
		console.log(`   Lokasi   : ${info.path}`);
	}
	process.exit(0);
} catch (e) {
	const pesan = e instanceof Error ? e.message : String(e);
	if (json) console.log(JSON.stringify({ ok: false, error: pesan }, null, 2));
	else console.error(`❌ Backup GAGAL: ${pesan}`);
	process.exit(1);
}
