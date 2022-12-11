<script lang="ts">
	import type { ApexOptions } from 'apexcharts'
	import { onMount } from 'svelte'

	let ApexCharts: Awaited<typeof import('apexcharts')>
	onMount(async () => {
		ApexCharts = (await import('apexcharts')).default
	})

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

{#if ApexCharts}
	<div use:apexChart={options} />
{/if}
