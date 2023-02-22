<script lang="ts">
    import genshinData from "../../stores/genshinData";
    import type { Party } from "../../stores/party";
    import { activeParty } from "../../stores/party";

    export let party: Party;

    function selectThisParty() {
        activeParty.setActive(party === $activeParty ? null : party);
    }

    $: characterThumbnail = genshinData.character.list.find(
        (c) => party.thumbnailCharacter === c.name
    )?.image;
</script>

<img
    src={characterThumbnail}
    alt={party.thumbnailCharacter}
    title={party.name}
    class:active={party === $activeParty}
    on:click={selectThisParty} />

<style lang="scss">
    img {
        display: static;
        border-radius: 50%;
        border: 2px solid var(--border-color);
        width: 4rem;
        height: 4rem;

        &.active {
            border-color: var(--primary-color);
            background-color: var(--background-highlight-color);
            box-shadow: 0 0 7px var(--primary-color);
        }
    }
</style>
