// @ts-expect-error — site-kit doesn’t provide types
import preset from '@astrojs/site-kit/tailwind-preset';
import containerQueries from '@tailwindcss/container-queries';
import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors.js';
import { fontFamily } from 'tailwindcss/defaultTheme.js';
import plugin from 'tailwindcss/plugin.js';

export default {
	presets: [preset],
	content: ['./src/**/*.{astro,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: fontFamily.sans,
			},
			colors: {
				neutral: colors.slate,
				primary: colors.purple,
				secondary: colors.orange,
				accent: colors.fuchsia,
			},
			screens: {
				'sm-y': { raw: '(min-height: 640px)' },
				'md-y': { raw: '(min-height: 768px)' },
				'lg-y': { raw: '(min-height: 1024px)' },
			},
		},
	},
	plugins: [
		containerQueries,
		plugin(function childrenPlugin(api) {
			api.addVariant('children', '& > *');
		}),
	],
} satisfies Config;
