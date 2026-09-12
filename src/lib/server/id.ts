import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function base36Random(len: number): string {
	const bytes = randomBytes(len);
	let result = '';
	for (let i = 0; i < len; i++) {
		result += ALPHABET[bytes[i] % ALPHABET.length];
	}
	return result;
}

/**
 * Generate a public ID with prefix.
 * Format: `{PREFIX}-{8 random alphanumeric chars}`
 * Examples: PTK-a1b2c3d4, SIS-e5f6g7h8, RMB-i9j0k1l2
 */
export function generatePublicId(prefix: string): string {
	return `${prefix}-${base36Random(8)}`;
}

/** Validate a public ID format: prefix-xxxxxxxx */
export function isValidPublicId(publicId: string, prefix: string): boolean {
	const pattern = new RegExp(`^${prefix}-[a-z0-9]{8}$`);
	return pattern.test(publicId);
}
