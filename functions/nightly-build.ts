import { schedule, Handler } from '@netlify/functions'
import fetch from 'node-fetch'

const nightly: Handler = async function () {
	try {
		const response = await fetch(process.env.NIGHTLY_BUILD_HOOK, {
			method: 'POST',
			body: JSON.stringify({}),
			headers: { 'Content-Type': 'application/json' },
		})

		if (!response.ok) {
			// NOT res.status >= 200 && res.status < 300
			return { statusCode: response.status, body: response.statusText }
		}

		return { statusCode: 200 }
	} catch (error) {
		// output to netlify function log
		console.error(error)
		return {
			statusCode: 500,
			// Could be a custom message or object i.e. JSON.stringify(err)
			body: JSON.stringify({ msg: error.message }),
		}
	}
}

const handler = schedule('0 0 * * *', nightly)

export { handler }