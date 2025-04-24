<script lang="ts">
	import { fly, slide } from 'svelte/transition'
	import { fetch_stargazers_page } from './github'
	import { onMount } from 'svelte'
	import '../app.sass'
	import Nav from './Nav.svelte'
	import ChartComponent from './Chart.svelte'
	import { get_next_color_index, new_chart, type Chart } from './chart'
	import type { UTCTimestamp } from 'lightweight-charts'
	import Tooltip from './Tooltip.svelte'

	let [owner, repo] = ['', '']

	let chart: Chart | undefined

	async function get_stargazers(owner: string, repo: string) {
		if (!chart || !$chart) {
			add_error('Chart not initialized')
			return
		}
		for (const line of $chart.lines) {
			if (line.name === `${owner}/${repo}`) {
				return // already added
			}
		}
		let count = 0
		let end_cursor: string | undefined
		const line = chart.addLine({
			name: `${owner}/${repo}`,
			color: get_next_color_index(),
			data: [],
		})
		let total_count = 0
		do {
			if (line.deleted) {
				return // abort
			}
			const { error, stargazers } = await fetch_stargazers_page(owner, repo, 'forward', end_cursor)
			if (!stargazers) {
				add_error(error)
				chart.deleteLine(line)
				return
			}

			if (stargazers.pageInfo.hasNextPage) {
				end_cursor = stargazers.pageInfo.endCursor
			} else {
				end_cursor = undefined
			}
			total_count = stargazers.totalCount

			const new_data = stargazers.starTimes.map((star_time) => {
				count++
				return {
					t: Math.floor(new Date(star_time).getTime() / 1000) as UTCTimestamp,
					v: count,
				}
			})
			chart.appendStargazers(line, new_data)
		} while (end_cursor)
		chart.addFinal(line, {
			t: Math.floor(new Date().getTime() / 1000) as UTCTimestamp,
			v: total_count,
		})
		chart.save()
	}

	let errors: { id: number; msg: string }[] = []
	function add_error(msg: string) {
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
		chart = new_chart(container, {
			width,
			height,
			layout: {
				attributionLogo: false,
			},
		})
	})
	$: $chart?.instance.applyOptions({
		width,
		height,
	})
</script>

<Nav bind:owner bind:repo on_submit={() => get_stargazers(owner, repo)} />

{#each errors as error, i (error.id)}
	<div class="error-container" transition:slide={{ duration: 200 }}>
		<div class="error" transition:fly={{ duration: 200, opacity: 0, y: -40 }}>
			{error.msg}
			<button
				type="button"
				aria-label="Dismiss error"
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

{#if chart && $chart && $chart.lines.length > 0}
	<ChartComponent bind:chart />
{/if}
<div class="chart" bind:clientWidth={width}>
	<div class="watermark">starchart.kasper.space</div>
	<div bind:this={container} class:hidden={!$chart || $chart.lines.length === 0}></div>
	{#if chart && $chart && $chart.lines.length > 0}
		<Tooltip {chart} />
	{/if}
</div>

<div class="bottom-bar">
	{#if chart && $chart && $chart.lines.length > 0}
		<label>
			<input
				type="checkbox"
				checked={$chart.align}
				on:input={(e) => {
					if (!chart) {
						return
					} else if (e.currentTarget.checked) {
						chart.alignLines()
					} else {
						chart.unalignLines()
					}
					chart.save()
				}}
			/>
			Align
		</label>
		<label>
			<input
				type="checkbox"
				checked={$chart.logScale}
				on:input={(e) => {
					if (chart) {
						chart.setLogScale(e.currentTarget.checked)
						chart.save()
					}
				}}
			/>
			Logarithmic
		</label>
	{/if}
</div>

<style lang="sass">
	.error-container
		padding-bottom: 1rem
	.error
		border: 2px solid hsla(0, 100%, 50%, 0.5)
		background-color: hsla(0, 100%, 50%, 0.25)
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
		position: relative // for tooltip
	.watermark
		position: absolute
		color: hsla(0, 0%, 100%, 0.1)
		top: 1.5rem
		left: 1.5rem
		z-index: 10
	.hidden
		display: none
	.bottom-bar
		padding-top: 10px
		padding-bottom: 50px
		display: flex
		gap: 12px
		margin-left: -6px
	label
		padding: 0.5rem
		font-size: 0.9375rem
		color: #FFFFFF
		display: inline-flex
		align-items: center
		user-select: none
	input[type='checkbox']
		appearance: none
		margin: 0px
		margin-right: 6px
		padding: 0px
		width: 1rem
		height: 1rem
		background-color: hsl(224, 9%, 20%)
		border-radius: 4px
		border: 1px solid hsl(228, 3%, 50%)
		transition: 120ms ease-out border-color
		&:checked
			background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")
		&:focus-visible
			border-color: #cbcaf7
			box-shadow: 0 0 1px #cbcaf7
			outline: 1px solid transparent
</style>
