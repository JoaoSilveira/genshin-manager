import genshin_data from '../../data_test/genshin_data.json';

export type TierObject = {
    low: number;
    medium: number;
    high: number;
    highest?: number;
};

export type TierCost = {
    quantity: number;
    tier: keyof TierObject;
};

export type LevelCap = {
    level: number;
    cap: number;
};

export type TalentProgress = {
    start: number;
    end: number;
};

export type LevelCapIndex = LevelCap;

class MaterialCost {
    materials: { id: number; quantity: number }[] = [];

    addTiered(tiers: TierObject, cost: TierCost) {
        const id = tiers[cost.tier];

        if (id == null) {
            console.debug(tiers, cost.tier);
            throw new Error("No id for the requested tier");
        }

        const material = this.materials.find((m) => m.id === id);
        if (material) {
            material.quantity += cost.quantity;
        } else {
            this.materials.push({ id, quantity: cost.quantity });
        }

        return this;
    }

    addSimple(id: number, quantity: number) {
        const material = this.materials.find((m) => m.id === id);
        if (material) {
            material.quantity += quantity;
        } else {
            this.materials.push({ id, quantity });
        }

        return this;
    }

    addItem(item: { id: number; quantity: number }) {
        const material = this.materials.find((m) => m.id === item.id);
        if (material) {
            material.quantity += item.quantity;
        } else {
            this.materials.push({ ...item });
        }

        return this;
    }

    merge(other: MaterialCost) {
        for (const other_mat of other.materials) {
            const mat = this.materials.find((m) => other_mat.id === m.id);

            if (mat) {
                mat.quantity += other_mat.quantity;
            } else {
                this.materials.push({ ...other_mat });
            }
        }

        return this;
    }

    toItemList() {
        const items = new Array(this.materials.length);
        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            const item = genshin_data.items.find((i) => i.id === mat.id);


            if (item == null)
                throw new Error("Could not find item by the id " + mat.id);
            items[i] = { ...item, quantity: mat.quantity };
        }

        return items;
    }
}

function extractTalentProgress(text: string): TalentProgress {
    const parts = text.split("/");

    if (parts.length != 2) throw new Error("Invalid level/cap format");

    const start = Number.parseInt(parts[0]);
    const end = Number.parseInt(parts[1]);

    if (start < 1 || start > 10)
        throw new Error("Invalid talent start value");
    if (end < 1 || end > 10 || end < start)
        throw new Error("Invalid talent end value");

    return { start, end };
}

function extractLevelAndCap(text: string): LevelCap {
    const parts = text.split("/");

    if (parts.length != 2) throw new Error("Invalid level/cap format");

    const level = Number.parseInt(parts[0]);
    const cap = Number.parseInt(parts[1]);

    if (Number.isNaN(level) || Number.isNaN(cap))
        throw new Error("Invalid number for level/cap");

    const cap_index = genshin_data.levelBarriers.findIndex(
        (lb) => lb === cap
    );

    if (cap_index < 0) throw new Error(`${cap} is not a valid level cap`);

    if (
        level > cap ||
        level <
        (cap_index > 0 ? genshin_data.levelBarriers[cap_index - 1] : 1)
    )
        throw new Error("Level is not in a valid cap range");

    return { level, cap };
}

function extractLevelAndCapIndex(text: string): LevelCapIndex {
    const level_cap = extractLevelAndCap(text);
    level_cap.cap = genshin_data.levelBarriers.findIndex(
        (lb) => lb === level_cap.cap
    );

    return level_cap;
}

function findWeaponMat(material_ids: {
    weaponMaterial: number;
    eliteMaterial: number;
    commonMaterial: number;
}): {
    wam: any;
    elite: any;
    common: any;
} {
    const weapon_mat = genshin_data.items.find(
        (i) => i.id === material_ids.weaponMaterial
    );
    const elite_mat = genshin_data.items.find(
        (i) => i.id === material_ids.eliteMaterial
    );
    const common_mat = genshin_data.items.find(
        (i) => i.id === material_ids.commonMaterial
    );

    if (!(weapon_mat && elite_mat && common_mat))
        throw new Error("Invalid weapon ascension material data");

    return {
        wam: weapon_mat.tiers,
        elite: elite_mat.tiers,
        common: common_mat.tiers,
    };
}

