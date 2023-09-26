import { schedule } from '@netlify/functions';

const nightlyBuildHook = process.env.NIGHTLY_BUILD_HOOK;
if (!nightlyBuildHook) {
	throw new Error('NIGHTLY_BUILD_HOOK environment variable is undefined');
}

export const handler = schedule('0 8 * * *', async function handler() {
	try {
		const response = await fetch(nightlyBuildHook, {
			method: 'POST',
			body: JSON.stringify({}),
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			// NOT res.status >= 200 && res.status < 300
			return { statusCode: response.status, body: response.statusText };
		}

		return { statusCode: 200 };
	} catch (error) {
		// output to netlify function log
		console.error(error);
		return { statusCode: 500, body: 'An internal error occurred' };
	}
});
