<script lang="ts">
    export let items: string[];
    export let value: string = "";
    export let placeholder: string = undefined;
    export let name: string = undefined;

    let wrapper: HTMLDivElement;
    let dialog: HTMLDivElement;
    let open = false;
    let selected_index = null;

    function moveNext() {
        if (selected_index == null) {
            selected_index = 0;
            return;
        }
        selected_index = (selected_index + 1) % filtered_list.length;
    }

    function movePrevious() {
        if (selected_index == null) {
            selected_index = filtered_list.length - 1;
            return;
        }

        selected_index =
            (selected_index + filtered_list.length - 1) % filtered_list.length;
    }

    function checkForSelection(event) {
        if (
            event.isComposing ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey ||
            event.metaKey
        )
            return;

        if (event.key === "ArrowDown") {
            moveNext();
            event.preventDefault();
        } else if (event.key === "ArrowUp") {
            movePrevious();
            event.preventDefault();
        } else if (event.key === "Escape") {
            open = false;
            event.preventDefault();
        } else if (event.key === "Enter") {
            value = filtered_list[selected_index ?? 0];
            open = false;
            event.preventDefault();
        } else if (event.key === "Tab") {
            open = false;
        }
    }

    function checkDialogPosition() {
        const bodyRect = document.body.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        const inputRect = wrapper.getBoundingClientRect();

        if (inputRect.bottom + dialogRect.height <= bodyRect.height) {
            dialog.style.top = inputRect.bottom + "";
        } else {
            dialog.style.bottom = inputRect.top + "";
        }

        if (inputRect.left + dialogRect.width <= bodyRect.width) {
            dialog.style.left = inputRect.left + "";
        } else {
            dialog.style.right = inputRect.right + "";
        }
    }

    function checkInputValidity() {
        const input = wrapper.firstElementChild as HTMLInputElement;
        if (!items.includes(value)) {
            input.setCustomValidity("Input does not match any valid value");
        } else {
            input.setCustomValidity("");
        }
    }

    function checkTarget(e: Event) {
        open = wrapper.contains(e.target as Node);
    }

    $: filtered_list = items.filter((i) => i.startsWith(value));
    $: {
        if (dialog != null && selected_index != null) {
            const child = dialog.children.item(selected_index) as HTMLElement;

            if (child.offsetTop < dialog.scrollTop) {
                child.scrollIntoView({ block: "center", inline: "center" });
            } else if (
                child.offsetTop + child.clientHeight >
                dialog.scrollTop + dialog.clientHeight
            ) {
                child.scrollIntoView({ block: "center", inline: "center" });
            }
        }
    }
</script>

<!-- <svelte:body on:click={checkClick} /> -->
<svelte:body on:click={checkTarget} on:focus|capture={checkTarget} />

<div
    bind:this={wrapper}
    class="wrapper"
    on:focusout={(e) => {
        // console.log
        // open = false;
        // checkInputValidity();
    }}>
    <input
        type="text"
        bind:value
        {placeholder}
        {name}
        autocomplete="off"
        on:keydown={checkForSelection}
        on:focus={() => {
            open = true;
            checkDialogPosition();
            selected_index = null;
        }} />

    <div
        class="dialog"
        bind:this={dialog}
        class:open={open && filtered_list.length > 0}>
        {#each filtered_list as item, i (item)}
            <button
                type="button"
                tabindex="-1"
                class:active={i === selected_index}
                on:click|stopPropagation={() => {
                    value = item;
                    open = false;
                }}>
                <span>{item.substring(0, value.length)}</span>{item.substring(
                    value.length
                )}
            </button>
        {/each}
    </div>
    <!-- <div
        class="dialog"
        class:top={false}
        class:bottom={false}
        class:left={false}
        class:right={false}
        bind:this={dialog}
        class:open={open && filtered_list.length > 0}>
        {#each filtered_list as item, i (item)}
            <button
                type="button"
                tabindex="-1"
                class:active={i === selected_index}
                on:click|stopPropagation={() => {
                    value = item;
                    open = false;
                }}>
                <span>{item.substring(0, value.length)}</span>{item.substring(
                    value.length
                )}
            </button>
        {/each}
    </div> -->
</div>

<style lang="scss">
    .wrapper {
        position: relative;
        padding: 0;
    }

    input {
        margin: 0;
        width: 100%;
    }

    button.active {
        background-color: var(--background-highlight-color);
        color: var(--foreground-highlight-color);
    }

    .dialog {
        visibility: collapse;
        position: fixed;
        margin: 0;
        padding: 0;
        color: var(--foreground-color);
        background-color: var(--background-color);
        border: 2px solid var(--border-color);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        max-height: 30vh;
        min-width: 300px;
        z-index: 1;

        &.open {
            visibility: visible;
        }

        // &.top {
        //     bottom: 100%;
        // }

        // &.bottom {
        //     top: 100%;
        // }

        // &.left {
        //     left: 0;
        // }

        // &.right {
        //     right: 0;
        // }
    }

    span {
        text-decoration: underline;
        font-weight: bold;
    }
</style>
