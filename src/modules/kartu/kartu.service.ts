import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';

const execFileAsync = promisify(execFile);

// ============================================
// KARTU DIR & PATHS
// ============================================

function kartuDir(): string {
	return join(process.cwd(), 'data', 'kartu');
}

function kartuPath(id: string): string {
	return join(kartuDir(), `${id}.png`);
}

function kartuBackPath(id: string): string {
	return join(kartuDir(), `${id}-back.png`);
}

function staticPath(rel: string): string {
	return join(process.cwd(), 'static', rel);
}

// ============================================
// KARTU DATA QUERY
// ============================================

interface SiswaKartu {
	id: string;
	nama: string;
	nisn: string;
	jk: string;
	kelas: string;
	rombel: string;
	tempat_lahir: string;
	tgl_lahir: string;
	foto_path: string;
}

export function getSiswaKartu(id: string): SiswaKartu | null {
	const row = db.all(sql`
		SELECT id, nama, nisn, jk, kelas, rombel, tempat_lahir, tgl_lahir, foto_path
		FROM siswa WHERE id = ${id}
	`)[0] as any;
	if (!row) return null;
	return {
		id: String(row.id),
		nama: row.nama || '',
		nisn: row.nisn || '',
		jk: row.jk || '',
		kelas: row.kelas || '',
		rombel: row.rombel || '',
		tempat_lahir: row.tempat_lahir || '',
		tgl_lahir: row.tgl_lahir || '',
		foto_path: row.foto_path || '',
	};
}

// ============================================
// IMAGE UTILS
// ============================================

function readImageDataURL(filePath: string): string {
	try {
		const data = readFileSync(filePath);
		const ext = extname(filePath).toLowerCase();
		let mime = 'image/png';
		if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
		else if (ext === '.gif') mime = 'image/gif';
		return `data:${mime};base64,${data.toString('base64')}`;
	} catch {
		return '';
	}
}

function formatTglID(tgl: string): string {
	const parts = tgl.split('-');
	if (parts.length !== 3) return tgl;
	const bulan = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
	];
	const y = parseInt(parts[0], 10);
	const m = parseInt(parts[1], 10);
	const d = parseInt(parts[2], 10);
	if (m < 1 || m > 12) return tgl;
	return `${d} ${bulan[m - 1]} ${y}`;
}

function titleCase(s: string): string {
	return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// ============================================
// HTML DATA BUILDER
// ============================================

interface KartuHTMLData {
	Nama: string;
	NISN: string;
	Gender: string;
	Kelas: string;
	TempatLahir: string;
	TglLahir: string;
	LogoDataURL: string;
	FotoDataURL: string;
	Initials: string;
}

function buildKartuHTMLData(d: SiswaKartu): KartuHTMLData {
	const logoPath = staticPath('uploads/logo-kemenag.png');
	const foto = d.foto_path ? readImageDataURL(staticPath(d.foto_path)) : '';

	// initials
	let initialsStr = '?';
	const parts = d.nama.toUpperCase().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		initialsStr = parts[0][0] + parts[1][0];
	} else if (parts.length === 1 && parts[0].length > 0) {
		initialsStr = parts[0][0];
	}

	const genderLabel = d.jk === 'L' ? 'Laki-laki' : d.jk === 'P' ? 'Perempuan' : '—';
	const kelasRombel = `${d.kelas} ${d.rombel}`.trim();

	return {
		Nama: d.nama.toUpperCase(),
		NISN: d.nisn,
		Gender: genderLabel,
		Kelas: kelasRombel,
		TempatLahir: titleCase(d.tempat_lahir),
		TglLahir: formatTglID(d.tgl_lahir),
		LogoDataURL: readImageDataURL(logoPath),
		FotoDataURL: foto,
		Initials: initialsStr,
	};
}

// ============================================
// HTML GENERATORS
// ============================================

