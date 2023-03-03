import { TinyColor } from '@ctrl/tinycolor'

export const colors = [
	'hsl(340, 100%, 52%)',
	'hsl(216, 100%, 49%)',
	'hsl(36, 100%, 50%)',
	'hsl(52, 100%, 50%)',
	'hsl(155, 100%, 45%)',
	'hsl(257, 100%, 61%)',
	'hsl(188, 90%, 52%)',
	'hsl(306, 100%, 52%)',
	'hsl(0, 0%, 100%)',
]
export const hexColors = colors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	return color.brighten(10).toHexString()
})
export const topColors = colors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	color.setAlpha(0.5)
	return color.saturate(100).toHslString()
})
export const bottomColors = colors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	color.setAlpha(0)
	return color.darken(0).toHslString()
})

export const brightColors = colors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	return color.brighten(10).toHslString()
})
