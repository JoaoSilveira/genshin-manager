<script lang="ts">
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
			<ul>
				{#each data.character.list as char}
					<li>{char.name}</li>
				{/each}
			</ul>
		</Context>
	{/await}
</main>

<style>
</style>
