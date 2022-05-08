import type { TalentCostType } from "./extractTalentData";
import type { fetchCharacterData } from "./fetchCharacterData";
import type { fetchExperienceData } from "./fetchExperienceData";
import type { fetchMaterials } from "./fetchMaterials";
import type { fetchWeaponData } from "./fetchWeaponData";
import { distinctBy, expect } from "./util";

type Identifiable = {
    id: number,
};

type Material = Identifiable & {
    name: string,
    image: string,
    stars: number,
};

type ExperienceMaterial = Material & {
    experience: number,
};

type LocalSpecialty = Material & {
    region: string,
};

type BaseGroup<M extends Material = Material> = Identifiable & {
    group: string,
    tiers: MaterialTier<M>,
}

type ExperienceMaterialGroup = BaseGroup<ExperienceMaterial> & {
    expToMoraRate: number,
};

type MonsterDropGroup = BaseGroup & {
    enemies: string[],
};

type AscensionGemGroup = BaseGroup & {
    element: {
        name: string,
        image: string,
    },
};

type AscentionMaterialGroup = BaseGroup & {
    days: string,
    region: string,
    temple: string,
};

type WeeklyBossMaterialGroup = Identifiable & {
    name: string,
    image: string,
    materials: Material[],
};

type MaterialTier<T> = {
    low: T,
    medium: T,
    high: T,
    highest?: T,
};

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
    [MaterialType.WeeklyBoss]: WeeklyBossMaterialGroup,
    [MaterialType.ExperienceGroup]: ExperienceMaterialGroup,
};

type VisualItem = {
    description: string,
    image: string,
};

type TieredRequirement = {
    tier: keyof MaterialTier<unknown>,
    quantity: number,
};

type CharacterAscensionRequirement = {
    mora: number,
    gem: TieredRequirement,
    localSpecialty: number,
    monsterMaterial: TieredRequirement,
    bossMaterial?: number,
};

type TalentAscensionRequirement = {
    mora: number,
    monsterMaterial: TieredRequirement,
    book: TieredRequirement,
    bossMaterial?: number,
    crown?: number,
};

type WeaponAscensionRequirement = {
    mora: number,
    weaponMaterial: TieredRequirement,
    eliteMaterial: TieredRequirement,
    monsterMaterial: TieredRequirement,
};

type CharacterAscensionMaterials = {
    gemGroup: number,
    localSpecialty: number,
    monsterGroup: number,
    bossMaterial?: number,
};

type CommonTalentAscensionMaterials = {
    monsterGroup: number,
    bookSeries: number,
    bossMaterial: number,
};

type TravelerTalentAscensionMaterials = {
    [element: string]: CommonTalentAscensionMaterials[] | { [ability: string]: CommonTalentAscensionMaterials[] },
};

type TalentAscensionMaterials = CommonTalentAscensionMaterials | TravelerTalentAscensionMaterials;

type Character = {
    name: string,
    image: string,
    stars: number,
    region?: string,
    element?: number,
    weapon: number,
    ascension: CharacterAscensionMaterials,
    talentAscension: TalentAscensionMaterials,
};

type Weapon = {
    name: string,
    image: string,
    stars: number,
    scaling: number,
    ascension: WeaponAscensionMaterials,
    subStatus: {
        scaling: number,
        attribute: string,
    },
    passive: {
        name: string,
        description: string,
    },
};

type WeaponAscensionMaterials = {
    weaponMaterial: TieredRequirement,
    eliteMaterial: TieredRequirement,
    commonMaterial: TieredRequirement,
};

class ItemManager {
    private static TAG_SHIFT: number = 3;
    private static TAG_MASK: number = 7;

    private idToMaterial: Map<number, Identifiable> = new Map();
    private nameToMaterial: Map<string, Identifiable> = new Map();
    private idToGroup: Map<number, Identifiable> = new Map();

    constructor(materials: AsyncReturnType<typeof fetchMaterials>, expMaterials: AsyncReturnType<typeof fetchExperienceData>, mora: Omit<Material, 'id'>) {
        this.addMat(MaterialType.Simple, mora);

        this.addExperienceItems(expMaterials);
        this.addCharacterItems(materials.character);
        this.addCommonItems(materials.common);
        this.addTalentMaterials(materials.talent);

        materials.weapon.forEach(group => {
            this.addMat(MaterialType.Ascention, {
                days: group.days,
                region: group.region,
                temple: group.temple,
                group: group.temple,
                tiers: this.addTier(
                    MaterialType.Simple,
                    this.convertToTier(group.materials, a => a),
                ),
            });
        });
    }

