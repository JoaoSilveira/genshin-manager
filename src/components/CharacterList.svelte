<script lang="ts">
    import { getContext } from "svelte";
    import { GenshinDataKey } from "../lib/consts";
    import Character from "./Character.svelte";

    const characters =
        getContext<GenshinDataPristine>(GenshinDataKey).character.list;
</script>

<div>
    {#each characters as character}
        <Character {character} />
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
