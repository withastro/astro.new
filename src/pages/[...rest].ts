import type { APIContext, APIRoute } from 'astro';
import { toTemplateName, toTitle } from '../data/examples-shared.js';
import { fromStarlightName, isStarlightName, toStarlightName } from '../utils/constants.js';
import {
	type ExampleData,
	astroContentUrl,
	githubRequest,
	starlightContentUrl,
} from '../utils/github.js';

export const prerender = false;

type CachedExample = {
	name: string;
	github: string;
	idx: string;
	stackblitz: string;
	codesandbox: string;
	gitpod: string;
};

const examplesCache = new Map<string, CachedExample[]>();
let starlightExamplesCache: CachedExample[] | undefined = undefined;

/** Generate a placeholder workspace name for IDX. Must be no longer than 20 characters. */
function idxProjectName(example: ExampleData, repo: string) {
	const fullTitle = toTitle(
		repo === 'withastro/starlight' ? toStarlightName(example.name) : example.name,
	)
		// Remove parentheticals
		.replace(/\([^)]+\)/, '')
		.trim();

	if (fullTitle.length > 20) return `${fullTitle.slice(0, 19)}…`;
	if (fullTitle.length < 13) return `Astro: ${fullTitle}`;
	return fullTitle;
}

/**
 * Generate a URL to create a new IDX workspace for the given example.
 *
 * @param example GitHub REST API repository contents entry for this template.
 * @param repo The GitHub repo identifier for this template, e.g. `withastro/astro`.
 * @param ref The GitHub branch to use: `latest` or `next`.
 */
function idxUrl(example: ExampleData, repo: string, ref = 'latest') {
	const url = new URL('https://idx.google.com/new');
	// Add UTM parameters for IDX to track.
	url.searchParams.set('utm_source', 'astro');
	url.searchParams.set('utm_medium', 'astro');
	url.searchParams.set('utm_campaign', 'astro');
	// Select the Astro template to use when starting up IDX.
	url.searchParams.set('astroTemplate', toTemplateName({ ...example, repo }));
	// Pre-fill the IDX wizard with a project name based on the selected template.
	const title = idxProjectName(example, repo);
	url.searchParams.set('name', title);
	// Tell IDX where the template files are located. IDX parses this greedily so it MUST COME LAST.
	const templateUrl = `https://github.com/withastro/astro.new/tree/main/.idx-templates/${ref}`;
	url.searchParams.set('template', templateUrl);
	return url.href;
}

/**
 * Create a map of URLs that open this example on different services.
 *
 * @param example GitHub REST API repository contents entry for this template.
 * @param repo The GitHub repo identifier for this template, e.g. `withastro/astro`.
 * @param ref The GitHub branch to use: `latest` or `next`.
 */
function toCachedExample(example: ExampleData, repo: string, ref: string): CachedExample {
	const githubUrl = new URL(example.html_url);
	return {
		name: example.name,
		github: example.html_url,
		idx: idxUrl(example, repo, ref),
		stackblitz: `https://stackblitz.com/github${githubUrl.pathname}`,
		codesandbox: `https://codesandbox.io/p/sandbox/github${githubUrl.pathname}`,
		gitpod: `https://gitpod.io/#${example.html_url}`,
	};
}

async function getStarlightExamples() {
	if (starlightExamplesCache) {
		return starlightExamplesCache;
	}

	const examples: ExampleData[] = await fetch(githubRequest(starlightContentUrl())).then((res) =>
		res.json(),
	);

	if (!Array.isArray(examples)) {
		console.error(`Unable to fetch templates from GitHub. Expected array, got:`, examples);
		throw new Error(`Unable to fetch templates from GitHub`);
	}

	starlightExamplesCache = examples.flatMap((example) =>
		example.size > 0 ? [] : toCachedExample(example, 'withastro/starlight', 'latest'),
	);

	return starlightExamplesCache;
}

async function getExamples(ref = 'latest') {
	const existing = examplesCache.get(ref);

	if (existing) {
		return existing;
	}

	const examples: ExampleData[] = await fetch(githubRequest(astroContentUrl(ref))).then((res) =>
		res.json(),
	);

	if (!Array.isArray(examples)) {
		console.error(`Unable to fetch templates from GitHub. Expected array, got:`, examples);
		throw new Error(`Unable to fetch templates from GitHub`);
	}

	const values = examples.flatMap((example) =>
		example.size > 0 ? [] : toCachedExample(example, 'withastro/astro', ref),
	);

	examplesCache.set(ref, values);

	return values;
}

const releaseCache = new Map();
async function getRelease(ref: string) {
	if (releaseCache.has(ref)) {
		return releaseCache.get(ref);
	}

	const release = await fetch(
		githubRequest(`https://api.github.com/repos/withastro/astro/releases/tags/astro@${ref}`),
	).then((res) => (res.status === 200 ? res.json() : null));

	releaseCache.set(ref, release);

	return release;
}

async function validateRef(name: string) {
	if (name === 'next' || name === 'latest') {
		return true;
	}

	const release = await getRelease(name);
	if (release !== null) {
		return true;
	}

	throw new Error(
		`Invalid version "${name}"! Supported versions are "next", "latest", or any <a href="https://github.com/withastro/astro/releases?q=astro%40">GitHub release</a>.`,
	);
}

type Platform = typeof PLATFORMS extends Set<infer T> ? T : never;
const PLATFORMS = new Set(['idx', 'stackblitz', 'codesandbox', 'github', 'gitpod'] as const);
function isPlatform(name: string): name is Platform {
	return PLATFORMS.has(name as Platform);
}

async function parseReq(context: APIContext) {
	const platform = context.url.searchParams.get('on') ?? 'stackblitz';
	const path = context.params.rest?.replace(/^\//, '') ?? '';

	if (!isPlatform(platform)) {
		throw new Error(
			`Unsupported "on" query! Supported platforms are:\n  - ${Array.from(PLATFORMS.values())
				.map((x) => x)
				.join(`\n  - `)}`,
		);
	}

	const value = {
		ref: 'latest',
		repo: 'astro',
		template: path,
		platform,
	};

	if (isStarlightName(path)) {
		value.repo = 'starlight';
		value.template = fromStarlightName(path);
	}

	if (path.includes('@')) {
		const [template, ref] = path.split('@');
		if (!ref || !template) {
			throw new Error('why have you forsaken me');
		}
		await validateRef(ref);
		value.template = template;
		if (ref === 'next' || ref === 'latest') {
			value.ref = ref;
		} else {
			value.ref = `astro@${ref}`;
		}
	}

	return value;
}

export const GET: APIRoute = async (context) => {
	if (context.url.pathname === '/') {
		return context.redirect('/latest');
	}

	try {
		const { ref, repo, template, platform } = await parseReq(context);

		const examples = repo === 'astro' ? await getExamples(ref) : await getStarlightExamples();
		const example = examples.find((x) => x.name === template);

		if (!example) {
			const supportedTemplates = examples.map((x) => x.name).join(`\n  - `);
			return new Response(
				`Unable to find ${template}! Supported templates are:\n  - ${supportedTemplates}`,
				{ status: 404 },
			);
		}

		return context.redirect(example[platform]);
	} catch (error) {
		console.error(error);
		return new Response('An internal error occurred', { status: 500 });
	}
};
