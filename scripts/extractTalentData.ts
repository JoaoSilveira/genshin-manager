import type { HTMLElement } from 'node-html-parser';
import { extractMaterialAndQuantity, findNextByTag, firstHtmlChild, htmlChildren, indexInParent, MaterialWithQuantity, traverseElement } from './util';

type TalentCostMap = {
    [key: string]: MaterialWithQuantity[][] | { [otherKey: string]: MaterialWithQuantity[][] }
}

export type TalentCostType = TalentCostMap | MaterialWithQuantity[][];

export function extractTalentData(doc: HTMLElement): TalentCostType {
    const talents = doc.querySelectorAll('#Single_Talent_Leveling');
    if (talents.length > 0) {
        return extractMultiple(talents);
    }

    return extractSingle(traverseElement(doc.querySelector('#Talent_Upgrade'), '^>vv>'));
}

function extractMultiple(talents: HTMLElement[]): TalentCostMap {
    const data = {};

    const names = [...htmlChildren(traverseElement(talents[0], '^^^vv'))].map(e => e.textContent.trim());
    for (const talent of talents) {
        const name = names[indexInParent(talent.parentNode.parentNode) - 1];
        const handle = talent.parentNode.nextElementSibling;

        data[name] = handle.tagName === 'DL' ? extractByTopic(handle) : extractSingle(traverseElement(handle, 'vv>'));
    }

    return data;
}

function extractByTopic(handle: HTMLElement): TalentCostMap {
    const data = {};

    while (handle != null && handle.tagName === 'DL') {
        data[handle.textContent.trim().toLowerCase()] = extractSingle(traverseElement(handle, '>vv>'));

        handle = findNextByTag(handle, 'DL');
    }

    return data;
}

function extractSingle(talent: HTMLElement): MaterialWithQuantity[][] {
    const data: MaterialWithQuantity[][] = [];

    while (talent != null) {
        const requisitesData: MaterialWithQuantity[] = [];
        let requisites = firstHtmlChild(talent);
        while (firstHtmlChild(requisites)?.tagName !== 'DIV') {
            requisites = requisites.nextElementSibling;
        }

        while (firstHtmlChild(requisites) != null) {
            requisitesData.push(extractMaterialAndQuantity(firstHtmlChild(requisites)));

            requisites = requisites.nextElementSibling;
        }

        data.push(requisitesData);
        talent = talent.nextElementSibling;
    }

    return data;
}
