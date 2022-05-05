"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAscensionData = void 0;
const util_1 = require("./util");
function extractAscensionData(doc) {
    const header = doc.querySelector('#Ascensions_and_Stats') ?? doc.querySelector('#Ascensions');
    let ascension = (0, util_1.traverseElement)(header, '^>vv>>>');
    const data = [];
    while (ascension != null) {
        let requisites = (0, util_1.traverseElement)(ascension, 'vv>v');
        const requisitesData = [];
        while (requisites != null) {
            requisitesData.push({
                description: (0, util_1.traverseElement)(requisites, 'vv').attributes['title'],
                image: (0, util_1.getImageUrl)((0, util_1.traverseElement)(requisites, 'vvv')),
                quantity: (0, util_1.parseIntWithCommas)((0, util_1.traverseElement)(requisites, '$').textContent),
            });
            requisites = requisites.nextElementSibling?.nextElementSibling;
        }
        data.push(requisitesData);
        ascension = ascension.nextElementSibling?.nextElementSibling?.nextElementSibling;
    }
    return data;
}
exports.extractAscensionData = extractAscensionData;
//# sourceMappingURL=extractAscensionData.js.map