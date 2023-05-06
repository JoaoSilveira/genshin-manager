<script lang="ts" context="module">
    import genshin_data from "../data_test/genshin_data.json";

    const formatter = new Intl.NumberFormat();
    const mora = genshin_data.items.find((i) => i.id === 0);
    const hero_wit = genshin_data.items.find((i) => i.id === 25);
    const mystic_ore = genshin_data.items.find((i) => i.id === 57);
    const crown = genshin_data.items.find((i) => i.id === 1504);

    function format(value: number | bigint): string {
        return formatter.format(value);
    }
</script>

<script lang="ts">
    import MaterialCostList from "./components/MaterialCostList.svelte";
    import { cost } from "./stores";
</script>

<section id="cost-panel">
    <div class="header">
        <div>
            <img src={mora.image} alt={mora.name} title={mora.name} />
            <p>{format($cost.mora.quantity)}</p>
        </div>
        <div>
            <img
                src={hero_wit.image}
                alt={hero_wit.name}
                title={hero_wit.name} />
            <p>{format(Math.ceil($cost.character_exp.quantity / 20000))}</p>
        </div>
        <div>
            <img
                src={mystic_ore.image}
                alt={mystic_ore.name}
                title={mystic_ore.name} />
            <p>{format(Math.ceil($cost.weapon_exp.quantity / 10000))}</p>
        </div>
        {#if $cost.crown.quantity > 0}
            <div>
                <img src={crown.image} alt={crown.name} title={crown.name} />
                <p>{$cost.crown.quantity}</p>
            </div>
        {/if}
    </div>

    <MaterialCostList
        list={$cost.local_specialty.list}
        title="Local Specialty" />
    <MaterialCostList list={$cost.gem.list} title="Gems" />
    <MaterialCostList
        list={$cost.ascension_boss.list}
        title="Ascension Bosses" />
    <MaterialCostList list={$cost.common.list} title="Common Loot" />
    <MaterialCostList list={$cost.book.list} title="Talent Books" />
    <MaterialCostList list={$cost.talent_boss.list} title="Talent Bosses" />
    <MaterialCostList list={$cost.elite.list} title="Elite Loot" />
    <MaterialCostList list={$cost.wam.list} title="Weapon Ascension Material" />
</section>

<style lang="scss">
    section {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 1.5rem;
        flex: 1;
    }

    .header {
        display: flex;
        gap: 0.25rem;

        & > div {
            flex: 1 1 min-content;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            & > img {
                width: 50px;
            }
        }
    }
</style>
