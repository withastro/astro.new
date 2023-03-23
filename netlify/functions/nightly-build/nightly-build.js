const { schedule } = require("@netlify/functions")
const fetch = require("node-fetch")

const handler = async function () {
	try {
		const response = await fetch(process.env.NIGHTLY_BUILD_HOOK, {
			method: "POST",
			body: JSON.stringify({}),
			headers: { "Content-Type": "application/json" },
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

module.exports.handler = schedule("0 8 * * *", handler)
