<script lang="ts">
    import { getContext } from "svelte";
    import { GenshinDataKey } from "../lib/consts";

    export let character: Character;

    const data = getContext<GenshinDataPristine>(GenshinDataKey);
    const weapon = data.weapon.types[character.weapon];
    const element =
        character.element != null
            ? data.elements[character.element]
            : undefined;
</script>

<div>
    <img
        class="character"
        src={character.image}
        alt={character.name}
        title={character.name} />

    {#if element}
        <img
            class="thumbnail element"
            src={element.image}
            alt={element.description}
            title={element.description} />
    {/if}

    <img
        class="thumbnail weapon"
        src={weapon.image}
        alt={weapon.description}
        title={weapon.description} />
</div>

<style lang="scss">
    div {
        position: relative;
    }

    .character {
        width: 100px;
        height: 100px;
    }

    .thumbnail {
        position: absolute;
        width: 35px;
        height: 35px;
    }

    .element {
        bottom: 0;
        left: 0;
    }

    .weapon {
        bottom: 0;
        right: 0;
    }
</style>
