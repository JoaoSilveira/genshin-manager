<script lang="ts" context="module">
    type IconType =
        | "menu-hamburger"
        | "edit-4"
        | "refresh"
        | "user-question"
        | "undo"
        | "cross"
        | "plus"
        | "user-plus"
        | "document-plus"
        | "trash-2";
    const PATH_DATA: Record<IconType, string> = {
        refresh:
            "M3 3V9M3 9H9M3 9C5.32744 6.91141 7.48287 4.54676 10.7453 4.08779C12.6777 3.81593 14.6461 4.17941 16.3539 5.12343C18.0617 6.06746 19.4164 7.54091 20.2139 9.32177M21 21V15M21 15H15M21 15C18.6725 17.0886 16.5171 19.4532 13.2547 19.9122C11.3223 20.1841 9.35391 19.8206 7.6461 18.8766C5.93829 17.9325 4.58356 16.4591 3.78604 14.6782",
        "menu-hamburger": "M4 17H20M4 12H20M4 7H20",
        "edit-4":
            "M14 6L8 12V16H12L18 10M14 6L17 3L21 7L18 10M14 6L18 10M10 4L4 4L4 20L20 20V14",
        "user-question":
            "M20.9532 13V12.995M19 7.4C19.2608 6.58858 20.0366 6 20.9531 6C22.0836 6 23 6.89543 23 8C23 9.60675 21.2825 8.81678 21 10.5M8 15H16C18.2091 15 20 16.7909 20 19V21H4V19C4 16.7909 5.79086 15 8 15ZM16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
        undo: "M4 9V15M4 15H10M4 15C6.32744 12.9114 8.48287 10.5468 11.7453 10.0878C13.6777 9.81593 15.6461 10.1794 17.3539 11.1234C19.0617 12.0675 20.4164 13.5409 21.2139 15.3218",
        "trash-2":
            "M10 10V16M14 10V16M18 6V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V6M4 6H20M15 6V5C15 3.89543 14.1046 3 13 3H11C9.89543 3 9 3.89543 9 5V6",
        cross: "M19 5L5 19M5.00001 5L19 19",
        plus: "M4 12H20M12 4V20",
        "user-plus":
            "M20 8.5V13.5M17.5 11H22.5M8 15H16C18.2091 15 20 16.7909 20 19V21H4V19C4 16.7909 5.79086 15 8 15ZM16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z",
        "document-plus":
            "M12 11V14M12 14V17M12 14H9M12 14H15M13 3H5V21H19V9M13 3H14L19 8V9M13 3V7C13 8 14 9 15 9H19",
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