function findCharacterAscensionMat(material_ids: {
    gemGroup: number;
    monsterGroup: number;
}): {
    gem: any;
    common: any;
} {
    const gem = genshin_data.items.find(
        (i) => i.id === material_ids.gemGroup
    );
    const common = genshin_data.items.find(
        (i) => i.id === material_ids.monsterGroup
    );

    if (!(gem && common))
        throw new Error("Invalid character ascension material data");

    return {
        gem: gem.tiers,
        common: common.tiers,
    };
}

function findCharacterTalentMat(material_ids: {
    bookSeries: number;
    monsterGroup: number;
}): {
    book: any;
    common: any;
} {
    const book = genshin_data.items.find(
        (i) => i.id === material_ids.bookSeries
    );
    const common = genshin_data.items.find(
        (i) => i.id === material_ids.monsterGroup
    );

    if (!(book && common))
        throw new Error("Invalid character ascension material data");

    return {
        book: book.tiers,
        common: common.tiers,
    };
}

function weaponCost(config: { name: string; start: string; end: string }) {
    const weapon = genshin_data.weapon.list.find(
        (w) => w.name === config.name
    );

    if (weapon == null)
        throw new Error(
            `Weapon named '${config.name}' does not exist in the database`
        );

    try {
        const star_index = weapon.stars - 1;
        const material = findWeaponMat(weapon.ascension);
        const start = extractLevelAndCapIndex(config.start);
        const end = extractLevelAndCapIndex(config.end);
        const ascension_cost = genshin_data.weapon.ascension[
            star_index
        ].slice(start.cap, end.cap);

        return {
            mora: ascension_cost
                .map((ac) => ac.mora)
                .reduce((sum, mora) => sum + mora, 0),
            experience: genshin_data.weapon.exp[star_index]
                .slice(start.level - 1, end.level - 1)
                .reduce((sum, val) => sum + val, 0),
            wam: ascension_cost
                .map((ac) => ac.weaponMaterial as TierCost)
                .reduce(
                    (mc, asc) => mc.addTiered(material.wam, asc),
                    new MaterialCost()
                ),
            common: ascension_cost
                .map((ac) => ac.monsterMaterial as TierCost)
                .reduce(
                    (mc, asc) => mc.addTiered(material.common, asc),
                    new MaterialCost()
                ),
            elite: ascension_cost
                .map((ac) => ac.eliteMaterial as TierCost)
                .reduce(
                    (mc, asc) => mc.addTiered(material.elite, asc),
                    new MaterialCost()
                ),
        };
    } catch (cause) {
        throw new Error(`Weapon: ${config.name}. ${cause.message}`);
    }
}

function characterAscensionCost(
    character,
    config: {
        level_start: string;
        level_end: string;
    }
) {
    try {
        const start = extractLevelAndCapIndex(config.level_start);
        const end = extractLevelAndCapIndex(config.level_end);
        const material = findCharacterAscensionMat(character.ascension);
        const ascension_cost = genshin_data.character.ascension.slice(
            start.cap,
            end.cap
        );

        return {
            mora: ascension_cost
                .map((ac) => ac.mora)
                .reduce((sum, mora) => sum + mora, 0),
            experience: genshin_data.character.exp
                .slice(start.level - 1, end.level - 1)
                .reduce((sum, val) => sum + val, 0),
            gem: ascension_cost
                .map((ac) => ac.gem as TierCost)
                .reduce(
                    (mc, asc) => mc.addTiered(material.gem, asc),
                    new MaterialCost()
                ),
            common: ascension_cost
                .map((ac) => ac.monsterMaterial as TierCost)
                .reduce(
                    (mc, asc) => mc.addTiered(material.common, asc),
                    new MaterialCost()
                ),
            local_specialty: {
                id: character.ascension.localSpecialty,
                quantity: ascension_cost
                    .map((ac) => ac.localSpecialty)
                    .reduce((sum, ls) => sum + ls, 0),
            },
            boss: {
                id: character.ascension.bossMaterial,
                quantity: ascension_cost
                    .map((ac) => ac.bossMaterial)
                    .filter((m) => m != null)
                    .reduce((sum, ls) => sum + ls, 0),
            },
        };
    } catch (cause) {
        throw new Error(`Character: ${character.name}. ${cause.message}`);
    }
}

