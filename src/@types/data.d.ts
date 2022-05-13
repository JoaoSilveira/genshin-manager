declare type PristinePayload = 'pristine';
declare type ExpandedPayload = 'expanded';

type Expanded<TPayload> = TPayload extends Payload<unknown, infer TMat>
    ? Payload<ExpandedPayload, TMat> : never;

type Payload<T, TMat> =
    T extends PristinePayload ? number
    : T extends ExpandedPayload ? TMat : never;

type PayloadOf<T> = T extends Payload<infer TPayloadType, infer TPayload>
    ? TPayload extends PristinePayload ? number : TPayload
    : any;

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

declare type MaterialTier<TPayload, TMat> = {
    low: Payload<TPayload, TMat>,
    medium: Payload<TPayload, TMat>,
    high: Payload<TPayload, TMat>,
    highest?: Payload<TPayload, TMat>,
};

declare type BaseGroup<TPayload, TMat> = Identifiable & {
    group: string,
    tiers: MaterialTier<TPayload, TMat>,
}

declare type ExperienceMaterialGroup<TPayload> = BaseGroup<TPayload, ExperienceMaterial> & {
    expToMoraRate: number,
};

declare type MonsterDropGroup<TPayload> = BaseGroup<TPayload, Material> & {
    enemies: string[],
};

declare type AscensionGemGroup<TPayload> = BaseGroup<TPayload, Material> & {
    element?: string,
};

declare type AscentionMaterialGroup<TPayload> = BaseGroup<TPayload, Material> & {
    days: string,
    region: string,
    temple: string,
};

declare type WeeklyBossMaterialGroup<TPayload> = Identifiable & {
    name: string,
    image: string,
    materials: Payload<TPayload, Material>[],
};

declare type VisualItem = {
    description: string,
    image: string,
};

declare type TieredRequirement = {
    tier: keyof MaterialTier<unknown>,
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

declare type CharacterAscensionMaterials<TPayload> = {
    gemGroup: Payload<TPayload, AscensionGemGroup<ExpandedPayload>>,
    localSpecialty: Payload<TPayload, LocalSpecialty>,
    monsterGroup: Payload<TPayload, MonsterDropGroup<ExpandedPayload>>,
    bossMaterial?: Payload<TPayload, Material>,
};

declare type CommonTalentAscensionMaterials<TPayload> = {
    monsterGroup: Payload<TPayload, MonsterDropGroup<ExpandedPayload>>,
    bookSeries: Payload<TPayload, AscentionMaterialGroup<ExpandedPayload>>,
    bossMaterial: Payload<TPayload, Material>,
};

declare type SingleTalentAscensionMaterials<TPayload> = {
    monster: Payload<TPayload, Material>,
    book: Payload<TPayload, Material>,
    boss?: Payload<TPayload, Material>,
    crown?: Payload<TPayload, Material>,
};

declare type TravelerTalentAscensionMaterials<TPayload> = {
    [element: string]: SingleTalentAscensionMaterials<TPayload>[] | { [ability: string]: SingleTalentAscensionMaterials<TPayload>[] },
};

declare type TalentAscensionMaterials<TPayload> = CommonTalentAscensionMaterials<TPayload> | TravelerTalentAscensionMaterials<TPayload>;

declare type WeaponAscensionMaterials<TPayload> = {
    weaponMaterial: Payload<TPayload, AscentionMaterialGroup>,
    eliteMaterial: Payload<TPayload, MonsterDropGroup>,
    commonMaterial: Payload<TPayload, MonsterDropGroup>,
};

declare type Character<TPayload> = {
    name: string,
    image: string,
    stars: number,
    region?: string,
    element?: Payload<TPayload, VisualItem>,
    weapon: Payload<TPayload, VisualItem>,
    ascension: CharacterAscensionMaterials<TPayload>,
    talentAscension: TalentAscensionMaterials<TPayload>,
};

declare type Weapon<TPayload> = {
    name: string,
    image: string,
    stars: number,
    scaling: Payload<TPayload, number[]>,
    ascension: WeaponAscensionMaterials<TPayload>,
    subStatus?: {
        attribute: string,
        scaling: Payload<TPayload, number[]>,
    },
    passive: {
        name: string,
        description: string,
    },
};

type WeaponStatuses = {
    attackBefore: number[][];
    attackAfter: number[][];
    starOffset: number[];
    sub: number[][];
    subAbsOffset: number;
};

declare type GenshinDataBase<TPayload> = {
    levelBarriers: number[],
    items: Identifiable[],
    elements: VisualItem[],
    weapon: {
        list: Weapon<TPayload>[],
        ascension: WeaponAscensionRequirement[][],
        types: VisualItem[],
        levelCap: number[],
        statuses: WeaponStatuses,
        exp: number[][],
    },
    character: {
        list: Character<TPayload>[],
        ascension: CharacterAscensionRequirement[],
        talent: TalentAscensionRequirement[],
        exp: number[],
    },
};

declare type GenshinDataPristine = GenshinDataBase<PristinePayload>;
declare type GenshinDataExpanded = GenshinDataBase<ExpandedPayload>;