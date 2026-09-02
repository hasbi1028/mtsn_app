/**
 * EMIS GTK SKAKPT Scraper — Reusable
 * 
 * Tujuan: Login ke EMIS GTK untuk setiap PTK bersertifikasi, navigasi ke
 * halaman SKAKPT (Tunjangan > SKAKPT), ekstrak 11 indikator kelayakan TPG,
 * lalu:
 *   - Laporkan PTK yang TIDAK layak + indikator mana yang belum terpenuhi
 *   - Simpan hasil per indikator ke database mtsn_app (tabel skakpt + detail)
 * 
 * Cara pakai:
 *   node scripts/emis-skakpt-scrape.mjs                 # bulan Agustus 2026, semua akun
 *   node scripts/emis-skakpt-scrape.mjs --bulan=September 2026
 *   node scripts/emis-skakpt-scrape.mjs --bulan=Agustus 2026 --nama="ANDI RASNIA"
 * 
 * Config:    scripts/emis-config.json (atau dibaca dari local.db)
 * Output:    output/skakpt-<bulan>.json + update ke local.db
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// ================= CONFIG =================
const EMIS_BASE = 'https://emisgtk.kemenag.go.id';
const LOGIN_URL = `${EMIS_BASE}/login`;
const SKAKPT_URL = `${EMIS_BASE}/tunjangan/skakpt/`;

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const hit = args.find(a => a.startsWith(`--${key}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const BULAN = getArg('bulan', 'Agustus 2026');      // Default: Agustus 2026
const NAMA_FILTER = getArg('nama', '');              // Optional: filter 1 PTK
const HEADLESS = getArg('headless', 'true') !== 'false';
const DB_PATH = getArg('db', path.join(process.cwd(), 'local.db'));
const OUT_DIR = path.join(process.cwd(), 'output');
const BUKTI_DIR = path.join(process.cwd(), 'output', 'bukti-skakpt'); // folder bukti/screenshot

// ================= DB LOAD =================
const db = new Database(DB_PATH);
const ptkRows = db.prepare(`
  SELECT id, nama, user_emis AS user, pass_emis AS pass
  FROM ptk
  WHERE sertifikasi = 1
    AND user_emis IS NOT NULL AND user_emis != ''
    AND pass_emis IS NOT NULL AND pass_emis != ''
`).all();

let accounts = ptkRows.filter(a => a.pass);
if (NAMA_FILTER) {
  accounts = accounts.filter(a => a.nama.toLowerCase().includes(NAMA_FILTER.toLowerCase()));
}
if (accounts.length === 0) {
  console.log('❌ Tidak ada akun PTK bersertifikasi dengan password terisi.');
  process.exit(1);
}

console.log(`\n=== EMIS GTK SKAKPT Scraper ===`);
console.log(`Bulan: ${BULAN}`);
console.log(`Akun PTK: ${accounts.length} (${accounts.map(a => a.nama).join(', ')})`);
console.log(`Headless: ${HEADLESS}\n`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(BUKTI_DIR)) fs.mkdirSync(BUKTI_DIR, { recursive: true });

// ================= HELPERS =================
async function screenshot(page, name) {
  try {
    const filePath = path.join(BUKTI_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  📸 Bukti tersimpan: ${path.relative(process.cwd(), filePath)}`);
    return filePath;
  } catch { return ''; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Login 1 akun ke EMIS GTK */
async function login(page, account) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Tutup popup "Saya Mengerti" jika muncul
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.click('text=Saya Mengerti').catch(() => {});
  await page.fill('#email', account.user);
  await page.fill('#password', account.pass);
  await page.click('button[type="submit"]');
  // Tunggu navigasi ke dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

/** Pilih bulan pada halaman SKAKPT */
async function setBulan(page, bulan) {
  const select = await page.$('select');
  if (!select) return false;
  try {
    await select.selectOption({ label: bulan });
    await page.waitForTimeout(3000);
    return true;
  } catch (e) {
    return false; // opsi tidak ada, pakai default
  }
}

/**
 * Ekstrak 11 indikator dari halaman SKAKPT.
 * Return { layak, totalOk, indikator: [{no, nama, keterangan, ok}] }
 */
