import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { loginAs } from './helpers';

const root = process.cwd();

/** Rekursif: kumpulkan semua file di dalam dir (absolute path). */
function walk(dir: string, out: string[] = []): string[] {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) {
			walk(full, out);
		} else {
			out.push(full);
		}
	}
	return out;
}

function rel(full: string) {
	return path.relative(root, full).replaceAll('\\', '/');
}

function read(relPath: string): string {
	const p = path.join(root, relPath);
	return existsSync(p) ? readFileSync(p, 'utf-8') : '';
}

const SRC_FILES = walk(path.join(root, 'src'));
const ROUTE_FILES = SRC_FILES.filter((f) => rel(f).startsWith('src/routes/'));

/**
 * Guardrails struktural — membuktikan aplikasi full remote function:
 * tanpa legacy `+page.server.ts` actions & tanpa `fetch('/api/...')`.
 */
test.describe('Full Remote — Structural Guards', () => {
	test('tidak ada fetch("/api/...") di seluruh src', () => {
		const offenders: string[] = [];
		for (const file of SRC_FILES) {
			if (!/\.(svelte|ts|js)$/.test(file)) continue;
			const text = readFileSync(file, 'utf-8');
			if (/fetch\(\s*['"`]\/api\//.test(text)) offenders.push(rel(file));
		}
		expect(offenders).toEqual([]);
	});

	test('tidak ada +page.server.ts dengan export const actions', () => {
		const offenders: string[] = [];
		for (const file of ROUTE_FILES) {
			if (!file.endsWith('+page.server.ts')) continue;
			if (/export const actions/.test(readFileSync(file, 'utf-8'))) offenders.push(rel(file));
		}
		expect(offenders).toEqual([]);
	});

	test('tidak ada import enhance dari $app/forms di routes', () => {
		const offenders: string[] = [];
		for (const file of ROUTE_FILES) {
			if (!file.endsWith('.svelte')) continue;
			const text = readFileSync(file, 'utf-8');
			if (/import[^;]*enhance[^;]*from\s*['"]\$app\/forms['"]/.test(text)) offenders.push(rel(file));
			if (/action=\s*["']\?\//.test(text)) offenders.push(rel(file) + ' (action="?/")');
		}
		expect(offenders).toEqual([]);
	});

	test('backend/ dan exe Go tidak ada', () => {
		expect(existsSync('backend')).toBe(false);
		expect(existsSync('api.exe')).toBe(false);
		expect(existsSync('backend.exe')).toBe(false);
		expect(existsSync('backend-api.exe')).toBe(false);
	});

	test('ecosystem.config.cjs bersih dari service Go API', () => {
		const src = read('ecosystem.config.cjs');
		expect(src).not.toContain('mtsn-app-api');
		expect(src).not.toContain('3730');
	});
});

test.describe('Full Remote — Endpoint Guards', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('endpoint bisnis legacy semua 404', async ({ page }) => {
		const endpoints: [string, string][] = [
			['POST', '/api/kartu/generate-all'],
			['GET', '/api/siswa/kartu/list'],
			['GET', '/api/kartu/queue/abc'],
			['POST', '/api/kartu/queue/abc/cancel'],
			['GET', '/api/siswa/1/detail'],
			['POST', '/api/siswa/1/kartu-regenerate'],
			['POST', '/api/siswa/me/foto']
		];
		const statuses: Record<string, number> = {};
		for (const [method, url] of endpoints) {
			const res = method === 'GET' ? await page.request.get(url) : await page.request.post(url);
			statuses[`${method} ${url}`] = res.status();
		}
		const expected = Object.fromEntries(endpoints.map(([m, u]) => [`${m} ${u}`, 404]));
		expect(statuses).toEqual(expected);
	});

	test('endpoint biner/statis yang diizinkan tetap ada', async ({ page }) => {
		const health = await page.request.get('/api/health');
		expect(health.ok()).toBeTruthy();

		const buktiFile = path.join(root, 'src/routes/api/skakpt/bukti/[name]/+server.ts');
		expect(existsSync(buktiFile)).toBe(true);
		expect(readFileSync(buktiFile, 'utf-8')).toContain('export const GET');

		for (const suffix of ['kartu', 'kartu-front', 'kartu-back']) {
			const p = path.join(root, `src/routes/api/siswa/[id]/${suffix}/+server.ts`);
			expect(existsSync(p), `${suffix} harus ada`).toBe(true);
		}
	});
});
