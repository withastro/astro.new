import type { APIContext, APIRoute } from "astro"

const examplesCache = new Map()
async function getExamples(ref = "latest") {
	if (examplesCache.has(ref)) {
		return examplesCache.get(ref)
	}

	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
	}
	if (typeof process.env.VITE_GITHUB_TOKEN === "undefined") {
		console.warn(
			`VITE_GITHUB_TOKEN is undefined. You may run into rate-limiting issues.`,
		)
	} else {
		headers["Authorization"] = `token ${process.env.VITE_GITHUB_TOKEN}`
	}
	const examples = await fetch(
		`https://api.github.com/repos/withastro/astro/contents/examples?ref=${ref}`,
		{
			headers,
		},
	).then((res: { json: () => any }) => res.json())

	if (!Array.isArray(examples)) {
		console.error(
			`Unable to fetch templates from GitHub. Expected array, got:`,
			examples,
		)
		throw new Error(`Unable to fetch templates from GitHub`)
	}

	const values = examples
		.map((example) =>
			example.size > 0
				? null
				: {
						name: example.name,
						github: example.html_url,
						netlify: "https://astro.build",
						stackblitz: `https://stackblitz.com/github/withastro/astro/tree/${ref}/examples/${example.name}`,
						codesandbox: `https://codesandbox.io/p/sandbox/github/withastro/astro/tree/${ref}/examples/${example.name}`,
						gitpod: `https://gitpod.io/#https://github.com/withastro/astro/tree/${ref}/examples/${example.name}`,
				  },
		)
		.filter((x) => x)

	examplesCache.set(ref, values)

	return values
}

const releaseCache = new Map()
async function getRelease(ref: string) {
	if (releaseCache.has(ref)) {
		return releaseCache.get(ref)
	}

	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
	}
	if (typeof process.env.VITE_GITHUB_TOKEN === "undefined") {
		console.warn(
			`VITE_GITHUB_TOKEN is undefined. You may run into rate-limiting issues.`,
		)
	} else {
		headers["Authorization"] = `token ${process.env.VITE_GITHUB_TOKEN}`
	}

	const release = await fetch(
		`https://api.github.com/repos/withastro/astro/releases/tags/astro@${ref}`,
		{
			headers,
		},
	).then((res) => (res.status === 200 ? res.json() : null))

	releaseCache.set(ref, release)

	return release
}

async function validateRef(name: string) {
	if (name === "next" || name === "latest") {
		return true
	}

	const release = await getRelease(name)
	if (release !== null) {
		return true
	}

	throw new Error(
		`Invalid version "${name}"! Supported versions are "next", "latest", or any <a href="https://github.com/withastro/astro/releases?q=astro%40">GitHub release</a>.`,
	)
}

const PLATFORMS = new Set([
	"stackblitz",
	"codesandbox",
	"netlify",
	"github",
	"gitpod",
])
function isPlatform(name: string) {
	return PLATFORMS.has(name)
}

async function parseReq(context: APIContext) {
	const platform = context.url.searchParams.get("on") ?? "stackblitz"
	const path = context.params.rest?.replace(/^\//, "") ?? ""

	if (!isPlatform(platform)) {
		throw new Error(
			`Unsupported "on" query! Supported platforms are:\n  - ${Array.from(
				PLATFORMS.values(),
			)
				.map((x) => x)
				.join(`\n  - `)}`,
		)
	}

	const value = {
		ref: "latest",
		template: path,
		platform,
	}

	if (path.indexOf("@") > -1) {
		const [template, ref] = path.split("@")
		if (!ref || !template) {
			throw new Error("why have you forsaken me")
		}
		await validateRef(ref)
		value.template = template
		if (ref === "next") {
			value.ref = "main"
		} else if (ref === "latest") {
			value.ref = "latest"
		} else {
			value.ref = `astro@${ref}`
		}
	}

	return value
}

export const get: APIRoute = async (context) => {
	if (context.url.pathname === "/") {
		return context.redirect("/latest")
	}

	try {
		const { ref, template, platform } = await parseReq(context)

		const examples = await getExamples(ref)
		const example = examples.find((x: { name: string }) => x.name === template)

		if (!example) {
			return {
				statusCode: 404,
				body: `Unable to find ${template}! Supported templates are:\n  - ${examples
					.map((x: { name: any }) => x.name)
					.join(`\n  - `)}`,
			}
		}

		return context.redirect(example[platform])
	} catch (error) {
		console.error(error)
		return new Response("An internal error occurred", { status: 500 })
	}
}
