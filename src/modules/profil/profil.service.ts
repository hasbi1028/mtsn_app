import { db } from '$lib/server/db';
import { users, ptk, roster } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { UserSession } from '$modules/auth/auth.validation';

export interface ProfilSaya {
	akun: {
		username: string;
		role: string;
		isActive: number | null;
		mustChangePassword: boolean;
		lastLogin: string | null;
	};
	ptk: typeof ptk.$inferSelect | null;
	roster: (typeof roster.$inferSelect)[];
}

/** Profil role staf (admin/kepsek/guru/staf): data akun + PTK (bila tertaut). */
export function getProfilSaya(user: UserSession): ProfilSaya | null {
	const akun = db.select().from(users).where(eq(users.id, user.userId)).get();
	if (!akun) return null;

	const ptkRow = user.ref_id
		? (db.select().from(ptk).where(eq(ptk.id, user.ref_id)).get() ?? null)
		: null;

	const rosterList = ptkRow
		? db.select().from(roster).where(eq(roster.guruNama, ptkRow.nama)).all()
		: [];

	return {
		akun: {
			username: akun.username,
			role: akun.role,
			isActive: akun.isActive,
			mustChangePassword: !!akun.mustChangePassword,
			lastLogin: akun.lastLogin
		},
		ptk: ptkRow,
		roster: rosterList
	};
}
