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
    groupId?: number,
};

declare type TotalBuildCost = {
    exp: number,
    mora: number,
    materials: Map<number, MaterialQuantity<Material>>,
};