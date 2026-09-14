/**
 * Ekspor bagan struktur ke PNG (server-side) memakai Playwright.
 *
 * Sumber render = halaman cetak `/admin/struktur/bagan/cetak/<preset>?bare=1` — jadi
 * tampilan PNG dijamin sama dengan yang dicetak (satu sumber tampilan, tidak ada
 * duplikasi markup). Cache disimpan di `data/struktur/` dan dihitung ulang otomatis
 * bila isi bagan berubah (hash data).
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { getBagan } from './struktur.service';

const execFileAsync = promisify(execFile);

/** Preset ukuran cetak: skala PNG = pengali deviceScaleFactor. */
export const PRESET_CETAK: Record<string, { label: string; mmW: number; mmH: number; scale: number }> = {
	'spanduk-2x1': { label: 'Spanduk 2:1 (500×264 mm)', mmW: 529.17, mmH: 264.58, scale: 2 },
	a2: { label: 'A2 landscape (594×420 mm)', mmW: 594, mmH: 420, scale: 2 },
	a3: { label: 'A3 landscape (420×297 mm)', mmW: 420, mmH: 297, scale: 2 },
	a4: { label: 'A4 landscape (297×210 mm)', mmW: 297, mmH: 210, scale: 3 }
};

export function presetSah(kode: string | null | undefined): boolean {
	return !!kode && Object.prototype.hasOwnProperty.call(PRESET_CETAK, kode);
}

function dirPng(): string {
	const d = join(process.cwd(), 'data', 'struktur');
	mkdirSync(d, { recursive: true });
	return d;
}

function scriptShot(): string {
	return join(process.cwd(), 'scripts', 'struktur-bagan-screenshot.mjs');
}

export interface OpsiPng {
	preset: string;
	nip: boolean;
	/** Header Cookie dari request (agar Playwright bisa membuka halaman admin). */
	cookie?: string;
	/** Paksa render ulang (mis. tombol "Buat PNG"). */
	paksa?: boolean;
}

export async function getBaganPng(opsi: OpsiPng): Promise<Buffer> {
	const preset = presetSah(opsi.preset) ? opsi.preset : 'spanduk-2x1';
	const nip = opsi.nip === true;
	const data = getBagan({ publik: false });
	const versi = createHash('sha1')
		.update(JSON.stringify({ data, preset, nip }))
		.digest('hex')
		.slice(0, 16);

	const dir = dirPng();
	const nama = `bagan-${preset}-${nip ? 'nip' : 'nonip'}-${versi}.png`;
	const file = join(dir, nama);

	if (!opsi.paksa && existsSync(file) && statSync(file).size > 10_000) {
		return readFileSync(file);
	}

	// bersihkan cache versi lama untuk preset+mode yang sama
	const prefix = `bagan-${preset}-${nip ? 'nip' : 'nonip'}-`;
	for (const f of readdirSync(dir)) {
		if (f.startsWith(prefix) && f !== nama && f.endsWith('.png')) {
			try {
				unlinkSync(join(dir, f));
			} catch {
				/* abaikan */
			}
		}
	}

	const port = process.env.PORT || '3720';
	const url = `http://127.0.0.1:${port}/admin/struktur/bagan/cetak/${preset}?bare=1&nip=${nip ? '1' : '0'}`;
	const scale = String(PRESET_CETAK[preset]?.scale ?? 2);

	await execFileAsync(
		'node',
		[scriptShot(), url, file.replace(/\\/g, '/'), opsi.cookie ?? '', '.struktur-page', scale],
		{ timeout: 180_000, env: process.env }
	);

	if (!existsSync(file) || statSync(file).size < 1_000) {
		throw new Error('Gagal membuat PNG bagan (berkas tidak dihasilkan).');
	}
	return readFileSync(file);
}
