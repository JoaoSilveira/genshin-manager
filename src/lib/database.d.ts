export type WeaponType = "sword" | "bow" | "claymore" | "catalyst" | "polearm";
export type RegionType = "mondstadt" | "liyue" | "inazuma" | "sumeru" | "fontaine" | "natlan" | "snezhnaya" | "khaenri'ah";
export type ElementType = "geo" | "dendro" | "cryo" | "pyro" | "hydro" | "electro" | "anemo";

export interface ElementItem {
    key: ElementType;
    name: string;
    image_url: string;
}

export interface WeaponTypeItem {
    key: WeaponType;
    name: string;
    image_url: string;
}

export interface Item {
    key: string;
    name: string;
    image_url: string;
    stars: number;
}

export interface ExperienceItem extends Item {
    experience: number;
}

export interface LocalSpecialty extends Item {
    region: RegionType;
}

export interface ShortTier<T> {
    low: T;
    medium: T;
    high: T;
}

export interface LongTier<T> extends ShortTier<T> {
    highest: T;
}

export interface ExperienceGroup {
    key: string;
    name: string;
    exp_to_mora_rate: number;
    tiers: ShortTier<ExperienceItem>;
}

export interface GemGroup {
    key: string;
    name: string;
    element?: ElementType;
    tiers: LongTier<Item>;
}

export interface EnemyDropGroup {
    key: string;
    name: string;
    enemies: string[];
    tiers: ShortTier<Item>;
}

export interface TempleDrop {
    key: string;
    name: string;
    region: string;
    temple: string;
    days: string[];
}

export interface CharacterMaterialGroup extends TempleDrop {
    tiers: ShortTier<Item>;
}

export interface WeaponMaterialGroup extends TempleDrop {
    tiers: LongTier<Item>;
}

export interface WeeklyBossGroup {
    key: string;
    name: string;
    image_url: string;
    materials: Item[];
}

export interface CharacterAscensionMaterial {
    gem: string;
    local_specialty: string;
    monster: string;
    boss?: string;
}

export interface WeaponAscensionMaterial {
    weapon_material: string;
    elite: string;
    monster: string;
}

export interface TalentMaterial {
    monster: string;
    book: string;
    boss: string;
}

export interface Character {
    name: string;
    image_url: string;
    stars: number;
    region?: RegionType;
    weapon: WeaponType;
    element?: ElementType;
    ascension_material: CharacterAscensionMaterial;
    talent_material: TalentMaterial;
}

export interface Weapon {
    name: string;
    image_url: string;
    passive?: {
        name: string;
        description: string;
    };
    stars: number,
    subStatus?: {
        attribute: string;
        scaling: number[];
    };
    scaling: number[];
    ascension: WeaponAscensionMaterial;
}