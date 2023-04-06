// @ts-check
// @ts-expect-error: no type defs yet
const config = require("@astrojs/site-kit/tailwind")
const plugin = require("tailwindcss/plugin")
const colors = require("tailwindcss/colors")

/** @type {import('tailwindcss').Config} */
module.exports = {
	...config,
	theme: {
		...config.theme,
		extend: {
			...config.theme.extend,
			colors: {
				...config.theme.extend.colors,
				neutral: colors.slate,
				primary: colors.purple,
				secondary: colors.orange,
				accent: colors.fuchsia,
			},
		},
	},
	plugins: [
		...config.plugins,
		require("@tailwindcss/container-queries"),
		plugin(function childrenPlugin(api) {
			api.addVariant("children", "& > *")
		}),
	],
}
