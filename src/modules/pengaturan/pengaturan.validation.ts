import * as v from 'valibot';

/**
 * Schema teks identitas aplikasi (nama + subjudul).
 */
export const brandingTextSchema = v.object({
	app_name: v.pipe(
		v.string('Nama aplikasi wajib diisi'),
		v.trim(),
		v.minLength(2, 'Nama aplikasi minimal 2 karakter'),
		v.maxLength(60, 'Nama aplikasi maksimal 60 karakter')
	),
	app_subtitle: v.pipe(v.string(), v.trim(), v.maxLength(80, 'Subjudul maksimal 80 karakter'))
});

/**
 * Schema unggah logo (maks 2 MB).
 */
export const logoUploadSchema = v.object({
	logo: v.pipe(v.file('Pilih berkas logo'), v.maxSize(2_000_000, 'Ukuran logo maksimal 2MB'))
});

/**
 * Schema unggah favicon (maks 1 MB).
 */
export const faviconUploadSchema = v.object({
	favicon: v.pipe(v.file('Pilih berkas favicon'), v.maxSize(1_000_000, 'Ukuran favicon maksimal 1MB'))
});

export const brandingKindSchema = v.object({
	kind: v.picklist(['logo', 'favicon'])
});

export type BrandingKind = v.InferOutput<typeof brandingKindSchema>['kind'];
