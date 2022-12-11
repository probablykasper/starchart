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

<span on:keydown={inputKeydown}>
	<input type="text" bind:value={owner} />
	/
	<input type="text" bind:this={repoElement} bind:value={repo} />
</span>
