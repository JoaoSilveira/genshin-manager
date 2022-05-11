<script lang="ts">
    import { setContext } from "svelte";

    export let data: unknown;
    export let key: any;

    setContext(key, data);
</script>

<slot />
