import { derived, writable, type Readable } from "svelte/store";
import { calculateTrackable } from "../lib/buildCost";
import localStorageStore from "./localStorageStore";

export type TalentBuildConfig = {
    basic_talent: string;
    elemental_talent: string;
    burst_talent: string;
};

export type CharacterBuildConfig = {
    id?: number;
    image: string;
    name: string;
    level_start: string;
    level_end: string;
    talent: TalentBuildConfig | Record<string, TalentBuildConfig>;
};

export type WeaponBuildConfig = {
    id?: number;
    image: string;
    name: string;
    start: string;
    end: string;
};

export type BuildConfig = {
    description: string;
    thumbnail: string;
    thumbnail_name: string;
    char_build: CharacterBuildConfig[],
    weap_build: WeaponBuildConfig[],
};

export type Thing = 'character' | 'weapon' | 'item';
export type HighlightedThing = null | {
    what: Thing,
    id: number,
};

export function isSimpleTalentConfig(talent: CharacterBuildConfig['talent']): talent is TalentBuildConfig {
    return 'basic_talent' in talent;
}

function highlightThingStore() {
    const store = writable<HighlightedThing>(null);

    return {
        subscribe: store.subscribe,
        select(what: Thing, id: number): void {
            store.update(last => {
                if (last?.id === id && last?.what === what) return null;
                return { what, id };
            });
        },
        clear(): void {
            store.set(null);
        }
    };
}

export const build_list = localStorageStore<BuildConfig[]>('build_config', []);
export const build_index = localStorageStore<number>('selected_build_index', null);
export const selected_build = derived<[typeof build_list, typeof build_index], BuildConfig>([build_list, build_index], ([$build_list, $build_index], set) => {
    if ($build_index == null || $build_index < 0 || $build_index >= $build_list.length) {
        set(null);
    }

    set($build_list[$build_index]);
});
export const cost = derived(selected_build, $selected_build => $selected_build != null ? calculateTrackable($selected_build) : null);
export const highlight = highlightThingStore();
export const highlight_manager = derived<[typeof cost, typeof highlight], { isSelected(thing: Thing, id: number): boolean }>([cost, highlight], ([$cost, $highlight], set) => {
    const always_false = () => false;
    if ($cost == null || $highlight == null) {
        set({
            isSelected: always_false,
        });
        return;
    }

    let rec: Record<Thing, number[]>;

    switch ($highlight.what) {
        case 'item':
            const item = $cost.find($highlight.id);
            if (item != null) {
                rec = {
                    character: item.characters_id,
                    item: [item.item_id],
                    weapon: item.weapons_id,
                };
            }
            break;
        case 'character':
            rec = {
                character: [$highlight.id],
                item: $cost.findForCharacter($highlight.id).map(i => i.item_id),
                weapon: [],
            };
            break
        case 'weapon':
            rec = {
                weapon: [$highlight.id],
                item: $cost.findForWeapon($highlight.id).map(i => i.item_id),
                character: [],
            };
            break
    }

    set({ isSelected: rec == null ? always_false : (t: Thing, id: number) => rec[t].includes(id), });
});