declare type LevelProgresion = {
    start: number,
    end: number,
};

declare type CharacterBuild = {
    name: string,
    level: LevelProgresion,
    talents: {
        basic: LevelProgresion,
        elemental: LevelProgresion,
        burst: LevelProgresion,
    },
};