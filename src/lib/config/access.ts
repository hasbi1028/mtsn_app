/**
 * Matriks akses rute admin — satu sumber kebenaran.
 *
 * Dipakai `hooks.server.ts` untuk menolak navigasi halaman yang bukan hak role.
 * Catatan: ini HANYA melindungi navigasi halaman. Pemanggilan remote function
 * tidak melewati guard ini (endpoint-nya bukan `/admin/*`), jadi setiap remote
 * tetap wajib memakai `requireRole()` dari `$lib/server/guard`.
 */

export const STAFF_ROLES = ['admin', 'kepsek', 'guru', 'staf'];

export interface RouteRule {
	prefix: string;
	roles: string[];
}

/** Urutan tidak penting — pencocokan memakai prefix terpanjang. */
export const ROUTE_RULES: RouteRule[] = [
	{ prefix: '/admin/profil', roles: [...STAFF_ROLES, 'siswa', 'ortu'] },
	{ prefix: '/admin/siswa/profil', roles: ['siswa'] },
	{ prefix: '/admin/siswa/bansos', roles: ['siswa'] },
	{ prefix: '/admin/ortu', roles: ['ortu'] },
	{ prefix: '/admin/siswa', roles: STAFF_ROLES },
	{ prefix: '/admin/rombel', roles: STAFF_ROLES },
	{ prefix: '/admin/struktur', roles: STAFF_ROLES },
	{ prefix: '/admin/activity', roles: STAFF_ROLES },
	{ prefix: '/admin/dashboard', roles: STAFF_ROLES },
	{ prefix: '/admin/ptk', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/skmt', roles: ['admin', 'kepsek', 'guru'] },
	{ prefix: '/admin/skbk', roles: ['admin', 'kepsek', 'guru'] },
	{ prefix: '/admin/skakpt', roles: ['admin', 'kepsek', 'guru'] },
	{ prefix: '/admin/roster', roles: ['admin', 'kepsek', 'guru'] },
	{ prefix: '/admin/bel', roles: ['admin', 'staf'] },
	{ prefix: '/admin/approval', roles: ['admin', 'kepsek', 'staf'] },
	{ prefix: '/admin/berita', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/pengumuman', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/agenda', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/galeri', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/prestasi', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/ekskul', roles: ['admin', 'kepsek'] },
	{ prefix: '/admin/pengaturan', roles: ['admin'] },
	{ prefix: '/admin/backup', roles: ['admin'] },
	{ prefix: '/admin/user', roles: ['admin'] }
];

/** Modul yang butuh kata sandi sudah diganti (bukan default). */
export const SENSITIVE_PREFIXES = [
	'/admin/ptk',
	'/admin/skmt',
	'/admin/skbk',
	'/admin/skakpt',
	'/admin/pengaturan',
	'/admin/backup',
	'/admin/user'
];

export function matchRule(pathname: string): RouteRule | null {
	let best: RouteRule | null = null;
	for (const rule of ROUTE_RULES) {
		if (pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')) {
			if (!best || rule.prefix.length > best.prefix.length) best = rule;
		}
	}
	return best;
}

export function canAccess(role: string, pathname: string): boolean {
	const rule = matchRule(pathname);
	if (rule) return rule.roles.includes(role);
	// Rute /admin/* tak terdaftar: staf boleh, siswa/ortu tidak.
	return STAFF_ROLES.includes(role);
}

export function isSensitive(pathname: string): boolean {
	return SENSITIVE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** Halaman "rumah" per role untuk tujuan redirect saat akses ditolak. */
export function homeFor(role: string): string {
	if (role === 'siswa') return '/admin/siswa/profil';
	if (role === 'ortu') return '/admin/ortu/profil';
	return '/admin/dashboard';
}
