<script lang="ts">
	import Chart from './Chart.svelte'
	import { Octokit } from 'octokit'
	import { PUBLIC_PAT } from '$env/static/public'
	import { checkShortcut } from './shortcuts'

	const octokit = new Octokit({ auth: PUBLIC_PAT })
	let owner = 'tauri-apps'
	let repo = 'tao'

	// let series: Series = [
	// 	{
	// 		name: 'sales',
	// 		// data: [30, 40, 35, null, null, null, 70, 91, 125],
	// 		data: [30, 40, 35, 38, 58, 60, 70, 91, 125],
	// 	},
	// ]
	type Datapoint = { x: Date; y: number }
	type Serie = {
		name: string
		data: Datapoint[]
	}
	let series: Serie[] = []
	async function getStargazers() {
		let count = 0
		let endCursor: string | undefined
		const newSerie: Serie = {
			name: `${owner}/${repo}`,
			data: [],
		}
		series = [...series, newSerie]
		do {
			const stargazers = await fetchStargazersPage('forward', endCursor)
			if (stargazers.pageInfo.hasNextPage) {
				endCursor = stargazers.pageInfo.endCursor
			} else {
				endCursor = undefined
			}
			// const stargazers = {
			// 	starTimes: [
			// 		'2019-05-08T16:29:05Z',
			// 		'2020-05-13T03:33:27Z',
			// 		'2021-05-14T14:46:40Z',
			// 		'2022-05-15T03:07:23Z',
			// 	],
			// }
			const newData = stargazers.starTimes.map((starTime) => {
				count++
				return {
					x: new Date(starTime),
					y: count,
				}
			})
			newSerie.data = [...newSerie.data, ...newData]
			series = series
		} while (endCursor)
	}
	async function fetchStargazersPage(direction: 'forward' | 'back', cursor?: string) {
		const response = (await octokit.graphql(
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
		)) as {
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
		}
		console.log('response', response)
		return {
			...response.repository.stargazers,
			starTimes: response.repository.stargazers.edges.map((edge) => edge.starredAt),
		}
	}

	function inputKeydown(e: KeyboardEvent) {
		if (checkShortcut(e, 'Enter')) {
			console.log('enter')
			getStargazers()
		}
	}
</script>

<h1>Starchart</h1>

<form action="" />
<div on:keydown={inputKeydown}>
	<input type="text" bind:value={owner} />
	<input type="text" bind:value={repo} />
</div>
<button on:click={getStargazers}>Load</button>

<a href="https://github.com/settings/tokens/new?description=Starchart">Generate PAT</a>

<div class="chart">
	<Chart
		options={{
			chart: {
				type: 'line',
				zoom: {
					enabled: false,
				},
			},
			stroke: {
				curve: 'straight',
			},
			series,
			xaxis: {
				// categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
				type: 'datetime',
			},
			tooltip: {
				theme: 'dark',
				// intersect: true,
				shared: false,
				x: {
					format: 'yyyy MMM dd',
				},
			},
		}}
	/>
</div>

<style lang="sass">
  :global(html)
    margin: 0px
    font-family: Arial, Helvetica, sans-serif
    font-size: 18px
    background-color: #111318
    color: #f2f2f2
    text-align: center
  h1
    color: #ffdd00
  .chart
    padding: 0px 2rem
    max-width: 1000px
    margin: 0px auto
  // .chart
  //   :global(.apexcharts-tooltip), :global(.apexcharts-marker)
  //     transition: 200ms ease-out
</style>
