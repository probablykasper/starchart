<script lang="ts">
	import type { BusinessDay, MouseEventParams, UTCTimestamp } from 'lightweight-charts'
	import { onDestroy } from 'svelte'
	import type { Chart, DataPoint, Line } from './chart'
	import { bright_colors } from './color'

	export let chart: Chart

	const margin = 12
	let values: { line: Line; value: number }[] = []
	let width: number
	let height: number
	let left: number
	let top: number

	$: star_scale = $chart.instance.priceScale('right')
	$: time_scale = $chart.instance.timeScale()

	function on_touch_move() {
		left = 10
		top = 10
	}
	function on_mouse_move(e: { clientX: number; clientY: number }) {
		const bounds = $chart.container.getBoundingClientRect()
		const x = e.clientX - bounds.left
		const y = e.clientY - bounds.top
		left = x + margin
		if (left > $chart.container.clientWidth - width - star_scale.width()) {
			left = x - width - margin
		}

		top = y + margin
		if (top > $chart.container.clientHeight - height - time_scale.height()) {
			top = y - height - margin
		}
	}
	$chart.container.addEventListener('mousemove', on_mouse_move)
	$chart.container.addEventListener('touchmove', on_touch_move)
	onDestroy(() => {
		$chart.container.removeEventListener('mousemove', on_mouse_move)
		$chart.container.removeEventListener('touchmove', on_touch_move)
	})

	/** Binary search */
	function find_latest_data_point(arr: DataPoint[], max: UTCTimestamp) {
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

	function update_tooltip_on_mouse_event(param: MouseEventParams) {
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
			const max_date = new Date(time.year, time.month - 1, time.day, 23, 59, 59, 999)
			const max_timestamp = (max_date.getTime() / 1000) as UTCTimestamp
			const data_point = find_latest_data_point(line.data, max_timestamp)

			if (data_point) {
				values.push({
					line: line,
					value: data_point.v,
				})
			}
		}
		values.sort((a, b) => b.value - a.value)
		values = values
	}
	$chart.instance.subscribeCrosshairMove(update_tooltip_on_mouse_event)
	onDestroy(() => {
		$chart.instance.unsubscribeCrosshairMove(update_tooltip_on_mouse_event)
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
			{#each values as tooltip_value (tooltip_value.line.name)}
				{#if !tooltip_value.line.hidden}
					<tr>
						<td class="name" style:color={bright_colors[tooltip_value.line.color]}
							>{tooltip_value.line.name}</td
						>
						<td class="value">
							{tooltip_value.value}
						</td>
					</tr>
				{/if}
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
