<script lang="ts">
	import { cubicOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'
	import type { SeriesData } from './+page.svelte'

	export let hex: string
	export let serie: SeriesData
	export let onDelete: () => void
</script>

<span
	class="serie"
	style:border-color={hex}
	style:background-color={hex + '77'}
	in:scale={{ duration: 200, easing: cubicOut, start: 0.75, opacity: 0 }}
>
	{serie.name}
	<button type="button" on:click={onDelete}>
		<svg
			fill="currentColor"
			width="18"
			height="18"
			clip-rule="evenodd"
			fill-rule="evenodd"
			stroke-linejoin="round"
			stroke-miterlimit="2"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			><path
				d="m12 10.93 5.719-5.72c.146-.146.339-.219.531-.219.404 0 .75.324.75.749 0 .193-.073.385-.219.532l-5.72 5.719 5.719 5.719c.147.147.22.339.22.531 0 .427-.349.75-.75.75-.192 0-.385-.073-.531-.219l-5.719-5.719-5.719 5.719c-.146.146-.339.219-.531.219-.401 0-.75-.323-.75-.75 0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719c-.146-.147-.219-.339-.219-.532 0-.425.346-.749.75-.749.192 0 .385.073.531.219z"
			/></svg
		>
	</button>
</span>

<style lang="sass">
	.serie
		padding: 0.1rem 0.5rem
		padding-right: 0rem
		border-radius: 8px
		border: 2px solid
		margin: 0.25rem
		font-size: 0.9rem
		display: inline-flex
		align-items: center
		font-weight: 500
		svg
			display: block
	button
		background: none
		border: none
		color: inherit
		position: relative
		transition: all 100ms ease-out
		&:hover
			opacity: 0.7
</style>
