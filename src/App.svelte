<script lang="ts">
	import BuildCost from "./components/BuildCost.svelte";
	import CharacterList from "./components/CharacterList.svelte";
	import Context from "./components/Context.svelte";
	import { GenshinDataKey } from "./lib/consts";

	const promise = fetch("./genshin_data.json").then(
		(r) => r.json() as unknown as GenshinDataPristine
	);
</script>

<main>
	{#await promise}
		<p>Loading content</p>
	{:then data}
		<Context {data} key={GenshinDataKey}>
			<BuildCost />
			<hr />
			<CharacterList />
		</Context>
	{/await}
</main>

<style lang="scss">
	main {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}

	hr {
		border-color: #333;
		opacity: 0.25;
	}
</style>
