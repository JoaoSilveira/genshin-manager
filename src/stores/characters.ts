import { writable } from "svelte/store";

declare type LevelProgresion = {
    start: number,
    end: number,
};

declare type CharacterBuild = {
    name: string,
    level: LevelProgresion,
    talents: {
        basic: LevelProgresion,
        elemental: LevelProgresion,
        burst: LevelProgresion,
    },
};

// function toggleByName(characters: CharacterBuild[], name: string): CharacterBuild[] {
//     const indexOf = characters.findIndex(c => c.name === name);
//     if (indexOf >= 0) {
//         return [...characters.slice(0, indexOf), ...characters.slice(indexOf + 1)];
//     }

//     return [...characters,;
// }

function buildCharacterStore() {
    const selectedCharacters = writable<CharacterBuild[]>([]);

    return {
        subscribe: selectedCharacters.subscribe,
    };
}
