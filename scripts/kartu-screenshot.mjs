// kartu-screenshot.mjs — Playwright screenshot card element
// Usage: node kartu-screenshot.mjs <html-file-path> <output-png-path>
import { chromium } from 'playwright';

const htmlPath = process.argv[2];
const outputPath = process.argv[3];

// Escape passthrough for HD (device scale factor). Reads env if set, else 8x print-grade.
const envScale = process.env.KARTU_SCALE;
const deviceScaleFactor = envScale ? parseInt(envScale, 10) : 8;

if (!htmlPath || !outputPath) {
  console.error('Usage: node kartu-screenshot.mjs <html-path> <output.png>');
  process.exit(1);
}

const browser = await chromium.launch();
// context's deviceScaleFactor sharpens the render (4x = ~1288x832px, HD)
const context = await browser.newContext({ deviceScaleFactor });
const page = await context.newPage();
await page.setViewportSize({ width: 1600, height: 1000 });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

// Wait for images to load
await page.waitForTimeout(1000);

// screenshot just the card element, omit the surrounding body padding
const card = page.locator('.card');
await card.screenshot({ path: outputPath, type: 'png', omitBackground: false });

await browser.close();
console.log('OK');