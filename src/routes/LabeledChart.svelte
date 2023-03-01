<script lang="ts">
	import { createChart, type IChartApi } from 'lightweight-charts'
	import { onMount } from 'svelte'
	import type { SeriesData } from './+page.svelte'
	import Chart, { hexColors } from './Chart.svelte'
	import Label from './Label.svelte'

	let width: number
	let height: number
	$: if (width) {
		height = Math.round(width * 0.6)
	}

	export let series: SeriesData[] = []
	export let save: () => void

	let chart: IChartApi | null = null
	let container: HTMLDivElement
	onMount(() => {
		chart = createChart(container)
	})

	let chartComponent: Chart
</script>

<div class="series">
	{#each series as serie, i (serie.name)}
		<Label
			hex={hexColors[serie.color]}
			{serie}
			onDelete={() => {
				series.splice(i, 1)
				chartComponent.removeSeries(i)
				series = series
				save()
			}}
			onVisibleChange={(visible) => {
				chartComponent.setSeriesVisible(i, visible)
			}}
		/>
	{/each}
</div>

<div class="chart" bind:clientWidth={width}>
	<div bind:this={container}>
		{#if chart && series.length > 0}
			<Chart bind:this={chartComponent} {container} {chart} data={series} {width} {height} />
		{/if}
	</div>
</div>

<style lang="sass">
	.series
		text-align: center
	.chart
		width: 100%
		padding-bottom: 50px
</style>
