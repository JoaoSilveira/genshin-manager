"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCharacterData = void 0;
const extractAscensionData_1 = require("./extractAscensionData");
const util_1 = require("./util");
const compile_data_1 = require("./compile_data");
const extractTalentData_1 = require("./extractTalentData");
async function fetchCharacterData() {
    const listDoc = await (0, util_1.fetchPage)(compile_data_1.urls.character_list);
    const tableList = (0, util_1.traverseElement)(listDoc.querySelector('#Playable_Characters'), '^>>v');
    return await Promise.all([...(0, util_1.htmlChildren)(tableList)]
        .slice(1)
        .map(processRow)
        .map(extendCharacter));
}
exports.fetchCharacterData = fetchCharacterData;
function processRow(row) {
    return {
        url: (0, util_1.linkFromPath)((0, util_1.traverseElement)(row, 'v>v').attributes['href']),
        data: {
            name: (0, util_1.traverseElement)(row, 'v>v').textContent.trim(),
            image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(row, 'vvv')),
            stars: (0, util_1.traverseElement)(row, 'v>>v').attributes['title'],
            element: parseImageDescriptionColumn((0, util_1.traverseElement)(row, '$<<vv')),
            weapon: parseImageDescriptionColumn((0, util_1.traverseElement)(row, '$<vv')),
            region: (0, util_1.requireStringValue)((0, util_1.lastHtmlChild)(row).textContent.trim()),
        },
    };
}
async function extendCharacter(row) {
    const doc = await (0, util_1.fetchPage)(util_1.IsProduction ? row.url : 'scripts/samples/character-sample.html');
    return {
        ...row.data,
        talentCosts: (0, extractTalentData_1.extractTalentData)(doc),
        ascensionCosts: (0, extractAscensionData_1.extractAscensionData)(doc),
    };
}
function parseImageDescriptionColumn(link) {
    if (!link) {
        return undefined;
    }
    return {
        description: link.attributes['title'],
        image: (0, util_1.getImageUrl)((0, util_1.firstHtmlChild)(link)),
    };
}
//# sourceMappingURL=fetchCharacterData.js.map