import preset from '@astrojs/site-kit/tailwind-preset';
import containerQueries from '@tailwindcss/container-queries';
import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors.js';
import plugin from 'tailwindcss/plugin.js';

export default {
	presets: [preset],
	content: ['./src/**/*.{astro,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				neutral: colors.slate,
				primary: colors.purple,
				secondary: colors.orange,
				accent: colors.fuchsia,
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
