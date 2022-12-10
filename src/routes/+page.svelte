<script lang="ts">
	import { onMount } from 'svelte'

	let count = 0
	onMount(() => {
		const interval = setInterval(() => count++, 1000)
		return () => clearInterval(interval)
	})
</script>

<h1>Starchart</h1>

<style lang="sass">
  :global(body)
    margin: 100px 0px
    font-family: Arial, Helvetica, sans-serif
    font-size: 18px
    background-color: #111318
    color: #f2f2f2
    text-align: center
  h1
    color: #ffdd00
</style>
