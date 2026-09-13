/**
 * Path absolut modul backup (spec 027).
 *
 * ATURAN: hanya `node:*` — dipakai bersama server SvelteKit & CLI (tsx).
 *
 * ROOT memakai `process.cwd()` (bukan import.meta.url) karena:
 *  - proses PM2 menjalankan SvelteKit dengan cwd = root proyek;
 *  - `src/lib/server/db/index.ts` juga membuka DB relatif cwd (`local.db`),
 *    jadi path modul ini konsisten dengan jalur yang sudah terbukti;
 *  - saat di-bundle (build produksi / vite preview) `import.meta.url`
 *    menunjuk ke folder .svelte-kit sehingga tidak bisa dipakai sebagai acuan.
 * Bila aplikasi dijalankan dari cwd lain, set `APP_ROOT` di environment.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : process.cwd();

export const DB_FILE = process.env.DB_PATH
	? path.resolve(process.env.DB_PATH)
	: path.join(ROOT, 'local.db');

export const UPLOADS_DIR = process.env.UPLOADS_DIR
	? path.resolve(process.env.UPLOADS_DIR)
	: path.join(ROOT, 'static', 'uploads');

export const BACKUP_DIR = path.join(ROOT, process.env.BACKUP_DIR || 'data/backups');
export const RESTORE_DIR = path.join(ROOT, 'data/restore');
export const INCOMING_DIR = path.join(RESTORE_DIR, 'incoming');
export const STAGED_DIR = path.join(RESTORE_DIR, 'staged');
export const PENDING_FILE = path.join(RESTORE_DIR, 'pending.json');
export const RESULT_FILE = path.join(RESTORE_DIR, 'last-result.json');
export const HISTORY_FILE = path.join(RESTORE_DIR, 'history.log');

export const APP_VERSION = '0.0.1';

/** Commit git saat ini (best-effort, tanpa memanggil git). */
export function gitCommit(): string {
	try {
		const head = path.join(ROOT, '.git', 'HEAD');
		if (!existsSync(head)) return 'unknown';
		const txt = readFileSync(head, 'utf-8').trim();
		const m = txt.match(/^ref:\s*(.+)$/);
		if (!m) return txt.slice(0, 12);
		const refFile = path.join(ROOT, '.git', m[1]);
		if (!existsSync(refFile)) return 'unknown';
		return readFileSync(refFile, 'utf-8').trim().slice(0, 12);
	} catch {
		return 'unknown';
	}
}
