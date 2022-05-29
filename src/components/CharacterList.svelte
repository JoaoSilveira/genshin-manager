<script lang="ts">
    import {
        highlightedCharacter,
        selectedCharacters,
    } from "../stores/character";
    import genshinData from "../stores/genshinData";
    import BuildComposition from "./BuildComposition.svelte";
    import Character from "./Character.svelte";
</script>

<div class="container">
    <BuildComposition />

    <div class="character-container">
        {#each genshinData.character.list as character (character.name)}
            <Character
                {character}
                selected={$selectedCharacters.has(character.name)}
                on:click={() => ($highlightedCharacter = character)} />
        {/each}
    </div>
</div>

<style lang="scss">
    .container {
        display: flex;
        flex-direction: column;
    }

    .character-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        align-content: flex-start;
        gap: 10px;
        padding: 1rem 1rem 2rem;
        flex-grow: 1;
        overflow-y: auto;
    }
</style>
