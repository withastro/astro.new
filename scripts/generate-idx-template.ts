import { writeFile } from 'fs/promises';
import { getIdxParams } from '../src/data/examples-shared.js';

console.time('Updated idx-template.json');
console.log('Fetching examples from GitHub...');

// .idx-template/idx-template.json 
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
			options: await getIdxParams(),
			required: true,
		},
		{
			id: 'astroVersion',
			name: 'Astro version',
			type: 'enum',
			default: 'latest',
			options: {
				latest: 'Latest stable release',
				next: 'Next experimental release',
			},
			required: true,
		},
	],
};

console.log('Writing idx-template.json to disk...');
await writeFile('./.idx-template/idx-template.json', JSON.stringify(template, null, 2), 'utf-8');
console.timeEnd('Updated idx-template.json');
