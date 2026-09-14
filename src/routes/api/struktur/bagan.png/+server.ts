import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBaganPng, presetSah } from '$modules/struktur/struktur-bagan.service';

/**
 * GET /api/struktur/bagan.png?preset=spanduk-2x1&nip=0[&paksa=1]
 *
 * Endpoint biner (Playwright render) — didaftarkan di tests/e2e/full-remote.spec.ts
 * sebagai structural guard. Hooks melewati /api/*, jadi autentikasi dicek di sini.
 */
export const GET: RequestHandler = async ({ url, locals, request }) => {
	const user = (locals as unknown as { user?: { role?: string } }).user;
	if (!user) throw error(401, 'Tidak terautentikasi.');
	const boleh = ['admin', 'kepsek', 'guru', 'staf'];
	if (!boleh.includes(user.role ?? '')) throw error(403, 'Tidak punya akses ke bagan struktur.');

	const preset = url.searchParams.get('preset') ?? 'spanduk-2x1';
	if (!presetSah(preset)) throw error(400, `Preset "${preset}" tidak dikenal.`);

	const nip = url.searchParams.get('nip') === '1';
	const paksa = url.searchParams.get('paksa') === '1';
	const cookie = request.headers.get('cookie') ?? '';

	try {
		const png = await getBaganPng({ preset, nip, cookie, paksa });
		return new Response(new Uint8Array(png), {
			headers: {
				'Content-Type': 'image/png',
				'Content-Length': String(png.byteLength),
				'Content-Disposition': `inline; filename="bagan-struktur-${preset}${nip ? '-nip' : ''}.png"`,
				'Cache-Control': 'no-store'
			}
		});
	} catch (e) {
		throw error(500, `Gagal membuat PNG bagan: ${(e as Error).message}`);
	}
};