    idOf(name: string): number | undefined {
        return this.nameToMaterial.get(name)?.id;
    }

    getTierByName(name: string): keyof MaterialTier<unknown> | undefined {
        const childId = this.idOf(name);
        if (!childId) return;

        const group = this.idToGroup.get(childId);
        if (!group) return;
        if (!ItemManager.isGroupBased(group)) return;

        for (const key in group.tiers) {
            if (group.tiers[key]?.id === childId) return key as keyof MaterialTier<unknown>;
        }
    }

    getGroupIdByName(name: string): number | undefined {
        const childId = this.idOf(name);
        if (!childId) return;

        const group = this.idToGroup.get(childId);
        if (!group) return;
        if (!ItemManager.isGroupBased(group)) return;

        return group.id;
    }

    private addExperienceItems(expMaterials: AsyncReturnType<typeof fetchExperienceData>): void {
        [expMaterials.character.expItems, expMaterials.weapon.expItems]
            .forEach((materials, i) => {
                this.addMat(MaterialType.ExperienceGroup, {
                    expToMoraRate: 5 * (i + 1),
                    group: `${i === 0 ? 'Character' : 'Weapon'} Experience Material`,
                    tiers: this.addTier(
                        MaterialType.Experience,
                        this.convertToTier(materials, (a): Omit<ExperienceMaterial, 'id'> => ({
                            name: a.name,
                            image: a.image,
                            stars: a.stars,
                            experience: a.quantity
                        })),
                    ),
                });
            });
    }

    private addCharacterItems(materials: AsyncReturnType<typeof fetchMaterials>['character']): void {
        materials.localSpecialty.forEach(ls => this.addMat(MaterialType.LocalSpecialty, ls))
        materials.normalBoss.forEach(nb => this.addMat(MaterialType.Simple, nb));
        materials.gems.forEach(group => {
            this.addMat(MaterialType.AscensionGem, {
                group: group.group,
                element: group.element,
                tiers: this.addTier(
                    MaterialType.Simple,
                    this.convertToTier(group.materials, a => a),
                ),
            });
        });
    }

    private addCommonItems(materials: AsyncReturnType<typeof fetchMaterials>['common']): void {
        materials.common.forEach(group => {
            this.addMat(MaterialType.MonsterDrop, {
                enemies: group.enemies,
                group: group.group,
                tiers: this.addTier(
                    MaterialType.Simple,
                    this.convertToTier(group.materials, a => a),
                ),
            });
        });

        materials.elite.forEach(group => {
            this.addMat(MaterialType.MonsterDrop, {
                enemies: group.enemies,
                group: group.group,
                tiers: this.addTier(
                    MaterialType.Simple,
                    this.convertToTier(group.materials, a => a),
                ),
            });
        });
    }

    private addTalentMaterials(materials: AsyncReturnType<typeof fetchMaterials>['talent']): void {
        this.addMat(MaterialType.Simple, materials.crown);
        materials.books.forEach(group => {
            this.addMat(MaterialType.Ascention, {
                days: group.days,
                region: group.region,
                temple: group.temple,
                group: group.series,
                tiers: this.addTier(
                    MaterialType.Simple,
                    this.convertToTier(group.books, a => a),
                ),
            });
        });

        materials.bossMaterial.forEach(group => {
            this.addMat(MaterialType.WeeklyBoss, {
                name: group.name,
                image: group.image,
                materials: group.materials.map(m => this.addMat(MaterialType.Simple, m))
            });
        });
    }

    private addTier<MatType extends keyof MaterialTypeMap>(materialType: MatType, tier: MaterialTier<Omit<MaterialTypeMap[MatType], 'id'>>): MaterialTier<MaterialTypeMap[MatType]> {
        const registered: any = {
            low: this.addMat(materialType, tier.low),
            medium: this.addMat(materialType, tier.medium),
            high: this.addMat(materialType, tier.high),
        };

        if (tier.highest) {
            registered.highest = this.addMat(materialType, tier.highest);
        }

        return registered;
    }

    private addMat<MatType extends keyof MaterialTypeMap>(materialType: MatType, data: Omit<MaterialTypeMap[MatType], 'id'>): MaterialTypeMap[MatType] {
        const id = this.composeMaterialIndex(materialType);
        const withId = { id, ...data };

        this.idToMaterial.set(
            id,
            withId
        );

        this.fillMaps(withId);

        return withId as MaterialTypeMap[MatType];
    }

