export const TagShift = 3;
export const TagMask = 7;

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

export function indexOf(id: number): number {
    return id >> 3;
}

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

export function isMonsterGroup<TPayload>(id: Identifiable): id is MonsterDropGroup<TPayload> {
    return (id.id & TagMask) === MaterialType.MonsterDrop;
}

export function isGemGroup<TPayload>(id: Identifiable): id is AscensionGemGroup<TPayload> {
    return (id.id & TagMask) === MaterialType.AscensionGem;
}

export function isAscensionGroup<TPayload>(id: Identifiable): id is AscentionMaterialGroup<TPayload> {
    return (id.id & TagMask) === MaterialType.Ascention;
}

export function isExperienceGroup<TPayload>(id: Identifiable): id is ExperienceMaterialGroup<TPayload> {
    return (id.id & TagMask) === MaterialType.ExperienceGroup;
}

export function isGroup<TPayload, TMat = Material>(id: Identifiable): id is BaseGroup<TPayload, TMat> {
    return (id.id & TagMask) < MaterialType.WeeklyBoss && !isSimpleMaterial(id);
}

export function isWeeklyBossGroup<TPayload>(id: Identifiable): id is WeeklyBossMaterialGroup<TPayload> {
    return (id.id & TagMask) === MaterialType.WeeklyBoss;
}