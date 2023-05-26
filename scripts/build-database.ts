export { };

const current_db = await Bun.file('../static/genshin_data.json').json();

const database: BuildDatabase.Database = {
    level_barriers: current_db.levelBarriers,
    elements: current_db.elements.map((e: any): BuildDatabase.ElementItem => ({
        key: e.description.toLowerCase() as BuildDatabase.ElementType,
        name: e.description,
        image_url: e.image,
    })),
    mora: transformItem(current_db.items.find(i => i.id === 0)),
    crown: transformItem(current_db.items.find(i => i.id === 1680)),
    ascension_gems: current_db.items
        .filter(i => (i.id & 7) === 4)
        .map(i => transformItem(i)),
    local_specialty: current_db.items
        .filter(i => (i.id & 7) === 2)
        .map(i => transformItem(i)),
    talent_books: current_db.items
        .filter(i => (i.id & 7) === 5 && !i.tiers.highest)
        .map(i => transformItem(i)),
    weapon_material: current_db.items
        .filter(i => (i.id & 7) === 5 && !!i.tiers.highest)
        .map(i => transformItem(i)),
    character_exp_material: transformItem(current_db.items.find(i => i.id === 38)),
    weapon_exp_material: transformItem(current_db.items.find(i => i.id === 70)),
    weekly_boss_drops: current_db.items
        .filter(i => (i.id & 7) === 7)
        .map(i => transformItem(i)),
    monster_drops: current_db.items
        .filter(i => (i.id & 7) === 3)
        .map(i => transformItem(i))
        .filter(i => i.tiers.low.stars === 1),
    elite_drops: current_db.items
        .filter(i => (i.id & 7) === 3)
        .map(i => transformItem(i))
        .filter(i => i.tiers.low.stars === 2),
    boss_drops: current_db.items
        .filter(i => (i.id & 7) === 0 && i.stars === 4 && itemNotInGroup(i))
        .map(i => transformItem(i)),
    character: {
        experience_requirements: current_db.character.exp,
        ascension_requirements: current_db.character.ascension
            .map((i: any): BuildDatabase.CharacterAscensionRequirement => ({
                mora: i.mora,
                gem: i.gem,
                local_specialty: i.localSpecialty,
                monster: i.monsterMaterial,
                boss: i.bossMaterial,
            })),
        talent_requirements: current_db.character.talent
            .map((i: any): BuildDatabase.CharacterTalentRequirement => ({
                mora: i.mora,
                monster: i.monsterMaterial,
                book: i.book,
                boss: i.bossMaterial,
                crown: i.crown,
            })),
        list: current_db.character.list.map((w: any): BuildDatabase.CharacterBase => {
            if (w.name === 'Traveler') {
                return ({
                    name: w.name,
                    image_url: w.image,
                    stars: w.stars,
                    local_specialty: nameToKey(current_db.items.find(i => i.id === w.ascension.localSpecialty).name),
                    gem: nameToKey(current_db.items.find(i => i.id === w.ascension.gemGroup).group),
                    monster: nameToKey(current_db.items.find(i => i.id === w.ascension.monsterGroup).group),
                    weapon: current_db.weapon.types[w.weapon].description.toLowerCase(),
                    talent_material: (() => {
                        const talents = {};

                        for (const key in w.talentAscension) {
                            const element = key.toLowerCase();
                            if (element === 'unaligned') continue;

                            if (Array.isArray(w.talentAscension[key])) {
                                talents[element] = w.talentAscension[key].map(line => ({
                                    monster: nameToKey(current_db.items.find(i => i.id === line.monster).name),
                                    book: nameToKey(current_db.items.find(i => i.id === line.book).name),
                                    boss: !!line.boss ? nameToKey(current_db.items.find(i => i.id === line.boss).name) : undefined,
                                }));
                            }
                        }

                        return talents;
                    })(),
                }) as BuildDatabase.Traveler;
            }

            return ({
                name: w.name,
                image_url: w.image,
                stars: w.stars,
                element: current_db.elements[w.element].description.toLowerCase(),
                weapon: current_db.weapon.types[w.weapon].description.toLowerCase(),
                local_specialty: nameToKey(current_db.items.find(i => i.id === w.ascension.localSpecialty).name),
                gem: nameToKey(current_db.items.find(i => i.id === w.ascension.gemGroup).group),
                monster: nameToKey(current_db.items.find(i => i.id === w.ascension.monsterGroup).group),
                region: w.region,
                talent_book: nameToKey(current_db.items.find(i => i.id === w.talentAscension.bookSeries).group),
                talent_boss: nameToKey(current_db.items.find(i => i.id === w.talentAscension.bossMaterial).name),
                ascension_boss: nameToKey(current_db.items.find(i => i.id === w.ascension.bossMaterial).name),
            }) as BuildDatabase.Character;
        }),
    },
    weapon: {
        types: current_db.weapon.types.map((i: any): BuildDatabase.WeaponTypeItem => ({
            key: i.description.toLowerCase(),
            name: i.description,
            image_url: i.image,
        })),
        experience_requirements: current_db.weapon.exp,
        ascension_requirements: current_db.weapon.ascension
            .map((line: any): BuildDatabase.WeaponAscensionRequirement[] => line.map(i => ({
                mora: i.mora,
                weapon_material: i.weaponMaterial,
                elite: i.eliteMaterial,
                monster: i.monsterMaterial,
            }))),
        list: current_db.weapon.list.map((w: any): BuildDatabase.Weapon => ({
            name: w.name,
            image_url: w.image,
            max_level: current_db.weapon.levelCap[w.stars - 1],
            stars: w.stars,
            scaling: ((): number[][] => {
                const before = current_db.weapon.statuses.attackBefore[w.scaling];
                const after = current_db.weapon.statuses.attackAfter[w.scaling];

                let index = 0;
                const values = [[before[0], before[1]]];
                for (index = 0; index < after.length; index++) {
                    values.push([after[index], before[index + 2]]);
                }

                return values;
            })(),
            type: 'sword',
            passive: w.passive,
            subStatus: (() => {
                if (!w.subStatus) return undefined;

                return {
                    absolute: w.subStatus.scaling >= current_db.weapon.statuses.subAbsOffset,
                    attribute: w.subStatus.attribute,
                    scaling: current_db.weapon.statuses.sub[w.subStatus.scaling]
                };
            })(),
            ascension: {
                weapon_material: current_db.items.find(i => i.id === w.ascension.weaponMaterial).group.toLowerCase().replaceAll(/[^\w\d]/g, '_'),
                elite: current_db.items.find(i => i.id === w.ascension.eliteMaterial).group.toLowerCase().replaceAll(/[^\w\d]/g, '_'),
                monster: current_db.items.find(i => i.id === w.ascension.commonMaterial).group.toLowerCase().replaceAll(/[^\w\d]/g, '_'),
            },
        })),
    },
};

