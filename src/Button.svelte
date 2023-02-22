<script lang="ts">
    export let disabled: boolean = false;
    export let type: "submit" | "reset" | "button" = "button";
    export let icon: boolean = false;
</script>

<button {type} on:click {disabled} class:icon><slot /></button>

<style lang="scss">
    button {
        outline: none;
        border: none;
        background: transparent;
        color: var(--foreground-color);
        stroke: var(--foreground-color);
        padding: 0.25rem 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all .125ms;

        &.icon {
            padding: 0.15rem;
        }

        &:hover {
            color: var(--foreground-highlight-color);
            stroke: var(--foreground-highlight-color);
            background-color: rgba(0, 0, 0, 0.25);
        }

        &:active {
            color: var(--foreground-active-color);
            stroke: var(--foreground-active-color);
            background-color: rgba(0, 0, 0, 0.5);
        }

        &:disabled {
            color: var(--foreground-disabled-color);
            stroke: var(--foreground-disabled-color);
        }
    }
</style>