function characterTalentCost(
    character,
    conf: {
        basic_talent: string;
        elemental_talent: string;
        burst_talent: string;
    }
) {
    const normal = extractTalentProgress(conf.basic_talent);
    const elemental = extractTalentProgress(conf.elemental_talent);
    const burst = extractTalentProgress(conf.burst_talent);
    const material = findCharacterTalentMat(character.talentAscension);

    function regular(progress: TalentProgress) {
        const cost = genshin_data.character.talent.slice(
            progress.start - 1,
            progress.end - 1
        );

        return {
            mora: cost
                .map((ac) => ac.mora)
                .reduce((sum, mora) => sum + mora, 0),
            common: cost
                .map((ac) => ac.monsterMaterial as TierCost)
                .reduce(
                    (mc, m) => mc.addTiered(material.common, m),
                    new MaterialCost()
                ),
            book: cost
                .map((ac) => ac.book as TierCost)
                .reduce(
                    (mc, b) => mc.addTiered(material.book, b),
                    new MaterialCost()
                ),
            boss: cost
                .map((ac) => ac.bossMaterial)
                .filter((m) => m != null)
                .reduce((sum, b) => sum + b, 0),
            crown: cost
                .map((ac) => ac.crown)
                .filter((m) => m != null)
                .reduce((sum, crown) => sum + crown, 0),
        };
    }

    const normal_cost = regular(normal);
    const elemental_cost = regular(elemental);
    const burst_cost = regular(burst);

    return {
        mora: normal_cost.mora + elemental_cost.mora + burst_cost.mora,
        common: normal_cost.common
            .merge(elemental_cost.common)
            .merge(burst_cost.common),
        book: normal_cost.book
            .merge(elemental_cost.book)
            .merge(burst_cost.book),
        boss: new MaterialCost().addItem({
            id: character.talentAscension.bossMaterial,
            quantity:
                normal_cost.boss + elemental_cost.boss + burst_cost.boss,
        }),
        crown: normal_cost.crown + elemental_cost.crown + burst_cost.crown,
    };
}

function travelerTalentCost(
    character,
    conf_by_element: {
        [prop: string]: {
            basic_talent: string;
            elemental_talent: string;
            burst_talent: string;
        };
    }
) {
    const cost = {
        mora: 0,
        common: new MaterialCost(),
        book: new MaterialCost(),
        boss: new MaterialCost(),
        crown: 0,
    };

    function regular(progress: TalentProgress, material_by_level: any[]) {
        const mats = material_by_level.slice(
            progress.start - 1,
            progress.end - 1
        );
        const costs = genshin_data.character.talent.slice(
            progress.start - 1,
            progress.end - 1
        );

        for (let i = 0; i < costs.length; i++) {
            cost.mora += costs[i].mora;
            cost.common.addSimple(
                mats[i].monster,
                costs[i].monsterMaterial.quantity
            );
            cost.book.addSimple(mats[i].book, costs[i].book.quantity);
            cost.crown += costs[i].crown ?? 0;

            if ("boss" in mats[i]) {
                cost.boss.addSimple(mats[i].boss, costs[i].bossMaterial);
            }
        }
    }

    for (const [element, conf] of Object.entries(conf_by_element)) {
        const normal = extractTalentProgress(conf.basic_talent);
        const elemental = extractTalentProgress(conf.elemental_talent);
        const burst = extractTalentProgress(conf.burst_talent);

        if (!(element in character.talentAscension))
            throw new Error(
                `No talent build information for element ${element}`
            );

        if (Array.isArray(character.talentAscension[element])) {
            regular(normal, character.talentAscension[element]);
            regular(elemental, character.talentAscension[element]);
            regular(burst, character.talentAscension[element]);
        } else {
            regular(
                normal,
                character.talentAscension[element]["normal attack"]
            );
            regular(
                elemental,
                character.talentAscension[element][
                "elemental skill or burst"
                ]
            );
            regular(
                burst,
                character.talentAscension[element][
                "elemental skill or burst"
                ]
            );
        }
    }

    return cost;
}

function characterCost(conf) {
    const character = genshin_data.character.list.find(
        (w) => w.name === conf.name
    );

    if (character == null)
        throw new Error(
            `Character named '${conf.name}' does not exist in the database`
        );

    const ascension_cost = characterAscensionCost(character, conf);
    const talent_cost =
        character.name === "Traveler"
            ? travelerTalentCost(character, conf.talent)
            : characterTalentCost(character, conf.talent);

    return {
        mora: ascension_cost.mora + talent_cost.mora,
        experience: ascension_cost.experience,
        common: ascension_cost.common.merge(talent_cost.common),
        gem: ascension_cost.gem,
        book: talent_cost.book,
        local_specialty: ascension_cost.local_specialty,
        ascension_boss: ascension_cost.boss,
        talent_boss: talent_cost.boss,
        crown: talent_cost.crown,
    };
}

