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
	<input
		class="bordered owner"
		type="text"
		bind:value={owner}
		placeholder="probablykasper"
		on:keydown={inputKeydown}
	/>
	<div><span class="bordered slash">/</span></div>
	<input
		class="bordered repo"
		type="text"
		bind:this={repoElement}
		bind:value={repo}
		placeholder="cpc"
		on:keydown={inputKeydown}
	/>
	<button class="bordered button" on:click={() => onSubmit()}>Load</button>
</div>

<style lang="sass">
	div
		display: flex
		align-items: center
		flex-direction: column
		justify-content: center
		flex-grow: 1
		max-width: 32rem
		flex-direction: row
	.owner
		margin-bottom: 0px
		border-radius: 6px 0px 0px 6px
		&:focus
			z-index: 10
	.slash
		border-left: none
		border-right: none
	input
		width: 100%
	button.bordered
		background-color: hsla(52, 100%, 18%)
		border-left-color: transparent
		border-left-width: 0px
		border-radius: 0px 6px 6px 0px
		&:focus-visible
			border-color: #ffdd00
			z-index: 10
			margin-left: -1px
			border-left-width: 1px
</style>
