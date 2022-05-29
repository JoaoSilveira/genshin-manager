declare type LevelProgresion<TLevel> = {
    start: TLevel,
    end: TLevel,
};

declare type CharacterLevel = {
    level: number,
    cap: number,
};

declare type CharacterBuild = {
    name: string,
    level: LevelProgresion<CharacterLevel>,
    talents: {
        basic: LevelProgresion<number>,
        elemental: LevelProgresion<number>,
        burst: LevelProgresion<number>,
    },
};

declare type MaterialQuantity<T> = T & {
    quantity: number,
};

declare type TieredMaterialCost = BaseGroup<ExpandedPayload, MaterialQuantity<Material>>;

declare type TotalBuildCost = {
    exp: number,
    mora: number,
    crown: MaterialQuantity<Material>,
    localSpecialties: MaterialQuantity<LocalSpecialty>[],
    gems: TieredMaterialCost[],
    books: TieredMaterialCost[],
    mobMaterials: TieredMaterialCost[],
    eliteMaterials: TieredMaterialCost[],
    ascensionBossMaterials: MaterialQuantity<Material>[],
    talentBossMaterials: MaterialQuantity<Material>[],
};