await Bun.write('../static/genshin_data2.json', JSON.stringify(database, null, 4));

function nameToKey(name: string): string {
    return name.toLowerCase().replaceAll(/[^\w\d]/g, '_');
}

function itemNotInGroup(item: any): boolean {
    return current_db.items.every(i => {
        if ('tiers' in i) {
            return i.tiers.low !== item.id &&
                i.tiers.medium !== item.id &&
                i.tiers.high !== item.id &&
                i.tiers.highest !== item.id;
        }

        return true;
    });
}

function transformItem(item: any): any {
    switch (item.id & 7) {
        case 0: // simple
            return {
                key: nameToKey(item.name),
                name: item.name,
                image_url: item.image,
                stars: item.stars,
            } as BuildDatabase.Item;
        case 1: // experience
            return {
                key: nameToKey(item.name),
                name: item.name,
                image_url: item.image,
                stars: item.stars,
                experience: item.experience,
            } as BuildDatabase.ExperienceItem;
        case 2: // local specialty
            return {
                key: nameToKey(item.name),
                name: item.name,
                image_url: item.image,
                stars: item.stars,
                region: item.region.toLowerCase(),
            } as BuildDatabase.LocalSpecialty;
        case 3: // monster group drop
            return {
                key: nameToKey(item.group),
                name: item.group,
                enemies: item.enemies,
                tiers: {
                    low: transformItem(current_db.items.find((i: any) => i.id === item.tiers.low)),
                    medium: transformItem(current_db.items.find((i: any) => i.id === item.tiers.medium)),
                    high: transformItem(current_db.items.find((i: any) => i.id === item.tiers.high)),
                },
            } as BuildDatabase.EnemyDropGroup;
        case 4: // gem group
            return {
                key: nameToKey(item.group),
                name: item.group,
                element: item.element !== 'Traveler' ? item.element.toLowerCase() : undefined,
                tiers: {
                    low: transformItem(current_db.items.find((i: any) => i.id === item.tiers.low)),
                    medium: transformItem(current_db.items.find((i: any) => i.id === item.tiers.medium)),
                    high: transformItem(current_db.items.find((i: any) => i.id === item.tiers.high)),
                    highest: transformItem(current_db.items.find((i: any) => i.id === item.tiers.highest)),
                },
            } as BuildDatabase.GemGroup;
        case 5: // ascension
            return {
                key: nameToKey(item.group),
                name: item.group,
                days: item.days.toLowerCase().split('/'),
                temple: item.temple,
                region: item.region,
                tiers: {
                    low: transformItem(current_db.items.find((i: any) => i.id === item.tiers.low)),
                    medium: transformItem(current_db.items.find((i: any) => i.id === item.tiers.medium)),
                    high: transformItem(current_db.items.find((i: any) => i.id === item.tiers.high)),
                    highest: item.tiers.highest ? transformItem(current_db.items.find((i: any) => i.id === item.tiers.highest)) : undefined,
                }
            } as BuildDatabase.TalentBookGroup;
        case 6: // experience group
            return {
                key: nameToKey(item.group),
                name: item.group,
                exp_to_mora_rate: item.expToMoraRate,
                tiers: {
                    low: transformItem(current_db.items.find((i: any) => i.id === item.tiers.low)),
                    medium: transformItem(current_db.items.find((i: any) => i.id === item.tiers.medium)),
                    high: transformItem(current_db.items.find((i: any) => i.id === item.tiers.high)),
                }
            } as BuildDatabase.ExperienceGroup;
        case 7: // weekly boss
            return {
                key: nameToKey(item.name),
                name: item.name,
                image_url: item.image,
                materials: item.materials.map((id: any) => transformItem(current_db.items.find((i: any) => i.id === id))),
            } as BuildDatabase.WeeklyBossGroup;
    }
}