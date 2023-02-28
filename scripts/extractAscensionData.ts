import type { HTMLElement } from 'node-html-parser';
import { extractMaterialAndQuantity, getImageUrl, type MaterialWithQuantity, parseIntWithCommas, traverseElement, firstHtmlChild } from './util';

export function extractAscensionData(doc: HTMLElement): MaterialWithQuantity[][] {
    try {
        const header = doc.querySelector('#Ascensions_and_Stats') ?? doc.querySelector('#Ascensions');
        if (header == null) {
            return undefined;
        }

        let ascension = traverseElement(header, '^>>vv>>>');
        const data: MaterialWithQuantity[][] = [];

        while (ascension != null) {
            // character 'vv>>v' weapon 'vv>>'
            let requisites = traverseElement(ascension, 'vv>>');
            
            if (requisites.tagName === 'SPAN')
                requisites = firstHtmlChild(requisites);

            const requisitesData: MaterialWithQuantity[] = [];

            while (requisites != null) {
                requisitesData.push(extractMaterialAndQuantity(requisites));

                requisites = traverseElement(requisites, '>');
            }

            data.push(requisitesData);

            ascension = traverseElement(ascension, '>>>');
        }

        return data;
    } catch (error) {
        throw new Error(`Failed to extract character ascension data`);
    }
}