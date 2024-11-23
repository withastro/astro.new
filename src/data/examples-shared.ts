import titleCase from 'title';
import { toStarlightName } from '../utils/constants.js';
import {
	type ExampleData,
	astroContentUrl,
	githubRequest,
	starlightContentUrl,
} from '../utils/github.js';

export interface ExampleDataWithRepo extends ExampleData {
	repo: string;
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
	)
		.flat()
		.filter((example) => example.type === 'dir');
	return examples;
}

export async function getIdxParams(ref?: string) {
	const examples = await getExamples(ref);
	return Object.fromEntries(
		examples.map((example) => [toTemplateName(example), toTitle(example.name)]),
	);
}

export function toTemplateName({ repo, name, path }: ExampleDataWithRepo): string {
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

const TITLES = new Map([
	['with-mdx', 'MDX'],
	['ssr', 'SSR'],
	['with-tailwindcss', 'Tailwind CSS'],
	['blog-multiple-authors', 'Blog (Complex)'],
	['with-markdown-plugins', 'Markdown (Remark Plugins)'],
	['framework-multiple', 'Kitchen Sink (Multiple Frameworks)'],
	['basics', 'Just the Basics'],
	[toStarlightName('basics'), 'Starlight'],
	['starlog', 'Starlog'],
	['minimal', 'Empty Project'],
]);

export function toTitle(name: string) {
	return (
		TITLES.get(name) || titleCase(name.replace(/^(with|framework)/, '').replace(/-/g, ' ')).trim()
	);
}
