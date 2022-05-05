"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMaterials = void 0;
const compile_data_1 = require("./compile_data");
const util_1 = require("./util");
async function fetchMaterials() {
    return await fetchTalentAscensionMaterial();
}
exports.fetchMaterials = fetchMaterials;
async function fetchCommonMaterials() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.common_ascension_materials);
    return {
        common: extractCommonEnemyGroup(doc),
        elite: extractEliteEnemyGroup(doc),
    };
}
function extractCommonEnemyGroup(doc) {
    let handle = (0, util_1.traverseElement)(doc.querySelector('#Common_Enemy_Group'), '^>>>vv>');
    const data = [];
    while (handle) {
        const groupName = sanitizeTextContent((0, util_1.firstHtmlChild)(handle));
        const enemies = [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(handle, '$v'))].map(el => safeName(el));
        const materials = [];
        let matHandle = (0, util_1.traverseElement)(handle, 'v>v');
        while (matHandle != null) {
            const url = (0, util_1.traverseElement)(matHandle, 'vvv');
            materials.push({
                name: url.attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
                stars: (0, util_1.traverseElement)(matHandle, '>v').nextSibling.textContent.trim(),
            });
            matHandle = matHandle.nextElementSibling?.nextElementSibling;
        }
        data.push({
            group: groupName,
            materials,
            enemies,
        });
        handle = handle.nextElementSibling?.nextElementSibling;
    }
    return data;
}
function extractEliteEnemyGroup(doc) {
    const target = doc.querySelector('#Elite_Enemy_Group');
    return [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(target, '^>>v'))]
        .slice(1)
        .map(handle => {
        const groupName = sanitizeTextContent((0, util_1.firstHtmlChild)(handle));
        const enemies = [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(handle, '$v'))].map(el => safeName(el));
        const materials = [];
        let matHandle = (0, util_1.traverseElement)(handle, 'v>v');
        while (matHandle != null) {
            const url = (0, util_1.traverseElement)(matHandle, 'vvv');
            materials.push({
                name: url.attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
                stars: (0, util_1.traverseElement)(matHandle, '>v').nextSibling.textContent.trim(),
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
function sanitizeTextContent(element) {
    return (0, util_1.getTextWithBr)(element)
        .replaceAll('\n', ' ')
        .replaceAll('\r', '')
        .trim();
}
function safeName(element) {
    return element.textContent.split('\n').map(w => w.trim()).filter(s => s.length > 0).join(' ');
}
async function fetchCharacterAscensionMaterials() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.character_ascension_meterials);
    return {
        gems: extractGems(doc),
        normalBoss: extractNormalBoss(doc),
        localSpecialty: extractLocalSpecialty(doc),
    };
}
function extractGems(doc) {
    const target = doc.querySelector('#Ascension_Gems');
    return [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(target, '^>>>v'))]
        .slice(1)
        .map(handle => {
        const groupName = safeName((0, util_1.firstHtmlChild)(handle));
        const img = (0, util_1.traverseElement)(handle, 'v>vvv');
        const materials = [];
        let matHandle = (0, util_1.traverseElement)(handle, '$v');
        while (matHandle != null) {
            const url = (0, util_1.traverseElement)(matHandle, 'vvv');
            materials.push({
                name: url.attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
                stars: (0, util_1.traverseElement)(matHandle, '>v').nextSibling.textContent.trim(),
            });
            matHandle = matHandle.nextElementSibling?.nextElementSibling;
        }
        return {
            group: groupName,
            element: {
                name: img.attributes['alt'],
                image: (0, util_1.getImageUrl)(img),
            },
            materials,
        };
    });
}
function extractNormalBoss(doc) {
    const target = doc.querySelector('#Normal_Boss_Materials');
    return [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(target, '^>>v'))]
        .slice(1)
        .map(handle => {
        const url = (0, util_1.traverseElement)(handle, 'vvvvv');
        return {
            name: url.attributes['title'],
            image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
            stars: (0, util_1.traverseElement)(handle, 'vv>v').nextSibling.textContent.trim(),
        };
    });
}
function extractLocalSpecialty(doc) {
    const target = doc.querySelector('#Local_Specialities');
    return [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(target, '^>>v'))]
        .slice(1)
        .map(handle => {
        const url = (0, util_1.traverseElement)(handle, 'v>vvvv');
        return {
            name: url.attributes['title'],
            image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
            stars: '1★',
            region: safeName((0, util_1.firstHtmlChild)(handle)),
        };
    });
}
async function fetchTalentAscensionMaterial() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.talent_materials);
    return {
        books: extractTalentBooks(doc),
        bossMaterial: extractTalentBossMaterial(doc),
        crown: extractCrown(doc),
    };
}
function extractTalentBooks(doc) {
    const regions = ['Mondstadt', 'Liyue', 'Inazuma'];
    return regions.flatMap(region => {
        const target = doc.querySelector(`#${region}`);
        const children = [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(target, '^>>v'))];
        return children.slice(1, children.length - 1)
            .map(handle => {
            const days = `${(0, util_1.firstHtmlChild)(handle).textContent.trim()}/Sunday`;
            const series = (0, util_1.traverseElement)(handle, 'v>v').attributes['title'];
            const books = [];
            let matHandle = (0, util_1.traverseElement)(handle, 'v>v>>');
            while (matHandle != null) {
                const url = (0, util_1.traverseElement)(matHandle, 'vvv');
                books.push({
                    name: url.attributes['title'],
                    image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
                    stars: (0, util_1.traverseElement)(matHandle, '>v').nextSibling.textContent.trim().substring(0, 2),
                });
                matHandle = matHandle.nextElementSibling?.nextElementSibling;
            }
            return {
                series,
                books,
                days,
                region,
            };
        });
    });
}
function extractTalentBossMaterial(doc) {
    let handle = (0, util_1.traverseElement)(doc.querySelector('#Weekly_Boss_Drops'), '^>>vv>');
    const data = [];
    while (handle != null) {
        const span = parseInt((0, util_1.firstHtmlChild)(handle).attributes['rowspan'] ?? '1');
        const bossName = safeName((0, util_1.traverseElement)(handle, 'vvv$v'));
        const bossImage = (0, util_1.getImageUrl)((0, util_1.traverseElement)(handle, 'vvvvvv'));
        const materials = [];
        let matHandle = (0, util_1.traverseElement)(handle, 'v>');
        for (let i = 0; i < span; i++) {
            const url = (0, util_1.traverseElement)(matHandle, 'vvvv');
            materials.push({
                name: url.attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(url)),
                stars: '5★',
            });
            matHandle = (0, util_1.traverseElement)(matHandle, '^>v');
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
function extractCrown(doc) {
    let handle = (0, util_1.traverseElement)(doc.querySelector('#Limited-duration_Event_Materials'), '^>>vvv');
    return {
        name: handle.attributes['title'],
        image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(handle)),
        stars: '5★',
    };
}
//# sourceMappingURL=fetchMaterials.js.map