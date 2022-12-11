<script lang="ts">
	import { token } from './github'
	import Modal from './Modal.svelte'

	let editToken = false

	function save() {
		token.set($token)
		editToken = false
	}
</script>

<button class="bordered button rounded" on:click={() => (editToken = true)}>Add access token</button
>
<Modal if={editToken} title="Access token" onClose={() => (editToken = false)} let:focus>
	<form action="#" on:submit={save}>
		<p>
			You'll want a GitHub access token to avoid rate limiting.
			<a href="https://github.com/settings/tokens/new?description=Starchart"
				>Generate your access token</a
			>
		</p>
		<input
			type="text"
			class="bordered rounded"
			bind:value={$token}
			placeholder="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"
			use:focus
		/>
		<button class="bordered button rounded">Save</button>
	</form>
</Modal>

<style lang="sass">
	p
		max-width: 32rem
	button
		align-self: center
		border-radius: 8px
	form button
		margin-top: 0.5rem
		margin-left: auto
		background-color: hsla(52, 40%, 25%)
		padding-left: 1.5rem
		padding-right: 1.5rem
	input
		width: 100%
		&:focus
			outline: none
			border-color: #ffdd00
</style>
