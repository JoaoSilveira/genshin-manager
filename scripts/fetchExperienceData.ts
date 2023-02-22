import { extractMaterial, extractMaterialAndQuantity, fetchPage, firstHtmlChild, getImageUrl, htmlChildren, Material, MaterialWithQuantity, nthHtmlChild, parseIntWithCommas, traverseElement } from './util';
import { urls } from './compile_data';
import type { HTMLElement } from 'node-html-parser';

export type ExperienceInfo = {
    character: CharacterExperience,
    weapon: WeaponExperience,
};

declare type LevelExperience = {
    level: number,
    toNext: number,
};

export async function fetchExperienceData(): Promise<ExperienceInfo> {
    const [characterExp, weaponExp] = await Promise.all([
        fetchCharacterExperienceData(),
        fetchWeaponExperienceData(),
    ]);

    return {
        character: characterExp,
        weapon: weaponExp,
    };
}

type CharacterExperience = {
    expPerLevel: LevelExperience[],
    expItems: MaterialWithQuantity[],
};

async function fetchCharacterExperienceData(): Promise<CharacterExperience> {
    const doc = await fetchPage(urls.character_exp);

    return {
        expPerLevel: extractCharacterExpPerLevel(doc),
        expItems: extractCharacterExpItems(doc),
    };
}

function extractCharacterExpPerLevel(doc: HTMLElement): LevelExperience[] {
    try {
        const tableList = traverseElement(doc.querySelector('#EXP_Per_Level'), '^>v');
        const data: LevelExperience[] = [];

        for (const li of htmlChildren(tableList)) {
            let row = traverseElement(li, '$vv>');

            while (row != null) {
                data.push({
                    level: parseIntWithCommas(firstHtmlChild(row).textContent),
                    toNext: parseIntWithCommas(nthHtmlChild(row, 1).textContent),
                });

                row = row.nextElementSibling;
            }
        }

        return data;
    } catch (err) {
        throw new Error(`extractCharacterExpPerLevel: ${err}`);
    }
}

function extractCharacterExpItems(doc: HTMLElement): MaterialWithQuantity[] {
    try {
        const handle = traverseElement(doc.querySelector('#Leveling_Characters'), '^>>vv>v>');

        // hardcoding quantity because I didn't find an easy way to get the values
        return [
            { ...extractMaterial(traverseElement(handle, 'vv')), quantity: 20000 },
            { ...extractMaterial(traverseElement(handle, 'v>>v')), quantity: 5000 },
            { ...extractMaterial(traverseElement(handle, '$<v')), quantity: 1000 },
        ];
    } catch (err) {
        throw new Error(`extractCharacterExpItems: ${err}`);
    }
}

type WeaponExperience = {
    expPerLevel: { [stars: string]: LevelExperience[] },
    expItems: MaterialWithQuantity[],
};

async function fetchWeaponExperienceData(): Promise<WeaponExperience> {
    const doc = await fetchPage(urls.weapon_exp);

    return {
        expPerLevel: extractWeaponExpPerLevel(doc),
        expItems: extractWeaponExpItems(doc),
    };
}

function extractWeaponExpItems(doc: HTMLElement): MaterialWithQuantity[] {
    try {
        let handle = traverseElement(doc.querySelector('#Weapon_Enhancement_Material'), '^>>');
        const items: MaterialWithQuantity[] = [];

        for (let i = 0; i < 3; i++) {
            items.push(extractMaterialAndQuantity(firstHtmlChild(handle), txt => txt.substring(0, txt.length - 3)));

            handle = traverseElement(handle, '>>');
        }

        return items;
    } catch (err) {
        throw new Error(`extractWeaponExpItems: ${err}`);
    }
}

function extractWeaponExpPerLevel(doc: HTMLElement): WeaponExperience['expPerLevel'] {
    try {
        let handle = traverseElement(doc.querySelector('#Weapon_EXP_Chart'), '^>>v>');
        const data: WeaponExperience['expPerLevel'] = {};

        while (handle) {
            const stars = traverseElement(handle, 'v>v').textContent.trim();
            let tr = traverseElement(handle, 'v>>>vv>');

            data[stars] = [];

            while (tr) {
                const children = [...htmlChildren(tr)];

                for (let i = 0; i < children.length; i += 3) {
                    data[stars].push({
                        level: parseInt(children[i].textContent),
                        toNext: parseIntWithCommas(children[i + 1].textContent),
                    });
                }

                tr = tr.nextElementSibling;
            }

            data[stars].sort((a, b) => a.level - b.level);

            handle = handle.nextElementSibling;
        }

        return data;
    } catch (err) {
        throw new Error(`extractWeaponExpPerLevel: ${err}`);
    }
}