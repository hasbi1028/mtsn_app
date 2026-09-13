import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { UPLOADS_DIR, ROOT } from '$lib/server/paths';
import { getPengaturan, getBrandingContentType } from '$modules/pengaturan/pengaturan.service';

const FALLBACK = '/uploads/logo-kemenag.png';

function resolveLocal(webPath: string): string | null {
	if (webPath.startsWith('/uploads/')) {
		const full = path.resolve(UPLOADS_DIR, webPath.slice('/uploads/'.length));
		if (full.startsWith(UPLOADS_DIR + path.sep)) return full;
	}
	if (webPath.startsWith('/') && !webPath.startsWith('//')) {
		const full = path.resolve(ROOT, 'static', webPath.slice(1));
		if (full.startsWith(path.join(ROOT, 'static') + path.sep)) return full;
	}
	return null;
}

export async function GET() {
	let webPath = FALLBACK;
	try {
		webPath = getPengaturan().faviconUrl || FALLBACK;
	} catch {
		webPath = FALLBACK;
	}

	const full = resolveLocal(webPath);
	if (full) {
		try {
			const buf = await readFile(full);
			return new Response(new Uint8Array(buf), {
				headers: {
					'content-type': getBrandingContentType(webPath),
					'cache-control': 'public, max-age=600'
				}
			});
		} catch {
			// jatuh ke SVG bawaan
		}
	}

	const svg = await readFile(path.join(ROOT, 'static', 'favicon.svg'), 'utf-8').catch(() => '');
	return new Response(svg, {
		headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=600' }
	});
}
