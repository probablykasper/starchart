<script lang="ts">
	import { cubicOut } from 'svelte/easing'
	import { fade, scale } from 'svelte/transition'
	import { checkShortcut } from './shortcuts'

	export let title: string | null = null
	export let center = false
	export let closeIcon = true
	export let onClose: () => void
	let visible = true
	export { visible as if }

	function focus(el: HTMLDivElement) {
		el.focus()
	}
	function focusDefault(el: HTMLDivElement) {
		if (!el.contains(document.activeElement)) {
			el.focus()
			console.log('focd', el)
		}
	}
	function close() {
		onClose()
	}

	function keydown(e: KeyboardEvent) {
		if (checkShortcut(e, 'Escape')) {
			close()
		}
	}

	function getFocusElements(el: HTMLElement) {
		return Array.from(
			el.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			) || []
		)
	}
	function focusTrap(el: HTMLElement, autofocus: boolean) {
		if (autofocus && !el.contains(document.activeElement)) {
			const focusElements = getFocusElements(el)
			if (focusElements[0] && focusElements[0] instanceof HTMLElement) {
				focusElements[0].focus()
			}
		}

		function handleKeydown(e: KeyboardEvent) {
			if (checkShortcut(e, 'Tab', { shift: true })) {
				const focusElements = getFocusElements(el)
				const lastFocusElement = focusElements[focusElements.length - 1]
				if (
					focusElements[0] &&
					document.activeElement?.isSameNode(focusElements[0]) &&
					lastFocusElement instanceof HTMLElement
				) {
					lastFocusElement.focus()
					e.preventDefault()
				}
			} else if (checkShortcut(e, 'Tab')) {
				const focusElements = getFocusElements(el)
				const lastFocusElement = focusElements[focusElements.length - 1]
				if (
					document.activeElement?.isSameNode(lastFocusElement) &&
					focusElements[0] instanceof HTMLElement
				) {
					focusElements[0].focus()
					e.preventDefault()
				}
			}
		}
		el.addEventListener('keydown', handleKeydown)
		return {
			destroy() {
				el.removeEventListener('keydown', handleKeydown)
			},
		}
	}
</script>

{#if visible}
	<div class="modal overlay" use:focusTrap={true} on:keydown={keydown}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="bg overlay"
			on:click|self={close}
			tabindex="-1"
			transition:fade={{ duration: 200, easing: cubicOut }}
		/>
		<div
			class="box"
			tabindex="-1"
			use:focusDefault
			transition:scale|local={{ duration: 200, start: 0.9, opacity: 0, easing: cubicOut }}
		>
			{#if closeIcon}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<svg
					on:click={close}
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					><path
						d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z"
					/></svg
				>
			{/if}
			<div class="content" class:center>
				{#if title}
					<h2 class="mb-6 text-4xl font-light">{title}</h2>
				{/if}
				<slot {focus} />
			</div>
		</div>
	</div>
{/if}

<style lang="sass">
	.overlay
		position: fixed
		top: 0px
		left: 0px
		bottom: 0px
		right: 0px
		display: flex
	.modal
		align-items: center
		justify-content: center
		padding: 1.5rem
		box-sizing: border-box
		z-index: 100
	.bg
		background-color: rgba(#000000, 0.5)
		z-index: -10
	.box
		background-color: hsl(220, 18%, 11%)
		position: relative
		padding: 1.5rem
		border: 1px solid hsla(0, 0%, 100%, 0.1)
		min-width: 300px
		max-width: 100%
		max-height: 100%
		box-sizing: border-box
		border-radius: 8px
		box-shadow: 0px 0px 30px 0px rgba(#000000, 0.5)
		overflow: auto
	.content
		display: flex
		height: 100%
		flex-direction: column
		justify-content: center
		align-items: left
		text-align: initial
	.center
		align-items: center
		text-align: center
	svg
		position: absolute
		right: 0.75rem
		top: 0.75rem
		padding: 0.4rem
		&:hover
			opacity: 0.7
	h2
		margin-top: -0.5rem
		margin-bottom: 1.5rem
</style>
