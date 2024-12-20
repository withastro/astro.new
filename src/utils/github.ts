/**
 * GitHub REST API data for a directory.
 *
 * @see https://docs.github.com/en/rest/repos/contents#get-repository-content
 */
export interface ExampleData {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	type: 'dir' | 'file';
}

export function githubRequest(url: string) {
	const headers: Headers = new Headers({
		Accept: 'application/vnd.github.v3+json',
	});
	const token = import.meta.env?.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
	if (typeof token !== 'string') {
		console.warn(`GITHUB_TOKEN is ${typeof token}. You may run into rate-limiting issues.`);
	} else {
		headers.set('Authorization', `token ${token}`);
	}

	return new Request(url, { headers });
}

export function astroContentUrl(ref: string) {
	return `https://api.github.com/repos/withastro/astro/contents/examples?ref=${ref}`;
}

export function starlightContentUrl() {
	return `https://api.github.com/repos/withastro/starlight/contents/examples`;
}
