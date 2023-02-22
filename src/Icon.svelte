<script lang="ts" context="module">
    type IconType = "menu-hamburger" | "edit-4" | "refresh" | "user-question";
    const PATH_DATA: Record<IconType, string> = {
        refresh:
            "M3 3V9M3 9H9M3 9C5.32744 6.91141 7.48287 4.54676 10.7453 4.08779C12.6777 3.81593 14.6461 4.17941 16.3539 5.12343C18.0617 6.06746 19.4164 7.54091 20.2139 9.32177M21 21V15M21 15H15M21 15C18.6725 17.0886 16.5171 19.4532 13.2547 19.9122C11.3223 20.1841 9.35391 19.8206 7.6461 18.8766C5.93829 17.9325 4.58356 16.4591 3.78604 14.6782",
        "menu-hamburger": "M4 17H20M4 12H20M4 7H20",
        "edit-4":
            "M14 6L8 12V16H12L18 10M14 6L17 3L21 7L18 10M14 6L18 10M10 4L4 4L4 20L20 20V14",
        "user-question":
            "M20.9532 13V12.995M19 7.4C19.2608 6.58858 20.0366 6 20.9531 6C22.0836 6 23 6.89543 23 8C23 9.60675 21.2825 8.81678 21 10.5M8 15H16C18.2091 15 20 16.7909 20 19V21H4V19C4 16.7909 5.79086 15 8 15ZM16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
    };
</script>

<script lang="ts">
    // icons from https://www.svgrepo.com/collection/software-mansion-line-icons/
    export let icon: IconType;
    export let stroke: string = "var(--foreground-color)";
    export let fill: string = "none";
    export let size: string = null;

    $: data = PATH_DATA[icon];
</script>

<svg
    class={$$props["class"]}
    {fill}
    style:width={size}
    style:height={size}
    on:click
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0" />
    <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round" />
    <g id="SVGRepo_iconCarrier">
        <path
            d={data}
            {stroke}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
    </g>
</svg>
