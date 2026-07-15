import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

/* https://docs.netlify.com/configure-builds/environment-variables/#read-only-variables */
const NETLIFY_PREVIEW_SITE = process.env.CONTEXT !== 'production' && process.env.DEPLOY_PRIME_URL;

// https://astro.build/config
export default defineConfig({
	site: NETLIFY_PREVIEW_SITE || 'https://astro.new',
	prefetch: true,
	redirects: {
		'/repro/': '/repro/getting-started',
	},
	integrations: [
		tailwind({
			applyBaseStyles: false,
		}),
	],
	adapter: netlify({}),
	vite: {
		ssr: {
			noExternal: ['smartypants'],
		},
	},
});
