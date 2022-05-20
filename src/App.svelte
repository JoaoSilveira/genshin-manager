<script lang="ts">
	import BuildCost from "./components/BuildCost.svelte";
	import CharacterList from "./components/CharacterList.svelte";
	import { waitForValue } from "./lib/store";
	import genshinData from "./stores/genshinData";
</script>

<main>
	{#await waitForValue(genshinData)}
		<p>Loading content</p>
	{:then}
		<BuildCost />
		<hr />
		<CharacterList />
	{/await}
</main>

<style lang="scss">
	main {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}

	hr {
		border-color: #ddd;
		opacity: 0.25;
	}
</style>
