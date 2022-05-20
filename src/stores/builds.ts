import { derived, writable } from "svelte/store"
import { isSimpleTalent } from "../lib/genshinDataTransform";
import { isGroup, isSimpleMaterial } from "../lib/itemId";
import { waitForValue } from "../lib/store";
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
            level: 80,
            cap: 5,
        },
    },
    talents: {
        basic: {
            start: 1,
            end: 6,
        },
        elemental: {
            start: 1,
            end: 6,
        },
        burst: {
            start: 1,
            end: 6,
        },
    }
}

function buildStore() {
    const store = localStorageStore<{ [name: string]: CharacterBuild }>('builds', undefined, (set) => {
        waitForValue(genshinData)
            .then(data => {
                const builds = arrayToObject(
                    data.character.list,
                    (c) => ([c.name, { ...InitialBuild, name: c.name }])
                );

                set(builds);
            });
    });

    return {
        updateBuild: function (build: CharacterBuild): void {
            store.update(builds => void (builds[build.name] = { ...build }) || builds);
        },
        subscribe: store.subscribe,
    }
}

export const builds = buildStore();
export const activeBuild = derived([builds, highlightedCharacter], ([$builds, $highlighted]) => $builds[$highlighted]);
export const totalCost = derived([genshinData, builds, selectedCharacters], ([$genshinData, $builds, $selectedCharacters]) => {
    if (!$genshinData || !$builds || !$selectedCharacters) return undefined;

    return [...$selectedCharacters.values()]
        .map(sc => $builds[sc])
        .reduce((cost, build) => {
            const character = $genshinData.character.list.find(c => c.name === build.name);
            const crown = $genshinData.items.find(i => isSimpleMaterial(i) && i.name === 'Crown of Insight') as Material;

            const exp = sum($genshinData.character.exp.slice(build.level.start.level - 1, build.level.end.level - 1));
            cost.exp += exp;
            cost.mora += Math.ceil(exp / 5);
            $genshinData.character
                .ascension
                .slice(build.level.start.cap, build.level.end.cap + 1)
                .forEach(asc => {
                    calculateAscensionCosts(
                        cost,
                        character.ascension,
                        asc,
                    );
                });
            $genshinData.character
                .talent
                .slice(build.talents.basic.start - 1, build.talents.basic.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        cost,
                        character.talentAscension,
                        asc,
                        crown,
                        build.talents.basic.start + i,
                        'normal attack',
                    );
                });
            $genshinData.character
                .talent
                .slice(build.talents.elemental.start - 1, build.talents.elemental.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        cost,
                        character.talentAscension,
                        asc,
                        crown,
                        build.talents.basic.start + i,
                        'normal attack',
                    );
                });
            $genshinData.character
                .talent
                .slice(build.talents.burst.start - 1, build.talents.burst.end - 1)
                .forEach((asc, i) => {
                    calculateTalentCosts(
                        cost,
                        character.talentAscension,
                        asc,
                        crown,
                        build.talents.basic.start + i,
                        'normal attack',
                    );
                });

            return cost;
        }, {
            exp: 0,
            mora: 0,
            materials: new Map<number, MaterialQuantity<Material>>(),
        });
});

function calculateTalentCosts(
    costs: TotalBuildCost,
    mats: TalentAscensionMaterials<ExpandedPayload>,
    req: TalentAscensionRequirement,
    crown: Material,
    level: number,
    talent: string,
) {
    costs.mora += req.mora;

    if (isSimpleTalent(mats)) {
        addQuantity(costs.materials, mats.monsterGroup.tiers[req.monsterMaterial.tier], req.monsterMaterial.quantity);
        addQuantity(costs.materials, mats.bookSeries.tiers[req.book.tier], req.book.quantity);

        if (req.bossMaterial) {
            addQuantity(costs.materials, mats.bossMaterial!, req.bossMaterial!);
        }

        if (req.crown) {
            addQuantity(costs.materials, crown, req.crown);
        }
    } else {
    }
}

function calculateAscensionCosts(
    costs: TotalBuildCost,
    mats: CharacterAscensionMaterials<ExpandedPayload>,
    req: CharacterAscensionRequirement,
): void {
    costs.mora += req.mora;
    addQuantity(costs.materials, mats.localSpecialty, req.localSpecialty);
    addQuantity(costs.materials, mats.gemGroup.tiers[req.gem.tier], req.gem.quantity);
    addQuantity(costs.materials, mats.monsterGroup.tiers[req.monsterMaterial.tier], req.monsterMaterial.quantity);

    if (req.bossMaterial) {
        addQuantity(costs.materials, mats.bossMaterial!, req.bossMaterial!);
    }
}

function addQuantity(map: Map<number, MaterialQuantity<Material>>, mat: Material, quantity: number) {
    if (map.has(mat.id)) {
        map.get(mat.id).quantity += quantity;
    } else {
        let groupId = undefined;
        if (isGroup(mat)) {
            groupId = mat.id;
        }

        map.set(mat.id, {
            id: mat.id,
            image: mat.image,
            name: mat.name,
            stars: mat.stars,
            groupId,
            quantity
        });
    }
}

