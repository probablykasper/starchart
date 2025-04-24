<script lang="ts">
	import { browser } from '$app/environment'
	import { token } from './github'
	import Modal from 'modal-svelte'

	let token_intup = $token
	let edit_token = false

	function save() {
		token.set($token)
		edit_token = false
		$token = token_intup
	}
</script>

{#if browser}
	<button
		type="button"
		class="bordered button rounded"
		class:yellow={!$token}
		on:click={() => (edit_token = true)}
	>
		{$token ? 'Auth token' : 'Set auth token'}
	</button>
{/if}
{#if edit_token}
	<Modal title="Access token" onCancel={() => (edit_token = false)} form={save}>
		<p>
			You'll want a GitHub access token to avoid rate limiting.
			<a href="https://github.com/settings/tokens/new?description=Starchart"
				>Generate your access token</a
			>
		</p>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			class="bordered rounded"
			bind:value={token_intup}
			placeholder="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"
			autofocus
		/>
		<div slot="buttons">
			<button type="submit" class="save bordered button rounded highlight">Save</button>
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
		@media screen and (max-width: 360px)
			font-size: 12px
	button.save
		margin-top: 0.5rem
		margin-left: auto
		padding-left: 1.5rem
		padding-right: 1.5rem
		border-color: #7d7da7
		&:focus-visible
			border-color: #cbcaf7
	.highlight
		background-color: hsla(243, 100%, 77%, 0.5)
	input
		width: 100%
		&:focus-visible
			outline: 1px solid transparent
			border-color: #cbcaf7
</style>
