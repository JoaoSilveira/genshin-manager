import { urls } from "./compile_data";
import type { HTMLElement } from 'node-html-parser';
import { extractMaterial, fetchPage, firstHtmlChild, getImageUrl, getTextWithBr, htmlChildren, lastHtmlChild, Material, sanitizeName, traverseElement } from "./util";

type LocalSpecialty = Material & {
    region: string,
};

type MaterialGroup = {
    group: string,
    materials: Material[],
    enemies: string[],
};

type GemGroup = {
    group: string,
    element: {
        name: string,
        image: string,
    },
    materials: Material[],
};

type AscensionMaterialGroup = {
    series: string,
    books: Material[],
    days: string,
    region: string,
    temple: string,
};

type WeeklyBossMaterial = {
    name: string,
    image: string,
    materials: Material[],
};

type WeaponAscensionMaterialGroup = {
    materials: Material[],
    days: string,
    region: string,
    temple: string,
};

type MaterialsType = {
    common: CommonMaterials;
    character: CharacterAscensionMaterials;
    talent: TalentAscensionMaterials;
    weapon: WeaponAscensionMaterialGroup[];
};

export async function fetchMaterials(): Promise<MaterialsType> {
    const [common, character, talent, weapon] = await Promise.all([
        fetchCommonMaterials(),
        fetchCharacterAscensionMaterials(),
        fetchTalentAscensionMaterial(),
        fetchWeaponAscensionMaterials(),
    ]);

    return { common, character, talent, weapon };
}

type CommonMaterials = {
    common: MaterialGroup[];
    elite: MaterialGroup[];
};

async function fetchCommonMaterials(): Promise<CommonMaterials> {
    try {
        const doc = await fetchPage(urls.common_ascension_materials);

        return {
            common: extractCommonEnemyGroup(doc),
            elite: extractEliteEnemyGroup(doc),
        };
    } catch (err) {
        throw new Error(`fetchCommonMaterials: ${err}`);
    }
}

function extractCommonEnemyGroup(doc: HTMLElement): MaterialGroup[] {
    let handle = traverseElement(doc.querySelector('#General_Enemy_Drops'), '^>>>vv>');
    const data: MaterialGroup[] = [];

    while (handle) {
        const groupName = sanitizeName(traverseElement(handle, 'vv'));
        const enemies = [...htmlChildren(traverseElement(handle, '$v'))].map(el => sanitizeName(el));
        const materials: Material[] = [];

        let matHandle = traverseElement(handle, 'v>v');
        while (matHandle != null) {
            materials.push(extractMaterial(firstHtmlChild(matHandle)));

            matHandle = matHandle.nextElementSibling?.nextElementSibling;
        }

        data.push({
            group: groupName,
            materials,
            enemies,
        })

        handle = handle.nextElementSibling?.nextElementSibling;
    }

    return data;
}

function extractEliteEnemyGroup(doc: HTMLElement): MaterialGroup[] {
    const target = doc.querySelector('#Elite_Enemy_Drops');
    return [...htmlChildren(traverseElement(target, '^>>v'))]
        .slice(1)
        .map((handle): MaterialGroup => {
            const groupName = sanitizeName(traverseElement(handle, 'vv'));
            const enemies = [...htmlChildren(traverseElement(handle, '$v'))].map(el => sanitizeName(el));
            const materials: Material[] = [];

            let matHandle = traverseElement(handle, 'v>v');
            while (matHandle != null) {
                materials.push(extractMaterial(firstHtmlChild(matHandle)));

                matHandle = matHandle.nextElementSibling?.nextElementSibling;
            }

            return {
                group: groupName,
                materials,
                enemies,
            };
        });
}

type CharacterAscensionMaterials = {
    gems: GemGroup[];
    normalBoss: Material[];
    localSpecialty: LocalSpecialty[];
};

async function fetchCharacterAscensionMaterials(): Promise<CharacterAscensionMaterials> {
    try {
        const doc = await fetchPage(urls.character_ascension_meterials);

        return {
            gems: extractGems(doc),
            normalBoss: extractNormalBoss(doc),
            localSpecialty: extractLocalSpecialty(doc),
        };
    } catch (err) {
        throw new Error(`fetchCharacterAscensionMaterials: ${err}`);
    }
}

function extractGems(doc: HTMLElement): GemGroup[] {
    const target = doc.querySelector('#Ascension_Gems');
    return [...htmlChildren(traverseElement(target, '^>>>v'))]
        .slice(1)
        .map((handle): GemGroup => {
            const groupName = sanitizeName(lastHtmlChild(handle));
            const img = traverseElement(handle, '$vvv');
            const materials: Material[] = [];

            let matHandle = traverseElement(handle, 'vv>>');
            while (matHandle != null) {
                materials.push(extractMaterial(matHandle));

                matHandle = matHandle.nextElementSibling?.nextElementSibling;
            }

            return {
                group: groupName,
                element: {
                    name: img.attributes['alt'],
                    image: getImageUrl(img.tagName === 'IMG' ? img : firstHtmlChild(img)),
                },
                materials,
            };
        });
}

