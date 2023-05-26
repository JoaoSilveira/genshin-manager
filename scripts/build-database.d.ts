declare namespace BuildDatabase {

    export type WeaponType = "sword" | "bow" | "claymore" | "catalyst" | "polearm";
    export type RegionType = "mondstadt" | "liyue" | "inazuma" | "sumeru" | "fontaine" | "natlan" | "snezhnaya" | "khaenri'ah";
    export type ElementType = "geo" | "dendro" | "cryo" | "pyro" | "hydro" | "electro" | "anemo";
    export type TalentType = 'normal' | 'elemental' | 'burst';

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

    export interface TalentBookGroup extends TempleDrop {
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

    export interface CharacterAscensionRequirement {
        mora: number;
        gem: {
            quantity: number;
            tier: keyof LongTier<any>;
        };
        local_specialty: number;
        monster: {
            quantity: number;
            tier: keyof ShortTier<any>;
        };
        boss?: number;
    }

    export interface TravelerTalentRequirementItem {
        monster: string;
        book: string;
        boss?: string;
    }

    export interface CharacterTalentRequirement {
        mora: number;
        monster: {
            quantity: number;
            tier: keyof ShortTier<any>;
        };
        book: {
            quantity: number;
            tier: keyof ShortTier<any>;
        };
        boss?: number;
        crown?: number;
    }

    export interface WeaponAscensionRequirement {
        mora: number;
        weapon_material: {
            quantity: number;
            tier: keyof LongTier<any>;
        };
        elite: {
            quantity: number;
            tier: keyof ShortTier<any>;
        };
        monster: {
            quantity: number;
            tier: keyof ShortTier<any>;
        };
    }

    export interface CharacterBase {
        name: string;
        image_url: string;
        stars: number;
        weapon: WeaponType;
        gem: string;
        local_specialty: string;
        monster: string;
    }

    export interface Character extends CharacterBase {
        region: RegionType;
        element: ElementType;
        ascension_boss: string;
        talent_book: string;
        talent_boss: string;
    }

    export interface Traveler extends CharacterBase {
        talent_material: Record<ElementType, TravelerTalentRequirementItem[] | Record<TalentType, TravelerTalentRequirementItem[]>>,
    }

    export interface Weapon {
        name: string;
        image_url: string;
        type: WeaponType;
        stars: number;
        scaling: number[][];
        max_level: number;
        ascension: WeaponAscensionMaterial;
        passive?: {
            name: string;
            description: string;
        };
        subStatus?: {
            attribute: string;
            scaling: number[];
            absolute: boolean;
        };
    }

    interface Database {
        level_barriers: number[];
        elements: ElementItem[];
        mora: Item;
        crown: Item;
        character_exp_material: ExperienceGroup;
        weapon_exp_material: ExperienceGroup;
        local_specialty: LocalSpecialty[];
        boss_drops: Item[];
        ascension_gems: GemGroup[];
        monster_drops: EnemyDropGroup[];
        elite_drops: EnemyDropGroup[];
        weekly_boss_drops: WeeklyBossGroup[];
        talent_books: TalentBookGroup[];
        weapon_material: WeaponMaterialGroup[];
        weapon: {
            list: Weapon[];
            types: WeaponTypeItem[];
            ascension_requirements: WeaponAscensionRequirement[][];
            experience_requirements: number[][];
        };
        character: {
            list: CharacterBase[];
            ascension_requirements: CharacterAscensionRequirement[];
            talent_requirements: CharacterTalentRequirement[];
            experience_requirements: number[];
        };
    }
}