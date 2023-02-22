<script lang="ts">
    import genshinData from "../stores/genshinData";

    import { activeParty } from "../stores/party";

    $: character = genshinData.character.list.find(
        (c) => c.name === $activeParty.thumbnailCharacter
    );
</script>

<div>
    <img src={character.image} alt={character.name} />
    <h3>{$activeParty.name}</h3>
    <p>{$activeParty.notes}</p>
</div>

<style lang="scss">
    div {
        margin-inline: 1rem;

        &::after {
            content: "";
            clear: both;
            display: table;
        }
    }

    img {
        max-width: 33vw;
        float: left;
        background-color: var(--background-highlight-color);
        margin-right: .5rem;
        margin-bottom: .5rem;
    }
</style>
