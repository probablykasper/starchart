import {
	createChart as createChartInstance,
	TickMarkType,
	type BusinessDay,
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
	hidden?: boolean
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
const jsonTypeVersion = 3
type Json = {
	lines: LineJson[]
	align: boolean
	v: number
	expiry: number
}

let nextColorIndex = 0
export function getNextColorIndex() {
	const value = nextColorIndex
	nextColorIndex = (nextColorIndex + 1) % hexColors.length
	return value
}

function loadJson() {
	try {
		const seriesLocalStorage = JSON.parse(localStorage.getItem('starchart-series') || '{}')
		if (seriesLocalStorage?.v === jsonTypeVersion && seriesLocalStorage?.expiry > Date.now()) {
			const json = seriesLocalStorage as Json
			const lineBases = json.lines.map(
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
			return {
				lines: lineBases,
				align: json.align,
			}
		} else {
			localStorage.removeItem('starchart-series')
		}
	} catch (e) {
		console.log('Could not load lines', e)
	}
	return {
		lines: [],
		align: false,
	}
}

type ChartData = {
	instance: IChartApi
	lines: Line[]
	align: boolean
	container: HTMLElement
}
export type Chart = ReturnType<typeof newChart>

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function newChart(container: HTMLElement, options: DeepPartial<ChartOptions>) {
	const chart: ChartData = {
		instance: createChartInstance(container, options),
		container,
		align: false,
		lines: [],
	}
	const { subscribe, set } = writable(chart)

	const json = loadJson()
	chart.align = json.align

	function setDefaultFormatting() {
		chart.instance.applyOptions({
			localization: {
				timeFormatter: (time: BusinessDay) => {
					const date = new Date(time.year, time.month - 1, time.day)
					return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
				},
			},
			timeScale: {
				tickMarkFormatter: () => null,
			},
		})
	}
	setDefaultFormatting()

	const fillerLine = chart.instance.addAreaSeries({
		priceScaleId: '',
		visible: false,
	})

	function updateFiller(data: Line[]) {
		if (chart.align && data.length > 0) {
			fillerLine.setData([])
		} else {
			fillerLine.setData(getFiller(data, new Date()))
		}
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
				let chartSeries = toChartSeries(lineJson.data, start, end)
				console.log('addLine', chart.align)

				if (chart.align) {
					chartSeries = alignChartSeries(chartSeries)
				}
				series.setData(chartSeries)
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

		alignLines() {
			chart.align = true
			store.save()
			for (const line of chart.lines) {
				if (line.deleted || line.data.length === 0) {
					continue
				}
				const start = line.data[0]
				const end = line.data[line.data.length - 1]
				const chartSeries = toChartSeries(line.data, start, end)
				const alignedChartSeries = alignChartSeries(chartSeries)
				line.instance.setData(alignedChartSeries)
			}
			const startDate = new Date(2001, 0)
			const day = 1000 * 3600 * 24
			const startDay = Math.ceil(startDate.getTime() / day)
			chart.instance.applyOptions({
				localization: {
					timeFormatter: (time: BusinessDay) => {
						const date = new Date(time.year, time.month - 1, time.day)
						return Math.ceil(date.getTime() / day) - startDay + ' days'
					},
				},
				timeScale: {
					tickMarkFormatter: (time: BusinessDay, tickMarkType: TickMarkType) => {
						const date = new Date(time.year, time.month - 1, time.day)
						if (tickMarkType === TickMarkType.DayOfMonth) {
							return Math.ceil(date.getTime() / day) - startDay + 'd'
						}
						const years = date.getFullYear() - startDate.getFullYear()
						if (tickMarkType === TickMarkType.Month) {
							return date.getMonth() - startDate.getMonth() + 12 * years + 'm'
						} else if (tickMarkType === TickMarkType.Year) {
							switch (years) {
								case 0:
									return '0d'
								case 1:
									return '1y'
								default:
									return years + 'y'
							}
						} else {
							return null
						}
					},
				},
			})
			updateFiller(chart.lines)
			set(chart)
		},

		unalignLines() {
			chart.align = false
			store.save()
			for (const line of chart.lines) {
				if (line.deleted || line.data.length === 0) {
					continue
				}
				const start = line.data[0]
				const end = line.data[line.data.length - 1]
				const chartSeries = toChartSeries(line.data, start, end)
				line.instance.setData(chartSeries)
			}
			setDefaultFormatting()
			set(chart)
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
			const chartSeries = toChartSeries(data, start, end)
			const fresh = line.data.length === 0

			if (fresh) {
				line.instance.setData(chartSeries)
			} else {
				for (const dataPoint of chartSeries) {
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

	for (const jsonLine of json.lines) {
		store.addLine(jsonLine)
	}
	if (json.lines[json.lines.length - 1]) {
		const lastColor = json.lines[json.lines.length - 1].color
		const lastColorIndex = hexColors.findIndex((color) => color === hexColors[lastColor])
		nextColorIndex = (lastColorIndex + 1) % hexColors.length
	}

	return store
}

/** Used to keep the full chart size even when some lines are hidden */
function getFiller(data: Line[], now: Date) {
	let lowestDate = (Date.now() / 1000) as UTCTimestamp
	for (const series of data) {
		const dataPoint = series.data[0]
		if (dataPoint && dataPoint.t < lowestDate) {
			lowestDate = dataPoint.t
		}
	}
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
		align: chart.align,
		expiry: Date.now() + day * 1,
	}
	localStorage.setItem('starchart-series', JSON.stringify(json))
}

type ChartSeries = {
	time: {
		year: number
		month: number
		day: number
	}
	value: number
}
function toChartSeries(data: DataPoint[], start: DataPoint, final: DataPoint): ChartSeries[] {
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

function alignChartSeries(chartSeries: ChartSeries[]): ChartSeries[] {
	const date = new Date(2001, 0)
	return chartSeries.map((seriesPoint): ChartSeries => {
		const alignedSeriesPoint: ChartSeries = {
			time: {
				day: date.getDate(),
				month: date.getMonth() + 1,
				year: date.getFullYear(),
			},
			value: seriesPoint.value,
		}
		date.setDate(date.getDate() + 1)
		return alignedSeriesPoint
	})
}
