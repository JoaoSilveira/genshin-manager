import { derived, writable } from "svelte/store";
import { isNil } from "../lib/util";
import localStorageStore from "./localStorageStore";

type TalentSnapshot = {
    basic: number;
    elemental: number;
    burst: number;
};

type CharacterSnapshot = {
    level: number,
    cap: number,
    talents: TalentSnapshot,
};

type WeaponSnapshop = {
    level: number,
    cap: number,
};

type Progress<T> = {
    start: T,
    end: T,
};

type CharacterBuild = Progress<CharacterSnapshot>;
type WeaponBuild = Progress<WeaponSnapshop>;

type Build = {
    character: CharacterBuild,
    weapon: WeaponBuild,
};

type Party = {
    name: string,
    notes?: string,
    // map character name -> build
    builds: Map<string, Build>,
};

type PersistedParty = {
    name: string,
    notes?: string,
    builds: Record<string, Build>,
}

function stringifyParties(parties: Party[]): string {
    const persisted: PersistedParty[] = parties
        .map(party => ({
            ...party,
            builds: Object.fromEntries<Build>(party.builds.entries()),
        }));

    return JSON.stringify(persisted);
}

function parseParties(json: string): Party[] {
    const parties = JSON.parse(json) as PersistedParty[];

    return parties.map(party => ({
        ...party,
        builds: new Map(Object.entries(party.builds)),
    }));
}

function buildPartiesStore() {
    const parties = localStorageStore<Party[]>('parties', [], undefined, {
        parse: parseParties,
        stringify: stringifyParties,
    });

    return {
        subscribe: parties.subscribe,
        // todo:
        add: () => { },
        // todo:
        remove: () => { },
        // todo: place party in index (for sorting parties)
        move: () => { },
        // todo:
        update: () => { },
    };
}

function buildActivePartyStore() {
    const index = localStorageStore<number>(null);
    const value = derived([parties, index], ([$parties, $index]) => isNil($index) ? null : $parties[$index]);

    return {
        subscribe: value.subscribe,
        // todo: add char to party
        add: () => { },
        // todo:
        remove: () => { },
        // todo: set active party, maybe use `set`
        setActive: () => { },
    };
}

function buildActiveBuildStore() {
    const char = writable<string>(null);
    const value = derived([activeParty, char], ([$activeParty, $char]) => isNil($char) || !$activeParty.builds.has($char) ? null : $activeParty.builds.get($char));

    return {
        subscribe: value.subscribe,
        // todo: update parties store to update build
        refresh: () => { },
    };
}

export const parties = buildPartiesStore();
export const activeParty = buildActivePartyStore();
export const activeBuild = buildActiveBuildStore();
export const partyCost = derived(activeParty, ($party) => {
    
});
