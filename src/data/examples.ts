import { isStarlightName, toStarlightName } from '../utils/constants.js';
import {
	type ExampleDataWithRepo,
	getExamples,
	toTemplateName,
	toTitle,
} from './examples-shared.js';

const previewImages = new Map(
	Object.entries(import.meta.glob<{ default: ImageMetadata }>('../assets/previews/*.webp')).map(
		([key, value]) => [
			key
				.split('/')
				.pop()
				?.replace(/\.webp$/, ''),
			async () => (await value()).default,
		],
	),
);

export const TOP_SECTION = 'Getting Started';
const TOP_SECTION_ORDER = [
	'basics',
	'blog',
	toStarlightName('basics'),
	'starlog',
	'portfolio',
	'minimal',
];

const INTEGRATIONS_ORDER = ['with-tailwindcss', 'with-mdx'];
const FRAMEWORK_ORDER = ['react', 'preact', 'vue', 'svelte', 'lit', 'solid'].map(
	(name) => `framework-${name}`,
);

export interface Example {
	name: string;
	category: string;
	title: string;
	sourceUrl: string;
	idxUrl: string;
	stackblitzUrl: string;
	codesandboxUrl: string;
	gitpodUrl: string;
	previewUrl: string | null;
	previewEmbedUrl: string | null;
	createAstroTemplate: string;
	loadPreviewImage: (() => Promise<ImageMetadata>) | undefined;
}

function getSuffix(name: string, ref: string): string {
	// ignore refs for Starlight! Those examples always come from main
	if (ref === 'main' && !isStarlightName(name)) return '@next';
	if (ref === 'next' && !isStarlightName(name)) return '@next';
	return '';
}

function toExample(
	exampleData: ExampleDataWithRepo,
	previews: string[],
	category: string,
	ref: string,
): Example {
	const { name } = exampleData;
	const suffix = getSuffix(name, ref);
	return {
		name,
		category,
		sourceUrl: `/${name}${suffix}?on=github`,
		idxUrl: `/${name}${suffix}?on=idx`,
		stackblitzUrl: `/${name}${suffix}?on=stackblitz`,
		codesandboxUrl: `/${name}${suffix}?on=codesandbox`,
		gitpodUrl: `/${name}${suffix}?on=gitpod`,
		previewUrl:
			ref === 'latest' && previews.includes(name) ? `https://preview.astro.new/${name}` : null,
		previewEmbedUrl: ref === 'latest' && previews.includes(name) ? `/latest/preview/${name}` : null,
		createAstroTemplate: toTemplateName(exampleData),
		loadPreviewImage: previewImages.get(name),
		title: toTitle(name),
	};
}

export type ExampleGroup = {
	title: string;
	slug: string;
	items: Example[];
};

function groupExamplesByCategory(examples: ExampleDataWithRepo[], previews: string[], ref: string) {
	const categories = {
		'getting-started': [] as Example[],
		integrations: [] as Example[],
		frameworks: [] as Example[],
		templates: [] as Example[],
	};

	for (const example of examples) {
		if (example.size !== 0) continue;
		const category = TOP_SECTION_ORDER.includes(example.name)
			? 'getting-started'
			: example.name.startsWith('with-')
				? 'integrations'
				: example.name.startsWith('framework-')
					? 'frameworks'
					: 'templates';
		const data = toExample(example, previews, category, ref);
		categories[category].push(data);
	}

	return new Map(
		Object.entries({
			'getting-started': {
				title: TOP_SECTION,
				slug: 'getting-started',
				items: categories['getting-started'].sort(sortExamplesByOrder(TOP_SECTION_ORDER)),
			},
			frameworks: {
				title: 'Frameworks',
				slug: 'frameworks',
				items: categories.frameworks.sort(sortExamplesByOrder(FRAMEWORK_ORDER)),
			},
			integrations: {
				title: 'Integrations',
				slug: 'integrations',
				items: categories.integrations.sort(sortExamplesByOrder(INTEGRATIONS_ORDER)),
			},
			templates: {
				title: 'Templates',
				slug: 'templates',
				items: categories.templates,
			},
		}),
	);
}

export async function getCategorizedExamples(ref = 'latest') {
	const examples = await getExamples(ref);
	const previews = await getPreviews();
	return groupExamplesByCategory(examples, previews, ref);
}

async function getPreviews() {
	const { previews } = await fetch('https://preview.astro.new/metadata.json').then((res) =>
		res.json(),
	);
	return previews as string[];
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
