import type { HTMLElement } from 'node-html-parser';
import { extractAscensionData } from './extractAscensionData';
import { fetchPage, firstHtmlChild, getImageUrl, htmlChildren, IsProduction, lastHtmlChild, linkFromPath, MaterialWithQuantity, requireStringValue, sanitizeName, traverseElement } from './util';
import { urls } from './compile_data';
import { extractTalentData, TalentCostType } from './extractTalentData';

declare type PartialCharacter = {
    name: string,
    image: string,
    stars: string,
    element: ImageWithDescription,
    weapon: ImageWithDescription,
    region?: string,
};

declare type Character = PartialCharacter & {
    ascensionCosts: MaterialWithQuantity[][],
    talentCosts: TalentCostType,
};

export async function fetchCharacterData(): Promise<Character[]> {
    const listDoc = await fetchPage(urls.character_list);
    const tableList = traverseElement(listDoc.querySelector('#Playable_Characters'), '^>>v');

    return await Promise.all(
        [...htmlChildren(tableList)]
            .slice(1)
            .map(processRow)
            .map(extendCharacter)
    );
}

function processRow(row: HTMLElement): RowToExtend<PartialCharacter> {
    return {
        url: linkFromPath(traverseElement(row, 'v>v').attributes['href']),
        data: {
            name: sanitizeName(traverseElement(row, 'v>v')),
            image: getImageUrl(traverseElement(row, 'vvv')),
            stars: traverseElement(row, 'v>>v').attributes['title'],
            element: parseImageDescriptionColumn(traverseElement(row, '$<<vv')),
            weapon: parseImageDescriptionColumn(traverseElement(row, '$<vv')),
            region: requireStringValue(lastHtmlChild(row).textContent.trim()),
        },
    };
}

async function extendCharacter(row: RowToExtend<PartialCharacter>): Promise<Character> {
    const doc = await fetchPage(IsProduction ? row.url : 'scripts/samples/character-sample.html');

    return {
        ...row.data,
        talentCosts: extractTalentData(doc),
        ascensionCosts: extractAscensionData(doc),
    };
}

function parseImageDescriptionColumn(link: HTMLElement): ImageWithDescription {
    if (!link) {
        return undefined;
    }

    return {
        description: link.attributes['title'],
        image: getImageUrl(firstHtmlChild(link)),
    };
}