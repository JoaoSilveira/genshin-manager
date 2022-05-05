"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWeaponList = void 0;
const compile_data_1 = require("./compile_data");
const util_1 = require("./util");
const extractAscensionData_1 = require("./extractAscensionData");
async function extractWeaponList() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.weapon_list);
    const handle = (0, util_1.traverseElement)(doc.querySelector('#List_of_All_Weapons'), '^>>v');
    return await Promise.all([...(0, util_1.htmlChildren)(handle)]
        .slice(1)
        .map(processWeaponRow)
        .map(extendWeapon));
}
exports.extractWeaponList = extractWeaponList;
function processWeaponRow(handle) {
    const link = (0, util_1.traverseElement)(handle, 'vv');
    const atackStatus = parseStatusValue((0, util_1.traverseElement)(handle, '$<<').textContent);
    const subStatus = parseStatusValue((0, util_1.traverseElement)(handle, '$<').textContent);
    return {
        url: (0, util_1.linkFromPath)(link.attributes['href']),
        data: {
            name: link.attributes['title'],
            image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(link)),
            stars: (0, util_1.traverseElement)(handle, 'v>>v').attributes['alt'],
            baseAttack: atackStatus.base,
            finalAttack: atackStatus.final,
            baseSub: subStatus.base,
            finalSub: subStatus.final,
            sub: subStatus.subStatus,
            passive: parsePasiveAbility((0, util_1.traverseElement)(handle, '$')),
        }
    };
}
async function extendWeapon(partial) {
    const doc = await (0, util_1.fetchPage)(util_1.IsProduction ? partial.url : "scripts/samples/weapon-sample.html");
    return {
        ...partial.data,
        ascension: (0, extractAscensionData_1.extractAscensionData)(doc),
    };
}
function parseStatusValue(text) {
    const matches = text.match(/([\w\s]+ )?([\d\.]+)%?[\s\n]*\(([\d\.]+)%?\)/);
    if (!matches) {
        let base = parseFloat(text.substring(0, text.indexOf('(')));
        base = isNaN(base) ? undefined : base;
        return { base, final: undefined, subStatus: undefined };
    }
    return {
        subStatus: matches[1]?.trimEnd(),
        base: parseFloat(matches[2]),
        final: parseFloat(matches[3]),
    };
}
function parsePasiveAbility(parent) {
    if (parent.childNodes.length < 2) {
        return undefined;
    }
    const [name, ...text] = parent.childNodes.map(n => n.textContent);
    return {
        name,
        description: text.join('').trim(),
    };
}
//# sourceMappingURL=extractWeaponList.js.map