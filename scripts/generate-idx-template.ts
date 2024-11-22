import { writeFile } from 'fs/promises';
import { getIdxParams } from '../src/data/examples-shared.js';

await generateIDXTemplate('latest');
await generateIDXTemplate('next');

async function generateIDXTemplate(ref: 'latest' | 'next') {
	console.time(`Updated ${ref}/idx-template.json`);
	// .idx-templates/latest/idx-template.json
	const template = {
		name: 'astro.new',
		description: 'Kick start your next project with Astro’s official starter templates',
		icon: 'https://raw.githubusercontent.com/withastro/astro.build/refs/heads/main/public/assets/press/astro-icon-light-gradient.svg',
		params: [
			{
				id: 'astroTemplate',
				name: 'Starter template',
				type: 'enum',
				default: 'basics',
				options: await getIdxParams(ref),
				required: true,
			},
		],
	};
	await writeFile(
		`./.idx-templates/${ref}/idx-template.json`,
		JSON.stringify(template, null, 2) + '\n',
		'utf-8',
	);
	console.timeEnd(`Updated ${ref}/idx-template.json`);
}
