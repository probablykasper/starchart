<script lang="ts">
	import Chart from './Chart.svelte'
	import { fly, scale, slide } from 'svelte/transition'
	import { fetchStargazersPage } from './github'
	import { onMount } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import RepoInput from './RepoInput.svelte'

	// let [owner, repo] = ['tauri-apps', 'tao']
	let [owner, repo] = ['probablykasper', 'cpc']

	type Datapoint = { x: Date; y: number }
	type Serie = {
		name: string
		data: Datapoint[]
		final: Datapoint
	}
	type Json = {
		series: Serie[]
		v: number
	}
	/** Used to invalidate old localStorage */
	const jsonTypeVersion = 0

	let series: Serie[] = []
	const hexColors = ['#ffdd00', '#2491ff', '#60ff0a', '#FFFFFF', '#E91E63', '#FF9800']
	onMount(() => {
		try {
			const seriesLocalStorage = JSON.parse(localStorage.getItem('starchart-series') || '[]')
			if (seriesLocalStorage?.v === jsonTypeVersion) {
				series = (seriesLocalStorage as Json).series
			} else {
				localStorage.removeItem('starchart-series')
			}
		} catch (_e) {
			// ignore
		}
	})

	let width: number
	let height: number
	$: if (width) {
		height = Math.round(width * 0.6)
	}

	let errors: { id: number; msg: string }[] = []
	function addError(msg: string) {
		const id = Math.random()
		errors.push({ id, msg })
		errors = errors
		return id
	}

	async function getStargazers(owner: string, repo: string) {
		for (const serie of series) {
			if (serie.name === `${owner}/${repo}`) {
				return // already added
			}
		}
		let count = 0
		let endCursor: string | undefined
		const newSerie: Serie = {
			name: `${owner}/${repo}`,
			data: [],
			final: {
				x: new Date(),
				y: 0,
			},
		}
		series = [...series, newSerie]
		do {
			const { error, stargazers } = await fetchStargazersPage(owner, repo, 'forward', endCursor)
			if (!stargazers) {
				addError(error)
				series = series.filter((serie) => serie.name !== newSerie.name)
				return
			}

			if (stargazers.pageInfo.hasNextPage) {
				endCursor = stargazers.pageInfo.endCursor
			} else {
				endCursor = undefined
			}
			newSerie.final.y = stargazers.totalCount

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

		const json: Json = {
			series,
			v: jsonTypeVersion,
		}
		localStorage.setItem('starchart-series', JSON.stringify(json))
	}

	$: finalSeries = finalize(series)
	function finalize(series: Serie[]): Serie[] {
		const finalSeries = [...series].map((serie) => {
			const finalSerie: Serie = {
				name: serie.name,
				data: [...serie.data, serie.final],
				final: serie.final,
			}
			return finalSerie
		})
		return finalSeries
	}
</script>

<h1>Starchart</h1>

{#each errors as error, i (error.id)}
	<div class="error-container" transition:slide={{ duration: 200 }}>
		<div class="error" transition:fly={{ duration: 200, opacity: 0, y: -40 }}>
			{error.msg}
			<button
				on:click={() => {
					errors.splice(i, 1)
					errors = errors
				}}
			>
				<svg
					fill="currentColor"
					width="18"
					height="18"
					clip-rule="evenodd"
					fill-rule="evenodd"
					stroke-linejoin="round"
					stroke-miterlimit="2"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"
					/></svg
				>
			</button>
		</div>
	</div>
{/each}

<RepoInput bind:owner bind:repo onSubmit={() => getStargazers(owner, repo)} />
<button on:click={() => getStargazers(owner, repo)}>Load</button>

<div>
	<a href="https://github.com/settings/tokens/new?description=Starchart">Generate PAT</a>
</div>

<div>
	{#each series as serie, i (serie.name)}
		{@const hex = hexColors[i % hexColors.length]}
		<span
			class="serie"
			style:border-color={hex}
			style:background-color={hex + '77'}
			transition:scale={{ duration: 200, easing: cubicOut, start: 0.75, opacity: 0 }}
		>
			{serie.name}
			<button
				on:click={() => {
					series.splice(i, 1)
					series = series
				}}
			>
				<svg
					fill="currentColor"
					width="18"
					height="18"
					clip-rule="evenodd"
					fill-rule="evenodd"
					stroke-linejoin="round"
					stroke-miterlimit="2"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"
					/></svg
				>
			</button>
		</span>
	{/each}
</div>

<div class="chart" bind:clientWidth={width}>
	<Chart
		options={{
			chart: {
				background: 'transparent',
				width: width || '100%',
				height: height || '100%',
				foreColor: '#ccc',
				dropShadow: {
					enabled: true,
					color: '#000',
				},
				type: 'area',
				fontFamily: 'inherit',
			},
			colors: hexColors,
			stroke: {
				curve: 'smooth',
				// dashArray
			},
			dataLabels: {
				enabled: false,
			},
			fill: {
				gradient: {
					opacityFrom: 0.55,
					opacityTo: 0,
					stops: [0, 90],
					// shade: 'dark',
				},
			},
			series: finalSeries,
			xaxis: {
				// categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
				type: 'datetime',
			},
			tooltip: {
				theme: 'dark',
				x: {
					format: 'yyyy MMM dd',
				},
			},
			grid: {
				borderColor: '#808080',
			},
			theme: {
				mode: 'dark',
			},
		}}
	/>
</div>

<style lang="sass">
	:global(html)
		margin: 0px
		font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji"
		font-size: 18px
		background-color: #111318
		color: #f2f2f2
		text-align: center
	:global(body)
		max-width: 1000px
		margin: 0px auto
	h1
		color: #ffdd00
	.serie
		padding: 0.1rem 0.5rem
		padding-right: 0rem
		border-radius: 8px
		border: 2px solid
		margin: 0.25rem
		font-size: 0.85rem
		display: inline-flex
		align-items: center
		user-select: none
		svg
			display: block
	button
		background: none
		border: none
		color: inherit
	.chart
		width: 100%
	.error-container
		padding-bottom: 1rem
	.error
		border: 1px solid hsla(0, 100%, 50%, 0.5)
		background-color: hsla(0, 100%, 50%, 0.25)
		color: hsl(0, 100%, 66%)
		border-radius: 8px
		padding: 0.75rem 1rem
		margin: 0rem auto
		max-width: 650px
		font-size: 0.85rem
		position: relative
		text-align: initial
		button
			position: absolute
			top: 0px
			right: 0px
			padding: 0.2rem
	button:hover
		opacity: 0.7
	// .chart
	//   :global(.apexcharts-tooltip), :global(.apexcharts-marker)
	//     transition: 200ms ease-out
</style>
