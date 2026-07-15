import { writeFile } from 'node:fs/promises';
import { getFirebaseStudioParams } from '../src/data/examples-shared.js';

await generateFirebaseStudioTemplate('latest');
await generateFirebaseStudioTemplate('next');

async function generateFirebaseStudioTemplate(ref: 'latest' | 'next') {
	console.time(`Updated ${ref}/idx-template.json`);
	// .idx-templates/latest/idx-template.json
	const template = {
		name: ref === 'next' ? 'astro.new/next' : 'astro.new',
		description: 'Kick start your next project with Astro’s official starter templates',
		icon: 'https://raw.githubusercontent.com/withastro/astro.build/refs/heads/main/public/assets/press/astro-icon-light-gradient.svg',
		params: [
			{
				id: 'astroTemplate',
				name: 'Starter template',
				type: 'enum',
				default: 'basics',
				options: await getFirebaseStudioParams(ref),
				required: true,
			},
		],
	};
	await writeFile(
		`./.idx-templates/${ref}/idx-template.json`,
		`${JSON.stringify(template, null, 2)}\n`,
		'utf-8',
	);
	console.timeEnd(`Updated ${ref}/idx-template.json`);
}