function generateKartuHTML(d: KartuHTMLData): string {
	const fotoSection = d.FotoDataURL
		? `<img src="${d.FotoDataURL}" alt="Foto" />`
		: `<span class="initials">${d.Initials}</span>`;

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .card {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    width: 85mm;
    height: 55mm;
    padding: 4mm;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 3mm;
    border: 1px solid #d1b56a;
    color: #173d2b;
  }
  .orbit {
    position: absolute;
    width: 34mm;
    height: 34mm;
    right: -15mm;
    top: -17mm;
    border-radius: 50%;
    background: #e8f1e9;
    border: 5mm solid #f5ead0;
  }
  header { display: flex; align-items: center; gap: 3mm; z-index: 1; }
  header img { width: 11mm; height: 11mm; object-fit: contain; }
  header div { flex: 1; }
  .kicker { font-size: 5.3pt; letter-spacing: 0.55pt; margin: 0; font-weight: 700; }
  .school { font-size: 10pt; letter-spacing: 0.2pt; font-weight: 900; margin: 1pt 0; }
  .meta { font-size: 5pt; color: #6b786f; letter-spacing: 0.35pt; margin: 0; }
  .rule {
    height: 1.2pt; margin: 2.5mm 0 2.8mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, transparent);
  }
  section { display: flex; gap: 3mm; flex: 1; z-index: 1; }
  .photo {
    width: 22mm; height: 27mm; flex-shrink: 0; border-radius: 1.5mm;
    border: 1pt solid #c9ae62; box-sizing: border-box; overflow: hidden;
    display: grid; place-items: center;
    background: linear-gradient(145deg, #dbeadf, #f3f7ee);
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .photo .initials { font-size: 16pt; font-weight: 900; color: #276044; }
  .data { flex: 1; min-width: 0; }
  .name {
    font-size: 11pt; line-height: 1.05; font-weight: 900; text-transform: uppercase;
    margin: 0 0 2.5mm; max-width: 48mm; overflow: hidden;
  }
  .data > div { display: flex; gap: 2mm; align-items: baseline; margin: 1.1mm 0; font-size: 6.2pt; }
  .data span {
    width: 20mm; flex-shrink: 0; color: #77857b; font-size: 5.2pt;
    letter-spacing: 0.35pt; font-weight: 700;
  }
  .data strong { font-size: 6.8pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .data .birth strong { font-size: 5.7pt; }
  footer {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid #e1d6b8; padding-top: 1.7mm;
    color: #758078; font-size: 4.8pt; letter-spacing: 0.2pt; z-index: 1;
  }
  footer strong { color: #b38732; font-size: 5pt; }
</style>
</head>
<body>
<div class="card">
  <div class="orbit"></div>
  <header>
    <img src="${d.LogoDataURL}" alt="Logo Kementerian Agama" />
    <div>
      <p class="kicker">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
      <p class="school">MTsN 2 KOLAKA UTARA</p>
      <p class="meta">NSM 121174080002 · NPSN 40406031</p>
    </div>
  </header>
  <div class="rule"></div>
  <section>
    <div class="photo">${fotoSection}</div>
    <div class="data">
      <p class="name">${d.Nama}</p>
      <div><span>NISN</span><strong>${d.NISN}</strong></div>
      <div><span>KELAS</span><strong>${d.Kelas}</strong></div>
      <div><span>JENIS KELAMIN</span><strong>${d.Gender}</strong></div>
      <div class="birth"><span>LAHIR</span><strong>${d.TempatLahir}, ${d.TglLahir}</strong></div>
    </div>
  </section>
  <footer>
    <span>BERLAKU SELAMA TERDAFTAR</span>
    <strong>TA 2026 / 2027</strong>
  </footer>
</div>
</body>
</html>`;
}

async function generateKartuBackHTML(d: KartuHTMLData): Promise<string> {
	let qrImg = '';
	try {
		const qrDataUrl = await QRCode.toDataURL(d.NISN, { width: 200, margin: 1 });
		qrImg = `<img src="${qrDataUrl}" alt="QR" />`;
	} catch {
		qrImg = `<span class="qr-fallback">QR</span>`;
	}

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .card {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    width: 85mm;
    height: 55mm;
    padding: 4mm;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 3mm;
    border: 1px solid #d1b56a;
    color: #173d2b;
  }
  .watermark {
    position: absolute;
    width: 50mm;
    height: 50mm;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.06;
    z-index: 0;
  }
  .watermark img { width: 100%; height: 100%; object-fit: contain; }
  .stripe {
    height: 1.5mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, #b38732);
    margin: 0 0 3mm;
    border-radius: 0.5mm;
    z-index: 1;
  }
  .stripe-bottom {
    height: 1.5mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, #b38732);
    margin: auto 0 0;
    border-radius: 0.5mm;
    z-index: 1;
  }
  .content {
    flex: 1;
    display: flex;
    gap: 3mm;
    z-index: 1;
  }
  .info { flex: 1; min-width: 0; }
  .info p {
    font-size: 5.5pt;
    margin: 1.2mm 0;
    line-height: 1.35;
    color: #3a5040;
  }
  .info .label {
    font-size: 4.8pt;
    color: #77857b;
    font-weight: 700;
    letter-spacing: 0.3pt;
    text-transform: uppercase;
  }
  .info .value { font-weight: 600; }
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5mm;
    flex-shrink: 0;
  }
  .qr-section img {
    width: 16mm;
    height: 16mm;
    object-fit: contain;
  }
  .qr-fallback {
    width: 16mm;
    height: 16mm;
    display: grid;
    place-items: center;
    border: 1pt dashed #c9ae62;
    font-size: 5pt;
    color: #77857b;
  }
  .qr-label {
    font-size: 4.2pt;
    color: #77857b;
    letter-spacing: 0.2pt;
    text-align: center;
  }
  .notes {
    z-index: 1;
    border-top: 0.8pt solid #e1d6b8;
    padding-top: 2mm;
    margin-top: 2mm;
  }
  .notes p {
    font-size: 4.3pt;
    color: #758078;
    line-height: 1.4;
    margin: 0.5mm 0;
  }
  .notes strong { color: #3a5040; }
  .student-id {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    z-index: 1;
    margin-bottom: 2mm;
  }
  .student-name {
    font-size: 7pt;
    font-weight: 900;
    text-transform: uppercase;
    color: #173d2b;
    letter-spacing: 0.3pt;
  }
  .student-nisn {
    font-size: 5pt;
    color: #77857b;
    font-weight: 700;
    letter-spacing: 0.2pt;
  }
</style>
</head>
<body>
<div class="card">
  <div class="watermark"><img src="${d.LogoDataURL}" alt="" /></div>
  <div class="stripe"></div>
  <div class="student-id">
    <span class="student-name">${d.Nama}</span>
    <span class="student-nisn">NISN: ${d.NISN}</span>
  </div>
  <div class="content">
    <div class="info">
      <p><span class="label">Alamat</span><br/><span class="value">Jl. Lalume No. 42 Kelurahan Olo-Oloho<br/>Kec. Pakue, Kab. Kolaka Utara<br/>Sulawesi Tenggara 93954</span></p>
      <p><span class="label">Website</span> <span class="value">mtsn2kolut.sch.id</span></p>
      <p><span class="label">Email</span> <span class="value">mtsn.pakue@gmail.com</span></p>
    </div>
    <div class="qr-section">
      ${qrImg}
      <span class="qr-label">Scan untuk<br/>verifikasi data</span>
    </div>
  </div>
  <div class="notes">
    <p><strong>Ketentuan:</strong> Kartu ini berlaku selama terdaftar sebagai siswa MTsN 2 Kolaka Utara. Harap dikembalikan jika sudah tidak menempuh pendidikan. Kartu tidak dapat dialihkan ke orang lain.</p>
  </div>
  <div class="stripe-bottom"></div>
</div>
</body>
</html>`;
}

// ============================================
// PLAYWRIGHT RENDERING
// ============================================

async function renderHTMLToPNG(html: string, outputPath: string): Promise<void> {
	const tmpFile = join(process.env.TEMP || '/tmp', `kartu-${randomBytes(8).toString('hex')}.html`);
	writeFileSync(tmpFile, html, 'utf-8');

	try {
		const scriptPath = join(process.cwd(), 'scripts', 'kartu-screenshot.mjs');
		await execFileAsync('node', [scriptPath, tmpFile, outputPath], {
			timeout: 60_000,
			cwd: process.cwd(),
		});
	} finally {
		try { unlinkSync(tmpFile); } catch {}
	}
}

// ============================================
// CACHE VALIDATION
// ============================================

function kartuFresh(id: string, fotoPath: string): boolean {
	try {
		const ks = statSync(kartuPath(id));
		if (fotoPath) {
			try {
				const fm = statSync(staticPath(fotoPath));
				if (ks.mtime < fm.mtime) return false;
			} catch {}
		}
		return true;
	} catch {
		return false;
	}
}

function kartuBackFresh(id: string, fotoPath: string): boolean {
	try {
		const ks = statSync(kartuBackPath(id));
		if (fotoPath) {
			try {
				const fm = statSync(staticPath(fotoPath));
				if (ks.mtime < fm.mtime) return false;
			} catch {}
		}
		return true;
	} catch {
		return false;
	}
}

// ============================================
// PUBLIC RENDER FUNCTIONS
// ============================================

export async function renderKartuToFile(id: string, d: KartuHTMLData): Promise<void> {
	const html = generateKartuHTML(d);
	const out = kartuPath(id);
	mkdirSync(kartuDir(), { recursive: true });
	await renderHTMLToPNG(html, out);
}

export async function renderKartuBackToFile(id: string, d: KartuHTMLData): Promise<void> {
	const html = await generateKartuBackHTML(d);
	const out = kartuBackPath(id);
	mkdirSync(kartuDir(), { recursive: true });
	await renderHTMLToPNG(html, out);
}

// ============================================
// PUBLIC SERVE FUNCTIONS
// ============================================

export function getKartuPNG(id: string): Buffer | null {
	try {
		return readFileSync(kartuPath(id));
	} catch {
		return null;
	}
}

export function getKartuBackPNG(id: string): Buffer | null {
	try {
		return readFileSync(kartuBackPath(id));
	} catch {
		return null;
	}
}

export function isKartuFresh(id: string, fotoPath: string): boolean {
	return kartuFresh(id, fotoPath);
}

export function isKartuBackFresh(id: string, fotoPath: string): boolean {
	return kartuBackFresh(id, fotoPath);
}

// ============================================
// KARTU LIST
// ============================================

export interface KartuListItem {
	id: number;
	nama: string;
	kelas: string;
	rombel: string;
	foto_path: string;
	has_kartu: boolean;
	has_kartu_back: boolean;
}

export function getKartuList(): KartuListItem[] {
	const rows = db.all(sql`
		SELECT id, nama, kelas, rombel, foto_path FROM siswa
		WHERE foto_path IS NOT NULL AND foto_path != ''
		  AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')
		ORDER BY CAST(kelas AS INTEGER), rombel, nama
	`) as any[];

	return rows.map((r) => {
		const idStr = String(r.id);
		return {
			id: r.id,
			nama: r.nama || '',
			kelas: r.kelas || '',
			rombel: r.rombel || '',
			foto_path: r.foto_path || '',
			has_kartu: existsSync(kartuPath(idStr)),
			has_kartu_back: existsSync(kartuBackPath(idStr)),
		};
	});
}

// ============================================
// SINGLE GENERATE + SERVE
// ============================================

export async function generateAndServeKartu(id: string): Promise<{ png: Buffer; type: 'front' | 'back' } | null> {
	const sd = getSiswaKartu(id);
	if (!sd) return null;
	const d = buildKartuHTMLData(sd);
	await renderKartuToFile(id, d);
	await renderKartuBackToFile(id, d);
	const png = getKartuPNG(id);
	return png ? { png, type: 'front' } : null;
}

export async function getOrGenerateKartu(id: string): Promise<Buffer | null> {
	const sd = getSiswaKartu(id);
	if (!sd) return null;
	const d = buildKartuHTMLData(sd);
	const fotoPath = sd.foto_path;
	if (!kartuFresh(id, fotoPath)) {
		await renderKartuToFile(id, d);
	}
	return getKartuPNG(id);
}

export async function getOrGenerateKartuBack(id: string): Promise<Buffer | null> {
	const sd = getSiswaKartu(id);
	if (!sd) return null;
	const d = buildKartuHTMLData(sd);
	const fotoPath = sd.foto_path;
	if (!kartuBackFresh(id, fotoPath)) {
		await renderKartuBackToFile(id, d);
	}
	return getKartuBackPNG(id);
}

export async function regenerateKartu(id: string): Promise<boolean> {
	const sd = getSiswaKartu(id);
	if (!sd) return false;
	const d = buildKartuHTMLData(sd);
	await renderKartuToFile(id, d);
	await renderKartuBackToFile(id, d);
	return true;
}

// ============================================
// IN-MEMORY JOB QUEUE
// ============================================

interface Job {
	id: string;
	siswa_id: string;
	nama: string;
	status: 'pending' | 'processing' | 'done' | 'failed';
	error?: string;
	retries: number;
	created_at: Date;
	done_at?: Date;
}

interface BatchJob {
	id: string;
	status: 'processing' | 'completed';
	total: number;
	done: number;
	failed: number;
	created_at: Date;
	done_at?: Date;
	jobs: Map<string, Job>;
}

const MAX_WORKERS = 3;
const MAX_RETRIES = 3;
const batches = new Map<string, BatchJob>();
const pendingQueue: Job[] = [];
let workersRunning = false;

function processNextJob() {
	if (pendingQueue.length === 0) return;
	const job = pendingQueue.shift();
	if (!job) return;

	job.status = 'processing';

	const sd = getSiswaKartu(job.siswa_id);
	if (!sd) {
		failJob(job, 'siswa not found');
		return;
	}

	const d = buildKartuHTMLData(sd);

	renderKartuToFile(job.siswa_id, d)
		.then(() => renderKartuBackToFile(job.siswa_id, d))
		.then(() => {
			job.status = 'done';
			job.done_at = new Date();
			markJobDone(job);
		})
		.catch((err) => {
			if (job.retries < MAX_RETRIES) {
				job.retries++;
				job.status = 'pending';
				pendingQueue.push(job);
				scheduleProcess();
			} else {
				failJob(job, String(err));
			}
		});
}

function failJob(job: Job, errMsg: string) {
	job.status = 'failed';
	job.error = errMsg;
	job.done_at = new Date();
	markJobFailed(job);
}

function markJobDone(job: Job) {
	for (const batch of batches.values()) {
		if (batch.jobs.has(job.id)) {
			batch.done++;
			if (batch.done + batch.failed >= batch.total) {
				batch.status = 'completed';
				batch.done_at = new Date();
			}
			return;
		}
	}
}

function markJobFailed(job: Job) {
	for (const batch of batches.values()) {
		if (batch.jobs.has(job.id)) {
			batch.failed++;
			if (batch.done + batch.failed >= batch.total) {
				batch.status = 'completed';
				batch.done_at = new Date();
			}
			return;
		}
	}
}

function scheduleProcess() {
	if (!workersRunning) {
		workersRunning = true;
		runWorkers();
	}
}

function runWorkers() {
	const run = () => {
		if (pendingQueue.length === 0) {
			workersRunning = false;
			return;
		}
		const active = Array.from(batches.values()).flatMap((b) =>
			Array.from(b.jobs.values()).filter((j) => j.status === 'processing')
		).length;
		if (active < MAX_WORKERS) {
			processNextJob();
		}
		setTimeout(run, 100);
	};
	run();
}

export function enqueueBatch(siswaList: { id: number; nama: string }[]): BatchJob {
	const batch: BatchJob = {
		id: `batch-${Date.now()}`,
		status: 'processing',
		total: siswaList.length,
		done: 0,
		failed: 0,
		created_at: new Date(),
		jobs: new Map(),
	};
	batches.set(batch.id, batch);

	for (const s of siswaList) {
		const job: Job = {
			id: `job-${Date.now()}-${s.id}`,
			siswa_id: String(s.id),
			nama: s.nama,
			status: 'pending',
			retries: 0,
			created_at: new Date(),
		};
		batch.jobs.set(job.id, job);
		pendingQueue.push(job);
	}

	scheduleProcess();
	return batch;
}

export function enqueueSingle(siswaID: string, nama: string): { job: Job; batch: BatchJob } {
	const job: Job = {
		id: `job-${Date.now()}-${siswaID}`,
		siswa_id: siswaID,
		nama,
		status: 'pending',
		retries: 0,
		created_at: new Date(),
	};

	const batch: BatchJob = {
		id: job.id,
		status: 'processing',
		total: 1,
		done: 0,
		failed: 0,
		created_at: new Date(),
		jobs: new Map([[job.id, job]]),
	};
	batches.set(batch.id, batch);
	pendingQueue.push(job);

	scheduleProcess();
	return { job, batch };
}

export function getBatchStatus(batchID: string): BatchJob | null {
	return batches.get(batchID) || null;
}

export function cancelBatch(batchID: string): number {
	const batch = batches.get(batchID);
	if (!batch) return 0;

	let cancelled = 0;
	for (const job of batch.jobs.values()) {
		if (job.status === 'pending') {
			job.status = 'failed';
			job.error = 'cancelled';
			job.done_at = new Date();
			batch.failed++;
			cancelled++;
		}
	}

	if (batch.done + batch.failed >= batch.total) {
		batch.status = 'completed';
		batch.done_at = new Date();
	}

	return cancelled;
}

// ============================================
// GENERATE ALL (batch)
// ============================================

export function getAllActiveSiswaWithFoto(): { id: number; nama: string }[] {
	const rows = db.all(sql`
		SELECT id, nama FROM siswa
		WHERE foto_path IS NOT NULL AND foto_path != ''
		  AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')
		ORDER BY CAST(kelas AS INTEGER), rombel, nama
	`) as any[];
	return rows.map((r: any) => ({ id: r.id, nama: r.nama || '' }));
}
