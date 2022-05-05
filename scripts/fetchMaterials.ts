import { urls } from "./compile_data";
import type { HTMLElement } from 'node-html-parser';
import { fetchPage, firstHtmlChild, getImageUrl, getTextWithBr, htmlChildren, lastHtmlChild, traverseElement } from "./util";

export async function fetchMaterials() {
    const [common, character, talent, weapon] = await Promise.all([
        fetchCommonMaterials(),
        fetchCharacterAscensionMaterials(),
        fetchTalentAscensionMaterial(),
        fetchWeaponAscensionMaterials(),
    ]);

    return { common, character, talent, weapon };
}

async function fetchCommonMaterials() {
    const doc = await fetchPage(urls.common_ascension_materials);

    return {
        common: extractCommonEnemyGroup(doc),
        elite: extractEliteEnemyGroup(doc),
    };
}

function extractCommonEnemyGroup(doc: HTMLElement) {
    let handle = traverseElement(doc.querySelector('#Common_Enemy_Group'), '^>>>vv>');
    const data = [];

    while (handle) {
        const groupName = sanitizeTextContent(firstHtmlChild(handle));
        const enemies = [...htmlChildren(traverseElement(handle, '$v'))].map(el => safeName(el));
        const materials = [];

        let matHandle = traverseElement(handle, 'v>v');
        while (matHandle != null) {
            const url = traverseElement(matHandle, 'vvv');

            materials.push({
                name: url.attributes['title'],
                image: getImageUrl(firstHtmlChild(url)),
                stars: traverseElement(matHandle, '>v').nextSibling.textContent.trim(),
            });

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

function extractEliteEnemyGroup(doc: HTMLElement) {
    const target = doc.querySelector('#Elite_Enemy_Group');
    return [...htmlChildren(traverseElement(target, '^>>v'))]
        .slice(1)
        .map(handle => {
            const groupName = sanitizeTextContent(firstHtmlChild(handle));
            const enemies = [...htmlChildren(traverseElement(handle, '$v'))].map(el => safeName(el));
            const materials = [];

            let matHandle = traverseElement(handle, 'v>v');
            while (matHandle != null) {
                const url = traverseElement(matHandle, 'vvv');

                materials.push({
                    name: url.attributes['title'],
                    image: getImageUrl(firstHtmlChild(url)),
                    stars: traverseElement(matHandle, '>v').nextSibling.textContent.trim(),
                });

                matHandle = matHandle.nextElementSibling?.nextElementSibling;
            }

            return {
                group: groupName,
                materials,
                enemies,
            };
        });
}

function sanitizeTextContent(element: HTMLElement): string {
    return getTextWithBr(element)
        .replaceAll('\n', ' ')
        .replaceAll('\r', '')
        .trim();
}

function safeName(element: HTMLElement): string {
    return element.textContent.split('\n').map(w => w.trim()).filter(s => s.length > 0).join(' ');
}

async function fetchCharacterAscensionMaterials() {
    const doc = await fetchPage(urls.character_ascension_meterials);

    return {
        gems: extractGems(doc),
        normalBoss: extractNormalBoss(doc),
        localSpecialty: extractLocalSpecialty(doc),
    }
}

function extractGems(doc: HTMLElement) {
    const target = doc.querySelector('#Ascension_Gems');
    return [...htmlChildren(traverseElement(target, '^>>>v'))]
        .slice(1)
        .map(handle => {
            const groupName = safeName(firstHtmlChild(handle));
            const img = traverseElement(handle, 'v>vvv');
            const materials = [];

            let matHandle = traverseElement(handle, '$v');
            while (matHandle != null) {
                const url = traverseElement(matHandle, 'vvv');

                materials.push({
                    name: url.attributes['title'],
                    image: getImageUrl(firstHtmlChild(url)),
                    stars: traverseElement(matHandle, '>v').nextSibling.textContent.trim(),
                });

                matHandle = matHandle.nextElementSibling?.nextElementSibling;
            }

            return {
                group: groupName,
                element: {
                    name: img.attributes['alt'],
                    image: getImageUrl(img),
                },
                materials,
            };
        });
}

function extractNormalBoss(doc: HTMLElement) {
    const target = doc.querySelector('#Normal_Boss_Materials');
    return [...htmlChildren(traverseElement(target, '^>>v'))]
        .slice(1)
        .map(handle => {
            const url = traverseElement(handle, 'vvvvv');

            return {
                name: url.attributes['title'],
                image: getImageUrl(firstHtmlChild(url)),
                stars: traverseElement(handle, 'vv>v').nextSibling.textContent.trim(),
            }
        })
}

function extractLocalSpecialty(doc: HTMLElement) {
    const target = doc.querySelector('#Local_Specialities');
    return [...htmlChildren(traverseElement(target, '^>>v'))]
        .slice(1)
        .map(handle => {
            const url = traverseElement(handle, 'v>vvvv');

            return {
                name: url.attributes['title'],
                image: getImageUrl(firstHtmlChild(url)),
                stars: '1★',
                region: safeName(firstHtmlChild(handle)),
            }
        });
}

async function fetchTalentAscensionMaterial() {
    const doc = await fetchPage(urls.talent_materials);

    return {
        books: extractTalentBooks(doc),
        bossMaterial: extractTalentBossMaterial(doc),
        crown: extractCrown(doc),
    };
}

function extractTalentBooks(doc: HTMLElement) {
    const regions = ['Mondstadt', 'Liyue', 'Inazuma'];

    return regions.flatMap(region => {
        const target = doc.querySelector(`#${region}`);
        const children = [...htmlChildren(traverseElement(target, '^>>v'))];
        const temple = traverseElement(target, '^>v').attributes['title'];

        return children.slice(1, children.length - 1)
            .map(handle => {
                const days = `${firstHtmlChild(handle).textContent.trim()}/Sunday`;
                const series = traverseElement(handle, 'v>v').attributes['title'];
                const books = [];

                let matHandle = traverseElement(handle, 'v>v>>');
                while (matHandle != null) {
                    const url = traverseElement(matHandle, 'vvv');

                    books.push({
                        name: url.attributes['title'],
                        image: getImageUrl(firstHtmlChild(url)),
                        stars: traverseElement(matHandle, '>v').nextSibling.textContent.trim().substring(0, 2),
                    });

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

function extractTalentBossMaterial(doc: HTMLElement) {
    let handle = traverseElement(doc.querySelector('#Weekly_Boss_Drops'), '^>>vv>');
    const data = [];

    while (handle != null) {
        const span = parseInt(firstHtmlChild(handle).attributes['rowspan'] ?? '1');
        const bossName = safeName(traverseElement(handle, 'vvv$v'));
        const bossImage = getImageUrl(traverseElement(handle, 'vvvvvv'));

        const materials = [];
        let matHandle = traverseElement(handle, 'v>')
        for (let i = 0; i < span; i++) {
            const url = traverseElement(matHandle, 'vvvv');

            materials.push({
                name: url.attributes['title'],
                image: getImageUrl(firstHtmlChild(url)),
                stars: '5★',
            });

            matHandle = traverseElement(matHandle, '^>v');
            handle = handle?.nextElementSibling;
        }

        data.push({
            name: bossName,
            images: bossImage,
            materials,
        });
    }

    return data;
}

function extractCrown(doc: HTMLElement) {
    let handle = traverseElement(doc.querySelector('#Limited-duration_Event_Materials'), '^>>vvv');

    return {
        name: handle.attributes['title'],
        image: getImageUrl(firstHtmlChild(handle)),
        stars: '5★',
    };
}

async function fetchWeaponAscensionMaterials() {
    const doc = await fetchPage(urls.weapon_ascension_meterials);
    const regions = ['Mondstadt', 'Liyue', 'Inazuma'];

    return regions.flatMap(region => {
        const target = doc.querySelector(`#${region}`);
        const children = [...htmlChildren(traverseElement(target, '^>>v'))];
        const temple = traverseElement(target, '^>v').attributes['title'];

        return children.slice(1, children.length - 1)
            .map(handle => {
                const days = `${firstHtmlChild(handle).textContent.trim()}/Sunday`;
                const materials = [];

                let matHandle = traverseElement(handle, 'v>v');
                while (matHandle != null) {
                    const url = traverseElement(matHandle, 'vvv');
                    const stars = traverseElement(matHandle, 'vv>>v').attributes['alt'];

                    materials.push({
                        name: url.attributes['title'],
                        image: getImageUrl(firstHtmlChild(url)),
                        stars: `${stars.substring(5, 6)}★`,
                    });

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
}