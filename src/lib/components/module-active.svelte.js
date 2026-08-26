// Store modul aktif di sidebar module switcher.
import { writable } from 'svelte/store';

// 'semua' = tampilkan semua menu. Nilai lain = nama modul (misal 'PTK', 'Kesiswaan').
export const activeModule = writable('semua');