export function calculateCost(build_conf) {
    const cost = {
        mora: 0,
        character_experience: 0,
        weapon_experience: 0,
        common: new MaterialCost(),
        elite: new MaterialCost(),
        gem: new MaterialCost(),
        book: new MaterialCost(),
        wam: new MaterialCost(),
        local_specialty: new MaterialCost(),
        ascension_boss: new MaterialCost(),
        talent_boss: new MaterialCost(),
        crown: 0,
    };

    for (const char_conf of build_conf.char_build) {
        const char_cost = characterCost(char_conf);

        cost.mora += char_cost.mora;
        cost.character_experience += char_cost.experience;
        cost.common.merge(char_cost.common);
        cost.gem.merge(char_cost.gem);
        cost.book.merge(char_cost.book);
        cost.local_specialty.addItem(char_cost.local_specialty);
        cost.talent_boss.merge(char_cost.talent_boss);
        cost.crown += char_cost.crown;

        if (char_cost.ascension_boss.id != null) // traveler
            cost.ascension_boss.addItem(char_cost.ascension_boss);
    }

    for (const weap_conf of build_conf.weap_build) {
        const weap_cost = weaponCost(weap_conf);

        cost.mora += weap_cost.mora;
        cost.weapon_experience += weap_cost.experience;
        cost.common.merge(weap_cost.common);
        cost.wam.merge(weap_cost.wam);
        cost.elite.merge(weap_cost.elite);
    }

    return {
        mora: cost.mora,
        character_experience: cost.character_experience,
        weapon_experience: cost.weapon_experience,
        common: cost.common
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        elite: cost.elite
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        gem: cost.gem
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        book: cost.book
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        wam: cost.wam
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        local_specialty: cost.local_specialty
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        ascension_boss: cost.ascension_boss
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        talent_boss: cost.talent_boss
            .toItemList()
            .filter((i) => i.quantity > 0)
            .sort((a, b) => a.id - b.id),
        crown: cost.crown,
    };
}

export class TrackableItem {
    readonly item: Material;
    quantity: number = 0;

    weapons_id: number[] = [];
    characters_id: number[] = [];

    constructor(id: number) {
        this.item = genshin_data.items.find(i => i.id === id) as Material;

        if (this.item == null) throw new Error(`Material of id ${id} was not found`);
    }

    get item_id(): number {
        return this.item.id;
    }

    characterAdd(id: number, quantity: number): void {
        this.quantity += quantity;

        if (quantity > 0 && !this.characters_id.includes(id)) {
            this.characters_id.push(id);
        }
    }

    weaponAdd(id: number, quantity: number): void {
        this.quantity += quantity;

        if (quantity > 0 && !this.weapons_id.includes(id)) {
            this.weapons_id.push(id);
        }
    }
}

export class TrackableList {
    list: TrackableItem[] = [];

    characterAdd(character_id: number, item: { id: number, quantity: number }): void {
        let trackable_item = this.list.find(i => i.item_id === item.id);

        if (trackable_item == null) {
            trackable_item = new TrackableItem(item.id);
            this.list.push(trackable_item);
        }

        trackable_item.characterAdd(character_id, item.quantity);
    }

    characterMerge(id: number, list: MaterialCost): void {
        for (const mat of list.materials) {
            let item = this.list.find(i => i.item_id === mat.id);

            if (item == null) {
                item = new TrackableItem(mat.id);
                this.list.push(item);
            }

            item.characterAdd(id, mat.quantity);
        }
    }

    weaponMerge(id: number, list: MaterialCost): void {
        for (const mat of list.materials) {
            let item = this.list.find(i => i.item_id === mat.id);

            if (item == null) {
                item = new TrackableItem(mat.id);
                this.list.push(item);
            }

            item.weaponAdd(id, mat.quantity);
        }
    }

    filterOutZeroes(): void {
        this.list = this.list.filter(i => i.quantity > 0);
    }
}

