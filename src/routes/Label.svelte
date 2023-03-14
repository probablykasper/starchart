<script lang="ts">
	import { cubicOut } from 'svelte/easing'
	import { fade, scale } from 'svelte/transition'
	import type { Line } from './chart'
	import { hexColors } from './color'

	export let line: Line
	$: hex = hexColors[line.color]
	export let onDelete: () => void
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<span
	class="serie"
	style:--color-1={hex}
	style:--color-2={hex + '77'}
	in:scale={{ duration: 200, easing: cubicOut, start: 0.75, opacity: 0 }}
	class:hidden={line.hidden}
	tabindex="0"
	on:keydown={(e) => {
		if (e.key === ' ' || e.key === 'Enter') {
			line.hidden = !line.hidden
			line.instance.applyOptions({ visible: !line.hidden })
			e.preventDefault()
		} else if (e.key === 'Backspace' || e.key === 'Delete') {
			onDelete()
			e.preventDefault()
		}
	}}
>
	<button
		type="button"
		class="name"
		tabindex="-1"
		on:click={() => {
			line.hidden = !line.hidden
			line.instance.applyOptions({ visible: !line.hidden })
		}}
	>
		{line.name}
	</button>
	<button type="button" class="x" class:loading={!line.final} on:click={onDelete} tabindex="-1">
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
		{#if !line.final}
			<div class="spinner" transition:fade={{ duration: 150 }}>
				<div class="circle" />
			</div>
		{/if}
	</button>
</span>

<style lang="sass">
	.serie
		border-radius: 8px
		border: 2px solid
		display: inline-flex
		align-items: center
		font-size: 0.9rem
		font-weight: 500
		transition: 100ms ease-out
		outline: 1px solid transparent
		background-color: var(--color-2)
		border-color: var(--color-1)
		&:focus-visible
			border-color: hsla(0, 0%, 100%, 1)
		svg
			display: block
	.hidden
		opacity: 0.6
		text-decoration: line-through
		border-style: dashed
	button
		background: none
		border: none
		color: inherit
		padding: 0.175rem 0.5rem
		outline: 1px solid transparent
	button.x
		position: relative
		transition: all 100ms ease-out
		padding-left: 0.1rem
		&:hover
			opacity: 0.7
	.name
		font-size: 0.875rem
		font-weight: 500
		font-family: inherit
		transition: all 50ms ease-out
		padding-right: 0.2rem
		&:hover
			text-decoration: line-through
	.spinner
		position: absolute
		width: 100%
		height: 100%
		top: 0
		left: 0
		display: flex
		justify-content: center
		align-items: center
		transition: all 150ms ease-out
	svg
		transition: all 150ms ease-out
	button.loading
		svg
			opacity: 0
	.serie:hover
		svg
			opacity: 1
		.spinner
			opacity: 0
	.circle
		height: 11px
		width: 11px
		border-color: white transparent white white
		border-width: 1.5px
		border-style: solid
		border-image: initial
		border-radius: 50%
		animation: 750ms linear 0s infinite normal none running circle-rotate

	@keyframes circle-rotate
		0%
			transform: rotate(0)
		100%
			transform: rotate(360deg)
</style>