function extractNormalBoss(doc: HTMLElement): Material[] {
    const target = doc.querySelector('#Normal_Boss_Drops');
    return [...htmlChildren(traverseElement(target, '^>>v'))]
        .slice(1)
        .map((handle) => extractMaterial(traverseElement(handle, 'vvv')));
}

function extractLocalSpecialty(doc: HTMLElement): LocalSpecialty[] {
    const target = doc.querySelector('#Local_Specialities');
    const materials = [];

    let region = traverseElement(target, '^>>>');
    while (region != null) {
        const regionName = sanitizeName(region);

        let material = traverseElement(region, '>vv>');
        while (material != null) {
            materials.push({
                ...extractMaterial(traverseElement(material, 'vvv')),
                region: regionName,
            });

            material = material.nextElementSibling;
        }

        region = region.nextElementSibling;
    }

    return materials;
}

type TalentAscensionMaterials = {
    books: AscensionMaterialGroup[];
    bossMaterial: WeeklyBossMaterial[];
    crown: Material;
};

async function fetchTalentAscensionMaterial(): Promise<TalentAscensionMaterials> {
    try {
        const doc = await fetchPage(urls.talent_materials);

        return {
            books: extractTalentBooks(doc),
            bossMaterial: extractTalentBossMaterial(doc),
            crown: extractCrown(doc),
        };
    } catch (err) {
        throw new Error(`fetchTalentAscensionMaterial: ${err}`);
    }
}

function extractTalentBooks(doc: HTMLElement): AscensionMaterialGroup[] {
    const regions = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru'];

    return regions.flatMap(region => {
        const target = doc.querySelector(`#${region}`);
        const children = [...htmlChildren(traverseElement(target, '^>>v'))];
        const temple = traverseElement(target, '^>v').attributes['title'];

        return children.slice(1, children.length - 1)
            .map((handle): AscensionMaterialGroup => {
                const days = `${firstHtmlChild(handle).textContent.trim()}/Sunday`;
                const series = traverseElement(handle, 'v>v').attributes['title'];
                const books: Material[] = [];

                let matHandle = traverseElement(handle, 'v>v>>');
                while (matHandle != null) {
                    books.push(extractMaterial(firstHtmlChild(matHandle)))

                    matHandle = matHandle.nextElementSibling?.nextElementSibling;
                }

                return {
                    series,
                    books,
                    days,
                    region,
                    temple,
                };
            });
    });
}

function extractTalentBossMaterial(doc: HTMLElement): WeeklyBossMaterial[] {
    let handle = traverseElement(doc.querySelector('#Weekly_Boss_Drops'), '^>>vv>');
    const data: WeeklyBossMaterial[] = [];

    while (handle != null) {
        const span = parseInt(firstHtmlChild(handle).attributes['rowspan'] ?? '1');
        const bossName = sanitizeName(traverseElement(handle, 'vv$'));
        const bossImage = getImageUrl(traverseElement(handle, 'vvvvv'));

        const materials: Material[] = [];
        let matHandle = traverseElement(handle, 'v>')
        for (let i = 0; i < span; i++) {
            materials.push(extractMaterial(traverseElement(matHandle, 'vv')));

            handle = handle?.nextElementSibling;
            matHandle = traverseElement(handle, 'v');
        }

        data.push({
            name: bossName,
            image: bossImage,
            materials,
        });
    }

    return data;
}

function extractCrown(doc: HTMLElement): Material {
    return extractMaterial(traverseElement(doc.querySelector('#Limited-duration_Event_Materials'), '^>>v'));
}

async function fetchWeaponAscensionMaterials(): Promise<WeaponAscensionMaterialGroup[]> {
    try {
        const doc = await fetchPage(urls.weapon_ascension_meterials);
        const regions = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru'];

        return regions.flatMap(region => {
            const target = doc.querySelector(`#${region}`);
            const children = [...htmlChildren(traverseElement(target, '^>>v'))];
            const temple = traverseElement(target, '^>v').attributes['title'];

            return children.slice(1, children.length - 1)
                .map((handle): WeaponAscensionMaterialGroup => {
                    const days = `${firstHtmlChild(handle).textContent.trim()}/Sunday`;
                    const materials: Material[] = [];

                    let matHandle = traverseElement(handle, 'v>v');
                    while (matHandle != null) {
                        materials.push(extractMaterial(firstHtmlChild(matHandle)));

                        matHandle = matHandle.nextElementSibling?.nextElementSibling;
                    }

                    return {
                        materials,
                        days,
                        region,
                        temple,
                    };
                });
        });
    } catch (err) {
        throw new Error(`fetchWeaponAscensionMaterials: ${err}`);
    }
}