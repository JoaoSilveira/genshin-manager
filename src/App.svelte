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

			<hr />
	
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
		display: flex;
		column-gap: 1rem;
		padding-inline: 1rem;
	}
</style>
