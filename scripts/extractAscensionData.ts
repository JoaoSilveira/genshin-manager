import type { HTMLElement } from 'node-html-parser';
import { extractMaterialAndQuantity, getImageUrl, MaterialWithQuantity, parseIntWithCommas, traverseElement } from './util';

export function extractAscensionData(doc: HTMLElement): MaterialWithQuantity[][] {
    const header = doc.querySelector('#Ascensions_and_Stats') ?? doc.querySelector('#Ascensions');
    if (header == null) {
        return undefined;
    }

    let ascension = traverseElement(header, '^>>vv>>>');
    const data: MaterialWithQuantity[][] = [];

    while (ascension != null) {
        let requisites = traverseElement(ascension, 'vv>>v'); // character 'vv>>v' weapon 'vv>>'
        const requisitesData: MaterialWithQuantity[] = [];

        while (requisites != null) {
            requisitesData.push(extractMaterialAndQuantity(requisites));

            requisites = traverseElement(requisites, '>>');
        }

        data.push(requisitesData);

        ascension = traverseElement(ascension, '>>>');
    }

    return data;
}