import { db } from '$lib/server/db';
import { UPLOADS_DIR } from '$lib/server/paths';
import { sql } from 'drizzle-orm';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrandingKind } from './pengaturan.validation';

/**
 * Pengaturan aplikasi (key-value) — pure business logic, tanpa SvelteKit.
 *
 * Favicon & logo dapat diatur admin. Bila belum diatur, dipakai logo Kemenag.
 */

export const DEFAULT_APP_NAME = 'SIMAD';
export const DEFAULT_APP_SUBTITLE = 'MTsN 2 Kolaka Utara';
export const FALLBACK_LOGO = '/uploads/logo-kemenag.png';
export const FALLBACK_FAVICON = '/uploads/logo-kemenag.png';

const BRANDING_DIR = path.join(UPLOADS_DIR, 'branding');

const MIME_BY_EXT: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	ico: 'image/x-icon'
};

const LOGO_EXT = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const FAVICON_EXT = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'];

const MAGIC_BYTES: Record<string, number[]> = {
	png: [0x89, 0x50, 0x4e, 0x47],
	jpg: [0xff, 0xd8, 0xff],
	jpeg: [0xff, 0xd8, 0xff],
	webp: [0x52, 0x49, 0x46, 0x46],
	ico: [0x00, 0x00, 0x01, 0x00]
};

export interface Branding {
	appName: string;
	appSubtitle: string;
	logoUrl: string;
	faviconUrl: string;
	logoCustom: boolean;
	faviconCustom: boolean;
}

let ensured = false;

/** Buat tabel bila belum ada (aman untuk DB lama tanpa menjalankan migrasi). */
export function ensurePengaturanTable() {
	if (ensured) return;
	db.run(sql`
		CREATE TABLE IF NOT EXISTS pengaturan (
			key TEXT PRIMARY KEY,
			value TEXT,
			updated_at TEXT DEFAULT (datetime('now','localtime'))
		)
	`);
	ensured = true;
}

function readMap(): Record<string, string> {
	ensurePengaturanTable();
	const rows = db.all(sql`SELECT key, value FROM pengaturan`) as { key: string; value: string | null }[];
	const map: Record<string, string> = {};
	for (const row of rows) {
		if (row.value != null) map[row.key] = row.value;
	}
	return map;
}

export function getPengaturanValue(key: string): string | null {
	ensurePengaturanTable();
	const row = db.all(sql`SELECT value FROM pengaturan WHERE key = ${key}`)[0] as
		| { value: string | null }
		| undefined;
	return row?.value ?? null;
}

export function setPengaturanValues(values: Record<string, string>) {
	ensurePengaturanTable();
	for (const [key, value] of Object.entries(values)) {
		db.run(sql`
			INSERT INTO pengaturan (key, value, updated_at)
			VALUES (${key}, ${value}, datetime('now','localtime'))
			ON CONFLICT(key) DO UPDATE SET value = ${value}, updated_at = datetime('now','localtime')
		`);
	}
}

/** Resolusi branding lengkap dengan fallback logo Kemenag. */
export function getPengaturan(): Branding {
	const map = readMap();
	const logo = map.logo_path || '';
	const favicon = map.favicon_path || '';
	return {
		appName: map.app_name || DEFAULT_APP_NAME,
		appSubtitle: map.app_subtitle || DEFAULT_APP_SUBTITLE,
		logoUrl: logo || FALLBACK_LOGO,
		faviconUrl: favicon || FALLBACK_FAVICON,
		logoCustom: logo !== '',
		faviconCustom: favicon !== ''
	};
}

function detectExt(file: File, allowed: string[]): string {
	const ext = (file.name.split('.').pop() || '').toLowerCase();
	if (!allowed.includes(ext)) {
		throw new Error(`Format berkas tidak didukung (${allowed.join(', ').toUpperCase()}).`);
	}
	return ext;
}

async function validateMagic(file: File, ext: string, buffer: Buffer): Promise<void> {
	const sig = MAGIC_BYTES[ext];
	if (!sig) return; // svg / format teks — tidak ada magic bytes baku
	if (buffer.length < sig.length || !sig.every((b, i) => buffer[i] === b)) {
		throw new Error('Isi berkas tidak sesuai dengan ekstensinya.');
	}
}

/** Simpan logo/favicon; hapus berkas kustom lama. */
export async function saveBrandingFile(kind: BrandingKind, file: File): Promise<string> {
	const allowed = kind === 'favicon' ? FAVICON_EXT : LOGO_EXT;
	const ext = detectExt(file, allowed);
	const buffer = Buffer.from(await file.arrayBuffer());
	await validateMagic(file, ext, buffer);

	await mkdir(BRANDING_DIR, { recursive: true });
	const filename = `${kind}-${Date.now()}.${ext}`;
	await writeFile(path.join(BRANDING_DIR, filename), buffer);

	const key = kind === 'logo' ? 'logo_path' : 'favicon_path';
	const old = getPengaturanValue(key);
	setPengaturanValues({ [key]: `/uploads/branding/${filename}` });
	await removeBrandingFile(old);

	return `/uploads/branding/${filename}`;
}

/** Kembalikan ke fallback (logo Kemenag) dengan menghapus berkas kustom. */
export async function resetBrandingFile(kind: BrandingKind): Promise<void> {
	const key = kind === 'logo' ? 'logo_path' : 'favicon_path';
	const old = getPengaturanValue(key);
	setPengaturanValues({ [key]: '' });
	await removeBrandingFile(old);
}

async function removeBrandingFile(webPath: string | null) {
	if (!webPath || !webPath.startsWith('/uploads/branding/')) return;
	const name = path.basename(webPath);
	await rm(path.join(BRANDING_DIR, name), { force: true });
}

export function getBrandingContentType(webPath: string): string {
	const ext = (webPath.split('.').pop() || '').toLowerCase();
	return MIME_BY_EXT[ext] || 'application/octet-stream';
}
