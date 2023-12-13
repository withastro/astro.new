import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import { defineConfig } from 'astro/config';

/* https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables */
const VERCEL_PREVIEW_SITE =
	process.env.VERCEL_ENV !== 'production' &&
	process.env.VERCEL_URL &&
	`https://${process.env.VERCEL_URL}`;

// https://astro.build/config
export default defineConfig({
	site: VERCEL_PREVIEW_SITE || 'https://astro.new',
	prefetch: true,
	integrations: [
		tailwind({
			applyBaseStyles: false,
		}),
	],
	output: 'server',
	adapter: vercel(),
	vite: {
		ssr: {
			noExternal: ['smartypants'],
		},
	},
});
