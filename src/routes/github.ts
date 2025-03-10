import { Octokit } from '@octokit/core'
import { GraphqlResponseError } from '@octokit/graphql'
import { PUBLIC_PAT } from '$env/static/public'
import { get, writable } from 'svelte/store'
import { browser } from '$app/environment'

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

const octokit = new Octokit({
	auth: get(token) || PUBLIC_PAT,
	throttle: { enabled: false },
})

export async function fetch_stargazers_page(
	owner: string,
	repo: string,
	direction: 'forward' | 'back',
	cursor?: string,
) {
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

	console.log('response', response)
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
