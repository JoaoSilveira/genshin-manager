"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchExperienceData = void 0;
const util_1 = require("./util");
const compile_data_1 = require("./compile_data");
async function fetchExperienceData() {
    const [characterExp, weaponExp] = await Promise.all([
        fetchCharacterExperienceData(),
        fetchWeaponExperienceData(),
    ]);
    return {
        character: characterExp,
        weapon: weaponExp,
    };
}
exports.fetchExperienceData = fetchExperienceData;
async function fetchCharacterExperienceData() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.character_exp);
    return {
        expPerLevel: extractCharacterExpPerLevel(doc),
        expItems: extractCharacterExpItems(doc),
    };
}
function extractCharacterExpPerLevel(doc) {
    const tableList = (0, util_1.traverseElement)(doc.querySelector('#EXP_Per_Level'), '^>v');
    const data = [];
    for (const li of (0, util_1.htmlChildren)(tableList)) {
        let row = (0, util_1.traverseElement)(li, '$vv>');
        while (row != null) {
            data.push({
                level: (0, util_1.parseIntWithCommas)((0, util_1.firstHtmlChild)(row).textContent),
                toNext: (0, util_1.parseIntWithCommas)((0, util_1.nthHtmlChild)(row, 1).textContent),
            });
            row = row.nextElementSibling;
        }
    }
    return data;
}
function extractCharacterExpItems(doc) {
    const handle = (0, util_1.traverseElement)(doc.querySelector('#Leveling_Characters'), '^>>vv>v>');
    return [
        {
            description: "Wanderer's Advice",
            image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(handle, 'v>>>>vvvv')),
            quantity: 1000,
        },
        {
            description: "Item Adventurer's Experience",
            image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(handle, 'v>>vvvv')),
            quantity: 5000,
        },
        {
            description: "Hero's Wit",
            image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(handle, 'vvvvv')),
            quantity: 20000,
        },
    ];
}
async function fetchWeaponExperienceData() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.weapon_exp);
    return {
        expPerLevel: extractWeaponExpPerLevel(doc),
        expItems: extractWeaponExpItems(doc),
    };
}
function extractWeaponExpItems(doc) {
    let handle = (0, util_1.traverseElement)(doc.querySelector('#Weapon_Enhancement_Material'), '^>>');
    const items = [];
    for (let i = 0; i < 3; i++) {
        const link = (0, util_1.traverseElement)(handle, 'vvv');
        const exp = (0, util_1.traverseElement)(handle, 'vv>v').textContent.trim();
        items.push({
            description: link.attributes['title'],
            image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(link)),
            quantity: (0, util_1.parseIntWithCommas)(exp.substring(0, exp.length - 3)),
        });
        handle = (0, util_1.traverseElement)(handle, '>>');
    }
    return items;
}
function extractWeaponExpPerLevel(doc) {
    let handle = (0, util_1.traverseElement)(doc.querySelector('#Weapon_EXP_Chart'), '^>>v>');
    const data = {};
    while (handle) {
        const stars = (0, util_1.traverseElement)(handle, 'v>v').textContent.trim();
        let tr = (0, util_1.traverseElement)(handle, 'v>>>vv>');
        data[stars] = [];
        while (tr) {
            const children = [...(0, util_1.htmlChildren)(tr)];
            for (let i = 0; i < children.length; i += 3) {
                data[stars].push({
                    level: parseInt(children[i].textContent),
                    toNext: (0, util_1.parseIntWithCommas)(children[i + 1].textContent),
                });
            }
            tr = tr.nextElementSibling;
        }
        data[stars].sort((a, b) => a.level - b.level);
        handle = handle.nextElementSibling;
    }
    return data;
}
//# sourceMappingURL=fetchExperienceData.js.map