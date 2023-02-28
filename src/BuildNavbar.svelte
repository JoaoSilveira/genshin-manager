<script lang="ts">
    import BuildSelectDialog from "./BuildSelectDialog.svelte";
    import Icon from "./components/Icon.svelte";
    import CreateBuildDialog, {
        type BuildConfigData,
    } from "./CreateBuildDialog.svelte";
    import { build_list, build_index, selected_build } from "./stores";

    let selection_modal: BuildSelectDialog;
    let edit_modal: CreateBuildDialog;

    function submitEdit(data: CustomEvent<BuildConfigData>): void {
        const build = $build_list[$build_index];
        build.description = data.detail.description;
        build.thumbnail = data.detail.thumbnail;
        build.thumbnail_name = data.detail.thumbnail_name;

        $build_list[$build_index] = build;
        $build_list = [...$build_list];
    }

    function deleteActiveBuild(): void {
        $build_list = $build_list.filter((_, i) => i != $build_index);
        $build_index = null;
    }
</script>

<nav>
    <button on:click={() => selection_modal.open()} class="icon">
        <Icon icon="menu-hamburger" size="30px" stroke="inherit" />
    </button>

    <div class="build-thumbnail">
        {#if $selected_build != null}
            <img
                src={$selected_build.thumbnail}
                alt={$selected_build.thumbnail_name}
                title={$selected_build.thumbnail_name} />
        {:else}
            <Icon icon="user-question" />
        {/if}
    </div>

    {#if $selected_build != null}
        <h1 class="description">{$selected_build.description}</h1>

        <button
            class="icon"
            on:click={() =>
                edit_modal.open({
                    description: $selected_build.description,
                    thumbnail: $selected_build.thumbnail,
                    thumbnail_name: $selected_build.thumbnail_name,
                })}>
            <Icon icon="edit-4" size="30px" />
        </button>
    {:else}
        <h1 class="description">Access menu to select or create build</h1>
    {/if}
</nav>

<BuildSelectDialog bind:this={selection_modal} />
<CreateBuildDialog
    bind:this={edit_modal}
    edit
    on:create={submitEdit}
    on:delete={deleteActiveBuild} />

<style lang="scss">
    nav {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 1rem;
        border-bottom: 2px solid var(--border-color);

        & > .build-thumbnail {
            width: 60px;
            height: 60px;

            & > img {
                width: 100%;
                height: 100%;
            }
        }

        & > .description {
            flex: 1;
        }
    }
</style>
