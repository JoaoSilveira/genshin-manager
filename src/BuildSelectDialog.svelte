<script lang="ts">
    import Icon from "./components/Icon.svelte";
    import CreateBuildDialog, {
        type BuildConfigData,
    } from "./CreateBuildDialog.svelte";
    import { build_index, build_list } from "./stores";

    let dialog: HTMLDialogElement;
    let create_dialog: CreateBuildDialog;

    export function open() {
        dialog.showModal();
    }

    export function close() {
        dialog.close();
    }

    function submitNewBuild(event: CustomEvent<BuildConfigData>) {
        $build_list = [
            ...$build_list,
            {
                ...event.detail,
                char_build: [],
                weap_build: [],
            },
        ];
        $build_index = $build_list.length - 1;
        dialog.close();
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog bind:this={dialog} on:click|self={close}>
    <div>
        <div class="header">
            <Icon icon="menu-hamburger" size="2rem" />
            <p>Build Selection</p>
            <button
                type="button"
                class="icon"
                on:click={() => dialog.close()}
                tabindex="-1">
                <Icon icon="cross" size="2rem" />
            </button>
        </div>
        <button
            on:click={() => {
                dialog.close();
                create_dialog.open();
            }}
            type="button"
            class:span={$build_index == null}>
            <Icon icon="plus" size="2rem" />
            Create New
        </button>
        {#if $build_index != null}
            <button
                type="button"
                on:click={() => {
                    $build_index = null;
                    dialog.close();
                }}>
                <Icon icon="cross" size="2rem" />
                Clear Selection
            </button>
        {/if}
        <div class="build-panel">
            {#each $build_list as build, i}
                <button
                    class="build"
                    type="button"
                    disabled={i === $build_index}
                    class:active={i === $build_index}
                    on:click={() => {
                        $build_index = i;
                        dialog.close();
                    }}>
                    <img src={build.thumbnail} alt={build.thumbnail_name} />
                    <p class="description">{build.description}</p>
                    <small class="stats">
                        Characters: {build.char_build.length} Weapons: {build
                            .weap_build.length}
                    </small>
                </button>
            {/each}
            <div />
        </div>
    </div>
</dialog>

<CreateBuildDialog
    bind:this={create_dialog}
    on:create={submitNewBuild}
    on:cancel={() => dialog.showModal()} />

<style lang="scss">
    dialog > div {
        display: grid;
        grid-template-rows: auto auto 1fr;
        grid-template-columns: 1fr 1fr;
        column-gap: 1.5rem;
        row-gap: 0.5rem;
        min-width: 40vw;

        & > .header {
            grid-row: 1;
            grid-column: 1 / span 2;
        }

        & > button {
            grid-row: 2;

            &.span {
                grid-column: 1 / span 2;
            }

            &.span + button {
                grid-column: 2;
            }
        }

        & > .build-panel {
            grid-row: 3;
            grid-column: 1 / span 2;
        }
    }

    button:not(.build) {
        display: flex;
        gap: 0.5rem;
        font-size: 1.25rem;
    }

    .build-panel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
    }

    .header {
        display: flex;
        align-items: center;
        flex: 1 0 100%;
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
        }
    }

    .build {
        display: grid;
        grid-template-columns: 100px 1fr;
        grid-template-rows: auto 1fr;

        & > img {
            width: 100px;
            grid-row: 1 / span 2;
            grid-column: 1;
        }

        & > .stats {
            grid-row: 1;
            grid-column: 2;
            place-self: end end;
            filter: brightness(0.75);
        }

        & > .description {
            font-size: 1.15rem;
            grid-row: 2;
            grid-column: 2;
            place-self: start start;
        }
    }
</style>
