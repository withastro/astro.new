import toTitle from 'title';
import { isStarlightName, toStarlightName } from '../utils/constants.js';
import {
	type ExampleData,
	astroContentUrl,
	githubRequest,
	starlightContentUrl,
} from '../utils/github.js';

interface ExampleDataWithRepo extends ExampleData {
	repo: string;
}

const previewImageSlugs = new Set(
	Object.keys(import.meta.glob('../../public/previews/*.webp')).map((key) =>
		key
			.split('/')
			.pop()
			?.replace(/\.webp$/, ''),
	),
);

const TITLES = new Map([
	['with-tailwindcss', 'Tailwind CSS'],
	['blog-multiple-authors', 'Blog (Complex)'],
	['with-markdown-plugins', 'Markdown (Remark Plugins)'],
	['framework-multiple', 'Kitchen Sink (Multiple Frameworks)'],
	['basics', 'Just the Basics'],
	[toStarlightName('basics'), 'Starlight'],
	['starlog', 'Starlog'],
	['minimal', 'Empty Project'],
]);
export const TOP_SECTION = 'Getting Started';
const TOP_SECTION_ORDER = [
	'basics',
	'blog',
	toStarlightName('basics'),
	'starlog',
	'portfolio',
	'minimal',
];

const FEATURED_INTEGRATIONS = new Set(['tailwindcss']);
const FRAMEWORK_ORDER = ['react', 'preact', 'vue', 'svelte', 'lit', 'solid'].map(
	(name) => `framework-${name}`,
);

export interface Example {
	name: string;
	title: string;
	sourceUrl: string;
	stackblitzUrl: string;
	codesandboxUrl: string;
	gitpodUrl: string;
	createAstroTemplate: string;
	previewImage: string | undefined;
}

function getSuffix(name: string, ref: string): string {
	// ignore refs for Starlight! Those examples always come from main
	if (ref === 'main' && !isStarlightName(name)) return '@next';
	if (ref === 'next' && !isStarlightName(name)) return '@next';
	return '';
}

function toTemplateName({ repo, name, path }: ExampleDataWithRepo): string {
	if (repo === 'withastro/astro') {
		// Examples in the core monorepo work with just their directory name.
		return name;
	} else if (repo === 'withastro/starlight') {
		// Examples in the Starlight monorepo support a shorthand syntax
		return path === 'examples/basics' ? 'starlight' : path.replace('examples/', 'starlight/');
	} else {
		// Other repositories require the full GitHub identifier, e.g. `username/repo/path/to/template`
		return `${repo}/${path}`;
	}
}

function toExample(exampleData: ExampleDataWithRepo, ref: string): Example {
	const { name } = exampleData;
	const suffix = getSuffix(name, ref);
	let title: string;
	if (TITLES.has(name)) {
		title = TITLES.get(name)!; // we just checked w/ `.has()` it should exist.
	} else {
		title = toTitle(name.replace(/^(with|framework)/, '').replace(/-/g, ' ')).trim();
	}
	return {
		name,
		sourceUrl: `/${name}${suffix}?on=github`,
		stackblitzUrl: `/${name}${suffix}?on=stackblitz`,
		codesandboxUrl: `/${name}${suffix}?on=codesandbox`,
		gitpodUrl: `/${name}${suffix}?on=gitpod`,
		createAstroTemplate: toTemplateName(exampleData),
		previewImage: previewImageSlugs.has(name) ? `/previews/${name}.webp` : undefined,
		title,
	};
}

export type ExampleGroup = {
	title: string;
	slug: string;
	items: Example[];
};

function groupExamplesByCategory(examples: ExampleDataWithRepo[], ref: string) {
	const gettingStartedItems: Example[] = [];
	const frameworks: Example[] = [];
	const integrations: Example[] = [];
	const templates: Example[] = [];

	for (const example of examples) {
		if (example.size !== 0) continue;

		const data = toExample(example, ref);
		if (TOP_SECTION_ORDER.includes(example.name)) {
			gettingStartedItems.push(data);
		} else if (example.name.startsWith('with-')) {
			if (FEATURED_INTEGRATIONS.has(example.name.replace('with-', ''))) {
				integrations.unshift(data);
			} else {
				integrations.push(data);
			}
		} else if (example.name.startsWith('framework-')) {
			frameworks.push(data);
		} else {
			templates.push(data);
		}
	}

	return new Map(
		Object.entries({
			'getting-started': {
				title: TOP_SECTION,
				slug: 'getting-started',
				items: gettingStartedItems.sort(sortExamplesByOrder(TOP_SECTION_ORDER)),
			},
			frameworks: {
				title: 'Frameworks',
				slug: 'frameworks',
				items: frameworks.sort(sortExamplesByOrder(FRAMEWORK_ORDER)),
			},
			integrations: {
				title: 'Integrations',
				slug: 'integrations',
				items: integrations,
			},
			templates: {
				title: 'Templates',
				slug: 'templates',
				items: templates,
			},
		}),
	);
}

export async function getExamples(ref = 'latest') {
	if (ref === 'next') {
		try {
			await fetch(githubRequest(astroContentUrl(ref)));
		} catch (e) {
			console.error(`Failed to fetch examples for ref "${ref}" -`, e);
			// `next` branch is missing, fallback to `main`
			ref = 'main';
		}
	}
	const examples: ExampleDataWithRepo[] = (
		await Promise.all([
			fetch(githubRequest(astroContentUrl(ref)))
				.then((res) => res.json())
				.then((examples: ExampleData[]) =>
					examples.map((example) => ({
						...example,
						repo: 'withastro/astro',
					})),
				),
			fetch(githubRequest(starlightContentUrl()))
				.then((res) => res.json())
				// prefix starlight example names to differentiate duplicate example names
				.then((examples: ExampleData[]) =>
					examples.map((example) => ({
						...example,
						name: toStarlightName(example.name),
						repo: 'withastro/starlight',
					})),
				),
		])
	).flat();
	return groupExamplesByCategory(examples, ref);
}

function sortExamplesByOrder(order: string[]) {
	return (a: Example, b: Example) => {
		let aIndex = order.indexOf(a.name);
		let bIndex = order.indexOf(b.name);
		if (aIndex === -1) {
			aIndex = Infinity;
		}
		if (bIndex === -1) {
			bIndex = Infinity;
		}
		if (aIndex > bIndex) return 1;
		if (aIndex < bIndex) return -1;
		return 0;
	};
}
