import { Octokit } from '@octokit/core'
import { GraphqlResponseError } from '@octokit/graphql'
import { PUBLIC_PAT } from '$env/static/public'
import { get, writable } from 'svelte/store'
import { browser } from '$app/environment'
import { throttling, type ThrottlingOptions } from '@octokit/plugin-throttling'
import { retry } from '@octokit/plugin-retry'
// @ts-expect-error import missing from bottleneck's package.json
import BottleneckLight from 'bottleneck/light.js'
const Bottleneck = BottleneckLight as typeof import('bottleneck').default

const loaded_token = browser ? localStorage.getItem('starchart-token') : undefined
export const token = writable(loaded_token || '')
if (browser) {
	token.subscribe((value) => {
		if (value === '') {
			localStorage.removeItem('starchart-token')
		} else {
			localStorage.setItem('starchart-token', value)
		}
	})
}

let next_error_id = 0
const errors_store = writable<{ id: number; msg: string }[]>([])
export const errors = {
	subscribe: errors_store.subscribe,
	push(msg: string) {
		errors_store.update((errors) => {
			errors.push({ id: next_error_id++, msg })
			return errors
		})
	},
	remove_index(index: number) {
		errors_store.update((errors) => {
			errors.splice(index, 1)
			return errors
		})
	},
}

const rate_limit_handler: ThrottlingOptions['onRateLimit'] = (
	retry_after,
	options,
	octokit,
	retry_count,
) => {
	const retry_message = ` Retrying in ${retry_after} seconds.`
	const max_retries = 3
	if (retry_count < max_retries) {
		errors.push(`Rate limit reached.${retry_message}`)
		return true // retry
	}
	errors.push(`Rate limit reached ${max_retries} times.`)
}

const MyOctokit = Octokit.plugin(throttling, retry)
const octokit = new MyOctokit({
	auth: get(token) || PUBLIC_PAT,
	throttle: {
		onRateLimit: rate_limit_handler,
		onSecondaryRateLimit: rate_limit_handler,
		// The `write` group is what @octokit/plugin-throttling uses for the GraphQL API
		// This property is undocumented, but it is typed at least
		write: new Bottleneck.Group({
			maxConcurrent: 10,
			minTime: 100,
			// from @octokit/plugin-throttling source code:
			id: 'octokit-write',
			timeout: 1000 * 60 * 2,
		}),
	},
})

export async function fetch_stargazers_page(
	owner: string,
	repo: string,
	direction: 'forward' | 'back',
	cursor?: string,
) {
	const start_time = Date.now()
	const response_promise = octokit.graphql<{
		repository: {
			stargazers: {
				totalCount: number
				pageInfo: {
					startCursor: string
					endCursor: string
					hasNextPage: boolean
					hasPreviousPage: boolean
				}
				edges: { starredAt: string }[]
			}
		}
	}>(
		`query($owner: String!, $repo: String!, $first: Int, $last: Int, $after: String, $before: String) {
				repository(owner: $owner, name: $repo) {
					stargazers(first: $first, last: $last, after: $after, before: $before, orderBy: {field: STARRED_AT, direction: ASC}) {
						totalCount
						pageInfo {
							startCursor
							endCursor
							hasNextPage
							hasPreviousPage
						}
						edges {
							starredAt
						}
					}
				}
			}`,
		{
			owner,
			repo,
			after: direction === 'forward' ? cursor : undefined,
			before: direction === 'back' ? cursor : undefined,
			first: direction === 'forward' ? 100 : undefined,
			last: direction === 'back' ? 100 : undefined,
		},
	)

	const response = await response_promise.catch((error) => {
		if (error instanceof GraphqlResponseError && error.errors) {
			return {
				error: error.errors.map((error) => error.message).join('/n'),
			}
		} else if (error instanceof Error) {
			return { error: `${error.name}: ${error.message}` }
		} else {
			return { error: "Couldn't fetch stargazers" }
		}
	})

	console.log('response took', Date.now() - start_time, response)
	if ('error' in response) {
		return { error: response.error, stargazers: undefined }
	} else {
		return {
			error: undefined,
			stargazers: {
				...response.repository.stargazers,
				starTimes: response.repository.stargazers.edges.map((edge) => edge.starredAt),
			},
		}
	}
}
