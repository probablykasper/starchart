<script lang="ts">
	import ApexCharts from 'apexcharts'
	import type { ApexOptions } from 'apexcharts'

	export let options: ApexOptions

	function apexChart(node: HTMLDivElement, options: ApexOptions) {
		let chart = new ApexCharts(node, options)
		chart.render()

		return {
			update(options: ApexOptions) {
				chart.updateOptions(options)
			},
			destroy() {
				chart.destroy()
			},
		}
	}
</script>

<div use:apexChart={options} />
