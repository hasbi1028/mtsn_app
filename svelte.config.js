import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$modules: 'src/modules'
		},
		csrf: {
			trustedOrigins: [
				'http://localhost:3720',
				'http://127.0.0.1:3720',
				'http://localhost:5173',
				'http://127.0.0.1:5173',
				'http://localhost:4173',
				'http://127.0.0.1:4173'
			]
		},
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
