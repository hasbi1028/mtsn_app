import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readIfExists(rel: string): string {
	const p = path.join(root, rel);
	return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}

/**
 * Structural guards — membuktikan aplikasi berjalan full remote function
 * (tanpa legacy +page.server.ts actions / fetch('/api/...')). Tumbuh per
 * milestone (A1 auth) diplan dari plan-full-remote.md.
 */
test.describe('Full Remote — A1 Auth', () => {
	test('login page tidak memakai +page.server.ts actions', () => {
		const src = readIfExists('src/routes/login/+page.server.ts');
		expect(src).not.toContain('export const actions');
	});

	test('logout page tidak memakai +page.server.ts actions', () => {
		const src = readIfExists('src/routes/logout/+page.server.ts');
		expect(src).not.toContain('export const actions');
	});

	test('login form tidak memanggil fetch ke /api/...', () => {
		const src = readIfExists('src/modules/auth/components/login-form.svelte');
		expect(src).not.toMatch(/fetch\(\s*['"`]\/api\//);
	});
});

test.describe('Full Remote — A2 Approval', () => {
	test('approval tidak memakai +page.server.ts actions', () => {
		const src = readIfExists('src/routes/approval/+page.server.ts');
		expect(src).not.toContain('export const actions');
	});

	test('approval tidak memakai use:enhance dari $app/forms', () => {
		const src = readIfExists('src/routes/approval/+page.svelte');
		expect(src).not.toMatch(/import.*enhance.*from\s*['"]\$app\/forms['"]/);
	});

	test('approval tidak memakai action="?/..."', () => {
		const src = readIfExists('src/routes/approval/+page.svelte');
		expect(src).not.toMatch(/action=\s*["']\?\//);
	});
});

test.describe('Full Remote — A3 Skakpt', () => {
	test('skakpt tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/skakpt/+page.server.ts');
		expect(src).toBe('');
	});

	test('skakpt tidak memakai use:enhance dari $app/forms', () => {
		const src = readIfExists('src/routes/skakpt/+page.svelte');
		expect(src).not.toMatch(/import.*enhance.*from\s*['"]\$app\/forms['"]/);
	});

	test('skakpt tidak memakai action="?/..."', () => {
		const src = readIfExists('src/routes/skakpt/+page.svelte');
		expect(src).not.toMatch(/action=\s*["']\?\//);
	});

	test('api/skakpt/bukti tetap ada (static image serving)', () => {
		const src = readIfExists('src/routes/api/skakpt/bukti/[name]/+server.ts');
		expect(src).toContain('export const GET');
	});
});

test.describe('Full Remote — A4 Rombel', () => {
	test('rombel/[id] tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/rombel/[id]/+page.server.ts');
		expect(src).toBe('');
	});

	test('rombel/[id] tidak memakai use:enhance dari $app/forms', () => {
		const src = readIfExists('src/routes/rombel/[id]/+page.svelte');
		expect(src).not.toMatch(/import.*enhance.*from\s*['"]\$app\/forms['"]/);
	});

	test('rombel/[id] tidak memakai action="?/..."', () => {
		const src = readIfExists('src/routes/rombel/[id]/+page.svelte');
		expect(src).not.toMatch(/action=\s*["']\?\//);
	});

	test('rombel remote sudah punya getAvailableSiswaQ + getAllPtkQ', () => {
		const src = readIfExists('src/modules/rombel/rombel.remote.ts');
		expect(src).toContain('getAvailableSiswaQ');
		expect(src).toContain('getAllPtkQ');
	});
});

test.describe('Full Remote — A5 Cetak Kartu', () => {
	test('siswa/[id]/kartu tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/siswa/[id]/kartu/+page.server.ts');
		expect(src).toBe('');
	});

	test('siswa/[id]/kartu tidak memakai use:enhance dari $app/forms', () => {
		const src = readIfExists('src/routes/siswa/[id]/kartu/+page.svelte');
		expect(src).not.toMatch(/import.*enhance.*from\s*['"]\$app\/forms['"]/);
	});

	test('siswa/[id]/kartu tidak memakai action="?/..."', () => {
		const src = readIfExists('src/routes/siswa/[id]/kartu/+page.svelte');
		expect(src).not.toMatch(/action=\s*["']\?\//);
	});
});

test.describe('Full Remote — A6 Ortu', () => {
	test('ortu/profil tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/ortu/profil/+page.server.ts');
		expect(src).toBe('');
	});

	test('ortu/bansos tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/ortu/bansos/+page.server.ts');
		expect(src).toBe('');
	});

	test('ortu/bansos/cetak tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/ortu/bansos/cetak/+page.server.ts');
		expect(src).toBe('');
	});

	test('ortu remote sudah punya getOrtuSiswaQ', () => {
		const src = readIfExists('src/modules/ortu/ortu.remote.ts');
		expect(src).toContain('getOrtuSiswaQ');
	});
});

test.describe('Full Remote — A7 Bel', () => {
	test('bel tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/bel/+page.server.ts');
		expect(src).toBe('');
	});

	test('bel/suara tidak memakai +page.server.ts', () => {
		const src = readIfExists('src/routes/bel/suara/+page.server.ts');
		expect(src).toBe('');
	});

	test('bel remote sudah punya semua commands', () => {
		const src = readIfExists('src/modules/bel/bel.remote.ts');
		expect(src).toContain('playBellC');
		expect(src).toContain('stopBellC');
		expect(src).toContain('toggleMasterC');
		expect(src).toContain('createJadwalC');
		expect(src).toContain('uploadSuaraC');
		expect(src).toContain('deleteSuaraC');
	});
});

test.describe('Full Remote — B4 Guardrails', () => {
	test('ecosystem.config.cjs tidak ada mtsn-app-api', () => {
		const src = readIfExists('ecosystem.config.cjs');
		expect(src).not.toContain('mtsn-app-api');
		expect(src).not.toContain('3730');
	});

	test('tidak ada fetch("/api/...") di seluruh src/routes', () => {
		const files = [
			'approval', 'auth', 'bel', 'dokumen', 'kartu', 'ortu', 'ptk', 'rombel', 'roster', 'siswa', 'skakpt'
		];
		for (const mod of files) {
			const page = readIfExists(`src/routes/${mod}/+page.svelte`);
			if (page) {
				expect(page).not.toMatch(/fetch\(\s*['"`]\/api\//);
			}
		}
	});

	test('tidak ada +page.server.ts dengan actions di src/routes', () => {
		const dirs = ['login', 'logout', 'approval', 'skakpt', 'rombel/[id]', 'siswa/[id]/kartu',
			'ortu/profil', 'ortu/bansos', 'ortu/bansos/cetak', 'bel', 'bel/suara'];
		for (const dir of dirs) {
			const src = readIfExists(`src/routes/${dir}/+page.server.ts`);
			expect(src).not.toContain('export const actions');
		}
	});

	test('backend/ folder tidak ada', () => {
		expect(existsSync('backend')).toBe(false);
	});

	test('api.exe tidak ada di root', () => {
		expect(existsSync('api.exe')).toBe(false);
		expect(existsSync('backend.exe')).toBe(false);
		expect(existsSync('backend-api.exe')).toBe(false);
	});
});