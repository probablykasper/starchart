import { TinyColor } from '@ctrl/tinycolor'

export const hexColors = ['#E91E63', '#0064fa', '#ffdd00', '#FF9800', '#08fd96', '#FFFFFF']
export const topColors = hexColors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	color.setAlpha(0.5)
	return color.saturate(100).toRgbString()
})
export const bottomColors = hexColors.map((hexColor) => {
	const color = new TinyColor(hexColor)
	color.setAlpha(0)
	return color.darken(0).toRgbString()
})
