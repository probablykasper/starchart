<script lang="ts">
	import Chart from './Chart.svelte'
	import { fly, scale, slide } from 'svelte/transition'
	import { fetchStargazersPage } from './github'
	import { onMount } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import RepoInput from './RepoInput.svelte'
	import AccessToken from './AccessToken.svelte'
	import '../app.sass'

	let [owner, repo] = ['', '']

	type Datapoint = { x: Date; y: number }
	type Serie = {
		name: string
		data: Datapoint[]
		final?: Datapoint
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
		}
		let totalCount = 0
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
			totalCount = stargazers.totalCount

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
		newSerie.final = {
			x: new Date(),
			y: totalCount,
		}

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
				data: [...serie.data],
				final: serie.final,
			}
			if (serie.final) {
				finalSerie.data.push(serie.final)
			}
			return finalSerie
		})
		return finalSeries
	}
</script>

<nav>
	<h1 class="left">Starchart</h1>
	<RepoInput bind:owner bind:repo onSubmit={() => getStargazers(owner, repo)} />
	<div class="right">
		<AccessToken />
		<a href="https://github.com/probablykasper/starchart">
			<svg
				height="24"
				viewBox="-2 -2 28 28"
				width="24"
				xmlns="http://www.w3.org/2000/svg"
				class="svelte-8lfi33"
				><path
					d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					class="svelte-8lfi33"
				/></svg
			>
		</a>
	</div>
</nav>

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
				type: 'datetime',
			},
			yaxis: {
				labels: {
					formatter: (value) => value.toFixed(0),
				},
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
	nav
		display: flex
		width: 100%
		padding-top: 0.25rem
		padding-bottom: 1rem
		flex-direction: column
		align-items: center
		justify-content: center
		@media (min-width: 768px)
			flex-direction: row
			justify-content: space-between
			.left, .right
				width: 12rem
			.right
				display: flex
				justify-content: flex-end
	.right
		display: flex
		align-items: center
		a
			color: #ffffff
			cursor: default
		svg
			vertical-align: middle
			margin-left: 0.5rem
	.series
		text-align: center
	.serie
		padding: 0.1rem 0.5rem
		padding-right: 0rem
		border-radius: 8px
		border: 2px solid
		margin: 0.25rem
		font-size: 0.9rem
		display: inline-flex
		align-items: center
		user-select: none
		font-weight: 500
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
		font-size: 0.9rem
		position: relative
		text-align: initial
		button
			position: absolute
			top: 0px
			right: 0px
			padding: 0.2rem
	button:hover
		opacity: 0.7
</style>
