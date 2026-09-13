/**
 * Guard murni modul backup (spec 027).
 *
 * ATURAN: file ini HANYA boleh mengimpor `node:*` — tanpa alias `$lib`/`$app`,
 * tanpa dependensi npm. Alasannya: file ini dipakai bersama oleh server SvelteKit
 * DAN oleh `scripts/restore-apply.ts` (tsx) yang berjalan saat server mati.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const APP_ID = 'simad-mtsn2kolut';
export const FORMAT_VERSION = 1;
export const MAX_ENTRY_BYTES = 200 * 1024 * 1024;
export const MANIFEST_ENTRY = 'manifest.json';
export const DB_ENTRY = 'local.db';
export const BACKUP_NAME_RE = /^simad-backup-\d{8}-\d{6}-(ui|cron|pre-restore)\.zip$/;
export const STAGED_NAME_RE = /^[A-Za-z0-9._-]+\.zip$/;

/** Tabel yang wajib ada di DB hasil restore. */
export const REQUIRED_TABLES = [
	'users',
	'sessions',
	'ptk',
	'siswa',
	'rombel',
	'roster',
	'skakpt',
	'skmt_ajuan',
	'skbk_ajuan',
	'jam_bel',
	'schema_migrations'
];

export const EXCLUDED_LABELS = [
	'data/kartu',
	'node_modules',
	'build',
	'.svelte-kit',
	'*.log',
	'*.replaced-*',
	'*.db.bak-*'
];

const EXCLUDE_DIRS = new Set([
	'node_modules',
	'build',
	'.svelte-kit',
	'.git',
	'data',
	'test-results',
	'screenshots',
	'output',
	'__pycache__'
]);

export type BackupSource = 'ui' | 'cron' | 'pre-restore';

export interface ManifestFile {
	path: string;
	bytes: number;
	sha256: string;
}

export interface BackupManifest {
	app: string;
	formatVersion: number;
	createdAt: string;
	createdAtLocal: string;
	source: BackupSource;
	createdBy: string;
	appVersion: string;
	gitCommit: string;
	db: { path: string; bytes: number; sha256: string; integrityCheck: string };
	dbRowCounts: Record<string, number>;
	schemaMigrations: number | null;
	files: ManifestFile[];
	filesTotal: number;
	filesBytes: number;
	excluded: string[];
}

export interface BackupListItem {
	name: string;
	bytes: number;
	mtime: number;
	source: string;
	broken: boolean;
	manifest: BackupManifest | null;
}

/** Tolak entri ZIP berbahaya (zip-slip, absolut, drive letter) dan kembalikan path ternormalisasi. */
export function assertSafeZipEntry(entry: string): string {
	if (typeof entry !== 'string' || entry.trim() === '') {
		throw new Error('Entri ZIP kosong atau tidak valid.');
	}
	const raw = entry.replaceAll('\\', '/');
	if (raw.startsWith('/')) {
		throw new Error(`Entri ZIP berupa path absolut — ditolak: ${entry}`);
	}
	if (/^[A-Za-z]:/.test(raw)) {
		throw new Error(`Entri ZIP memuat drive letter — ditolak: ${entry}`);
	}
	const norm = path.posix.normalize(raw).replace(/^\.\//, '');
	if (norm === '..' || norm.startsWith('../')) {
		throw new Error(`Entri ZIP keluar folder (zip-slip) — ditolak: ${entry}`);
	}
	return norm;
}

/** Gabung path dan pastikan hasilnya tetap di dalam root. */
export function safeJoin(root: string, rel: string): string {
	const clean = assertSafeZipEntry(rel);
	const rootResolved = path.resolve(root);
	const full = path.resolve(rootResolved, clean);
	if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) {
		throw new Error(`Path keluar dari folder ${rootResolved}: ${rel}`);
	}
	return full;
}

export function sha256Buffer(buf: Buffer | Uint8Array): string {
	return createHash('sha256').update(buf).digest('hex');
}

export function sha256File(file: string): string {
	return sha256Buffer(readFileSync(file));
}

export function isEmptyObject(obj: unknown): boolean {
	return typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;
}