async function extractIndikator(page) {
  const result = await page.evaluate(() => {
    // 1) Status layak (radial progress + badge)
    const radial = document.querySelector('.radial-progress');
    const radialText = radial ? radial.textContent.trim() : '';
    const layakBadge = document.querySelector('[class*="badge-success"], [class*="text-success"]');
    const layakText = layakBadge ? layakBadge.textContent.trim() : '';

    // 2) Tabel syarat — 11 baris
    const table = document.querySelector('table');
    const indikator = [];
    if (table) {
      for (const tr of table.querySelectorAll('tbody tr')) {
        const cells = Array.from(tr.querySelectorAll('td'));
        if (cells.length < 3) continue;
        // HANYA baris utama: kolom No berisi angka 1-11 (sub-row JTM/tanggal tidak bernomor)
        const noRaw = cells[0].textContent.trim();
        if (!/^\d{1,2}$/.test(noRaw)) continue; // lewati sub-row
        const no = noRaw;
        const nama = cells[1].textContent.trim();
        const ket = cells[2] ? cells[2].textContent.trim() : '';
        // Status = badge di kolom ke-4 (jika ada), else kolom ke-3
        const statusCell = cells[3] || cells[2];
        const statusBadge = statusCell.querySelector('[class*="badge"]');
        const statusClass = statusBadge ? statusBadge.className : '';
        const statusText = statusBadge ? statusBadge.textContent.trim() : statusCell.textContent.trim();
        // ok = hijau (badge-success) ATAU teks OK ATAU mengandung Layak
        const ok = statusClass.includes('badge-success') ||
                   statusClass.includes('text-success') ||
                   statusText === 'OK' ||
                   statusText.includes('Layak') ||
                   /^OK/i.test(statusText);
        indikator.push({ no, nama, keterangan: ket, ok });
      }
    }

    return { radialText, layakText, indikator };
  });

  // Normalisasi: pasang fallback radialText "11/11" → layak
  const totalOk = result.indikator.filter(i => i.ok).length;
  const total = result.indikator.length;
  const layak = /Layak/i.test(result.layakText) || (total >= 11 && totalOk >= 11);
  return {
    layak,
    totalOk,
    total,
    indikator: result.indikator,
    layakText: result.layakText,
    radialText: result.radialText || `${totalOk}/${total}`,
  };
}

// ================= MAIN =================
// ================= DB WRITE (per-akun, tahan gangguan) =================
const insertStmt = db.prepare(`
  INSERT INTO skakpt (ptk_id, periode, bulan, status, tgl_verifikasi, detail)
  VALUES (@ptk_id, '2026/Semester 1', @bulan, @status, datetime('now','localtime'), @detail)
`);
const upsertStmt = db.prepare(`
  UPDATE skakpt SET status = @status, tgl_verifikasi = datetime('now','localtime'), detail = @detail
  WHERE ptk_id = @ptk_id AND bulan = @bulan
`);
const findStmt = db.prepare('SELECT id FROM skakpt WHERE ptk_id = ? AND bulan = ?');

function saveResultToDb(r) {
  const status = r.layak ? 'Disetujui' : 'Belum Layak';
  const detailJson = JSON.stringify({
    layak: r.layak,
    totalOk: r.totalOk,
    total: r.total,
    indikator_unmet: r.indikator_unmet,
    indikator: r.indikator,
    bukti: r.bukti,
  });
  const row = { ptk_id: r.ptk_id, bulan: r.bulan, status, detail: detailJson };
  const existing = findStmt.get(r.ptk_id, r.bulan);
  if (existing) upsertStmt.run(row);
  else insertStmt.run(row);
}

