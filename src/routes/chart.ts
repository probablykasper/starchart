import {
	createChart as createChartInstance,
	type ChartOptions,
	type DeepPartial,
	type IChartApi,
	type ISeriesApi,
	type SingleValueData,
	type UTCTimestamp,
} from 'lightweight-charts'
import { writable } from 'svelte/store'
import { bottomColors, hexColors, topColors } from './color'

export type DataPoint = { t: UTCTimestamp; v: number }
type LineBase = {
	name: string
	data: DataPoint[]
	color: number
	/** Loading if absent */
	final?: DataPoint
}
export interface Line extends LineBase {
	instance: ISeriesApi<'Area'>
	deleted: boolean
}

type LineJson = {
	name: string
	/** Star count = index + 1 */
	data: UTCTimestamp[]
	color: number
	/** Loading if absent */
	final?: DataPoint
}

/** Used to invalidate old localStorage */
const jsonTypeVersion = 2
type Json = {
	lines: LineJson[]
	v: number
	expiry: number
}

let nextColorIndex = 0
export function getNextColorIndex() {
	const value = nextColorIndex
	nextColorIndex = (nextColorIndex + 1) % hexColors.length
	return value
}

function loadJsonLines(): LineBase[] {
	try {
		const seriesLocalStorage = JSON.parse(localStorage.getItem('starchart-series') || '{}')
		if (seriesLocalStorage?.v === jsonTypeVersion && seriesLocalStorage?.expiry > Date.now()) {
			const lines = (seriesLocalStorage as Json).lines
			return lines.map(
				(line): LineBase => ({
					color: line.color,
					data: line.data.map((utcTimestamp, i): DataPoint => {
						return {
							t: utcTimestamp,
							v: i + 1,
						}
					}),
					final: line.final,
					name: line.name,
				})
			)
		} else {
			localStorage.removeItem('starchart-series')
		}
	} catch (e) {
		console.log('Could not load lines', e)
	}
	return []
}

type ChartData = {
	instance: IChartApi
	lines: Line[]
	container: HTMLElement
}
export type Chart = ReturnType<typeof newChart>

export function newChart(container: HTMLElement, options: DeepPartial<ChartOptions>) {
	const chart: ChartData = {
		instance: createChartInstance(container, options),
		container,
		lines: [],
	}
	const { subscribe, set } = writable(chart)

	const fillerLine = chart.instance.addAreaSeries({
		priceScaleId: '',
		visible: false,
	})

	function updateFiller(data: Line[]) {
		fillerLine.setData(getFiller(data))
	}

	const store = {
		subscribe,

		addLine(lineJson: LineBase) {
			const series = chart.instance.addAreaSeries({
				priceLineVisible: false,
				topColor: topColors[lineJson.color],
				bottomColor: bottomColors[lineJson.color],
				lineColor: hexColors[lineJson.color],
				priceFormat: {
					type: 'custom',
					formatter: (price: number) => {
						return Math.round(price)
					},
				},
			})

			if (lineJson.data.length >= 1) {
				const start = lineJson.data[0]
				const end = lineJson.final ?? lineJson.data[lineJson.data.length - 1]
				const chartData = toChartSeries(lineJson.data, start, end)
				series.setData(chartData)
			}
			const line: Line = {
				...lineJson,
				instance: series,
				deleted: false,
			}
			chart.lines.push(line)
			updateFiller(chart.lines)
			if (lineJson.data.length >= 1) {
				store.resetZoom()
			}
			set(chart)
			return line
		},

		deleteLine(line: Line) {
			chart.instance.removeSeries(line.instance)
			line.deleted = true
			chart.lines = chart.lines.filter((line) => !line.deleted)
			set(chart)
		},

		_appendChartData(line: Line, data: DataPoint[]) {
			if (data.length === 0) {
				return
			}
			const start = line.data[line.data.length - 1] ?? data[0]
			const end = line.final ?? data[data.length - 1]
			const chartData = toChartSeries(data, start, end)
			const fresh = line.data.length === 0

			if (fresh) {
				line.instance.setData(chartData)
			} else {
				for (const dataPoint of chartData) {
					line.instance.update(dataPoint)
				}
			}
		},

		appendStargazers(line: Line, data: DataPoint[]) {
			const fresh = line.data.length === 0
			store._appendChartData(line, data)
			line.data.push(...data)
			if (fresh) {
				updateFiller(chart.lines)
				store.resetZoom()
			}
			set(chart)
		},

		addFinal(line: Line, data: DataPoint) {
			store._appendChartData(line, [data])
			line.final = data
			updateFiller(chart.lines)
			set(chart)
		},

		resetZoom() {
			chart.instance.timeScale().fitContent()
		},

		save() {
			save(chart)
		},
	}

	const jsonLines = loadJsonLines()
	for (const jsonLine of jsonLines) {
		store.addLine(jsonLine)
	}
	if (jsonLines[jsonLines.length - 1]) {
		const lastColor = jsonLines[jsonLines.length - 1].color
		const lastColorIndex = hexColors.findIndex((color) => color === hexColors[lastColor])
		nextColorIndex = (lastColorIndex + 1) % hexColors.length
	}

	return store
}

function getFiller(data: Line[]) {
	let lowestDate = (Date.now() / 1000) as UTCTimestamp
	for (const series of data) {
		const dataPoint = series.data[0]
		if (dataPoint && dataPoint.t < lowestDate) {
			lowestDate = dataPoint.t
		}
	}
	const now = new Date()
	const dt = new Date(lowestDate * 1000)
	const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

	const dates = [date]
	while (dates[dates.length - 1] < now) {
		dates.push(
			new Date(
				dates[dates.length - 1].getFullYear(),
				dates[dates.length - 1].getMonth(),
				dates[dates.length - 1].getDate() + 1
			)
		)
	}
	return dates.map((date) => {
		return {
			time: {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
			},
		}
	})
}

const day = 1000 * 60 * 60 * 24
function save(chart: ChartData) {
	if (chart.lines.length === 0) {
		localStorage.removeItem('starchart-series')
		return
	}

	const jsonLines = chart.lines.map(
		(line): LineJson => ({
			name: line.name,
			data: line.data.map((dataPoint) => dataPoint.t),
			color: line.color,
			final: line.final,
		})
	)
	const json: Json = {
		lines: jsonLines,
		v: jsonTypeVersion,
		expiry: Date.now() + day * 1,
	}
	localStorage.setItem('starchart-series', JSON.stringify(json))
}

function toChartSeries(data: DataPoint[], start: DataPoint, final: DataPoint) {
	const dataPoints: { date: Date; value: number }[] = []

	for (const dataPoint of [start, ...data, final]) {
		const dt = new Date(dataPoint.t * 1000)
		const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())

		let lastDataPoint = (dataPoints as Partial<typeof dataPoints>)[dataPoints.length - 1]
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
		return {
			time: {
				year: dataPoint.date.getFullYear(),
				month: dataPoint.date.getMonth() + 1,
				day: dataPoint.date.getDate(),
			},
			value: dataPoint.value,
		} satisfies SingleValueData
	})
}
