import { derived } from "svelte/store"
import { isSimpleTalent } from "../lib/genshinDataTransform";
import { isSimpleMaterial } from "../lib/itemId";
import { arrayToObject, sum } from "../lib/util";
import { highlightedCharacter, selectedCharacters } from "./character";
import genshinData from "./genshinData";
import localStorageStore from "./localStorageStore";

const InitialBuild: Omit<CharacterBuild, 'name'> = {
    level: {
        start: {
            level: 1,
            cap: 0,
        },
        end: {
            level: 90,
            cap: 5,
        },
    },
    talents: {
        basic: {
            start: 1,
            end: 9,
        },
        elemental: {
            start: 1,
            end: 9,
        },
        burst: {
            start: 1,
            end: 9,
        },
    }
};

const initialBuilds = arrayToObject(
    genshinData.character.list,
    (c) => ([c.name, { ...InitialBuild, name: c.name }])
);

function buildStore() {
    const store = localStorageStore<{ [name: string]: CharacterBuild }>('builds', initialBuilds);

    return {
        updateBuild: function (build: CharacterBuild): void {
            store.update(builds => void (builds[build.name] = build) || { ...builds });
        },
        subscribe: store.subscribe,
    }
}

export const builds = buildStore();
export const activeBuild = derived([builds, highlightedCharacter], ([$builds, $highlighted]) => {
    if ($builds[$highlighted] == null) {
        const newBuild = { name: $highlighted, ...InitialBuild };
        builds.updateBuild(newBuild);

        return newBuild;
    }
    return $builds[$highlighted];
});
export const totalCost = derived([builds, selectedCharacters], ([$builds, $selectedCharacters]): TotalBuildCost => {
    if (!genshinData || !$builds || !$selectedCharacters) return undefined;

    const crown = genshinData.items.find(i => isSimpleMaterial(i) && i.name === 'Crown of Insight') as Material;
    const costs = {
        mora: 0,
        exp: 0,
        crown: { ...crown, quantity: 0 },
        localSpecialtyMap: new Map<number, MaterialQuantity<LocalSpecialty>>(),
        gemsMap: new Map<number, TieredMaterialCost>(),
        booksMap: new Map<number, TieredMaterialCost>(),
        mobMaterialsMap: new Map<number, TieredMaterialCost>(),
        eliteMaterialsMap: new Map<number, TieredMaterialCost>(),
        ascensionBossMaterialsMap: new Map<number, MaterialQuantity<Material>>(),
        talentBossMaterialsMap: new Map<number, MaterialQuantity<Material>>(),
    };

    [...$selectedCharacters.values()]
        .map(sc => $builds[sc])
        .filter(b => b != null)
        .forEach(build => {
            const character = genshinData.character.list.find(c => c.name === build.name);
            if (character == null) {
                console.warn(`build for ${build.name} not found`);
                return;
            }

            const exp = sum(genshinData.character.exp.slice(build.level.start.level - 1, build.level.end.level - 1));
            costs.exp += exp;
            costs.mora += Math.ceil(exp / 5);

            console.log(build.name, build.talents.basic, genshinData.character.talent)

            genshinData.character
                .ascension
                .slice(build.level.start.cap, build.level.end.cap)
                .forEach(asc => {
                    calculateAscensionCosts(
                        costs,
                        character.ascension,
                        asc,
                    );
                });
            genshinData.character
                .talent
                .slice(build.talents.basic.start - 1, build.talents.basic.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        costs,
                        character.talentAscension,
                        asc,
                        build.talents.basic.start + i,
                        'normal attack',
                    );
                });
            genshinData.character
                .talent
                .slice(build.talents.elemental.start - 1, build.talents.elemental.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        costs,
                        character.talentAscension,
                        asc,
                        build.talents.basic.start + i,
                        'elemental skill',
                    );
                });
            genshinData.character
                .talent
                .slice(build.talents.burst.start - 1, build.talents.burst.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        costs,
                        character.talentAscension,
                        asc,
                        build.talents.basic.start + i,
                        'burst',
                    );
                });
        });

    return {
        mora: costs.mora,
        exp: costs.exp,
        crown: costs.crown,
        localSpecialties: [...costs.localSpecialtyMap.values()],
        gems: [...costs.gemsMap.values()],
        books: [...costs.booksMap.values()],
        mobMaterials: [...costs.mobMaterialsMap.values()],
        eliteMaterials: [...costs.eliteMaterialsMap.values()],
        ascensionBossMaterials: [...costs.ascensionBossMaterialsMap.values()],
        talentBossMaterials: [...costs.talentBossMaterialsMap.values()],
    };
});

