<script lang="ts">
    import type { TrackableItem } from "../lib/buildCost";
    import { highlight, highlight_manager } from "../stores";

    export let list: TrackableItem[];
    export let title: string;
</script>

{#if list.length > 0}
    <div class="icon-grid">
        <h1>{title}</h1>
        {#each list as ti (ti.item_id)}
            <button
                on:click={() => highlight.select("item", ti.item_id)}
                class="icon"
                class:active={$highlight_manager.isSelected(
                    "item",
                    ti.item_id
                )}>
                <img
                    src={ti.item.image}
                    alt={ti.item.name}
                    title={ti.item.name} />
                <span>{ti.quantity}</span>
            </button>
        {/each}
    </div>
{/if}

<style lang="scss">
    .icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-start;
        align-content: flex-start;

        & > h1 {
            flex-basis: 100%;
        }

        & > button {
            width: 60px;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;

            & > img {
                width: 100%;
            }
        }
    }
</style>
