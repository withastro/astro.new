import toTitle from "title"
const previewImageSlugs = new Set(
	Object.keys(import.meta.glob("../../public/previews/*.webp")).map((key) =>
		key
			.split("/")
			.pop()
			?.replace(/\.webp$/, ""),
	),
)

const TITLES = new Map([
	["with-tailwindcss", "Tailwind CSS"],
	["blog-multiple-authors", "Blog (Complex)"],
	["with-markdown-plugins", "Markdown (Remark Plugins)"],
	["framework-multiple", "Kitchen Sink (Multiple Frameworks)"],
	["basics", "Just the Basics"],
	["minimal", "Empty Project"],
])
// this heading is hidden from the page
export const TOP_SECTION = "Getting Started"
const TOP_SECTION_ORDER = ["basics", "blog", "docs", "portfolio", "minimal"]

const FEATURED_INTEGRATIONS = new Set(["tailwindcss"])
const FRAMEWORK_ORDER = [
	"react",
	"preact",
	"vue",
	"svelte",
	"lit",
	"solid",
].map((name) => `framework-${name}`)

type ExampleData = {
	name: string
	size: number
	url: string
	html_url: string
	git_url: string
	preview_image: string
}
export type Example = {
	name: string
	title: string
	sourceUrl: string
	stackblitzUrl: string
	codesandboxUrl: string
	gitpodUrl: string
	previewImage: string | null
}

function toExample({ name }: ExampleData, ref: string): Example {
	const suffix = ref === "main" ? "@next" : ""
	let title: string
	if (TITLES.has(name)) {
		title = TITLES.get(name) as string // we just checked w/ `.has()` it should exist.
	} else {
		title = toTitle(
			name.replace(/^(with|framework)/, "").replace(/-/g, " "),
		).trim()
	}
	return {
		name,
		sourceUrl: `/${name}${suffix}?on=github`,
		stackblitzUrl: `/${name}${suffix}?on=stackblitz`,
		codesandboxUrl: `/${name}${suffix}?on=codesandbox`,
		gitpodUrl: `/${name}${suffix}?on=gitpod`,
		previewImage: previewImageSlugs.has(name) ? `/previews/${name}.webp` : null,
		title,
	}
}

function groupExamplesByCategory(
	examples: ExampleData[],
	ref: string,
): Array<[string, Example[]]> {
	const groups: {
		[TOP_SECTION]: Example[]
		Frameworks: Example[]
		Integrations: Example[]
		Templates: Example[]
	} = {
		[TOP_SECTION]: [],
		Frameworks: [],
		Integrations: [],
		Templates: [],
	}
	for (const example of examples) {
		if (example.size !== 0) continue
		const data = toExample(example, ref)
		switch (true) {
			case TOP_SECTION_ORDER.includes(example.name):
				groups[TOP_SECTION].push(data)
				break
			case example.name.startsWith("with-"):
				if (FEATURED_INTEGRATIONS.has(example.name.replace("with-", ""))) {
					groups["Integrations"].splice(0, 0, data)
				} else {
					groups["Integrations"].push(data)
				}
				break
			case example.name.startsWith("framework-"):
				groups["Frameworks"].push(data)
				break
			default: {
				groups["Templates"].push(data)
				break
			}
		}
	}
	groups[TOP_SECTION] = groups[TOP_SECTION].sort(
		sortExamplesByOrder(TOP_SECTION_ORDER),
	)
	groups["Frameworks"] = groups["Frameworks"].sort(
		sortExamplesByOrder(FRAMEWORK_ORDER),
	)
	return Object.entries(groups)
}

export async function getExamples(ref = "latest") {
	const headers: Headers = new Headers({
		Accept: "application/vnd.github.v3+json",
	})
	if (typeof import.meta.env.PUBLIC_VITE_GITHUB_TOKEN === "undefined") {
		console.warn(
			`PUBLIC_VITE_GITHUB_TOKEN is undefined. You may run into rate-limiting issues.`,
		)
	} else {
		headers.set(
			"Authorization",
			`token ${import.meta.env.PUBLIC_VITE_GITHUB_TOKEN}`,
		)
	}
	const examples = await fetch(
		`https://api.github.com/repos/withastro/astro/contents/examples?ref=${ref}`,
		{
			headers,
		},
	).then((res) => res.json())
	if (!Array.isArray(examples)) {
		console.error(
			`GITHUB_TOKEN appears to be misconfigured. Expected array, got:`,
			examples,
		)
		throw new Error(`GITHUB_TOKEN appears to be misconfigured`)
	}
	return groupExamplesByCategory(examples, ref)
}

function sortExamplesByOrder(order: string[]) {
	return (a: Example, b: Example) => {
		let aIndex = order.indexOf(a.name)
		let bIndex = order.indexOf(b.name)
		if (aIndex === -1) {
			aIndex = Infinity
		}
		if (bIndex === -1) {
			bIndex = Infinity
		}
		if (aIndex > bIndex) return 1
		if (aIndex < bIndex) return -1
		return 0
	}
}
