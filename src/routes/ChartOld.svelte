<script lang="ts">
	import type { SeriesDataItemTypeMap, UTCTimestamp, IChartApi } from 'lightweight-charts'
	import { Chart, LineSeries } from 'svelte-lightweight-charts'
	import type { SeriesData } from './+page.svelte'

	let chart: IChartApi | null = null

	export let data: SeriesData[]
	function toLineSeriesData(series: SeriesData): SeriesDataItemTypeMap['Line'][] {
		const dataPoints: { date: Date; value?: number }[] = []
		for (const dataPoint of series.data) {
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
						// value: lastDataPoint.value,
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
			const dp: SeriesDataItemTypeMap['Line'] = {
				time: (dataPoint.date.getTime() / 1000) as UTCTimestamp,
				value: dataPoint.value,
			}
			return dp
		})
	}
	export let width: number
	export let height: number
</script>

<Chart
	ref={(ref) => (chart = ref)}
	{width}
	{height}
	layout={{ background: { color: 'transparent' }, textColor: '#FFFFFF' }}
	grid={{
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	}}
	crosshair={{
		mode: 1,
		horzLine: {
			visible: false,
			labelVisible: false,
		},
	}}
>
	{#each data as series}
		<LineSeries data={toLineSeriesData(series)} color="red" />
	{/each}
</Chart>
