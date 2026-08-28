// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: { username: string; role: string; ref_id: number } | null;
		}
	}
}

export {};
