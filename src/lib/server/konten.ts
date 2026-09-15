import { db } from '$lib/server/db';
import { ptk } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { UserSession } from '$modules/auth/auth.validation';

/** Apakah user boleh mengelola konten milik `authorUserId`? */
export function canManageContent(user: UserSession, authorUserId: number | null): boolean {
	if (user.role === 'admin' || user.role === 'kepsek') return true;
	return authorUserId != null && authorUserId === user.userId;
}

/** Guru adalah kontributor: karyanya wajib lewat moderasi (selalu draft). */
export function isKontributor(user: UserSession): boolean {
	return user.role === 'guru';
}

/** Nama penulis untuk ditampilkan (nama PTK bila tertaut, jika tidak username). */
export function actorNama(user: UserSession): string {
	if (user.ref_id) {
		const p = db.select({ nama: ptk.nama }).from(ptk).where(eq(ptk.id, user.ref_id)).get();
		if (p?.nama) return p.nama;
	}
	return user.username;
}
