<script lang="ts" context="module">
	import { TinyColor } from '@ctrl/tinycolor'

	export const hexColors = ['#ffdd00', '#2491ff', '#60ff0a', '#FFFFFF', '#E91E63', '#FF9800']
	const topColors = hexColors.map((hexColor) => {
		const color = new TinyColor(hexColor)
		color.setAlpha(0.5)
		return color.saturate(100).toRgbString()
	})
	const bottomColors = hexColors.map((hexColor) => {
		const color = new TinyColor(hexColor)
		color.setAlpha(0)
		return color.darken(0).toRgbString()
	})

	let nextColorIndex = 0
	export function getNextColorIndex() {
		const value = nextColorIndex
		nextColorIndex = (nextColorIndex + 1) % hexColors.length
		return value
	}
</script>

<script lang="ts">
	import type { SeriesData } from './+page.svelte'
	import type {
		UTCTimestamp,
		IChartApi,
		ISeriesApi,
		SeriesDataItemTypeMap,
	} from 'lightweight-charts'
	import { ColorType } from 'lightweight-charts'
	import { onDestroy } from 'svelte'

	export let container: HTMLDivElement
	export let chart: IChartApi
	export let data: SeriesData[]
	export let width: number
	export let height: number

	chart.applyOptions({
		height,
		width,
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
		},
		crosshair: {
			mode: 1,
			horzLine: {
				visible: false,
				labelVisible: false,
			},
		},
	})

	const seriesList: ISeriesApi<'Area'>[] = []

	function toLineSeriesData(series: SeriesData): SeriesDataItemTypeMap['Area'][] {
		const dataPoints: { date: Date; value?: number }[] = []
		const fullSeries = series.final ? [...series.data, series.final] : series.data

		for (const dataPoint of fullSeries) {
			const dt = new Date(dataPoint.t * 1000)
			const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

			let lastDataPoint = dataPoints[dataPoints.length - 1]
			if (lastDataPoint) {
				while (lastDataPoint.date < date) {
					dataPoints.push({
						date: new Date(
							lastDataPoint.date.getFullYear(),
							lastDataPoint.date.getMonth(),
							lastDataPoint.date.getDate() + 1
						),
						value: lastDataPoint.value,
					})
					lastDataPoint = dataPoints[dataPoints.length - 1]
				}
			}
			if (lastDataPoint && lastDataPoint.date.getTime() === date.getTime()) {
				dataPoints[dataPoints.length - 1].value = dataPoint.v
			} else {
				dataPoints.push({
					date: date,
					value: dataPoint.v,
				})
			}
		}

		return dataPoints.map((dataPoint) => {
			const dp: SeriesDataItemTypeMap['Area'] = {
				time: (dataPoint.date.getTime() / 1000) as UTCTimestamp,
				value: dataPoint.value,
			}
			return dp
		})
	}

	$: update(data)
	function update(data: SeriesData[]) {
		console.log(data.length, seriesList.length)

		for (let i = seriesList.length - 1; i > data.length - 1; i--) {
			chart.removeSeries(seriesList[i])
			seriesList.pop()
		}
		for (let i = 0; i < data.length; i++) {
			if (!seriesList[i]) {
				const series = chart.addAreaSeries({
					priceLineVisible: false,
					topColor: topColors[i],
					bottomColor: bottomColors[i],
					lineColor: hexColors[i],
					priceFormat: {
						type: 'volume',
					},
				})
				seriesList.push(series)
			}
			seriesList[i].setData(toLineSeriesData(data[i]))
		}
		console.log(data, seriesList)
	}

	// const toolTipWidth = 80
	// const toolTipHeight = 80
	// const toolTipMargin = 15
	let toolTipValues: { name: string; value: number }[] = []
	let toolTipDateStr = 0
	let toolTipLeft = 0
	let toolTipTop = 0
	let tooltipVisible = false

	// update tooltip
	chart.subscribeCrosshairMove((param) => {
		if (
			param.point === undefined ||
			!param.time ||
			param.point.x < 0 ||
			param.point.x > container.clientWidth ||
			param.point.y < 0 ||
			param.point.y > container.clientHeight
		) {
			tooltipVisible = false
		} else {
			// time will be in the same format that we supplied to setData.
			// thus it will be YYYY-MM-DD
			toolTipDateStr = param.time as UTCTimestamp
			tooltipVisible = true
			for (let i = 0; i < seriesList.length; i++) {
				toolTipValues = []
				const lineData = param.seriesData.get(seriesList[i])
				let v = 0
				if (lineData && 'value' in lineData && lineData.value !== undefined) {
					v = lineData.value
				} else if (lineData && 'close' in lineData && lineData.close !== undefined) {
					v = lineData.close
				} else {
					return
				}
				toolTipValues.push({
					name: data[i].name,
					value: v,
				})
			}

			// const coordinate = seriesList[0].priceToCoordinate(price)
			// let shiftedCoordinate = param.point.x - 50
			// if (coordinate === null) {
			// 	return
			// }
			// shiftedCoordinate = Math.max(
			// 	0,
			// 	Math.min(container.clientWidth - toolTipWidth, shiftedCoordinate)
			// )
			// const coordinateY =
			// 	coordinate - toolTipHeight - toolTipMargin > 0
			// 		? coordinate - toolTipHeight - toolTipMargin
			// 		: Math.max(
			// 				0,
			// 				Math.min(
			// 					container.clientHeight - toolTipHeight - toolTipMargin,
			// 					coordinate + toolTipMargin
			// 				)
			// 		  )
			// toolTipLeft = shiftedCoordinate
			// toolTipTop = coordinateY
		}
	})

	chart.timeScale().fitContent()

	onDestroy(() => {
		for (const series of seriesList) {
			chart.removeSeries(series)
		}
	})
</script>

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
		border-color: #ffdd00
	.hide
		display: none
</style>
