// struktur-bagan-screenshot.mjs — potret elemen kanvas bagan dari halaman cetak (butuh login).
// Usage: node struktur-bagan-screenshot.mjs <url> <out.png> [cookieHeader] [selector] [scale]
import { chromium } from 'playwright';

const [url, out, cookie = '', selector = '.struktur-page', scaleArg = '2'] = process.argv.slice(2);

if (!url || !out) {
	console.error(
		'Usage: node struktur-bagan-screenshot.mjs <url> <out.png> [cookieHeader] [selector] [scale]'
	);
	process.exit(1);
}

const deviceScaleFactor = Math.min(4, Math.max(1, parseInt(scaleArg, 10) || 2));

const browser = await chromium.launch();
const context = await browser.newContext({
	deviceScaleFactor,
	viewport: { width: 2100, height: 1250 }
});
if (cookie) await context.setExtraHTTPHeaders({ Cookie: cookie });

const page = await context.newPage();
const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
if (!resp || !resp.ok()) {
	console.error('HTTP', resp ? resp.status() : 'tanpa respons');
}

await page.waitForSelector(selector, { timeout: 30_000 });
// beri waktu font/gambar selesai dirender
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(600);

await page.locator(selector).first().screenshot({ path: out, type: 'png', omitBackground: false });

await browser.close();
console.log('OK');
