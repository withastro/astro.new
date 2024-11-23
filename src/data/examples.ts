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
	loadPreviewImage: (() => Promise<ImageMetadata>) | undefined;
}

function getSuffix(name: string, ref: string): string {
	// ignore refs for Starlight! Those examples always come from main
	if (ref === 'main' && !isStarlightName(name)) return '@next';
	if (ref === 'next' && !isStarlightName(name)) return '@next';
	return '';
}

function toExample(exampleData: ExampleDataWithRepo, ref: string): Example {
	const { name } = exampleData;
	const suffix = getSuffix(name, ref);
	return {
		name,
		sourceUrl: `/${name}${suffix}?on=github`,
		stackblitzUrl: `/${name}${suffix}?on=stackblitz`,
		codesandboxUrl: `/${name}${suffix}?on=codesandbox`,
		gitpodUrl: `/${name}${suffix}?on=gitpod`,
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

export async function getCategorizedExamples(ref = 'latest') {
	const examples = await getExamples(ref);
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
