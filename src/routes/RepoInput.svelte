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
			owner = owner.replace(/^https?:\/\//, "").replace("github.com/", "")
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

<div class="container">
	<div class="inputs">
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
	</div>
	<button class="bordered button" on:click={() => onSubmit()}>Load</button>
</div>

<style lang="sass">
	.container
		margin: auto
	div
		display: flex
		align-items: center
		flex-direction: column
		justify-content: center
		max-width: 32rem
		flex-direction: row
	.owner
		margin-bottom: 0px
		border-radius: 6px 0px 0px 6px
		&:focus-visible
			z-index: 10
	.slash
		border-left: none
		border-right: none
	input
		width: 100%
	.repo
		border-right: none
		box-shadow: 1px 0 0 0 transparent
		&:focus-visible
			box-shadow: 1px 0 0 0 #cbcaf7
	.inputs
		z-index: 5
		position: relative
	button.bordered
		display: block
		background-color: hsla(243, 100%, 77%, 0.5)
		border-color: #7d7da7
		border-radius: 0px 6px 6px 0px
		&:focus-visible
			border-color: #cbcaf7
</style>
