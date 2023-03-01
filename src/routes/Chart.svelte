<script lang="ts">
	import type { UTCTimestamp } from 'lightweight-charts'
	import { ColorType } from 'lightweight-charts'
	import type { Chart } from './chart'

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

	let toolTipValues: { name: string; value: number }[] = []
	let toolTipDateStr = 0
	let toolTipLeft = 0
	let toolTipTop = 0
	let tooltipVisible = false

	// update tooltip
	$chart.instance.subscribeCrosshairMove((param) => {
		if (
			param.point === undefined ||
			!param.time ||
			param.point.x < 0 ||
			param.point.x > $chart.container.clientWidth ||
			param.point.y < 0 ||
			param.point.y > $chart.container.clientHeight
		) {
			tooltipVisible = false
		} else {
			// time will be in the same format that we supplied to setData.
			// thus it will be YYYY-MM-DD
			toolTipDateStr = param.time as UTCTimestamp
			tooltipVisible = true
			for (let i = 0; i < $chart.lines.length; i++) {
				toolTipValues = []
				const lineData = param.seriesData.get($chart.lines[i].instance)
				let v = 0
				if (lineData && 'value' in lineData && lineData.value !== undefined) {
					v = lineData.value
				} else if (lineData && 'close' in lineData && lineData.close !== undefined) {
					v = lineData.close
				} else {
					return
				}
				toolTipValues.push({
					name: $chart.lines[i].name,
					value: v,
				})
			}
		}
	})
</script>

<svelte:window on:resize={chart.resetZoom} />

<div class="tooltip" class:hide={!tooltipVisible} style:left={toolTipLeft} style:top={toolTipTop}>
	<div style="color: white">
		{toolTipDateStr}
	</div>
	<table>
		<tbody>
			<tr>
				{#each toolTipValues as toolTipValue}
					<td style:color="#ffdd00">{toolTipValue.name}</td>
					<td style="font-size: 24px; margin: 4px 0px; color: white">
						{toolTipValue}
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>

<style lang="sass">
	.tooltip
		height: 80px
		position: absolute
		display: none
		padding: 8px
		box-sizing: border-box
		font-size: 12px
		text-align: left
		z-index: 1000
		top: 12px
		left: 12px
		pointer-events: none
		border: 1px solid
		border-radius: 2px
		font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif
		webkit-font-smoothing: antialiased
		moz-osx-font-smoothing: grayscale
		color: white
		border-color: #cbcaf7
	.hide
		display: none
</style>
