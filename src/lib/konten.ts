/** Helper client-safe untuk moderasi konten (tanpa dependency server). */
export function canManage(
	role: string | undefined,
	userId: number | undefined,
	authorUserId: number | null | undefined
): boolean {
	if (role === 'admin' || role === 'kepsek') return true;
	return authorUserId != null && authorUserId === userId;
}

export function isModerator(role: string | undefined): boolean {
	return role === 'admin' || role === 'kepsek';
}
