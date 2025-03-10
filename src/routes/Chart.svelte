<script lang="ts">
	import type { Chart } from './chart'
	import Label from './Label.svelte'
	import { ColorType } from 'lightweight-charts'

	export let chart: Chart

	$chart.instance.applyOptions({
		layout: {
			background: { type: ColorType.Solid, color: 'transparent' },
			textColor: '#FFFFFF',
		},
		grid: {
			vertLines: {
				visible: false,
			},
			horzLines: {
				visible: false,
			},
		},
		rightPriceScale: {
			scaleMargins: {
				top: 0.05,
				bottom: 0,
			},
		},
		handleScale: {
			mouseWheel: false,
			axisPressedMouseMove: {
				time: true,
				price: false,
			},
		},
		timeScale: {
			fixRightEdge: true,
			fixLeftEdge: true,
			shiftVisibleRangeOnNewBar: true,
		},
		crosshair: {
			mode: 1,
			horzLine: {
				visible: false,
				labelVisible: false,
			},
		},
		localization: {
			dateFormat: 'yyyy MMM dd',
		},
	})
</script>

<div class="labels">
	{#each $chart.lines as line (line.name)}
		<Label
			{line}
			on_delete={() => {
				chart.deleteLine(line)
				chart.save()
			}}
		/>
	{/each}
</div>

<svelte:window on:resize={chart.resetZoom} />

<style lang="sass">
	.labels
		text-align: center
		display: flex
		flex-wrap: wrap
		justify-content: center
		gap: 8px
		padding-top: 8px
		padding-bottom: 14px
</style>