    private fillMaps(id: Identifiable): void {
        if (ItemManager.isSimpleMaterialBased(id)) {
            this.nameToMaterial.set(
                expect(!this.nameToMaterial.has(id.name), id.name, 'Duplicate key: ' + id.name),
                id
            );

            return;
        }

        if (ItemManager.isGroupBased(id)) {
            this.idToGroup.set(id.tiers.low.id, id);
            this.idToGroup.set(id.tiers.medium.id, id);
            this.idToGroup.set(id.tiers.high.id, id);
            id.tiers.highest && this.idToGroup.set(id.tiers.highest.id, id);

            return;
        }

        if (ItemManager.isWeeklyBossGroup(id)) {
            id.materials.forEach(m => this.idToGroup.set(m.id, id));
        }
    }

    private composeMaterialIndex(materialType: MaterialType): number {
        return (this.idToMaterial.size << ItemManager.TAG_SHIFT) | materialType;
    }

    private convertToTier<T extends { stars: number }, O extends Omit<Material, 'id'>>(materials: T[], converter: (obj: T) => O): MaterialTier<O> {
        const [low, medium, high, highest] = materials.sort((a, b) => a.stars - b.stars)
            .map(converter);

        return {
            low,
            medium,
            high,
            highest,
        };
    }

    static isSimpleMaterial(mat: Identifiable): mat is Material {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.Simple;
    }

    static isExperienceMaterial(mat: Identifiable): mat is ExperienceMaterial {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.Experience;
    }

    static isLocalSpecialty(mat: Identifiable): mat is LocalSpecialty {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.LocalSpecialty;
    }

    static isMonsterDropGroup(mat: Identifiable): mat is MonsterDropGroup {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.MonsterDrop;
    }

    static isAscensionGemGroup(mat: Identifiable): mat is AscensionGemGroup {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.AscensionGem;
    }

    static isAscentionGroup(mat: Identifiable): mat is AscentionMaterialGroup {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.Ascention;
    }

    static isWeeklyBossGroup(mat: Identifiable): mat is WeeklyBossMaterialGroup {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.WeeklyBoss;
    }

    static isExperienceMaterialGroup(mat: Identifiable): mat is ExperienceMaterialGroup {
        return (mat.id & ItemManager.TAG_MASK) == MaterialType.ExperienceGroup;
    }

    static isSimpleMaterialBased(mat: Identifiable): mat is Material {
        return (mat.id & ItemManager.TAG_MASK) <= MaterialType.LocalSpecialty;
    }

    static isGroupBased(mat: Identifiable): mat is BaseGroup {
        return !ItemManager.isSimpleMaterialBased(mat) && (mat.id & ItemManager.TAG_MASK) < MaterialType.WeeklyBoss;
    }
}

export class Manager {
    readonly items: ItemManager;
    readonly elements: VisualItem[];
    readonly weaponTypes: VisualItem[];
    readonly characterAscension: CharacterAscensionRequirement[];
    readonly weaponAscension: WeaponAscensionRequirement[][];
    readonly talentAscension: TalentAscensionRequirement[];
    readonly characters: Character[];
    readonly maxLevelByStars: number[] = [70, 70, 90, 90, 90];
    readonly levelBarriers: number[] = [20, 40, 50, 60, 70, 80];
    readonly weaponAttackScaling: number[][];
    readonly weaponSubScaling: number[][];
    readonly weapons: Weapon[];
    readonly characterExpByLevel: number[];
    readonly weaponExpByLevel: number[][];

