import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrGenerateKartuBack } from '$modules/kartu/kartu.service';

export const GET: RequestHandler = async ({ params }) => {
	const png = await getOrGenerateKartuBack(params.id);
	if (!png) error(404, 'Kartu belakang tidak ditemukan');
	return new Response(png, {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
	});
};
