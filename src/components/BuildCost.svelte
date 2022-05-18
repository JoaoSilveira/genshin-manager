<script>
    import { waitForValue } from "../lib/store";
    import { totalCost } from "../stores/builds";
</script>

{#await waitForValue(totalCost)}
    <p>Loading costs</p>
{:then}
    <div>
        <p>Mora:</p>
        <p>{$totalCost.mora}</p>
        <p>Exp:</p>
        <p>{$totalCost.exp}</p>

        {#each [...$totalCost.materials.values()] as mat}
            <p>{mat.name}:</p>
            <p>{mat.quantity}</p>
        {/each}
    </div>
{/await}

<style lang="scss">
    div {
        display: grid;
        align-content: flex-start;
        grid-template-columns: 1fr auto;
        row-gap: 0.25rem;
    }
    p {
        margin: 0;
        padding: 0;
    }
</style>
