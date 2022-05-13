import { writable } from "svelte/store"
import { waitForValue } from "../lib/store";
import { arrayToObject } from "../lib/util";
import genshinData from "./genshinData";

const InitialBuild: Omit<CharacterBuild, 'name'> = {
    level: {
        start: 1,
        end: 90,
    },
    talents: {
        basic: {
            start: 1,
            end: 10,
        },
        elemental: {
            start: 1,
            end: 10,
        },
        burst: {
            start: 1,
            end: 10,
        },
    }
}

function buildStore() {
    const store = writable<{ [name: string]: CharacterBuild }>(undefined, (set) => {
        waitForValue(genshinData)
            .then(data => {
                const builds = arrayToObject(
                    data.character.list,
                    (c) => ([c.name, { ...InitialBuild, name: c.name }])
                );

                set(builds);
            });
    });

    return {
        subscribe: store.subscribe,
    }
}

export const builds = buildStore();