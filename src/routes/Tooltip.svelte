<script lang="ts">
	import type { BusinessDay, MouseEventParams, UTCTimestamp } from 'lightweight-charts'
	import { onDestroy } from 'svelte'
	import type { Chart, DataPoint, Line } from './chart'
	import { brightColors } from './color'

	export let chart: Chart

	const margin = 12
	let values: { line: Line; value: number }[] = []
	let width: number
	let height: number
	let left: number
	let top: number

	$: starScale = $chart.instance.priceScale('right')
	$: timeScale = $chart.instance.timeScale()

	function onTouchMove() {
		left = 10
		top = 10
	}
	function onMouseMove(e: { clientX: number; clientY: number }) {
		const bounds = $chart.container.getBoundingClientRect()
		const x = e.clientX - bounds.left
		const y = e.clientY - bounds.top
		left = x + margin
		if (left > $chart.container.clientWidth - width - starScale.width()) {
			left = x - width - margin
		}

		top = y + margin
		if (top > $chart.container.clientHeight - height - timeScale.height()) {
			top = y - height - margin
		}
	}
	$chart.container.addEventListener('mousemove', onMouseMove)
	$chart.container.addEventListener('touchmove', onTouchMove)
	onDestroy(() => {
		$chart.container.removeEventListener('mousemove', onMouseMove)
		$chart.container.removeEventListener('touchmove', onTouchMove)
	})

	/** Binary search */
	function findLatestDataPoint(arr: DataPoint[], max: UTCTimestamp) {
		let start = 0
		let end = arr.length - 1
		let result: DataPoint | null = null

		while (start <= end) {
			let middle = Math.floor((start + end) / 2)

			if (arr[middle].t <= max) {
				result = arr[middle]
				start = middle + 1
			} else {
				end = middle - 1
			}
		}
		return result
	}

	function updateTooltipOnMouseEvent(param: MouseEventParams) {
		values = []
		if (
			param.point === undefined ||
			!param.time ||
			param.point.x < 0 ||
			param.point.x > $chart.container.clientWidth ||
			param.point.y < 0 ||
			param.point.y > $chart.container.clientHeight
		) {
			return
		}
		// time is in the same format that we supplied to setData
		if (typeof param.time !== 'object') {
			console.error('time is not a BusinessDay:', param.time)
			return
		}
		const time = param.time as BusinessDay

		for (const line of $chart.lines) {
			const maxDate = new Date(time.year, time.month - 1, time.day, 23, 59, 59, 999)
			const maxTimestamp = (maxDate.getTime() / 1000) as UTCTimestamp
			const dataPoint = findLatestDataPoint(line.data, maxTimestamp)

			if (dataPoint) {
				values.push({
					line: line,
					value: dataPoint.v,
				})
			}
		}
		values.sort((a, b) => b.value - a.value)
		values = values
	}
	$chart.instance.subscribeCrosshairMove(updateTooltipOnMouseEvent)
	onDestroy(() => {
		$chart.instance.unsubscribeCrosshairMove(updateTooltipOnMouseEvent)
	})
</script>

<div
	class="tooltip"
	class:hide={values.length === 0}
	style:left={left + 'px'}
	style:top={top + 'px'}
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	<table>
		{#each values as tooltipValue}
			{#if !tooltipValue.line.hidden}
				<tr>
					<td class="name" style:color={brightColors[tooltipValue.line.color]}
						>{tooltipValue.line.name}</td
					>
					<td class="value">
						{tooltipValue.value}
					</td>
				</tr>
			{/if}
		{/each}
	</table>
</div>

<style lang="sass">
	.tooltip
		position: absolute
		font-size: 0.8rem
		text-align: left
		z-index: 10
		pointer-events: none
	table
		padding: 8px
		box-sizing: border-box
		border: 2px solid
		border-radius: 8px
		background-color: hsla(230, 0%, 0%, 0.45)
		backdrop-filter: blur(3px)
		border-color: hsla(241, 74%, 88%, 0.25)
	.hide
		display: none
	.value
		text-align: right
		padding-left: 2px
		font-variant-numeric: tabular-nums
</style>
