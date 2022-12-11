<script lang="ts">
	import { checkShortcut } from './shortcuts'

	export let owner: string
	export let repo: string
	export let onSubmit: () => void
	let repoElement: HTMLInputElement

	$: owner, parseOwnerField()
	async function parseOwnerField() {
		const slashIndex = owner.indexOf('/')
		if (slashIndex >= 0) {
			const newOwner = owner.slice(0, slashIndex)
			const newRepo = owner.slice(slashIndex + 1)
			owner = newOwner
			if (newRepo !== '') {
				repo = newRepo
				repoElement.focus()
			} else {
				repoElement.select()
			}
		}
	}

	function inputKeydown(e: KeyboardEvent) {
		if (checkShortcut(e, 'Enter')) {
			onSubmit()
		}
	}
</script>

<div>
	<div on:keydown={inputKeydown}>
		<input class="bordered owner" type="text" bind:value={owner} />
		<div><span class="bordered slash">/</span></div>
		<input class="bordered repo" type="text" bind:this={repoElement} bind:value={repo} />
	</div>
	<button class="bordered button" on:click={() => onSubmit()}>Load</button>
</div>

<style lang="sass">
	div
		display: flex
		align-items: center
		outline: none
	.owner
		border-top-left-radius: 6px
		border-bottom-left-radius: 6px
	.slash
		border-left: none
		border-right: none
	button.bordered
		border-top-right-radius: 6px
		border-bottom-right-radius: 6px
		background-color: hsla(52, 40%, 20%)
		border-color: transparent
		border-left-width: 0px
		&:focus-visible
			border-color: #ffdd00
			z-index: 10
			margin-left: -1px
			border-left-width: 1px
</style>
