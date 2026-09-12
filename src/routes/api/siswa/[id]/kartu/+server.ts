import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrGenerateKartu } from '$modules/kartu/kartu.service';

export const GET: RequestHandler = async ({ params }) => {
	const png = await getOrGenerateKartu(params.id);
	if (!png) error(404, 'Kartu tidak ditemukan');
	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'no-cache',
		},
	});
};
