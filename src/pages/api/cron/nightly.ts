import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
    if (!import.meta.env.NIGHTLY_BUILD_HOOK) {
        return new Response(
            'NIGHTLY_BUILD_HOOK variable not defined',
            { status: 500 }
        )
    }

    try {
		const response = await fetch(import.meta.env.NIGHTLY_BUILD_HOOK, {
			method: "POST",
			body: JSON.stringify({}),
			headers: { "Content-Type": "application/json" },
		})

		if (!response.ok) {
			// NOT res.status >= 200 && res.status < 300
            return new Response(
                response.statusText,
                { status: response.status }
            )
		}

		return new Response(null, { status: 200 })
	} catch (error) {
		// output to netlify function log
		console.error(error)
        return new Response(
            'An internal error occurred',
            { status: 500 }
        )
	}
}