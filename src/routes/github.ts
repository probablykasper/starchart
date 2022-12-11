import { Octokit } from 'octokit'
import { PUBLIC_PAT } from '$env/static/public'
import { get, writable } from 'svelte/store'
import { browser } from '$app/environment'

const loadedToken = browser ? localStorage.getItem('starchart-token') : undefined
export const token = writable(loadedToken || '')
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

export async function fetchStargazersPage(
	owner: string,
	repo: string,
	direction: 'forward' | 'back',
	cursor?: string
) {
	const responsePromise = octokit.graphql<{
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
					stargazers(first: $first, last: $last, after: $after, before: $before) {
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
		}
	)

	const response = await responsePromise.catch((error) => {
		console.error(error)
		const response = error?.response
		const status = error?.response?.status
		console.log('status', status)
		const message = error?.response?.data?.message || ''
		if (!response) {
			return {
				error: typeof error.message === 'string' ? (error.message as string) : 'Unknown error',
			}
		} else if (status === 404) {
			return { error: `Repo ${owner}/${repo} not found` }
		} else if (status === 403) {
			return { error: 'GitHub rate limit exceeded' }
		} else if (status !== undefined) {
			return { error: [`Couldn't fetch stargazers, code ${status}`, message].join(': ') }
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
