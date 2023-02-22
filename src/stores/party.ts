import { derived, get, writable } from "svelte/store";
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
    active: boolean,
    character: CharacterBuild,
    weapon: WeaponBuild,
};

export type Party = {
    name: string,
    thumbnailCharacter: string,
    notes?: string,
    // map character name -> build
    builds: Map<string, Build>,
};

type PersistedParty = {
    name: string,
    thumbnailCharacter: string,
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
        add: (party: Party) => void (parties.update(current => [...current, party])),
        remove: (party: Party) => void (parties.update(current => {
            const index = current.indexOf(party);
            if (index < 0 || index >= current.length) return current;

            current.splice(index, 1);
            return [...current];
        })),
        // move: (index: number, position: number) => void (parties.update(current => {
        //     if (index < 0 || index >= current.length) return current;
        //     if (position < 0 || position > current.length) return current;

        //     const value = current[index];
        //     current.splice(index, 1);
        //     return [...current.slice(0, position), value, ...current.slice(position)];
        // })),
        update: (index: number, party: Party) => void (parties.update(current => {
            if (index < 0 || index >= current.length) return current;

            current[index] = party;
            return [...current];
        })),
    };
}

function buildActivePartyStore() {
    const index = localStorageStore<number>('active-party', null);
    const value = derived([parties, index], ([$parties, $index]) => isNil($index) || $index < 0 || $index >= $parties.length ? null : $parties[$index]);

    return {
        subscribe: value.subscribe,
        setBuild: (character: string, build: Build) => {
            const idx = get(index);
            const arr = get(parties);

            if (idx == null || idx < 0 || idx >= arr.length) return;
            const party = arr[idx];

            party.builds.set(character, build);
            parties.update(idx, party);
        },
        removeBuild: (character: string) => {
            const partyIndex = get(index);
            const arr = get(parties);

            if (partyIndex == null || partyIndex < 0 || partyIndex >= arr.length) return;
            const party = arr[partyIndex];

            if (party.builds.has(character)) {
                party.builds.get(character).active = false;
            }

            parties.update(partyIndex, party);
        },
        setActive: (party: Party | null) => {
            if (party == null) {
                index.set(null);
                return;
            }

            const arr = get(parties);
            const newIndex = arr.indexOf(party);

            if (newIndex >= 0) {
                index.set(newIndex);
            }
        },
    };
}

function buildActiveBuildStore() {
    const char = writable<string>(null);
    const value = derived([activeParty, char], ([$activeParty, $char]) => isNil($char) || !$activeParty.builds.has($char) ? null : $activeParty.builds.get($char));

    return {
        subscribe: value.subscribe,
        update: (build: Build) => {
            const charName = get(char);
            if (isNil(charName)) return;

            activeParty.setBuild(charName, build);
        },
        // todo: update parties store to update build
        refresh: () => { },
    };
}

export const parties = buildPartiesStore();
export const activeParty = buildActivePartyStore();
export const activeBuild = buildActiveBuildStore();
export const partyCost = derived(activeParty, ($party) => {

});
