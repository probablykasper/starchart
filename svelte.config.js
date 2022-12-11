import adapter from '@sveltejs/adapter-cloudflare'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),
	},
}
