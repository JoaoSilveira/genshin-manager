<script lang="ts" context="module">
    import { createEventDispatcher } from "svelte";
    import genshin_data from "../data_test/genshin_data.json";
    import AutocompleteInput from "./components/AutocompleteInput.svelte";
    import Icon from "./components/Icon.svelte";

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

    const level_options = generateLevelCombination();
    const empty_weapon: WeaponBuildConfig = {
        name: "",
        image: "",
        end: "",
        start: "",
    };
</script>

<script lang="ts">
    import { deepClone } from "./lib/util";
    import { build_list, type WeaponBuildConfig } from "./stores";
    import { selected_build } from "./stores";

    const dispatch = createEventDispatcher<{
        create: WeaponBuildConfig;
    }>();
    let weapon: WeaponBuildConfig = empty_weapon;
    let dialog: HTMLDialogElement;

    function deleteWeapon() {
        const index = $selected_build.weap_build.findIndex(
            (w) => w.id === weapon.id
        );

        if (index >= 0) {
            $selected_build.weap_build.splice(index, 1);
            $selected_build.weap_build = [...$selected_build.weap_build];
            $build_list = [...$build_list];
        }

        dialog.close();
    }

    export function open(data?: WeaponBuildConfig): void {
        if (data != null) {
            weapon = deepClone(data);
        } else {
            const w = genshin_data.weapon.list[0];

            weapon = deepClone(empty_weapon);
            weapon.name = w.name;
            weapon.image = w.image;
        }

        dialog.showModal();
    }

    function submitWeapon(): void {
        dispatch("create", weapon);
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <form method="dialog" on:submit={submitWeapon}>
        <div class="header">
            <Icon icon="document-plus" size="2rem" />
            <p>Weapon Build Creation</p>
            <button
                type="button"
                class="icon"
                on:click={() => dialog.close()}
                tabindex="-1">
                <Icon icon="cross" size="2rem" />
            </button>
        </div>

        <div class="body">
            <p class="name">{weapon.name}</p>

            <img
                class="thumbnail"
                src={weapon.image}
                alt={weapon.name}
                title={weapon.name} />

            {#if weapon.id == null}
                <div class="horizontal-list">
                    {#each genshin_data.weapon.list as weap (weap.name)}
                        <button
                            disabled={weap.name === weapon.name}
                            class:active={weap.name === weapon.name}
                            title={weap.name}
                            on:click={() => {
                                weapon.image = weap.image;
                                weapon.name = weap.name;
                            }}>
                            <img src={weap.image} alt={weap.name} />
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="level_start">
                <AutocompleteInput
                    name="level_start"
                    items={level_options}
                    placeholder="Start level (<level>/<cap>)"
                    bind:value={weapon.start} />
            </div>

            <div class="level_end">
                <AutocompleteInput
                    name="level_end"
                    placeholder="End level (<level>/<cap>)"
                    items={filteredCombination(weapon.start)}
                    bind:value={weapon.end} />
            </div>
        </div>

        <div class="footer">
            {#if weapon.id != null}
                <input type="button" value="Delete" on:click={deleteWeapon} />
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
        grid-template-rows: repeat(3, auto);
        column-gap: 1rem;
        row-gap: 0.5rem;
        grid-template-areas:
            "img  name  name"
            "img  start end"
            "img  list  list";
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
        & > .horizontal-list {
            grid-area: list;
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
