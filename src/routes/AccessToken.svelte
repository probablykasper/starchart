<script lang="ts">
	import { browser } from '$app/environment'
	import { token } from './github'
	import Modal from 'modal-svelte'

	let tokenInput = $token
	let editToken = false

	function save() {
		token.set($token)
		editToken = false
		$token = tokenInput
	}
</script>

{#if browser}
	<button
		class="bordered button rounded"
		class:yellow={!$token}
		on:click={() => (editToken = true)}
	>
		{$token ? 'Edit' : 'Add'} access token
	</button>
{/if}
{#if editToken}
	<Modal title="Access token" onCancel={() => (editToken = false)} form={save} let:focus>
		<p>
			You'll want a GitHub access token to avoid rate limiting.
			<a href="https://github.com/settings/tokens/new?description=Starchart"
				>Generate your access token</a
			>
		</p>
		<input
			type="text"
			class="bordered rounded"
			bind:value={tokenInput}
			placeholder="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"
			use:focus
		/>
		<div slot="buttons">
			<button class="save bordered button rounded highlight">Save</button>
		</div>
	</Modal>
{/if}

<style lang="sass">
	p
		margin-top: 0rem
		margin-bottom: 1.5rem
		max-width: 28rem
	button
		align-self: center
		border-radius: 8px
	button.save
		margin-top: 0.5rem
		margin-left: auto
		padding-left: 1.5rem
		padding-right: 1.5rem
	.highlight
		background-color: hsla(243, 100%, 77%, 0.5)
	input
		width: 100%
		&:focus
			outline: none
			border-color: #cbcaf7
</style>
