<script lang="ts">
    import {
        highlight,
        highlight_manager,
        type WeaponBuildConfig,
    } from "../stores";

    export let conf: WeaponBuildConfig;

    function formatLevel(): string {
        return conf.start === conf.end
            ? conf.start
            : `${conf.start} -> ${conf.end}`;
    }

    $: title = `Name: ${conf.name}\nLevel: ${formatLevel()}`;
</script>

<button
    type="button"
    {title}
    on:click
    class:active={$highlight_manager.isSelected("weapon", conf.id)}>
    <img src={conf.image} alt={conf.name} />
    <button
        type="button"
        class="select"
        on:click|stopPropagation={() => highlight.select("weapon", conf.id)}>
        <div />
    </button>
</button>

<style lang="scss">
    button {
        padding: 0;
        position: relative;

        & > img {
            width: 70px;
            height: 70px;
        }

        &.active > .select,
        &:hover > .select {
            visibility: visible;
        }
    }

    .select {
        visibility: hidden;
        position: absolute;
        top: 0;
        right: 0;
        padding: 3px;
        margin: 0;
        width: 20px;
        height: 20px;
        z-index: 1;
        background-color: var(--background-highlight-color);
        border: 2px solid var(--border-highlight-color);

        & > div {
            width: 100%;
            height: 100%;
        }

        .active > & {
            border-color: var(--border-active-color);
            background-color: var(--background-active-color);

            & > div {
                background-color: var(--border-active-color);
            }
        }
    }
</style>
