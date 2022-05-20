import { writable, type Readable } from "svelte/store";
import localStorageStore from "./localStorageStore";

type ReadonlySet<T> = Omit<Set<T>, 'add' | 'clear' | 'delete'>;

function buildSelectedCharactersStore() {
    const store = localStorageStore<Set<string>>("selected-characters", new Set(), undefined, {
        parse: (json: string) => new Set(JSON.parse(json)),
        stringify: (value: Set<string>) => JSON.stringify([...value.values()]),
    });

    return {
        select: function (name: string): void {
            store.update(current => new Set(current.add(name)));
        },
        unselect: function (name: string): void {
            store.update(current => current.delete(name) ? new Set(current) : current);
        },
        toggle: function (name: string): void {
            store.update(current => current.delete(name) ? current : new Set(current.add(name)));
        },
        subscribe: store.subscribe as Readable<ReadonlySet<string>>['subscribe'],
    }
}

function buildHighlightedCharacter() {
    const store = writable<string>(undefined);

    return {
        highlight: function (name: string) {
            store.update(current => {
                if (current === name) {
                    selectedCharacters.unselect(name);
                    return undefined;
                }

                selectedCharacters.select(name);
                return name;
            });
        },
        set: function (character: string | Character<any>) {
            if (typeof character === 'object')
                this.highlight(character.name);
            else
                this.highlight(character);
        },
        subscribe: store.subscribe,
    };
}

export const selectedCharacters = buildSelectedCharactersStore();
export const highlightedCharacter = buildHighlightedCharacter();