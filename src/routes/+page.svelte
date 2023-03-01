<script lang="ts">
	import { fly, slide } from 'svelte/transition'
	import { fetchStargazersPage } from './github'
	import { onMount } from 'svelte'
	import '../app.sass'
	import Nav from './Nav.svelte'
	import LabeledChart from './LabeledChart.svelte'
	import { getNextColorIndex, newChart, type Chart } from './chart'
	import type { UTCTimestamp } from 'lightweight-charts'

	let [owner, repo] = ['', '']

	let chart: Chart

	async function getStargazers(owner: string, repo: string) {
		for (const line of $chart.lines) {
			if (line.name === `${owner}/${repo}`) {
				return // already added
			}
		}
		let count = 0
		let endCursor: string | undefined
		const line = chart.addLine({
			name: `${owner}/${repo}`,
			color: getNextColorIndex(),
			data: [],
		})
		let totalCount = 0
		do {
			if (line.deleted) {
				return // abort
			}
			const { error, stargazers } = await fetchStargazersPage(owner, repo, 'forward', endCursor)
			if (!stargazers) {
				addError(error)
				chart.deleteLine(line)
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
			chart.appendLineData(line, newData)
		} while (endCursor)
		line.final = {
			t: Math.ceil(new Date().getTime() / 1000) as UTCTimestamp,
			v: totalCount,
		}
		chart.appendLineData(line, [line.final])
		chart.save()
	}

	let errors: { id: number; msg: string }[] = []
	function addError(msg: string) {
		const id = Math.random()
		errors.push({ id, msg })
		errors = errors
		return id
	}

	let width: number
	let height: number
	$: if (width) {
		height = Math.round(width * 0.6)
	}

	let container: HTMLDivElement
	onMount(() => {
		chart = newChart(container, { width, height })
	})
	$: $chart?.instance.applyOptions({
		width,
		height,
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

<div class="chart" bind:clientWidth={width}>
	{#if $chart && $chart.lines.length > 0}
		<LabeledChart {chart} />
	{/if}
	<div bind:this={container} class:hidden={!$chart || $chart.lines.length === 0} />
</div>

<style lang="sass">
	.error-container
		padding-bottom: 1rem
	.error
		border: 2px solid hsla(0, 100%, 50%, 0.5)
		background-color: hsla(0, 100%, 50%, 0.25)
		// color: hsl(0, 100%, 66%)
		border-radius: 8px
		padding: 0.75rem 1rem
		font-weight: 500
		margin: 0rem auto
		max-width: 650px
		font-size: 0.875rem
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
			padding: 0.2rem 0.25rem
			&:hover
				opacity: 0.7
	.chart
		width: 100%
		padding-bottom: 50px
	.hidden
		display: none
</style>