type TotalBuildCostReducer = {
    mora: number,
    exp: number,
    crown: MaterialQuantity<Material>,
    localSpecialtyMap: Map<number, MaterialQuantity<LocalSpecialty>>,
    gemsMap: Map<number, TieredMaterialCost>,
    booksMap: Map<number, TieredMaterialCost>,
    mobMaterialsMap: Map<number, TieredMaterialCost>,
    eliteMaterialsMap: Map<number, TieredMaterialCost>,
    ascensionBossMaterialsMap: Map<number, MaterialQuantity<Material>>,
    talentBossMaterialsMap: Map<number, MaterialQuantity<Material>>,
}

function calculateTalentCosts(
    costs: TotalBuildCostReducer,
    mats: TalentAscensionMaterials<ExpandedPayload>,
    req: TalentAscensionRequirement,
    level: number,
    talent: string,
) {
    costs.mora += req.mora;

    if (isSimpleTalent(mats)) {
        costs.crown.quantity += req.crown ?? 0;
        addTieredMaterialQuantity(costs.mobMaterialsMap, mats.monsterGroup, req.monsterMaterial);
        addTieredMaterialQuantity(costs.booksMap, mats.bookSeries, req.book);

        if (req.bossMaterial) {
            addMaterialQuantity(costs.talentBossMaterialsMap, mats.bossMaterial!, req.bossMaterial!);
        }

        return;
    }
}

function calculateAscensionCosts(
    costs: TotalBuildCostReducer,
    mats: CharacterAscensionMaterials<ExpandedPayload>,
    req: CharacterAscensionRequirement,
): void {
    costs.mora += req.mora;
    addMaterialQuantity(costs.localSpecialtyMap, mats.localSpecialty, req.localSpecialty);
    addTieredMaterialQuantity(costs.gemsMap, mats.gemGroup, req.gem);
    addTieredMaterialQuantity(costs.mobMaterialsMap, mats.monsterGroup, req.monsterMaterial);

    if (req.bossMaterial) {
        addMaterialQuantity(costs.ascensionBossMaterialsMap, mats.bossMaterial!, req.bossMaterial!);
    }
}

function addMaterialQuantity<TMat extends Material>(map: Map<number, MaterialQuantity<TMat>>, mat: TMat, quantity: number) {
    if (map.has(mat.id)) {
        map.get(mat.id).quantity += quantity;
        return;
    }

    map.set(mat.id, {
        ...mat,
        quantity
    });
}

function addTieredMaterialQuantity(map: Map<number, TieredMaterialCost>, group: BaseGroup<ExpandedPayload, Material>, req: TieredRequirement) {
    if (map.has(group.id)) {
        map.get(group.id).tiers[req.tier].quantity += req.quantity;
        return;
    }

    map.set(group.id, {
        id: group.id,
        group: group.group,
        tiers: {
            low: {
                ...group.tiers.low,
                quantity: req.tier === 'low' ? req.quantity : 0,
            },
            medium: {
                ...group.tiers.medium,
                quantity: req.tier === 'medium' ? req.quantity : 0,
            },
            high: {
                ...group.tiers.high,
                quantity: req.tier === 'high' ? req.quantity : 0,
            },
            highest: group.tiers.highest ? {
                ...group.tiers.highest,
                quantity: req.tier === 'highest' ? req.quantity : 0,
            } : undefined,
        },
    });
}
