import * as v from 'valibot';

/** Nama arsip wajib berpola — mencegah path traversal lewat argumen command. */
export const backupNameSchema = v.pipe(
	v.string(),
	v.regex(/^simad-backup-\d{8}-\d{6}-(ui|cron|pre-restore)\.zip$/, 'Nama arsip tidak valid.')
);

/** Nama berkas unggahan restore (di data/restore/incoming). */
export const stagedNameSchema = v.pipe(
	v.string(),
	v.regex(/^[A-Za-z0-9._-]+\.zip$/, 'Nama berkas unggahan tidak valid.')
);

export const emptySchema = v.object({});

export const uploadSchema = v.object({
	fileName: v.string(),
	fileSize: v.number()
});

export const stagedSchema = v.object({ staged: stagedNameSchema });
