<script lang="ts">
    import { parties } from "../../stores/party";
    import AddPartyButton from "./AddPartyButton.svelte";
    import PartyItem from "./PartyItem.svelte";
</script>

<nav>
    {#each $parties as party}
        <PartyItem {party} />
    {/each}

    <AddPartyButton />
</nav>

<style lang="scss">
    nav {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        padding-block: 0.5rem;
        overflow-x: hidden;
        background-color: var(--background-active-color);
        border-bottom: 1px solid var(--border-color);

        & > :global(*:first-child) {
            margin-left: 2rem;
        }
    }
</style>
