import { fetchPage, firstHtmlChild, getImageUrl, htmlChildren, nthHtmlChild, parseIntWithCommas, traverseElement } from './util';
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
    expItems: ImageWithDescriptionAndValue[],
};

async function fetchCharacterExperienceData(): Promise<CharacterExperience> {
    const doc = await fetchPage(urls.character_exp);

    return {
        expPerLevel: extractCharacterExpPerLevel(doc),
        expItems: extractCharacterExpItems(doc),
    };
}

function extractCharacterExpPerLevel(doc: HTMLElement): LevelExperience[] {
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
}

function extractCharacterExpItems(doc: HTMLElement): ImageWithDescriptionAndValue[] {
    const handle = traverseElement(doc.querySelector('#Leveling_Characters'), '^>>vv>v>');

    return [
        {
            description: "Wanderer's Advice",
            image: getImageUrl(traverseElement(handle, 'v>>>>vvvv')),
            quantity: 1000,
        },
        {
            description: "Item Adventurer's Experience",
            image: getImageUrl(traverseElement(handle, 'v>>vvvv')),
            quantity: 5000,
        },
        {
            description: "Hero's Wit",
            image: getImageUrl(traverseElement(handle, 'vvvvv')),
            quantity: 20000,
        },
    ];
}

type WeaponExperience = {
    expPerLevel: { [stars: string]: LevelExperience[] },
    expItems: ImageWithDescriptionAndValue[],
};

async function fetchWeaponExperienceData(): Promise<WeaponExperience> {
    const doc = await fetchPage(urls.weapon_exp);

    return {
        expPerLevel: extractWeaponExpPerLevel(doc),
        expItems: extractWeaponExpItems(doc),
    };
}

function extractWeaponExpItems(doc: HTMLElement): ImageWithDescriptionAndValue[] {
    let handle = traverseElement(doc.querySelector('#Weapon_Enhancement_Material'), '^>>');
    const items: ImageWithDescriptionAndValue[] = [];

    for (let i = 0; i < 3; i++) {
        const link = traverseElement(handle, 'vvv');
        const exp = traverseElement(handle, 'vv>v').textContent.trim();

        items.push({
            description: link.attributes['title'],
            image: getImageUrl(firstHtmlChild(link)),
            quantity: parseIntWithCommas(exp.substring(0, exp.length - 3)),
        });

        handle = traverseElement(handle, '>>');
    }

    return items;
}

function extractWeaponExpPerLevel(doc: HTMLElement): WeaponExperience['expPerLevel'] {
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
}
