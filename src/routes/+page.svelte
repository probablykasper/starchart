<script lang="ts" context="module">
	import type { UTCTimestamp } from 'lightweight-charts'

	export type DataPoint = { t: UTCTimestamp; v: number }
	export type SeriesData = {
		name: string
		data: DataPoint[]
		color: number
		/** Loading if absent */
		final?: DataPoint
	}
</script>

<script lang="ts">
	import { fly, slide } from 'svelte/transition'
	import { fetchStargazersPage } from './github'
	import { onMount } from 'svelte'
	import { createChart, type IChartApi } from 'lightweight-charts'
	import Chart, { getNextColorIndex, hexColors } from './Chart.svelte'
	import '../app.sass'
	import Nav from './Nav.svelte'
	import Label from './Label.svelte'

	let [owner, repo] = ['', '']

	type Json = {
		series: SeriesData[]
		v: number
	}
	/** Used to invalidate old localStorage */
	const jsonTypeVersion = 1

	let series: SeriesData[] = []
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
		const newSerie: SeriesData = {
			name: `${owner}/${repo}`,
			color: getNextColorIndex(),
			data: [],
		}
		let totalCount = 0
		series = [...series, newSerie]
		do {
			if (!series.find((serie) => serie.name === newSerie.name)) {
				// abort
				return
			}
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
			totalCount = stargazers.totalCount

			const newData = stargazers.starTimes.map((starTime) => {
				count++
				return {
					t: Math.ceil(new Date(starTime).getTime() / 1000) as UTCTimestamp,
					v: count,
				}
			})

			newSerie.data = [...newSerie.data, ...newData]
			series = series
		} while (endCursor)
		newSerie.final = {
			t: Math.ceil(new Date().getTime() / 1000) as UTCTimestamp,
			v: totalCount,
		}
		save()
	}

	function save() {
		const json: Json = {
			series,
			v: jsonTypeVersion,
		}
		localStorage.setItem('starchart-series', JSON.stringify(json))
	}

	let chart: IChartApi | null = null
	let container: HTMLDivElement
	onMount(() => {
		chart = createChart(container)
	})
</script>

<Nav bind:owner bind:repo onSubmit={() => getStargazers(owner, repo)} />

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

<div class="series">
	{#each series as serie, i (serie.name)}
		<Label
			hex={hexColors[serie.color]}
			{serie}
			onDelete={() => {
				series.splice(i, 1)
				series = series
				save()
			}}
		/>
	{/each}
</div>

<div class="chart" bind:clientWidth={width}>
	<div bind:this={container}>
		{#if chart && series.length > 0}
			<Chart {container} {chart} data={series} {width} {height} />
		{/if}
	</div>
</div>

<style lang="sass">
	.series
		text-align: center
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
		font-size: 0.9rem
		position: relative
		text-align: initial
		button
			background: none
			border: none
			color: inherit
			position: relative
			position: absolute
			top: 0px
			right: 0px
			padding: 0.2rem
			&:hover
				opacity: 0.7
</style>
