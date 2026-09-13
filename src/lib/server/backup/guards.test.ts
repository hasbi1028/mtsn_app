import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
	APP_ID,
	FORMAT_VERSION,
	MAX_ENTRY_BYTES,
	BACKUP_NAME_RE,
	assertSafeZipEntry,
	safeJoin,
	sha256Buffer,
	sha256File,
	validateManifest,
	shouldExclude,
	formatStamp,
	humanBytes
} from './guards';

function manifestSah() {
	return {
		app: APP_ID,
		formatVersion: FORMAT_VERSION,
		createdAt: '2026-09-13T15:00:00.000Z',
		createdAtLocal: '2026-09-13 23:00:00',
		source: 'ui',
		createdBy: 'hasbi',
		appVersion: '0.0.1',
		gitCommit: 'd2ea6ff',
		db: { path: 'local.db', bytes: 10, sha256: 'a'.repeat(64), integrityCheck: 'ok' },
		dbRowCounts: { siswa: 232 },
		schemaMigrations: 1,
		files: [{ path: 'uploads/bel/1.mp3', bytes: 5, sha256: 'b'.repeat(64) }],
		filesTotal: 1,
		filesBytes: 5,
		excluded: ['data/kartu']
	};
}

describe('guards — keamanan entri ZIP', () => {
	it('menolak entri zip-slip & path absolut', () => {
		for (const bad of ['../evil.txt', 'uploads/../../x', '/abs/evil', 'C:\\evil.txt', '..\\evil.txt']) {
			expect(() => assertSafeZipEntry(bad), `harus tolak ${bad}`).toThrow();
		}
	});

	it('menerima entri normal', () => {
		for (const ok of ['manifest.json', 'local.db', 'uploads/bel/1.mp3', 'config/ecosystem.config.cjs']) {
			expect(assertSafeZipEntry(ok)).toBe(ok);
		}
	});

	it('safeJoin menolak path keluar root, menerima di dalam root', () => {
		const root = path.join(tmpdir(), 'rootx');
		expect(() => safeJoin(root, '../y')).toThrow();
		expect(safeJoin(root, 'a/b.txt')).toBe(path.join(root, 'a', 'b.txt'));
	});
});

describe('guards — hash', () => {
	it('sha256 cocok dengan crypto untuk buffer & file', () => {
		const buf = Buffer.from('simad-backup');
		const expectHash = createHash('sha256').update(buf).digest('hex');
		expect(sha256Buffer(buf)).toBe(expectHash);

		const dir = mkdtempSync(path.join(tmpdir(), 'guard-'));
		const file = path.join(dir, 'x.bin');
		writeFileSync(file, buf);
		expect(sha256File(file)).toBe(expectHash);
		rmSync(dir, { recursive: true, force: true });
	});
});

describe('guards — validasi manifest', () => {
	it('menolak manifest tidak valid', () => {
		expect(() => validateManifest(null)).toThrow();
		expect(() => validateManifest({})).toThrow();
		expect(() => validateManifest({ ...manifestSah(), app: 'aplikasi-lain' })).toThrow();
		expect(() => validateManifest({ ...manifestSah(), formatVersion: FORMAT_VERSION + 1 })).toThrow();
		expect(() => validateManifest({ ...manifestSah(), db: undefined })).toThrow();
		expect(() => validateManifest({ ...manifestSah(), files: 'bukan-array' })).toThrow();
	});

	it('menerima manifest sah dan mengembalikan objek bertipe', () => {
		const m = validateManifest(manifestSah());
		expect(m.app).toBe(APP_ID);
		expect(m.filesTotal).toBe(1);
		expect(m.files[0].path).toBe('uploads/bel/1.mp3');
	});
});

describe('guards — aturan exclude', () => {
	it('menolak sampah & entri kebesaran', () => {
		expect(shouldExclude('uploads/app.log')).toBe(true);
		expect(shouldExclude('Thumbs.db')).toBe(true);
		expect(shouldExclude('nul')).toBe(true);
		expect(shouldExclude('local.db.replaced-20260913')).toBe(true);
		expect(shouldExclude('uploads/bel/x.mp3', MAX_ENTRY_BYTES + 1)).toBe(true);
	});

	it('menerima file unggahan normal', () => {
		expect(shouldExclude('uploads/bel/1.mp3')).toBe(false);
		expect(shouldExclude('uploads/foto_siswa/185.jpg')).toBe(false);
		expect(shouldExclude('uploads/logo-kemenag.png', 452000)).toBe(false);
	});
});

describe('guards — nama arsip & stamp', () => {
	it('BACKUP_NAME_RE menerima pola sah saja', () => {
		expect(BACKUP_NAME_RE.test('simad-backup-20260913-230000-cron.zip')).toBe(true);
		expect(BACKUP_NAME_RE.test('simad-backup-20260913-230000-ui.zip')).toBe(true);
		expect(BACKUP_NAME_RE.test('simad-backup-20260913-230000-pre-restore.zip')).toBe(true);
		expect(BACKUP_NAME_RE.test('../local.db')).toBe(false);
		expect(BACKUP_NAME_RE.test('simad-backup-20260913-230000-xx.zip')).toBe(false);
		expect(BACKUP_NAME_RE.test('local.db')).toBe(false);
	});

	it('formatStamp memakai waktu lokal & humanBytes wajar', () => {
		expect(formatStamp(new Date(2026, 8, 13, 23, 0, 0))).toBe('20260913-230000');
		expect(humanBytes(1024)).toBe('1 KB');
		expect(humanBytes(11_534_336)).toMatch(/MB$/);
	});
});
