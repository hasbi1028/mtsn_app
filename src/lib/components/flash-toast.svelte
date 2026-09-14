<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { notify } from '$lib/toast';

	const PESAN: Record<string, string> = {
		'403': 'Anda tidak memiliki akses ke halaman tersebut.',
		wajib: 'Ganti kata sandi Anda dulu untuk membuka modul ini.'
	};

	let lastHandled = '';

	$effect(() => {
		if (!browser) return;
		const kode = page.url.searchParams.get('e');
		if (!kode || kode === lastHandled) return;
		lastHandled = kode;

		const pesan = PESAN[kode];
		if (pesan) notify.warning(pesan);

		const url = new URL(page.url);
		url.searchParams.delete('e');
		replaceState(url, {});
	});
</script>
