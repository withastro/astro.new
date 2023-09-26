export type ExampleData = {
	name: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	preview_image: string;
};
export type Example = {
	name: string;
	title: string;
	sourceUrl: string;
	stackblitzUrl: string;
	codesandboxUrl: string;
	gitpodUrl: string;
	previewImage: string | undefined;
};

export function githubRequest(url: string) {
	const headers: Headers = new Headers({
		Accept: 'application/vnd.github.v3+json',
	});
	if (typeof import.meta.env.GITHUB_TOKEN !== 'string') {
		console.warn(
			`GITHUB_TOKEN is ${typeof import.meta.env
				.GITHUB_TOKEN}. You may run into rate-limiting issues.`,
		);
	} else {
		headers.set('Authorization', `token ${import.meta.env.GITHUB_TOKEN}`);
	}

	return new Request(url, { headers });
}

export function astroContentUrl(ref: string) {
	return `https://api.github.com/repos/withastro/astro/contents/examples?ref=${ref}`;
}

export function starlightContentUrl() {
	return `https://api.github.com/repos/withastro/starlight/contents/examples`;
}
