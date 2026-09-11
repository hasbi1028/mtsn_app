// See https://svelte.dev/docs/kit/types#app.d.ts
import type { UserSession } from '$modules/auth/auth.validation';

declare global {
	namespace App {
		interface Locals {
			user: UserSession | null;
		}
	}
}

export {};
