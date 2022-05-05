"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTalentData = void 0;
const util_1 = require("./util");
function extractTalentData(doc) {
    const talents = doc.querySelectorAll('#Single_Talent_Leveling');
    if (talents.length > 0) {
        return extractMultiple(talents);
    }
    return extractSingle((0, util_1.traverseElement)(doc.querySelector('#Talent_Upgrade'), '^>vv>'));
}
exports.extractTalentData = extractTalentData;
function extractMultiple(talents) {
    const data = {};
    const names = [...(0, util_1.htmlChildren)((0, util_1.traverseElement)(talents[0], '^^^vv'))].map(e => e.textContent.trim());
    for (const talent of talents) {
        const name = names[(0, util_1.indexInParent)(talent.parentNode.parentNode) - 1];
        const handle = talent.parentNode.nextElementSibling;
        data[name] = handle.tagName === 'DL' ? extractByTopic(handle) : extractSingle((0, util_1.traverseElement)(handle, 'vv>'));
    }
    return data;
}
function extractByTopic(handle) {
    const data = {};
    while (handle != null && handle.tagName === 'DL') {
        data[handle.textContent.trim().toLowerCase()] = extractSingle((0, util_1.traverseElement)(handle, '>vv>'));
        handle = (0, util_1.findNextByTag)(handle, 'DL');
    }
    return data;
}
function extractSingle(talent) {
    const data = [];
    while (talent != null) {
        const requisitesData = [];
        let requisites = (0, util_1.firstHtmlChild)(talent);
        while ((0, util_1.firstHtmlChild)(requisites)?.tagName !== 'DIV') {
            requisites = requisites.nextElementSibling;
        }
        while ((0, util_1.firstHtmlChild)(requisites) != null) {
            requisitesData.push({
                description: (0, util_1.traverseElement)(requisites, 'vvv').attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(requisites, 'vvvv')),
                quantity: (0, util_1.parseIntWithCommas)((0, util_1.traverseElement)(requisites, 'v$').textContent),
            });
            requisites = requisites.nextElementSibling;
        }
        data.push(requisitesData);
        talent = talent.nextElementSibling;
    }
    return data;
}
//# sourceMappingURL=extractTalentData.js.map