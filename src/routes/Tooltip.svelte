<script lang="ts">
	import type { MouseEventParams, UTCTimestamp } from 'lightweight-charts'
	import { onDestroy } from 'svelte'
	import type { Chart, DataPoint, Line } from './chart'
	import { hexColors } from './color'

	export let chart: Chart

	const margin = 12
	let values: { line: Line; value: number }[] = []
	let width: number
	let height: number
	let left: number
	let top: number

	function onMouseMove(e: MouseEvent) {
		const bounds = $chart.container.getBoundingClientRect()
		const x = e.clientX - bounds.left
		const y = e.clientY - bounds.top
		// console.log(bounds.left)
		// console.log(e.clientX - bounds.left, e.clientY - bounds.top)
		left = x + margin
		if (left > $chart.container.clientWidth - width) {
			left = x - width - margin
		}

		top = y + margin
		if (top > $chart.container.clientHeight - height) {
			top = y - height - margin
		}
	}
	$chart.container.addEventListener('mousemove', onMouseMove)
	onDestroy(() => {
		$chart.container.removeEventListener('mousemove', onMouseMove)
	})

	function findHighestDataPoint(arr: DataPoint[], max: UTCTimestamp) {
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

	// update tooltip
	function mouseEventHandler(param: MouseEventParams) {
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
		const time = param.time as UTCTimestamp

		// left = param.point.x + margin
		// if (left > $chart.container.clientWidth - width) {
		// 	left = param.point.x - margin - width
		// }

		// top = param.point.y + margin
		// if (top > $chart.container.clientHeight - height) {
		// 	top = param.point.y - height - margin
		// }

		for (const line of $chart.lines) {
			const dataPoint = findHighestDataPoint(line.data, time)
			if (dataPoint) {
				// const date = new Date(dataPoint.t * 1000)
				// console.log(
				// 	`${line.name} ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
				// 	dataPoint.v
				// )
				values.push({
					line: line,
					value: dataPoint.v,
				})
			}
		}
		values.sort((a, b) => b.value - a.value)
		values = values
	}
	$chart.instance.subscribeCrosshairMove(mouseEventHandler)
	onDestroy(() => {
		$chart.instance.unsubscribeCrosshairMove(mouseEventHandler)
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
		<tbody>
			{#each values as tooltipValue}
				<tr>
					<td style:color={hexColors[tooltipValue.line.color]}>{tooltipValue.line.name}</td>
					<td class="value">
						{tooltipValue.value}
					</td>
				</tr>
			{/each}
		</tbody>
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
		background-color: hsla(230, 0%, 0%, 0.4)
		backdrop-filter: blur(3px)
		border-color: hsla(241, 74%, 88%, 0.25)
	.hide
		display: none
	.value
		text-align: right
		padding-left: 2px
		font-variant-numeric: tabular-nums
</style>
