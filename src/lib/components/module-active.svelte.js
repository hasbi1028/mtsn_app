// Store modul aktif di sidebar module switcher — Svelte 5 runes mode.
// File .svelte.js enables runes at module level.

let _activeModule = $state('semua');

/** @returns {string} */
export function getActiveModule() {
	return _activeModule;
}

/** @param {string} value */
export function setActiveModule(value) {
	_activeModule = value;
}
