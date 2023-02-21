<script lang="ts">
	import AccessToken from './AccessToken.svelte'
	import RepoInput from './RepoInput.svelte'

	export let owner: string
	export let repo: string
	export let onSubmit: () => void
</script>

<nav>
	<span class="left">
		<h1>Starchart</h1>
	</span>
	<RepoInput bind:owner bind:repo {onSubmit} />
	<div class="right">
		<AccessToken />
		<a href="https://github.com/probablykasper/starchart">
			<svg
				height="24"
				viewBox="-2 -2 28 28"
				width="24"
				xmlns="http://www.w3.org/2000/svg"
				class="svelte-8lfi33"
				><path
					d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					class="svelte-8lfi33"
				/></svg
			>
		</a>
	</div>
</nav>

<style lang="sass">
	nav
		display: flex
		width: 100%
		padding-top: 0.25rem
		padding-bottom: 1rem
		flex-direction: column
		align-items: center
		justify-content: center
		@media (min-width: 768px)
			flex-direction: row
			justify-content: space-between
			.left, .right
				width: 12rem
			.right
				display: flex
				justify-content: flex-end
	.left
		display: flex
	.right
		display: flex
		align-items: center
		a
			color: #ffffff
			cursor: default
			margin-left: 0.5rem
		svg
			vertical-align: middle
</style>
