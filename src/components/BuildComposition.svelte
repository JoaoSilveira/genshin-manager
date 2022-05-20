<script lang="ts">
    import { activeBuild } from "../stores/builds";
    import { highlightedCharacter } from "../stores/character";
    import genshinData from "../stores/genshinData";

    $: char = $genshinData.character.list.find(
        (c) => c.name === $highlightedCharacter
    );
</script>

<div class="container" class:skeleton={!$highlightedCharacter}>
    {#if $highlightedCharacter}
        <div class="character-level">
            <img class="thumbnail" src={char.image} alt={char.name} />
            <div>
                <h1 class="name">{char.name}</h1>
                <div>
                    <input type="text" value={$activeBuild.level.start.level} />
                    ->
                    <input type="text" value={$activeBuild.level.end.level} />
                </div>
            </div>
        </div>
    {:else}
        <div class="character-level">
            <div class="thumbnail" />
            <div>
                <div class="name" />
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        &.skeleton {
            .thumbnail,
            .name {
                background-color: #ddd;
                border-radius: 0.5rem;
            }

            .name {
                width: 9rem;
                height: 3rem;
            }
        }
    }

    .character-level {
        display: flex;

        h1 {
            margin-top: 0;
        }
    }

    .thumbnail {
        width: 200px;
        height: 200px;
    }
</style>
