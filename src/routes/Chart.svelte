<script lang="ts" context="module">
	import { TinyColor } from '@ctrl/tinycolor'

	export const hexColors = ['#E91E63', '#0064fa', '#ffdd00', '#FF9800', '#08fd96', '#FFFFFF']

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

	$: chart.applyOptions({
		width,
		height,
	})

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

	let fillerSeries = chart.addAreaSeries({
		priceScaleId: '',
		visible: false,
	})
	function getFiller(data: SeriesData[]) {
		let lowestDate = (Date.now() / 1000) as UTCTimestamp
		for (const series of data) {
			const dataPoint = series.data[0]
			if (dataPoint && dataPoint.t < lowestDate) {
				lowestDate = dataPoint.t
			}
		}
		const dt = new Date(lowestDate * 1000)
		const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

		let dates = [date]
		while (dates[dates.length - 1] < new Date()) {
			dates.push(
				new Date(
					dates[dates.length - 1].getFullYear(),
					dates[dates.length - 1].getMonth(),
					dates[dates.length - 1].getDate() + 1
				)
			)
		}
		fillerSeries.setData(
			dates.map((date) => {
				return {
					time: (date.getTime() / 1000) as UTCTimestamp,
				}
			})
		)
	}

	$: update(data)
	function update(data: SeriesData[]) {
		let willExpand = data.length > seriesList.length
		for (let i = seriesList.length - 1; i > data.length - 1; i--) {
			chart.removeSeries(seriesList[i])
			seriesList.pop()
		}
		for (let i = 0; i < data.length; i++) {
			if (!seriesList[i]) {
				const series = chart.addAreaSeries({
					priceLineVisible: false,
					topColor: topColors[data[i].color],
					bottomColor: bottomColors[data[i].color],
					lineColor: hexColors[data[i].color],
					priceFormat: {
						type: 'custom',
						formatter: (price: number) => {
							return Math.round(price)
						},
					},
				})
				seriesList.push(series)
			}
			seriesList[i].setData(toLineSeriesData(data[i]))
		}
		if (data[data.length - 1]) {
			const lastColor = data[data.length - 1].color
			const lastColorIndex = hexColors.findIndex((color) => color === hexColors[lastColor])
			nextColorIndex = (lastColorIndex + 1) % hexColors.length
		}
		getFiller(data)
		if (willExpand) {
			resetZoom()
		}
	}

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
		}
	})

	resetZoom()

	function resetZoom() {
		chart.timeScale().fitContent()
	}

	onDestroy(() => {
		for (const series of seriesList) {
			chart.removeSeries(series)
		}
	})
</script>

<svelte:window on:resize={resetZoom} />

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
