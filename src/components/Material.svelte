<script lang="ts">
    export let material: MaterialQuantity<Material>;
</script>

{#if material?.quantity > 0}
    <div title={material.name}>
        <img src={material.image} alt={material.name} />
        <strong>{material.quantity}</strong>
    </div>
{/if}

<style lang="scss">
    div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    img {
        width: 50px;
        height: 50px;
    }
</style>
