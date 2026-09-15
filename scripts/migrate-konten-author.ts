#!/usr/bin/env node
/**
 * Migrasi konten guru (spec 032).
 *
 * Menambah kolom kepemilikan & moderasi pada 6 tabel konten:
 *   berita, pengumuman, agenda, galeri, prestasi, ekskul
 *   - penulis          (bila belum ada)
 *   - author_user_id   (pemilik konten)
 *   - published        (bila belum ada; default 1 agar konten lama tetap tampil)
 *   - published_at     (bila belum ada)
 *
 * Pemakaian:
 *   node --import tsx scripts/migrate-konten-author.ts            # dry-run
 *   node --import tsx scripts/migrate-konten-author.ts --apply    # tulis
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || 'local.db';
const APPLY = process.argv.includes('--apply');

interface TableSpec {
	table: string;
	// kolom published/published_at hanya untuk tabel yang belum punya
	publish?: boolean;
	penulis?: boolean;
}

const TABLES: TableSpec[] = [
	{ table: 'berita' },
	{ table: 'pengumuman', penulis: true },
	{ table: 'agenda', penulis: true, publish: true },
	{ table: 'galeri', penulis: true, publish: true },
	{ table: 'prestasi', penulis: true, publish: true },
	{ table: 'ekskul', penulis: true, publish: true }
];

function columns(db: Database.Database, table: string): Set<string> {
	return new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name));
}

async function main() {
	const db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');

	console.log('='.repeat(60));
	console.log(APPLY ? 'MIGRASI KONTEN — APPLY' : 'MIGRASI KONTEN — DRY RUN');
	console.log('='.repeat(60));

	const rencana: string[] = [];
	for (const spec of TABLES) {
		const cols = columns(db, spec.table);
		if (!cols.has('author_user_id')) rencana.push(`ALTER ${spec.table} ADD author_user_id`);
		if (spec.penulis && !cols.has('penulis')) rencana.push(`ALTER ${spec.table} ADD penulis`);
		if (spec.publish && !cols.has('published')) rencana.push(`ALTER ${spec.table} ADD published`);
		if (spec.publish && !cols.has('published_at')) rencana.push(`ALTER ${spec.table} ADD published_at`);
	}

	if (rencana.length === 0) {
		console.log('Tidak ada kolom yang perlu ditambah. Selesai.');
		db.close();
		return;
	}
	for (const r of rencana) console.log(' - ' + r);

	if (!APPLY) {
		console.log('\nDRY RUN. Jalankan ulang dengan --apply.');
		db.close();
		return;
	}

	mkdirSync('data', { recursive: true });
	const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
	const backup = path.join('data', `backup_pra_konten_${stamp}.db`);
	await db.backup(backup);
	console.log(`[OK] Backup: ${backup}`);

	const run = db.transaction(() => {
		for (const spec of TABLES) {
			const cols = columns(db, spec.table);
			const add = (ddl: string) => db.exec(`ALTER TABLE ${spec.table} ADD COLUMN ${ddl}`);

			if (!cols.has('author_user_id')) add('author_user_id INTEGER');
			if (spec.penulis && !cols.has('penulis')) add("penulis TEXT DEFAULT 'Admin'");
			if (spec.publish && !cols.has('published')) add('published INTEGER NOT NULL DEFAULT 1');
			if (spec.publish && !cols.has('published_at')) add('published_at TEXT');

			// Konten lama dianggap sudah terbit.
			if (spec.publish) {
				db.prepare(
					`UPDATE ${spec.table} SET published = 1 WHERE published IS NULL`
				).run();
				db.prepare(
					`UPDATE ${spec.table} SET published_at = created_at WHERE published_at IS NULL`
				).run();
			}
			console.log(`[OK] ${spec.table}`);
		}
	});
	run();

	db.close();
	console.log('\nSelesai.');
}

main().catch((e) => {
	console.error('GAGAL:', e);
	process.exit(1);
});
