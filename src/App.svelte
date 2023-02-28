<script lang="ts">
	import BuildAccordion from "./BuildAccordion.svelte";
	import BuildNavbar from "./BuildNavbar.svelte";
	import CostsPanel from "./CostsPanel.svelte";
	import { selected_build } from "./stores";
</script>

<div class="body">
	<BuildNavbar />
	
	{#if $selected_build != null}
		<div class="content">
			<BuildAccordion />
	
			<CostsPanel />
		</div>
	{/if}
</div>

<svelte:head>
	<style lang="scss">
		@import "./scss/global";
	</style>
</svelte:head>

<style lang="scss">
	div.body {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	div.content {
		flex: 1 1;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: auto;
		// height: 100%;
		column-gap: 2rem;
	}
</style>
