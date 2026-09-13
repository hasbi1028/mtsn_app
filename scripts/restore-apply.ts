#!/usr/bin/env node
/**
 * Eksekutor restore SIMAD (spec 027) — JALANKAN SAAT SERVER BERHENTI.
 *
 *   pm2 stop simad-bel mtsn-app-bff
 *   node --import tsx scripts/restore-apply.ts            # pakai data/restore/pending.json (dari UI)
 *   pm2 start ecosystem.config.cjs
 *
 * Opsi:
 *   --file <zip>        restore darurat dari arsip mana pun di data/backups
 *   --dry-run           validasi + cek kunci/disk saja, tidak mengubah berkas
 *   --keep-old          jangan hapus cadangan .replaced-<stamp>
 *   --keep-session <t>  sisipkan ulang sesi admin (token) agar tidak logout
 *   --actor <nama>
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyRestore } from '../src/lib/server/backup/apply';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PENDING_FILE = path.join(ROOT, 'data', 'restore', 'pending.json');

function arg(nama: string): string | undefined {
	const i = process.argv.indexOf(nama);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

const dryRun = process.argv.includes('--dry-run');
const keepOld = process.argv.includes('--keep-old');
const fileArg = arg('--file');
const actorArg = arg('--actor');
const keepSession = arg('--keep-session');

interface Pending {
	stagedPath?: string;
	stagedName?: string;
	actor?: string;
	preRestoreName?: string;
}

let pending: Pending | null = null;
let zipPath = '';

if (fileArg) {
	zipPath = path.resolve(fileArg);
} else if (existsSync(PENDING_FILE)) {
	pending = JSON.parse(readFileSync(PENDING_FILE, 'utf-8')) as Pending;
	zipPath = pending.stagedPath ?? '';
}

if (!zipPath) {
	console.error('❌ Tidak ada arsip untuk dipulihkan.');
	console.error('   Siapkan dulu dari UI /admin/backup, atau pakai: --file <path-arsip.zip>');
	process.exit(2);
}
if (!existsSync(zipPath)) {
	console.error(`❌ Arsip tidak ditemukan: ${zipPath}`);
	process.exit(2);
}

console.log(`▶ Restore dari : ${zipPath}`);
if (pending?.preRestoreName) console.log(`▶ Snapshot pengaman: ${pending.preRestoreName}`);
if (dryRun) console.log('▶ Mode         : DRY-RUN (tidak ada berkas yang diubah)');
console.log('');

const hasil = await applyRestore({
	zipPath,
	actor: actorArg ?? pending?.actor ?? 'cli',
	preRestoreName: pending?.preRestoreName,
	dryRun,
	keepOld,
	keepSession
});

for (const baris of hasil.log ?? []) console.log(`   · ${baris}`);
console.log('');

if (hasil.ok) {
	console.log(`✅ Restore ${dryRun ? '(dry-run) ' : ''}BERHASIL — ${hasil.stagedName}`);
	if (hasil.dbRowCounts) {
		console.log(
			`   Terpulihkan: ${hasil.filesTotal ?? 0} berkas · ${hasil.dbRowCounts.siswa ?? 0} siswa · ${hasil.dbRowCounts.ptk ?? 0} PTK · ${hasil.dbRowCounts.roster ?? 0} roster`
		);
	}
	console.log('   Lanjutkan dengan: pm2 start ecosystem.config.cjs');
	process.exit(0);
}

console.error(`❌ Restore GAGAL — ${hasil.error ?? 'tidak diketahui'}`);
if (hasil.rolledBack) {
	console.error('   Data lama sudah dipulihkan otomatis (rollback). Tidak ada yang perlu dikerjakan.');
} else if (hasil.error?.includes('pm2 stop')) {
	console.error('   Server masih memegang local.db. Jalankan: pm2 stop simad-bel mtsn-app-bff');
} else if (hasil.preRestoreName) {
	console.error(`   Pemulihan manual bila perlu: arsip pengaman data/backups/${hasil.preRestoreName}`);
}
process.exit(1);
