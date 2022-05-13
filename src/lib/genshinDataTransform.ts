import { indexOf, isGroup, isWeeklyBossGroup } from "./itemId";

export default function genshinDataTransform(pristine: GenshinDataPristine): GenshinDataExpanded {
    const items = transformItems(pristine.items);

    return {
        levelBarriers: pristine.levelBarriers,
        items,
        elements: pristine.elements,
        character: {
            ascension: pristine.character.ascension,
            talent: pristine.character.talent,
            exp: pristine.character.exp,
            list: transformCharacters(pristine, items),
        },
        weapon: {
            exp: pristine.weapon.exp,
            levelCap: pristine.weapon.levelCap,
            types: pristine.weapon.types,
            statuses: pristine.weapon.statuses,
            ascension: pristine.weapon.ascension,
            list: transformWeapons(pristine.weapon.list, pristine.items, pristine.weapon.statuses),
        },
    };
}

function transformItems(items: Identifiable[]): Identifiable[] {
    return items.map((it) => {
        if (isGroup<PristinePayload>(it)) {
            return {
                ...it,
                tiers: {
                    low: items[indexOf(it.tiers.low)],
                    medium: items[indexOf(it.tiers.medium)],
                    high: items[indexOf(it.tiers.high)],
                    highest: it.tiers.highest != null ? items[indexOf(it.tiers.highest)] : undefined,
                }
            } as Expanded<typeof it>;
        }

        if (isWeeklyBossGroup<PristinePayload>(it)) {
            return {
                ...it,
                materials: it.materials.map(id => items[indexOf(id)]),
            } as Expanded<typeof it>;
        }

        return it;
    });
}

function transformCharacters(pristine: GenshinDataPristine, items: Identifiable[]): Character<ExpandedPayload>[] {
    return pristine.character.list.map((c) => ({
        name: c.name,
        image: c.image,
        stars: c.stars,
        region: c.region,
        weapon: pristine.weapon.types[c.weapon],
        element: c.element != null ? pristine.elements[c.element] : undefined,
        ascension: {
            gemGroup: items[indexOf(c.ascension.gemGroup)] as AscensionGemGroup<ExpandedPayload>,
            localSpecialty: items[indexOf(c.ascension.localSpecialty)] as LocalSpecialty,
            monsterGroup: items[indexOf(c.ascension.monsterGroup)] as MonsterDropGroup<ExpandedPayload>,
            bossMaterial: c.ascension.bossMaterial != null ? items[indexOf(c.ascension.bossMaterial)] as Material : undefined,
        },
        talentAscension: transformTalent(c.talentAscension, items),
    }));
}

function transformTalent(talent: TalentAscensionMaterials<PristinePayload>, items: Identifiable[]): TalentAscensionMaterials<ExpandedPayload> {
    if (isSimpleTalent(talent)) {
        return {
            bookSeries: items[talent.bookSeries] as AscentionMaterialGroup<ExpandedPayload>,
            monsterGroup: items[talent.monsterGroup] as MonsterDropGroup<ExpandedPayload>,
            bossMaterial: items[talent.bossMaterial] as Material,
        }
    }

    const talents: Partial<TravelerTalentAscensionMaterials<ExpandedPayload>> = {};
    for (const element in talent) {
        const t = talent[element];

        if (Array.isArray(t)) {
            talents[element] = t.map(req => ({
                book: items[indexOf(req.book)] as Material,
                monster: items[indexOf(req.monster)] as Material,
                boss: req.boss != null ? items[indexOf(req.boss)] as Material : undefined,
                crown: req.crown != null ? items[indexOf(req.crown)] as Material : undefined,
            }));
        } else {
            talents[element] = {};
            for (const ability in t) {
                talents[element][ability] = t[ability].map(req => ({
                    book: items[indexOf(req.book)] as Material,
                    monster: items[indexOf(req.monster)] as Material,
                    boss: req.boss != null ? items[indexOf(req.boss)] as Material : undefined,
                    crown: req.crown != null ? items[indexOf(req.crown)] as Material : undefined,
                }));
            }
        }
    }
}

function isSimpleTalent<TPayload>(talent: TalentAscensionMaterials<unknown>): talent is CommonTalentAscensionMaterials<TPayload> {
    return 'monsterGroup' in talent;
}

function transformWeapons(weapons: Weapon<PristinePayload>[], items: Identifiable[], scaling: WeaponStatuses): Weapon<ExpandedPayload>[] {
    return weapons.map(w => ({
        name: w.name,
        image: w.image,
        stars: w.stars,
        passive: w.passive,
        subStatus: w.subStatus == null ? undefined : {
            attribute: w.subStatus.attribute,
            scaling: scaling.sub[w.subStatus.scaling],
        },
        scaling: joinWeaponScaling(scaling.attackBefore[w.scaling], scaling.attackAfter[w.scaling]),
        ascension: {
            commonMaterial: items[indexOf(w.ascension.commonMaterial)] as MonsterDropGroup<ExpandedPayload>,
            eliteMaterial: items[indexOf(w.ascension.eliteMaterial)] as MonsterDropGroup<ExpandedPayload>,
            weaponMaterial: items[indexOf(w.ascension.weaponMaterial)] as AscentionMaterialGroup<ExpandedPayload>,
        },
    }));
}

function joinWeaponScaling(before: number[], after: number[]): number[] {
    const values = [before[0]];

    for (let i = 0; i < after.length; i++) {
        values.push(before[i + 1], after[i]);
    }
    values.push(before[before.length - 1]);

    return values;
}