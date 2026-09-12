import { describe, it, expect } from 'vitest';
import { generatePublicId, isValidPublicId } from './id';

describe('generatePublicId', () => {
	it('generates ID with correct format', () => {
		const id = generatePublicId('PTK');
		expect(id).toMatch(/^PTK-[a-z0-9]{8}$/);
	});

	it('generates unique IDs', () => {
		const ids = new Set<string>();
		for (let i = 0; i < 100; i++) {
			ids.add(generatePublicId('SIS'));
		}
		expect(ids.size).toBe(100);
	});

	it('supports different prefixes', () => {
		expect(generatePublicId('PTK')).toMatch(/^PTK-/);
		expect(generatePublicId('SIS')).toMatch(/^SIS-/);
		expect(generatePublicId('RMB')).toMatch(/^RMB-/);
	});
});

describe('isValidPublicId', () => {
	it('validates correct format', () => {
		expect(isValidPublicId('PTK-a1b2c3d4', 'PTK')).toBe(true);
		expect(isValidPublicId('SIS-e5f6g7h8', 'SIS')).toBe(true);
	});

	it('rejects invalid prefix', () => {
		expect(isValidPublicId('XXX-a1b2c3d4', 'PTK')).toBe(false);
	});

	it('rejects wrong length', () => {
		expect(isValidPublicId('PTK-a1b2c3', 'PTK')).toBe(false);
		expect(isValidPublicId('PTK-a1b2c3d4e5', 'PTK')).toBe(false);
	});

	it('rejects uppercase in random part', () => {
		expect(isValidPublicId('PTK-A1B2C3D4', 'PTK')).toBe(false);
	});

	it('rejects special characters', () => {
		expect(isValidPublicId('PTK-a1b2c3d-', 'PTK')).toBe(false);
		expect(isValidPublicId('PTK-a1b2c3d!', 'PTK')).toBe(false);
	});
});
