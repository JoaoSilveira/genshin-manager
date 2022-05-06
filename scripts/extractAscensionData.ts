import type { HTMLElement } from 'node-html-parser';
import { extractMaterialAndQuantity, getImageUrl, MaterialWithQuantity, parseIntWithCommas, traverseElement } from './util';

export function extractAscensionData(doc: HTMLElement): MaterialWithQuantity[][] {
    const header = doc.querySelector('#Ascensions_and_Stats') ?? doc.querySelector('#Ascensions');
    let ascension = traverseElement(header, '^>vv>>>');
    const data: MaterialWithQuantity[][] = [];

    while (ascension != null) {
        let requisites = traverseElement(ascension, 'vv>v');
        const requisitesData: MaterialWithQuantity[] = [];

        while (requisites != null) {
            requisitesData.push(extractMaterialAndQuantity(requisites));

            requisites = requisites.nextElementSibling?.nextElementSibling;
        }

        data.push(requisitesData);

        ascension = ascension.nextElementSibling?.nextElementSibling?.nextElementSibling;
    }

    return data;
}