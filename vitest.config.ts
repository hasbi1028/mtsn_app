import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$modules: path.resolve('./src/modules')
		}
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
