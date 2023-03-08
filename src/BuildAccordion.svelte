<script lang="ts">
    import CharacterDialog from "./CharacterDialog.svelte";
    import WeaponDialog from "./WeaponDialog.svelte";
    import CharacterIcon from "./components/CharacterIcon.svelte";
    import WeaponIcon from "./components/WeaponIcon.svelte";
    import {
        build_list,
        build_index,
        selected_build,
        type CharacterBuildConfig,
        type WeaponBuildConfig,
    } from "./stores";

    let character_modal: CharacterDialog;
    let weapon_modal: WeaponDialog;

    function toggleAccordion(event: MouseEvent) {
        const target = event.target as Element;
        target.classList.toggle("open");
        target.nextElementSibling?.classList.toggle("open");
    }

    function submitCharacter(event: CustomEvent<CharacterBuildConfig>): void {
        const index = $selected_build.char_build.findIndex(
            (cb) => cb.id === event.detail.id
        );

        if (index >= 0) {
            // update
            const arr = Array.from($selected_build.char_build);
            arr[index] = event.detail;

            $build_list[$build_index] = {
                ...$selected_build,
                char_build: arr,
            };
        } else {
            const arr = $selected_build.char_build;
            const id = arr.length > 0 ? arr[arr.length - 1].id + 1 : 0;
            arr.push({ ...event.detail, id });

            $build_list[$build_index] = {
                ...$selected_build,
                char_build: arr,
            };
        }

        $build_list = [...$build_list];
    }

    function submitWeapon(event: CustomEvent<WeaponBuildConfig>): void {
        const index = $selected_build.weap_build.findIndex(
            (cb) => cb.id === event.detail.id
        );

        if (index >= 0) {
            // update
            const arr = Array.from($selected_build.weap_build);
            arr[index] = event.detail;

            $build_list[$build_index] = {
                ...$selected_build,
                weap_build: arr,
            };
        } else {
            const arr = $selected_build.weap_build;
            const id = arr.length >= 0 ? arr[arr.length - 1].id + 1 : 0;
            arr.push({ ...event.detail, id });

            $build_list[$build_index] = {
                ...$selected_build,
                weap_build: arr,
            };
        }

        $build_list = [...$build_list];
    }
</script>

<section>
    <button
        type="button"
        class="header"
        on:click={toggleAccordion}
        class:open={false}>
        Characters
    </button>

    <div class="body icon-grid" class:open={false}>
        <button
            class="add"
            type="button"
            on:click={() => character_modal.open()}>Add</button>

        {#each $selected_build.char_build as character (character.id)}
            <CharacterIcon
                conf={character}
                on:click={() => character_modal.open(character)} />
        {/each}
    </div>

    <button
        type="button"
        class="header"
        on:click={toggleAccordion}
        class:open={false}>
        Weapons
    </button>

    <div class="body icon-grid" class:open={false}>
        <button type="button" class="add" on:click={() => weapon_modal.open()}
            >Add</button>
        {#each $selected_build.weap_build as weapon}
            <WeaponIcon
                conf={weapon}
                on:click={() => weapon_modal.open(weapon)} />
        {/each}
    </div>
</section>

<CharacterDialog bind:this={character_modal} on:create={submitCharacter} />
<WeaponDialog bind:this={weapon_modal} on:create={submitWeapon} />

<style lang="scss">
    section {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding-block: 0.5rem;

        & > .header {
            flex: 0 0;
        }

        & > .body {
            flex: 0 0;
            height: 0;
            overflow: hidden;
            transition: flex-grow 125ms;

            &.open {
                overflow: auto;
                flex: 1;
                min-height: 20%;
            }
        }
    }

    .header {
        font-size: 1.25rem;
        padding-block: 1rem;
    }

    .body {
        background-color: rgba(255, 255, 255, 0.025);
    }

    .icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-start;
        align-content: flex-start;

        & > .add {
            flex-basis: 100%;
            font-size: 1rem;
            height: 3rem;
        }
    }
</style>
