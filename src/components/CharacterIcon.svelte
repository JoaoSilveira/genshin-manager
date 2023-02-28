<script lang="ts">
    import {
        highlight,
        highlight_manager,
        type CharacterBuildConfig,
        type TalentBuildConfig,
    } from "../stores";

    function buildTalentLines(talent: TalentBuildConfig): string[] {
        function displayNumber(value: string): string {
            const [start, end] = value.split("/");

            return start === end ? start : `${start} -> ${end}`;
        }

        return [
            `   Basic: ${displayNumber(talent.basic_talent)}`,
            `   Elemental: ${displayNumber(talent.elemental_talent)}`,
            `   Burst: ${displayNumber(talent.burst_talent)}`,
        ];
    }

    function formatLevel(start: string, end: string): string {
        return start === end ? start : `${start} -> ${end}`;
    }

    function buildCharacterTooltip(): string {
        const lines = [
            `Name: ${conf.name}`,
            `Level: ${formatLevel(conf.level_start, conf.level_end)}`,
            "",
        ];

        if ("basic_talent" in conf.talent) {
            lines.push("Talent:");
            lines.push(...buildTalentLines(conf.talent as TalentBuildConfig));
            lines.concat();
        } else {
            for (let [el, tal] of Object.entries(conf.talent)) {
                lines.push(`${el} Talent:`);
                lines.push(...buildTalentLines(tal));
                lines.push("");
            }
            lines.pop();
        }

        return lines.join("\n");
    }

    export let conf: CharacterBuildConfig;

    $: title = buildCharacterTooltip();
</script>

<button
    type="button"
    {title}
    on:click
    class:active={$highlight_manager.isSelected("character", conf.id)}>
    <img src={conf.image} alt={conf.name} />
    <button
        type="button"
        class="select"
        on:click|stopPropagation={() => highlight.select("character", conf.id)}>
        <div />
    </button>
</button>

<style lang="scss">
    button {
        padding: 0;
        position: relative;

        & > img {
            width: 70px;
            height: 70px;
        }

        &.active > .select,
        &:hover > .select {
            visibility: visible;
        }
    }

    .select {
        visibility: hidden;
        position: absolute;
        top: 0;
        right: 0;
        padding: 3px;
        margin: 0;
        width: 20px;
        height: 20px;
        z-index: 1;
        background-color: var(--background-highlight-color);
        border: 2px solid var(--border-highlight-color);

        & > div {
            width: 100%;
            height: 100%;
        }

        .active > & {
            border-color: var(--border-active-color);
            background-color: var(--background-active-color);

            & > div {
                background-color: var(--border-active-color);
            }
        }
    }
</style>