    constructor(character: AsyncReturnType<typeof fetchCharacterData>, materials: AsyncReturnType<typeof fetchMaterials>, weapon: AsyncReturnType<typeof fetchWeaponData>, expMaterials: AsyncReturnType<typeof fetchExperienceData>) {
        this.items = new ItemManager(materials, expMaterials, character[0].ascensionCosts[0][0]);
        this.weaponTypes = distinctBy(character, c => c.weapon.description).map(c => c.weapon);
        this.elements = distinctBy(character, c => c.element?.description).map(c => c.element).filter(e => e != null);
        this.characterAscension = character[0].ascensionCosts.map((row): CharacterAscensionRequirement => ({
            mora: row[0].quantity,
            gem: {
                quantity: row[1].quantity,
                tier: this.items.getTierByName(row[1].name),
            },
            localSpecialty: row[2].quantity,
            monsterMaterial: {
                quantity: row[3].quantity,
                tier: this.items.getTierByName(row[3].name),
            },
            bossMaterial: row.length > 4 ? row[4].quantity : undefined,
        }));
        this.weaponAscension = distinctBy(weapon[0], w => w.stars)
            .sort((a, b) => a.stars.localeCompare(b.stars))
            .map(w => w.ascension)
            .map((starRequirements): WeaponAscensionRequirement[] => {
                return starRequirements.map((row): WeaponAscensionRequirement => ({
                    mora: row[0].quantity,
                    weaponMaterial: {
                        quantity: row[1].quantity,
                        tier: this.items.getTierByName(row[1].name),
                    },
                    eliteMaterial: {
                        quantity: row[2].quantity,
                        tier: this.items.getTierByName(row[2].name),
                    },
                    monsterMaterial: {
                        quantity: row[2].quantity,
                        tier: this.items.getTierByName(row[2].name),
                    },
                }));
            });
        this.talentAscension = Array.isArray(character[0].talentCosts)
            && character[0].talentCosts.map((row): TalentAscensionRequirement => ({
                mora: row[0].quantity,
                monsterMaterial: {
                    quantity: row[1].quantity,
                    tier: this.items.getTierByName(row[1].name),
                },
                book: {
                    quantity: row[2].quantity,
                    tier: this.items.getTierByName(row[2].name),
                },
                bossMaterial: row.length > 3 ? row[3].quantity : undefined,
                crown: row.length > 4 ? row[4].quantity : undefined,
            }));
        this.characters = character.map((c): Character => ({
            name: c.name,
            image: c.image,
            stars: parseInt(c.stars.substring(0, 1)),
            region: c.region,
            weapon: this.weaponTypes.findIndex(w => w.description === c.weapon.description),
            element: c.element ? this.elements.findIndex(e => e.description === c.element.description) : undefined,
            ascension: {
                gemGroup: this.items.getGroupIdByName(c.ascensionCosts[0][1].name),
                localSpecialty: this.items.idOf(c.ascensionCosts[0][2].name),
                monsterGroup: this.items.getGroupIdByName(c.ascensionCosts[0][3].name),
                bossMaterial: c.ascensionCosts[1].length > 4 ? this.items.idOf(c.ascensionCosts[1][4].name) : undefined,
            },
            talentAscension: this.resolveTalentAscension(c.talentCosts),
        }));
        this.weaponAttackScaling = Object.keys(weapon[1])
            .map(stars => parseInt(stars.substring(0, 1)))
            .map(s => weapon[1][s])
        this.characterExpByLevel = expMaterials.character.expPerLevel.map(epl => epl.toNext).filter(e => e != null);
        this.weaponExpByLevel = Object.keys(expMaterials.weapon.expPerLevel)
            .map(stars => parseInt(stars.substring(0, 1)))
            .map(s => expMaterials.weapon.expPerLevel[s].map(epl => epl.toNext).filter(e => e != null));
        // this.weapons = weapon[0].map(w => ({
        //     name: w.name,
        //     image: w.image,
        //     passive: w.passive,
        //     stars: parseInt(w.stars.substring(0, 1)),
        //     subStatus: {
        //         attribute: w.sub,
        //         // scaling: //todo,
        //     },
        //     // scaling: //todo,
        //     ascension: {
        //         weaponMaterial: this.items.getGroupIdByName(w.ascension[0][1].name),
        //         eliteMaterial: this.items.getGroupIdByName(w.ascension[0][2].name),
        //         commonMaterial: this.items.getGroupIdByName(w.ascension[0][3].name),
        //     },
        // }));
    }

    resolveTalentAscension(talentCosts: TalentCostType): TalentAscensionMaterials {
        if (Array.isArray(talentCosts)) {
            const last = talentCosts[talentCosts.length - 1];

            return {
                monsterGroup: this.items.getGroupIdByName(last[1].name),
                bookSeries: this.items.getGroupIdByName(last[2].name),
                bossMaterial: this.items.idOf(last[3].name),
            };
        }

        return Object.keys(talentCosts)
            .reduce((cost, element) => {
                if (Array.isArray(talentCosts[element])) {
                    const last = talentCosts[element][(talentCosts[element] as any[]).length - 1];

                    cost[element] = {
                        monsterGroup: this.items.getGroupIdByName(last[1].name),
                        bookSeries: this.items.getGroupIdByName(last[2].name),
                        bossMaterial: this.items.idOf(last[3].name),
                    };
                } else {
                    cost[element] = Object.keys(talentCosts[element])
                        .reduce((acc, hab) => {
                            const costs = talentCosts[element][hab];
                            const last = costs[costs.length - 1];

                            acc[hab] = {
                                monsterGroup: this.items.getGroupIdByName(last[1].name),
                                bookSeries: this.items.getGroupIdByName(last[2].name),
                                bossMaterial: this.items.idOf(last[3].name),
                            };

                            return acc;
                        }, {});
                }

                return cost;
            }, {}) as TravelerTalentAscensionMaterials;
    }
}
