<script lang="ts">
    import genshinData from "../../stores/genshinData";
    import { parties } from "../../stores/party";

    export let open = false;
    let dialogRef: HTMLDialogElement;
    let character = genshinData.character.list[0].name;
    let name = "";
    let notes = "";

    $: {
        if (dialogRef) {
            if (open) {
                dialogRef.showModal();
            } else {
                dialogRef.close();
            }
        }
    }

    $: selectedCharacter = genshinData.character.list.find(
        (c) => c.name === character
    );

    function onCloseModal() {
        open = false;
        character = genshinData.character.list[0].name;
        name = "";
        notes = "";
    }

    function submitModal() {
        parties.add({
            builds: new Map(),
            name,
            notes,
            thumbnailCharacter: character,
        });
    }
</script>

<dialog bind:this={dialogRef} on:close={onCloseModal}>
    <div>
        <h2>New Party</h2>

        <form method="dialog" on:submit={submitModal}>
            <img
                src={selectedCharacter?.image}
                alt={selectedCharacter?.name}
                class="thumbnail" />
            <select bind:value={character} name="character" required={true}>
                {#each genshinData.character.list as char}
                    <option value={char.name}>
                        <div>
                            <img src={char.image} alt={char.name} />
                            <p>{char.name}</p>
                        </div>
                    </option>
                {/each}
            </select>
            <input
                type="text"
                name="name"
                placeholder="name"
                bind:value={name}
                required={true} />
            <textarea placeholder="Notes" name="notes" bind:value={notes} />

            <div class="button-container">
                <button
                    type="button"
                    class="btn-border-outline"
                    on:click={() => dialogRef.close()}>Cancel</button>
                <button type="submit" class="btn-primary">Submit</button>
            </div>
        </form>
    </div>
</dialog>

<style lang="scss">
    dialog {
        color: var(--foreground-color);
        background-color: var(--background-color);
        border: 2px solid var(--border-color);
        box-shadow: 0 0 10px -2px var(--border-color);
        width: min(90vw, 400px);
        max-height: 80vh;

        & > div,
        & > div > form {
            display: flex;
            flex-direction: column;
        }


        &::backdrop {
            background-color: rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(3px);
        }
    }

    h2 {
        padding-bottom: 0.25rem;
        padding-left: 0.5rem;
        margin: 0;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    form {
        gap: 0.5rem;
    }

    .button-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .thumbnail {
        max-width: 200px;
        max-height: 200px;
        align-self: center;
        background-color: var(--background-highlight-color);
        border: 2px solid var(--border-color);
    }

    textarea {
        height: 8rem;
    }
</style>
