<script lang="ts">
    import { activeBuild, builds } from "../stores/builds";
    import { highlightedCharacter } from "../stores/character";
    import genshinData from "../stores/genshinData";

    function updateLevel(
        which: keyof LevelProgresion<any>,
        prop: keyof CharacterLevel
    ) {
        return (event: SvelteEvent<InputEvent, any>) => {
            const currentBuild = $activeBuild;
            currentBuild.level[which][prop] =
                event.currentTarget.valueAsNumber ?? event.currentTarget.value;
            builds.updateBuild({ ...currentBuild });
        };
    }

    function updateTalent(
        talent: keyof CharacterBuild["talents"],
        prop: keyof LevelProgresion<any>
    ) {
        return (event: SvelteEvent<InputEvent, HTMLInputElement>) =>
            builds.updateBuild({
                ...$activeBuild,
                talents: {
                    ...$activeBuild.talents,
                    [talent]: {
                        ...$activeBuild.talents[talent],
                        [prop]: event.currentTarget.valueAsNumber,
                    },
                },
            });
    }

    function updateBuilds() {
        builds.updateBuild({ ...$activeBuild });
    }

    $: char = genshinData.character.list.find(
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
                    <input
                        type="number"
                        bind:value={$activeBuild.level.start.level}
                        on:input={updateBuilds} />
                    <select
                        bind:value={$activeBuild.level.start.cap}
                        on:change={updateBuilds}>
                        {#each genshinData.levelBarriers as level, i}
                            <option value={i}>{level}</option>
                        {/each}
                    </select>
                    <input
                        type="number"
                        bind:value={$activeBuild.level.end.level}
                        on:input={updateBuilds} />
                    <select
                        bind:value={$activeBuild.level.end.cap}
                        on:change={updateBuilds}>
                        {#each genshinData.levelBarriers as level, i}
                            <option value={i}>{level}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <div>
                        <input
                            type="number"
                            value={$activeBuild.talents.basic.start}
                            on:input={updateTalent("basic", "start")} />
                        <input
                            type="number"
                            value={$activeBuild.talents.basic.end}
                            on:input={updateTalent("basic", "end")} />
                    </div>

                    <div>
                        <input
                            type="number"
                            value={$activeBuild.talents.elemental.start}
                            on:input={updateTalent("elemental", "start")} />
                        <input
                            type="number"
                            value={$activeBuild.talents.elemental.end}
                            on:input={updateTalent("elemental", "end")} />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={$activeBuild.talents.burst.start}
                            on:input={updateTalent("burst", "start")} />
                        <input
                            type="number"
                            value={$activeBuild.talents.burst.end}
                            on:input={updateTalent("burst", "end")} />
                    </div>
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
