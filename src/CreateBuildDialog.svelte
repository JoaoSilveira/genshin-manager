<script lang="ts" context="module">
    export type BuildConfigData = Omit<
        BuildConfig,
        "char_build" | "weap_build"
    >;
    export type CustomEvents = {
        create: BuildConfigData;
        cancel: void;
        delete: void;
    };
</script>

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { clickOutsideDialog } from "./actions";
    import Icon from "./components/Icon.svelte";
    import genshin_data from "../data_test/genshin_data.json";
    import type { BuildConfig } from "./stores";

    export let edit: boolean = false;

    const dispatch = createEventDispatcher<CustomEvents>();
    let dialog: HTMLDialogElement;
    let char_list: HTMLDivElement;
    let description = "";
    let thumbnail = genshin_data.character.list[0].image;
    let thumbnail_name = genshin_data.character.list[0].name;

    export function open(data?: BuildConfigData) {
        data ??= {
            description: "",
            thumbnail: genshin_data.character.list[0].image,
            thumbnail_name: genshin_data.character.list[0].name,
        };

        description = data.description;
        thumbnail = data.thumbnail;
        thumbnail_name = data.thumbnail_name;

        dialog.showModal();
        scrollToCharacter(thumbnail_name);
    }

    export function close() {
        dispatch("cancel");
        dialog.close();
    }

    function submit(): void {
        dispatch("create", {
            description,
            thumbnail,
            thumbnail_name,
        });
        dialog.close();
    }

    function deleteBuild(): void {
        dispatch("delete");
        dialog.close();
    }

    function scrollToCharacter(name: string): void {
        for (let el of char_list.children) {
            if ((el as HTMLElement).dataset.character === name) {
                el.scrollIntoView({ inline: "center", block: "center" });
            }
        }
    }
</script>

<dialog
    bind:this={dialog}
    use:clickOutsideDialog
    on:outsideclick={close}
    on:cancel={() => dispatch("cancel")}>
    <form method="dialog" on:submit={submit}>
        <div class="header">
            <Icon icon="user-plus" size="2rem" />
            <p>Build Creation</p>
            <button type="button" class="icon" on:click={close} tabindex="-1">
                <Icon icon="cross" size="2rem" />
            </button>
        </div>

        <div class="body">
            <img
                class="thumbnail"
                src={thumbnail}
                alt={thumbnail_name}
                title={thumbnail_name} />

            <div bind:this={char_list} class="horizontal-list">
                {#each genshin_data.character.list as character}
                    <button
                        type="button"
                        data-character={character.name}
                        title={character.name}
                        disabled={character.name === thumbnail_name}
                        class:active={character.name === thumbnail_name}
                        on:click={() => {
                            thumbnail = character.image;
                            thumbnail_name = character.name;
                        }}>
                        <img src={character.image} alt={character.name} />
                    </button>
                {/each}
            </div>

            <!-- svelte-ignore a11y-autofocus -->
            <input
                autofocus
                type="text"
                name="description"
                title="Build description"
                placeholder="Description"
                bind:value={description} />
        </div>

        <div class="footer">
            {#if edit}
                <input type="button" value="Delete" on:click={deleteBuild} />
            {/if}
            <input type="submit" value="Submit" />
            <input type="button" value="Cancel" on:click={close} />
        </div>
    </form>
</dialog>

<style lang="scss">
    dialog > form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 40vw;

        & > .body {
            flex: 1 1;
        }
    }

    button:not(.build) {
        display: flex;
        gap: 0.5rem;
        font-size: 1.25rem;
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
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        padding-inline: 1.5rem;
        column-gap: 1rem;
        row-gap: 0.25rem;

        & > .thumbnail {
            grid-column: 1;
            grid-row: 1 / span 2;

            width: 200px;
            height: 200px;
        }

        & > .horizontal-list {
            grid-column: 2;
            grid-row: 2;

            align-self: flex-end;
        }

        & > input {
            grid-column: 2;
            grid-row: 1;
        }
    }

    .footer {
        display: flex;
        align-items: stretch;
        margin-top: 1rem;
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
