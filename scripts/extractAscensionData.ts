import type { HTMLElement } from 'node-html-parser';
import { getImageUrl, parseIntWithCommas, traverseElement } from './util';

export function extractAscensionData(doc: HTMLElement): ImageWithDescriptionAndValue[][] {
    const header = doc.querySelector('#Ascensions_and_Stats') ?? doc.querySelector('#Ascensions');
    let ascension = traverseElement(header, '^>vv>>>');
    const data: ImageWithDescriptionAndValue[][] = [];

    while (ascension != null) {
        let requisites = traverseElement(ascension, 'vv>v');
        const requisitesData: ImageWithDescriptionAndValue[] = [];

        while (requisites != null) {
            requisitesData.push({
                description: traverseElement(requisites, 'vv').attributes['title'],
                image: getImageUrl(traverseElement(requisites, 'vvv')),
                quantity: parseIntWithCommas(traverseElement(requisites, '$').textContent),
            });

            requisites = requisites.nextElementSibling?.nextElementSibling;
        }

        data.push(requisitesData);

        ascension = ascension.nextElementSibling?.nextElementSibling?.nextElementSibling;
    }

    return data;
}