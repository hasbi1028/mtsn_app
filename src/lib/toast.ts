// Helper notifikasi terpusat (Sonner / shadcn-svelte).
// Pemakaian di komponen:
//   import { notify } from '$lib/toast';
//   notify.success('Tersimpan');
//   notify.error('Gagal');
//   notify.fromForm(form);  // form = data balikan action SvelteKit
import { toast } from 'svelte-sonner';

export const notify = {
	success: (msg: string) => toast.success(msg),
	error: (msg: string) => toast.error(msg),
	info: (msg: string) => toast.info(msg),
	warning: (msg: string) => toast.warning(msg),
	/** Standar untuk hasil `form` dari +page.server.ts actions */
	fromForm: (form: any, okMsg?: string) => {
		if (!form) return;
		if (form.ok === true) toast.success(form.pesan || okMsg || 'Berhasil.');
		else if (form.ok === false) toast.error(form.error || 'Gagal.');
		else if (form.error) toast.error(form.error);
	}
};