import { command, form, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import {
	getPengaturan,
	resetBrandingFile,
	saveBrandingFile,
	setPengaturanValues
} from './pengaturan.service';
import {
	brandingKindSchema,
	brandingTextSchema,
	faviconUploadSchema,
	logoUploadSchema
} from './pengaturan.validation';

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
	if (user.role !== 'admin') throw error(403, 'Hanya admin yang boleh mengubah pengaturan.');
	return user;
}

function pesanError(e: unknown, fallback: string): string {
	return (e as { body?: { message?: string } })?.body?.message ?? (e instanceof Error ? e.message : fallback);
}

/* ── Read ────────────────────────────────────────────────── */

export const getPengaturanQ = query(async () => getPengaturan());

/* ── Identitas teks ──────────────────────────────────────── */

export const updateBrandingTextForm = form(brandingTextSchema, async (data) => {
	try {
		requireAdmin();
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Akses ditolak.') };
	}
	setPengaturanValues({ app_name: data.app_name, app_subtitle: data.app_subtitle });
	return { ok: true as const, pesan: 'Identitas aplikasi disimpan.' };
});

/* ── Unggah logo / favicon ───────────────────────────────── */

export const uploadLogoForm = form(logoUploadSchema, async ({ logo }) => {
	try {
		requireAdmin();
		await saveBrandingFile('logo', logo);
		return { ok: true as const, pesan: 'Logo aplikasi diperbarui.' };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Logo gagal diunggah.') };
	}
});

export const uploadFaviconForm = form(faviconUploadSchema, async ({ favicon }) => {
	try {
		requireAdmin();
		await saveBrandingFile('favicon', favicon);
		return { ok: true as const, pesan: 'Favicon aplikasi diperbarui.' };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Favicon gagal diunggah.') };
	}
});

/* ── Reset ke logo Kemenag ───────────────────────────────── */

export const resetBrandingC = command(brandingKindSchema, async ({ kind }) => {
	requireAdmin();
	await resetBrandingFile(kind);
	return { ok: true as const, pesan: 'Dikembalikan ke logo Kemenag.' };
});
