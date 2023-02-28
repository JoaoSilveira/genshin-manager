<script lang="ts" context="module">
    import { createEventDispatcher } from "svelte";
    import genshin_data from "../data_test/genshin_data.json";
    import AutocompleteInput from "./components/AutocompleteInput.svelte";
    import Icon from "./components/Icon.svelte";
    import { isSimpleTalent } from "./lib/genshinDataTransform";

    function generateTalentCombination(): string[] {
        const options = [];

        for (let start = 1; start <= 10; start++) {
            for (let end = start; end <= 10; end++) {
                options.push(`${start}/${end}`);

                // if (end < 10) {
                //     options.push(`0${start}/${end}`);
                //     options.push(`0${start}/0${end}`);
                // } else if (start < 10) {
                //     options.push(`0${start}/${end}`);
                // }
            }
        }

        return options;
    }

    function generateLevelCombination(): string[] {
        const options = [];
        for (let level = 1; level <= 90; level++) {
            const cap = genshin_data.levelBarriers.find((b) => level <= b);
            options.push(`${level}/${cap}`);

            if (level < 10) {
                // options.push(`0${level}/${cap}`);
            } else if (level === cap && level < 90) {
                options.push(
                    `${level}/${genshin_data.levelBarriers.find(
                        (b) => level < b
                    )}`
                );
            }
        }

        return options;
    }

    function filteredCombination(value: string): string[] {
        if (!level_options.includes(value)) return level_options;

        const [start, end] = value.split("/").map((v) => parseInt(v));
        return level_options.filter((lo) => {
            const [low, high] = lo.split("/").map((v) => parseInt(v));

            return low >= start && high >= end;
        });
    }

    function changeTalent(
        character: Character<PristinePayload>,
        talent: CharacterBuildConfig["talent"]
    ): CharacterBuildConfig["talent"] {
        if (isSimpleTalent(character.talentAscension)) {
            if (!isSimpleTalentConfig(talent)) {
                return Object.values(talent)[0];
            }
        } else {
            if (isSimpleTalentConfig(talent)) {
                return Object.fromEntries(
                    Object.keys(character.talentAscension)
                        .filter((k) =>
                            genshin_data.elements.some(
                                (e) => e.description === k
                            )
                        )
                        .map((k) => [k, talent])
                );
            }
        }

        return talent;
    }

    const level_options = generateLevelCombination();
    const talent_options = generateTalentCombination();
    const empty_character = {
        image: "",
        level_end: "",
        level_start: "",
        name: "",
        talent: {
            basic_talent: "",
            elemental_talent: "",
            burst_talent: "",
        },
    };
</script>

<script lang="ts">
    import { deepClone } from "./lib/util";
    import {
        build_list,
        isSimpleTalentConfig,
        type CharacterBuildConfig,
    } from "./stores";
    import { selected_build } from "./stores";

    const dispatch = createEventDispatcher<{
        create: CharacterBuildConfig;
    }>();
    let character: CharacterBuildConfig = empty_character;
    let dialog: HTMLDialogElement;
    let open_tab: string = null;

    function deleteCharacter() {
        const index = $selected_build.char_build.findIndex(
            (w) => w.id === character.id
        );

        if (index >= 0) {
            $selected_build.char_build.splice(index, 1);
            $selected_build.char_build = [...$selected_build.char_build];
            $build_list = [...$build_list];
        }

        dialog.close();
    }

    export function open(data?: CharacterBuildConfig): void {
        if (data != null) {
            character = deepClone(data);
        } else {
            character = deepClone(empty_character);
            character.name = available_characters[0].name;
            character.image = available_characters[0].image;
        }

        dialog.showModal();
    }

    function submitCharacter(): void {
        dispatch("create", character);
        dialog.close();
    }

    $: available_characters = genshin_data.character.list.filter(
        (c1) => !$selected_build.char_build.some((c2) => c1.name === c2.name)
    );
    $: {
        open_tab = isSimpleTalentConfig(character.talent)
            ? null
            : Object.keys(character.talent)[0];
    }
</script>

