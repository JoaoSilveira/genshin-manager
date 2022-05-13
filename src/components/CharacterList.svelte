<script lang="ts">
    import {
        highlightedCharacter,
        selectedCharacters,
    } from "../stores/character";
    import genshinData from "../stores/genshinData";
    import Character from "./Character.svelte";
</script>

<div>
    {#each $genshinData.character.list as character (character.name)}
        <Character
            {character}
            selected={$selectedCharacters.has(character.name)}
            on:click={() => ($highlightedCharacter = character)} />
    {/each}
</div>

<style lang="scss">
    div {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 1rem 1rem 2rem;
    }
</style>