/** Proses 1 akun: login → SKAKPT → ekstrak. Dengan retry (max 2x). */
async function processAccount(browser, account) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'id-ID' });
    const page = await context.newPage();
    try {
      await login(page, account);
      await page.goto(SKAKPT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);

      // Set bulan kalau dropdown ada
      const bulanChanged = await setBulan(page, BULAN);
      if (bulanChanged) console.log(`  ✅ Bulan: ${BULAN}`);
      else console.log(`  ⚠️  Dropdown bulan tak tersedia, pakai default`);

      // Verifikasi halaman benar
      const hasSkakpt = await page.evaluate(() => document.body.textContent.includes('SKAKPT'));
      if (!hasSkakpt) throw new Error('Halaman SKAKPT tidak ditemukan');

      const data = await extractIndikator(page);
      const buktiPath = await screenshot(page, `skakpt-${BULAN.replace(/[^a-z0-9]/gi, '-')}-${account.nama.replace(/[^a-z0-9]/gi, '_')}`);

      return {
        ptk_id: account.id,
        nama: account.nama,
        user: account.user,
        bulan: BULAN,
        layak: data.layak,
        totalOk: data.totalOk,
        total: data.total,
        indikator_unmet: data.indikator.filter(i => !i.ok).map(u => ({ no: u.no, nama: u.nama, keterangan: u.keterangan })),
        indikator: data.indikator,
        layakText: data.layakText,
        radialText: data.radialText,
        bukti: buktiPath ? path.relative(process.cwd(), buktiPath) : '',
        detail: data,
      };
    } catch (e) {
      console.log(`  ⚠️  Percobaan ${attempt} gagal: ${e.message}`);
      await screenshot(page, `error-${account.nama.replace(/[^a-z0-9]/gi, '_')}`).catch(() => {});
      if (attempt === 2) throw e;
    } finally {
      await context.close();
    }
    await sleep(2000);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--start-maximized'],
  });

  const results = [];
  const failures = [];
  const CONCURRENCY = 3;
  let index = 0;

  async function worker() {
    while (index < accounts.length) {
      const account = accounts[index++];
      console.log(`\n--- ${account.nama} (${account.user}) ---`);
      try {
        const r = await processAccount(browser, account);
        console.log(`  📊 ${r.radialText} | ${r.totalOk}/${r.total} hijau | layak=${r.layak}`);
        if (r.indikator_unmet.length > 0) {
          console.log(`  ⚠️  ${r.indikator_unmet.length} indikator BELUM terpenuhi:`);
          r.indikator_unmet.forEach(u => console.log(`      - [#${u.no}] ${u.nama}: ${u.keterangan || 'N/A'}`));
        } else {
          console.log(`  ✅ SEMUA ${r.total} indikator terpenuhi (hijau)`);
        }
        if (r.bukti) console.log(`  📸 Bukti: ${r.bukti}`);
        results.push(r);
        saveResultToDb(r); // SIMPAN PER-AKUN → tahan kalau proses terputus
        console.log(`  💾 Tersimpan ke DB`);
      } catch (e) {
        console.log(`  ❌ GAGAL: ${e.message}`);
        failures.push({ ptk_id: account.id, nama: account.nama, error: e.message });
      }
      await sleep(1500); // jeda antar akun
    }
  }

  // Jalankan N worker paralel (context terpisah per akun di dalam processAccount)
  const workers = Array.from({ length: Math.min(CONCURRENCY, accounts.length) }, () => worker());
  await Promise.all(workers);

  await browser.close();

  // ================= SIMPAN JSON =================
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const outFile = path.join(OUT_DIR, `skakpt-${BULAN.replace(/[^a-z0-9]/gi, '-')}-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ bulan: BULAN, scrapedAt: now.toISOString(), results, failures }, null, 2));
  console.log(`\n📄 Hasil disimpan: ${outFile}`);

  // ================= LAPORAN TXT (manusiawi) =================
  const reportFile = path.join(OUT_DIR, `laporan-skakpt-${BULAN.replace(/[^a-z0-9]/gi, '-')}-${stamp}.txt`);
  const notLayakRpt = results.filter(r => !r.layak);
  const lines = [];
  lines.push('==================================================================');
  lines.push(`  LAPORAN KELAYAKAN TPG / SKAKPT — ${BULAN}`);
  lines.push(`  Tanggal: ${now.toLocaleString('id-ID')}`);
  lines.push('==================================================================');
  lines.push(`  Total PTK bersertifikasi: ${results.length}`);
  lines.push(`  Layak (11/11 hijau): ${results.length - notLayakRpt.length}`);
  lines.push(`  Belum layak: ${notLayakRpt.length}`);
  lines.push('');
  lines.push('--------------------------------------------------------------------------');
  lines.push('  ⚠️  PTK YANG BELUM LAYAK / ADA INDIKATOR MERAH');
  lines.push('--------------------------------------------------------------------------');
  if (notLayakRpt.length === 0) {
    lines.push('  (tidak ada — semua PTK layak menerima TPG)');
  } else {
    notLayakRpt.forEach((r, i) => {
      lines.push('');
      lines.push(`  ${i + 1}. ${r.nama} — ${r.totalOk}/${r.total} indikator`);
      lines.push(`     Akun: ${r.user} | Bukti screenshot: ${r.bukti || 'N/A'}`);
      r.indikator_unmet.forEach(u => {
        lines.push(`        ❌ [#${u.no}] ${u.nama}: ${u.keterangan || 'N/A'}`);
      });
    });
  }
  lines.push('');
  lines.push('--------------------------------------------------------------------------');
  lines.push('  ✅ SEMUA PTK (untuk arsip)');
  lines.push('--------------------------------------------------------------------------');
  results.forEach(r => {
    lines.push(`  ${r.layak ? '✓' : '✗'} ${r.nama.padEnd(38)} ${r.totalOk}/${r.total}  ${r.bukti ? '' : ''}`);
  });
  if (failures.length > 0) {
    lines.push('');
    lines.push(`  ❌ GAGAL scraping (${failures.length}):`);
    failures.forEach(r => lines.push(`     - ${r.nama}: ${r.error}`));
  }
  fs.writeFileSync(reportFile, lines.join('\n') + '\n');
  console.log(`📄 Laporan: ${reportFile}\n`);

  // ================= RANGKUMAN AKHIR =================
  console.log(`\n========== RANGKUMAN (${BULAN}) ==========`);
  const layakCount = results.filter(r => r.layak).length;
  console.log(`Layak TPG: ${layakCount}/${results.length}`);

  const notLayak = results.filter(r => !r.layak);
  if (notLayak.length > 0) {
    console.log(`\n⚠️  PTK yang BELUM layak / ada indikator merah:`);
    notLayak.forEach(r => {
      console.log(`  - ${r.nama} (${r.totalOk}/${r.total})`);
      r.indikator_unmet.forEach(u => console.log(`      ❌ #${u.no} ${u.nama}: ${u.keterangan || 'N/A'}`));
    });
  } else {
    console.log(`\n✅ SEMUA PTK layak menerima TPG (11/11 hijau)`);
  }

  if (failures.length > 0) {
    console.log(`\n❌ GAGAL scraping ${failures.length} akun:`);
    failures.forEach(f => console.log(`  - ${f.nama}: ${f.error}`));
  }

  return { ok: failures.length === 0, results, failures };
}

main().then(r => {
  process.exit(r.ok ? 0 : 1);
}).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