/** Validasi manifest arsip. Melempar Error berbahasa Indonesia bila tidak sah. */
export function validateManifest(obj: unknown): BackupManifest {
	const m = obj as BackupManifest;
	if (!m || typeof m !== 'object' || Array.isArray(m)) {
		throw new Error('Manifest arsip tidak ditemukan atau bukan objek JSON.');
	}
	if (m.app !== APP_ID) {
		throw new Error(`Arsip ini bukan milik ${APP_ID} (app: ${String(m.app)}).`);
	}
	if (!Number.isInteger(m.formatVersion) || m.formatVersion < 1) {
		throw new Error('Manifest tidak memuat formatVersion yang sah.');
	}
	if (m.formatVersion > FORMAT_VERSION) {
		throw new Error(
			`Versi arsip (formatVersion ${m.formatVersion}) lebih baru dari yang didukung aplikasi (${FORMAT_VERSION}). Perbarui aplikasi dulu.`
		);
	}
	if (!m.db || typeof m.db !== 'object' || typeof m.db.sha256 !== 'string' || m.db.sha256.length !== 64) {
		throw new Error('Manifest tidak memuat informasi database (db.sha256) yang sah.');
	}
	if (!Array.isArray(m.files)) {
		throw new Error('Manifest tidak memuat daftar file (files) yang sah.');
	}
	for (const f of m.files) {
		if (!f || typeof f.path !== 'string' || typeof f.sha256 !== 'string') {
			throw new Error('Ada entri file pada manifest yang tidak lengkap.');
		}
	}
	if (!m.dbRowCounts || typeof m.dbRowCounts !== 'object' || Array.isArray(m.dbRowCounts)) {
		throw new Error('Manifest tidak memuat dbRowCounts yang sah.');
	}
	if (typeof m.createdAt !== 'string' || typeof m.source !== 'string') {
		throw new Error('Manifest tidak memuat createdAt/source yang sah.');
	}
	return m;
}

function isExcludedDir(name: string): boolean {
	return EXCLUDE_DIRS.has(name.toLowerCase());
}

/** Aturan file yang tidak pernah masuk arsip. */
export function shouldExclude(relPath: string, size = 0): boolean {
	if (Number.isFinite(size) && size > MAX_ENTRY_BYTES) return true;
	const norm = relPath.replaceAll('\\', '/');
	const segs = norm.split('/').filter(Boolean);
	if (segs.some((s) => isExcludedDir(s))) return true;
	const base = (segs.at(-1) ?? '').toLowerCase();
	if (!base) return true;
	if (base === '.ds_store' || base === 'thumbs.db' || base === 'nul' || base === 'desktop.ini') return true;
	if (base.endsWith('.log')) return true;
	if (base.includes('.replaced-')) return true;
	if (base.startsWith('.tmp-')) return true;
	return false;
}

/** Daftar file relatif (posix, terurut) di dalam dir, sudah melewati aturan exclude. */
export function walkFiles(dir: string, base = dir, out: string[] = []): string[] {
	if (!existsSync(dir)) return out;
	const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (isExcludedDir(entry.name)) continue;
			walkFiles(full, base, out);
			continue;
		}
		const rel = path.relative(base, full).replaceAll('\\', '/');
		let size = 0;
		try {
			size = statSync(full).size;
		} catch {
			continue;
		}
		if (!shouldExclude(rel, size)) out.push(rel);
	}
	return out;
}

/** Stamp waktu lokal: YYYYMMDD-HHMMSS. */
export function formatStamp(d: Date = new Date()): string {
	const p = (n: number, len = 2) => String(n).padStart(len, '0');
	return `${p(d.getFullYear(), 4)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Waktu lokal yang mudah dibaca, mis. `2026-09-13 23:00:00`. */
export function formatLocal(d: Date = new Date()): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function humanBytes(n: number): string {
	if (!Number.isFinite(n) || n < 0) return '-';
	if (n < 1024) return `${Math.round(n)} B`;
	const units = ['KB', 'MB', 'GB', 'TB'];
	let v = n / 1024;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	const s = v < 10 ? v.toFixed(1).replace(/\.0$/, '') : String(Math.round(v));
	return `${s} ${units[i]}`;
}

/* ────────────────────────────────────────────────────────────
   Kontrak bersama service & CLI restore (tipe saja, tanpa runtime)
   ──────────────────────────────────────────────────────────── */

export interface RestoreInspection {
	ok: true;
	stagedName: string;
	manifest: BackupManifest;
	preview: {
		current: { dbRowCounts: Record<string, number>; filesTotal: number; filesBytes: number };
		archive: { dbRowCounts: Record<string, number>; filesTotal: number; filesBytes: number };
		deltas: Record<string, number>;
		filesDelta: number;
	};
}

export interface RestorePending {
	stagedName: string;
	stagedPath: string;
	preRestoreName: string;
	preRestorePath: string;
	actor: string;
	createdAt: string;
	createdAtLocal: string;
	manifestSummary: {
		app: string;
		formatVersion: number;
		createdAt: string;
		source: BackupSource;
		gitCommit: string;
		dbRowCounts: Record<string, number>;
		filesTotal: number;
		filesBytes: number;
	};
}

export interface RestoreResult {
	ok: boolean;
	dryRun: boolean;
	actor: string;
	stagedName: string;
	preRestoreName: string;
	restoredAt: string;
	restoredAtLocal: string;
	dbRowCounts?: Record<string, number>;
	filesTotal?: number;
	rolledBack?: boolean;
	error?: string;
	log?: string[];
}