<dialog bind:this={dialog}>
    <form method="dialog" on:submit={submitCharacter}>
        <div class="header">
            <Icon icon="user-plus" size="2rem" />
            <p>Character Build Creation</p>
            <button
                type="button"
                class="icon"
                on:click={() => dialog.close()}
                tabindex="-1">
                <Icon icon="cross" size="2rem" />
            </button>
        </div>

        <div class="body">
            <p class="name">{character.name}</p>

            <img
                class="thumbnail"
                src={character.image}
                alt={character.name}
                title={character.name} />

            {#if character.id == null}
                <div class="horizontal-list">
                    {#each available_characters as char (char.name)}
                        <button
                            disabled={char.name === character.name}
                            class:active={char.name === character.name}
                            title={char.name}
                            on:click={() => {
                                character.image = char.image;
                                character.name = char.name;
                                character.talent = changeTalent(
                                    char,
                                    character.talent
                                );
                            }}>
                            <img src={char.image} alt={char.name} />
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="level_start">
                <AutocompleteInput
                    name="level_start"
                    items={level_options}
                    placeholder="Start level (<level>/<cap>)"
                    bind:value={character.level_start} />
            </div>

            <div class="level_end">
                <AutocompleteInput
                    name="level_end"
                    placeholder="End level (<level>/<cap>)"
                    items={filteredCombination(character.level_start)}
                    bind:value={character.level_end} />
            </div>

            {#if isSimpleTalentConfig(character.talent)}
                <div class="talent-panel">
                    <p>Talent</p>
                    <AutocompleteInput
                        name="basic_talent"
                        placeholder="Basic talent level (<start>/<end>)"
                        items={talent_options}
                        bind:value={character.talent.basic_talent} />
                    <AutocompleteInput
                        name="elemental_talent"
                        placeholder="Elemental talent level (<start>/<end>)"
                        items={talent_options}
                        bind:value={character.talent.elemental_talent} />
                    <AutocompleteInput
                        name="burst_talent"
                        placeholder="Burst talent level (<start>/<end>)"
                        items={talent_options}
                        bind:value={character.talent.burst_talent} />
                </div>
            {:else}
                <div class="talent-panel tab-panel">
                    <div class="tabs">
                        {#each Object.keys(character.talent) as element}
                            <button
                                type="button"
                                title={element}
                                class="icon"
                                on:click={() => (open_tab = element)}
                                disabled={open_tab === element}
                                class:active={open_tab === element}>
                                <img
                                    src={genshin_data.elements.find(
                                        (e) => e.description === element
                                    )?.image}
                                    alt={element} />
                            </button>
                        {/each}
                    </div>

                    {#each Object.entries(character.talent) as [element, talent]}
                        <div class="panel" class:open={element === open_tab}>
                            <AutocompleteInput
                                name="basic_talent"
                                placeholder="Basic talent level (<start>/<end>)"
                                items={talent_options}
                                bind:value={talent.basic_talent} />
                            <AutocompleteInput
                                name="elemental_talent"
                                placeholder="Elemental talent level (<start>/<end>)"
                                items={talent_options}
                                bind:value={talent.elemental_talent} />
                            <AutocompleteInput
                                name="burst_talent"
                                placeholder="Burst talent level (<start>/<end>)"
                                items={talent_options}
                                bind:value={talent.burst_talent} />
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="footer">
            {#if character.id != null}
                <input
                    type="button"
                    value="Delete"
                    on:click={deleteCharacter} />
            {/if}
            <input type="submit" value="Submit" />
            <input
                type="button"
                value="Cancel"
                on:click={() => dialog.close()} />
        </div>
    </form>
</dialog>

<style lang="scss">
    form {
        display: flex;
        flex-direction: column;
        max-width: 800px;

        & > .body {
            flex: 1 1;
        }
    }

    .header {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 2px solid var(--border-color);

        p {
            font-size: 1.75rem;
            line-height: 1;
            margin: 0;
            flex: 1 1;
            padding-left: 1rem;
        }

        button {
            flex: 0 1;
            stroke: var(--error-color);
        }
    }

    .body {
        display: grid;
        grid-template-columns: auto repeat(2, 1fr);
        grid-template-rows: repeat(4, auto);
        column-gap: 1rem;
        row-gap: 0.5rem;
        grid-template-areas:
            "img  name  name"
            "img  start end"
            "img  tal   tal"
            "list list  list";
        padding: 1rem 1.5rem;
        overflow-y: auto;

        & > .name {
            grid-area: name;
            font-size: 1.5rem;
        }
        & > .thumbnail {
            grid-area: img;
            max-width: 256px;
            max-height: 256px;
        }
        & > .level_start {
            grid-area: start;
        }
        & > .level_end {
            grid-area: end;
        }
        & > .talent-panel {
            grid-area: tal;
        }
        & > .horizontal-list {
            grid-area: list;
        }
    }

    %talent-panel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .tab-panel {
        & > .panel {
            display: none;
            background-color: var(--background-active-color);
            padding: 0.5rem;
        }

        & > .panel.open {
            @extend %talent-panel;
        }
    }

    .talent-panel:not(.tab-panel) {
        @extend %talent-panel;

        & > p {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
    }

    .tabs {
        display: flex;
        height: 50px;

        img {
            height: 100%;
        }
    }

    .footer {
        display: flex;
        align-items: stretch;
        min-height: 2.5rem;
        gap: 1.5rem;
        border-top: 2px solid var(--border-color);
        justify-content: flex-end;

        & > input[type="button"],
        & > input[type="submit"] {
            font-size: 1em;
        }
    }
</style>
