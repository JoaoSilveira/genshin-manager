<script lang="ts">
    export let character: Character<ExpandedPayload>;
    export let selected: boolean;
</script>

<div class:selected on:click>
    <img
        class="character"
        src={character.image}
        alt={character.name}
        title={character.name} />

    {#if character.element}
        <img
            class="thumbnail element"
            src={character.element.image}
            alt={character.element.description}
            title={character.element.description} />
    {/if}

    <img
        class="thumbnail weapon"
        src={character.weapon.image}
        alt={character.weapon.description}
        title={character.weapon.description} />
</div>

<style lang="scss">
    div {
        position: relative;

        border: 1px solid transparent;

        &.selected {
            border-color: white;
        }
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