export class TrackableCost {
    mora: TrackableItem = new TrackableItem(0);
    character_exp: TrackableItem = new TrackableItem(25);
    weapon_exp: TrackableItem = new TrackableItem(57);
    common: TrackableList = new TrackableList();
    elite: TrackableList = new TrackableList();
    gem: TrackableList = new TrackableList();
    book: TrackableList = new TrackableList();
    wam: TrackableList = new TrackableList();
    local_specialty: TrackableList = new TrackableList();
    ascension_boss: TrackableList = new TrackableList();
    talent_boss: TrackableList = new TrackableList();
    crown: TrackableItem = new TrackableItem(1504);

    find(id: number): TrackableItem | null {
        if (id === this.mora.item_id) return this.mora;
        if (id === this.character_exp.item_id) return this.character_exp;
        if (id === this.weapon_exp.item_id) return this.weapon_exp;
        if (id === this.crown.item_id) return this.crown;

        let item = this.common.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.elite.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.gem.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.book.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.wam.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.local_specialty.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.ascension_boss.list.find(i => i.item_id === id);
        if (item != null) return item;

        item = this.talent_boss.list.find(i => i.item_id === id);
        if (item != null) return item;

        return null;
    }

    findForCharacter(id: number): TrackableItem[] {
        const list = [];

        if (this.mora.characters_id.includes(id)) list.push(this.mora);
        if (this.character_exp.characters_id.includes(id)) list.push(this.character_exp);
        if (this.crown.characters_id.includes(id)) list.push(this.crown);

        list.push(...this.common.list.filter(i => i.characters_id.includes(id)));
        list.push(...this.gem.list.filter(i => i.characters_id.includes(id)));
        list.push(...this.book.list.filter(i => i.characters_id.includes(id)));
        list.push(...this.local_specialty.list.filter(i => i.characters_id.includes(id)));
        list.push(...this.ascension_boss.list.filter(i => i.characters_id.includes(id)));
        list.push(...this.talent_boss.list.filter(i => i.characters_id.includes(id)));

        return list;
    }

    findForWeapon(id: number): TrackableItem[] {
        const list = [];

        if (this.mora.weapons_id.includes(id)) list.push(this.mora);
        if (this.weapon_exp.weapons_id.includes(id)) list.push(this.weapon_exp);

        list.push(...this.common.list.filter(i => i.weapons_id.includes(id)));
        list.push(...this.elite.list.filter(i => i.weapons_id.includes(id)));
        list.push(...this.wam.list.filter(i => i.weapons_id.includes(id)));

        return list;
    }

    filterOutZeroes(): void {
        this.common.filterOutZeroes();
        this.elite.filterOutZeroes();
        this.gem.filterOutZeroes();
        this.book.filterOutZeroes();
        this.wam.filterOutZeroes();
        this.local_specialty.filterOutZeroes();
        this.ascension_boss.filterOutZeroes();
        this.talent_boss.filterOutZeroes();
    }
}

export function calculateTrackable(build_conf): TrackableCost {
    const cost = new TrackableCost();

    for (const char_conf of build_conf.char_build) {
        const char_cost = characterCost(char_conf);

        console.log(char_conf, char_cost)

        cost.mora.characterAdd(char_conf.id, char_cost.mora);
        cost.character_exp.characterAdd(char_conf.id, char_cost.experience);
        cost.crown.characterAdd(char_conf.id, char_cost.crown);
        cost.common.characterMerge(char_conf.id, char_cost.common);
        cost.gem.characterMerge(char_conf.id, char_cost.gem);
        cost.book.characterMerge(char_conf.id, char_cost.book);
        cost.local_specialty.characterAdd(char_conf.id, char_cost.local_specialty);
        cost.talent_boss.characterMerge(char_conf.id, char_cost.talent_boss);

        if (char_cost.ascension_boss.id != null) // traveler
            cost.ascension_boss.characterAdd(char_conf.id, char_cost.ascension_boss);
    }

    for (const weap_conf of build_conf.weap_build) {
        const weap_cost = weaponCost(weap_conf);

        cost.mora.weaponAdd(weap_conf.id, weap_cost.mora);
        cost.weapon_exp.weaponAdd(weap_conf.id, weap_cost.experience);
        cost.common.weaponMerge(weap_conf.id, weap_cost.common);
        cost.wam.weaponMerge(weap_conf.id, weap_cost.wam);
        cost.elite.weaponMerge(weap_conf.id, weap_cost.elite);
    }

    cost.mora.quantity += Math.ceil(cost.character_exp.quantity / 5);
    cost.mora.quantity += Math.ceil(cost.weapon_exp.quantity / 10);

    cost.filterOutZeroes();

    return cost;
}