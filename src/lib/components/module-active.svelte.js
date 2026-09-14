// Store modul aktif di sidebar module switcher — Svelte 5 runes mode.
// File .svelte.js enables runes at module level.

import { browser } from '$app/environment';

const KEY = 'simad_active_module';

let _activeModule = $state('semua');

/** @returns {string} */
export function getActiveModule() {
	return _activeModule;
}

/** @param {string} value */
export function setActiveModule(value) {
	_activeModule = value;
	if (!browser) return;
	try {
		localStorage.setItem(KEY, value);
	} catch {
		/* ignore */
	}
}

/** Muat modul tersimpan dari localStorage (dipanggil client-side setelah mount). */
export function hydrateActiveModule() {
	if (!browser) return;
	try {
		const saved = localStorage.getItem(KEY);
		if (saved) _activeModule = saved;
	} catch {
		/* ignore */
	}
}
