/**
 * Remote function modul Backup & Restore (spec 027).
 *
 * UI TIDAK boleh memanggil endpoint /api/backup/... lewat fetch — structural guard
 * (tests/e2e/full-remote.spec.ts) melarang pola itu. Satu-satunya endpoint biner
 * adalah /api/backup/[name]/download (dipakai lewat <a href>, bukan fetch).
 *
 * Unggah ZIP memakai `form()` (bukan `command()`) karena SvelteKit mengirim
 * argumen command sebagai JSON — berkas hanya terkirim lewat form remote.
 */
import { command, form, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as v from 'valibot';
import { formatStamp, safeJoin, walkFiles } from '../../lib/server/backup/guards';
import { APP_VERSION, BACKUP_DIR, INCOMING_DIR, UPLOADS_DIR, gitCommit } from '../../lib/server/paths';
import {
	createBackup,
	deleteBackup,
	inspectArchive,
	listBackups,
	prepareRestore,
	readPending,
	readRestoreStatus
} from './backup.service';
import { backupNameSchema, emptySchema, stagedSchema } from './backup.validation';

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

interface Aktor {
	username: string;
	role: string;
}

function userAktif(): Aktor | null {
	const { locals } = getRequestEvent();
	return (locals as unknown as { user?: Aktor }).user ?? null;
}

function requireAdmin(): Aktor {
	const user = userAktif();
	if (!user) throw error(401, 'Tidak terautentikasi.');
	if (user.role !== 'admin') throw error(403, 'Hanya admin yang boleh mengakses backup & restore.');
	return user;
}

/* ── Query ───────────────────────────────────────────────── */

export const getBackupStateQ = query(async () => {
	const user = userAktif();
	const meta = { backupDir: BACKUP_DIR, incomingDir: INCOMING_DIR, appVersion: APP_VERSION, gitCommit: gitCommit() };
	if (!user || user.role !== 'admin') {
		return { allowed: false, items: [], lastResult: null, pending: null, uploads: { filesTotal: 0 }, meta };
	}
	return {
		allowed: true,
		items: await listBackups(),
		lastResult: await readRestoreStatus(),
		pending: await readPending(),
		uploads: { filesTotal: walkFiles(UPLOADS_DIR).length },
		meta
	};
});

/* ── Command: backup ─────────────────────────────────────── */

export const createBackupC = command(emptySchema, async () => {
	const user = requireAdmin();
	const info = await createBackup({ source: 'ui', by: user.username });
	return {
		ok: true as const,
		name: info.name,
		bytes: info.bytes,
		pesan: `Backup ${info.name} selesai — ${info.manifest.filesTotal} file, ${info.manifest.dbRowCounts.siswa ?? 0} siswa.`
	};
});

export const deleteBackupC = command(backupNameSchema, async (name) => {
	requireAdmin();
	await deleteBackup(name);
	return { ok: true as const, pesan: `Arsip ${name} dihapus.` };
});

/* ── Form: unggah ZIP restore (unggah + validasi sekaligus) ─ */

export const uploadRestoreForm = form(
	v.object({ file: v.instance(File) }),
	async ({ file }) => {
		try {
			requireAdmin();
		} catch (e) {
			return { ok: false as const, error: (e as { body?: { message?: string } })?.body?.message ?? 'Akses ditolak.' };
		}
		if (!file.name.toLowerCase().endsWith('.zip')) {
			return { ok: false as const, error: 'Hanya berkas .zip yang diterima.' };
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			return { ok: false as const, error: 'Ukuran berkas melebihi 200 MB.' };
		}
		const staged = `unggahan-${formatStamp()}.zip`;
		try {
			await mkdir(INCOMING_DIR, { recursive: true });
			await writeFile(safeJoin(INCOMING_DIR, staged), Buffer.from(await file.arrayBuffer()));
			const inspeksi = await inspectArchive(staged);
			return {
				ok: true as const,
				staged,
				pesan: 'Arsip terunggah dan lolos validasi.',
				inspeksi
			};
		} catch (e) {
			return { ok: false as const, error: e instanceof Error ? e.message : 'Arsip tidak bisa divalidasi.' };
		}
	}
);

/* ── Command: restore ────────────────────────────────────── */

export const inspectRestoreC = command(stagedSchema, async ({ staged }) => {
	requireAdmin();
	return { ok: true as const, inspeksi: await inspectArchive(staged) };
});

export const prepareRestoreC = command(stagedSchema, async ({ staged }) => {
	const user = requireAdmin();
	const pending = await prepareRestore(staged, user.username);
	return {
		ok: true as const,
		pending,
		pesan: `Rencana restore siap. Snapshot pengaman: ${pending.preRestoreName}`
	};
});

export const hapusUnggahanC = command(stagedSchema, async ({ staged }) => {
	requireAdmin();
	await rm(safeJoin(INCOMING_DIR, staged), { force: true });
	return { ok: true as const, pesan: 'Berkas unggahan dibersihkan.' };
});
