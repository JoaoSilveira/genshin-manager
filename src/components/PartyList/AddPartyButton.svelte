<script lang="ts">
    import NewPartyModal from "../NewPartyModal/NewPartyModal.svelte";

    let editing = false;
</script>

<button on:click={() => editing = true}>
    <svg viewBox="0 0 10 10">
        <path d="m0 5H10M5 0V10" />
    </svg>
</button>

<NewPartyModal bind:open={editing} />

<style lang="scss">
    button {
        $size: 4rem;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;
        width: $size;
        height: $size;
        border: 2px solid var(--border-color);
        background-color: var(--background-color);
        outline: none;
        padding: 0;
        cursor: pointer;

        & > svg {
            width: 70%;
            pointer-events: none;

            & > path {
                stroke: var(--border-color);
            }
        }

        &:hover {
            border-color: var(--border-highlight-color);
            background-color: var(--background-highlight-color);

            & > svg > path {
                stroke: var(--border-highlight-color);
            }
        }
    }
</style>
