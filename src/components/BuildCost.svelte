<script>
    import { waitForValue } from "../lib/store";
    import { totalCost } from "../stores/builds";
    import Material from "./Material.svelte";
</script>

{#await waitForValue(totalCost)}
    <p>Loading costs</p>
{:then}
    <div class="costs-container">
        <p>Mora:</p>
        <p>{$totalCost.mora}</p>
        <p>Exp:</p>
        <p>{$totalCost.exp}</p>

        <h1>Local Specialty</h1>
        <div class="material-container">
            {#each $totalCost.localSpecialties as material}
                <Material {material} />
            {/each}
        </div>

        <h1>Gems</h1>
        <div class="material-container">
            {#each $totalCost.gems as gem}
                <Material material={gem.tiers.highest} />
                <Material material={gem.tiers.high} />
                <Material material={gem.tiers.medium} />
                <Material material={gem.tiers.low} />
            {/each}
        </div>

        <h1>Books</h1>
        <div class="material-container">
            {#each $totalCost.books as book}
                <Material material={book.tiers.highest} />
                <Material material={book.tiers.high} />
                <Material material={book.tiers.medium} />
                <Material material={book.tiers.low} />
            {/each}
        </div>

        <h1>Mob Material</h1>
        <div class="material-container">
            {#each $totalCost.mobMaterials as mob}
                <Material material={mob.tiers.high} />
                <Material material={mob.tiers.medium} />
                <Material material={mob.tiers.low} />
            {/each}
        </div>

        <h1>Elite Mob Material</h1>
        <div class="material-container">
            {#each $totalCost.eliteMaterials as mob}
                <Material material={mob.tiers.high} />
                <Material material={mob.tiers.medium} />
                <Material material={mob.tiers.low} />
            {/each}
        </div>

        <h1>Boss Ascension Material</h1>
        <div class="material-container">
            {#each $totalCost.ascensionBossMaterials as material}
                <Material {material} />
            {/each}
        </div>

        <h1>Boss Talent Material</h1>
        <div class="material-container">
            {#each $totalCost.talentBossMaterials as material}
                <Material {material} />
            {/each}
        </div>
    </div>
{/await}

<style lang="scss">
    .costs-container {
        display: flex;
        flex-direction: column;
    }

    .material-container {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    p {
        margin: 0;
        padding: 0;
    }
</style>
