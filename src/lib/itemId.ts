const TagShift = 3;
const TagMask = 7;

const enum MaterialType {
    Simple = 0,
    Experience = 1,
    LocalSpecialty = 2,
    MonsterDrop = 3,
    AscensionGem = 4,
    Ascention = 5,
    ExperienceGroup = 6,
    WeeklyBoss = 7,
}

type MaterialTypeMap = {
    [MaterialType.Simple]: Material,
    [MaterialType.Experience]: ExperienceMaterial,
    [MaterialType.LocalSpecialty]: LocalSpecialty,
    [MaterialType.MonsterDrop]: MonsterDropGroup,
    [MaterialType.AscensionGem]: AscensionGemGroup,
    [MaterialType.Ascention]: AscentionMaterialGroup,
    [MaterialType.ExperienceGroup]: ExperienceMaterialGroup,
    [MaterialType.WeeklyBoss]: WeeklyBossMaterialGroup,
};

export function isMaterial(id: Identifiable): id is Material {
    return (id.id & TagMask) === MaterialType.Simple;
}

export function isExperienceMaterial(id: Identifiable): id is ExperienceMaterial {
    return (id.id & TagMask) === MaterialType.Experience;
}

export function isLocalSpecialty(id: Identifiable): id is LocalSpecialty {
    return (id.id & TagMask) === MaterialType.LocalSpecialty;
}

export function isSimpleMaterial(id: Identifiable): id is Material {
    return (id.id & TagMask) <= MaterialType.LocalSpecialty;
}

export function isMonsterGroup(id: Identifiable): id is MonsterDropGroup {
    return (id.id & TagMask) === MaterialType.MonsterDrop;
}

export function isGemGroup(id: Identifiable): id is AscensionGemGroup {
    return (id.id & TagMask) === MaterialType.AscensionGem;
}

export function isAscensionGroup(id: Identifiable): id is AscentionMaterialGroup {
    return (id.id & TagMask) === MaterialType.Ascention;
}

export function isExperienceGroup(id: Identifiable): id is ExperienceMaterialGroup {
    return (id.id & TagMask) === MaterialType.ExperienceGroup;
}

export function isGroup(id: Identifiable): id is BaseGroup {
    return (id.id & TagMask) <= MaterialType.WeeklyBoss && !isSimpleMaterial(id);
}

export function isWeeklyBossGroup(id: Identifiable): id is WeeklyBossMaterialGroup {
    return (id.id & TagMask) === MaterialType.LocalSpecialty;
}