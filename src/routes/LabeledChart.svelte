<script lang="ts">
	import ChartComponent from './Chart.svelte'
	import type { Chart } from './chart'
	import Label from './Label.svelte'

	export let chart: Chart
</script>

<div class="labels">
	{#each $chart.lines as line (line.name)}
		<Label
			{line}
			onDelete={() => {
				chart.deleteLine(line)
				chart.save()
			}}
			onVisibleChange={(visible) => {
				line.instance.applyOptions({ visible })
			}}
		/>
	{/each}
</div>

<ChartComponent {chart} />

<style lang="sass">
	.labels
		text-align: center
</style>
