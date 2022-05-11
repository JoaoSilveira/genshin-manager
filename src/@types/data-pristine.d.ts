declare type Identifiable = {
    id: number,
};

declare type Material = Identifiable & {
    name: string,
    image: string,
    stars: number,
};

declare type ExperienceMaterial = Material & {
    experience: number,
};

declare type LocalSpecialty = Material & {
    region: string,
};

declare type BaseGroup = Identifiable & {
    group: string,
    tiers: MaterialTier,
}

declare type ExperienceMaterialGroup = BaseGroup<ExperienceMaterial> & {
    expToMoraRate: number,
};

declare type MonsterDropGroup = BaseGroup & {
    enemies: string[],
};

declare type AscensionGemGroup = BaseGroup & {
    element?: string,
};

declare type AscentionMaterialGroup = BaseGroup & {
    days: string,
    region: string,
    temple: string,
};

declare type WeeklyBossMaterialGroup = Identifiable & {
    name: string,
    image: string,
    materials: Material[],
};

declare type MaterialTier = {
    low: number,
    medium: number,
    high: number,
    highest?: number,
};

declare type VisualItem = {
    description: string,
    image: string,
};

declare type TieredRequirement = {
    tier: keyof MaterialTier,
    quantity: number,
};

declare type CharacterAscensionRequirement = {
    mora: number,
    gem: TieredRequirement,
    localSpecialty: number,
    monsterMaterial: TieredRequirement,
    bossMaterial?: number,
};

declare type TalentAscensionRequirement = {
    mora: number,
    monsterMaterial: TieredRequirement,
    book: TieredRequirement,
    bossMaterial?: number,
    crown?: number,
};

declare type WeaponAscensionRequirement = {
    mora: number,
    weaponMaterial: TieredRequirement,
    eliteMaterial: TieredRequirement,
    monsterMaterial: TieredRequirement,
};

declare type CharacterAscensionMaterials = {
    gemGroup: number,
    localSpecialty: number,
    monsterGroup: number,
    bossMaterial?: number,
};

declare type CommonTalentAscensionMaterials = {
    monsterGroup: number,
    bookSeries: number,
    bossMaterial: number,
};

declare type SingleTalentAscensionMaterials = {
    monster: number,
    book: number,
    boss?: number,
    crown?: number,
};

declare type TravelerTalentAscensionMaterials = {
    [element: string]: SingleTalentAscensionMaterials[] | { [ability: string]: SingleTalentAscensionMaterials[] },
};

declare type TalentAscensionMaterials = CommonTalentAscensionMaterials | TravelerTalentAscensionMaterials;

declare type Character = {
    name: string,
    image: string,
    stars: number,
    region?: string,
    element?: number,
    weapon: number,
    ascension: CharacterAscensionMaterials,
    talentAscension: TalentAscensionMaterials,
};

declare type Weapon = {
    name: string,
    image: string,
    stars: number,
    scaling: number,
    ascension: WeaponAscensionMaterials,
    subStatus?: {
        attribute: string,
        scaling: number,
    },
    passive: {
        name: string,
        description: string,
    },
};

declare type WeaponAscensionMaterials = {
    weaponMaterial: number,
    eliteMaterial: number,
    commonMaterial: number,
};

type WeaponStatuses = {
    attackBefore: number[][];
    attackAfter: number[][];
    starOffset: number[];
    sub: number[][];
    subAbsOffset: number;
};

declare type GenshinDataPristine = {
    levelBarriers: number[],
    items: Identifiable[],
    elements: VisualItem[],
    weapon: {
        list: Weapon[],
        ascension: WeaponAscensionRequirement[][],
        types: VisualItem[],
        levelCap: number[],
        statuses: WeaponStatuses,
        exp: number[][],
    },
    character: {
        list: Character[],
        ascension: CharacterAscensionRequirement[],
        talent: TalentAscensionRequirement[],
        exp: number[],
    },
};