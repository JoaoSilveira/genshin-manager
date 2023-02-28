<script lang="ts">
    export let conf: Material;
</script>

<button type="button" title={conf.name} on:click>
    <img src={conf.image} alt={conf.name} />
</button>

<style lang="scss">
    button {
        padding: 0;

        & > img {
            width: 70px;
            height: 70px;
        }
    }
</style>
