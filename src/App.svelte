<script lang="ts">
	import BuildCost from "./components/BuildCost.svelte";
	import CharacterList from "./components/CharacterList.svelte";
</script>

<main>
	<BuildCost />
	<hr />
	<CharacterList />
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
