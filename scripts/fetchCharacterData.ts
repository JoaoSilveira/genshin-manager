import type { HTMLElement } from 'node-html-parser';
import { extractAscensionData } from './extractAscensionData';
import { fetchPage, firstHtmlChild, getImageUrl, htmlChildren, IsProduction, lastHtmlChild, linkFromPath, type MaterialWithQuantity, requireStringValue, sanitizeName, traverseElement } from './util';
import { urls } from './compile_data';
import { extractTalentData, type TalentCostType } from './extractTalentData';


declare type ImageWithDescription = {
    description: string,
    image: string,
};

declare type RowToExtend<P> = {
    url: string,
    data: P,
};

declare type PartialCharacter = {
    name: string,
    image: string,
    stars: string,
    element: ImageWithDescription,
    weapon: ImageWithDescription,
    region?: string,
};

export type Character = PartialCharacter & {
    ascensionCosts: MaterialWithQuantity[][],
    talentCosts: TalentCostType,
};

export async function fetchCharacterData(): Promise<Character[]> {
    const listDoc = await fetchPage(urls.character_list);
    const tableList = traverseElement(listDoc.querySelector('#Playable_Characters'), '^>>v');

    try {
        return await Promise.all(
            [...htmlChildren(tableList)]
                .slice(1)
                .map(processCharacterRow)
                .map(extendCharacter)
        );
    }
    catch (err) {
        throw new Error(`fetchCharacterData: ${err}`);
    }
}

export function processCharacterRow(row: HTMLElement): RowToExtend<PartialCharacter> {
    return {
        url: linkFromPath(traverseElement(row, 'v>v').attributes['href']),
        data: {
            name: sanitizeName(traverseElement(row, 'v>v')),
            image: getImageUrl(traverseElement(row, 'vvv')),
            stars: traverseElement(row, 'v>>v').attributes['title'],
            element: parseImageDescriptionColumn(traverseElement(row, '$<<<vv')),
            weapon: parseImageDescriptionColumn(traverseElement(row, '$<<vv')),
            region: requireStringValue(traverseElement(row, '$<').textContent.trim()),
        },
    };
}

export async function extendCharacter(row: RowToExtend<PartialCharacter>): Promise<Character> {
    try {
        const doc = await fetchPage(IsProduction ? row.url : 'scripts/samples/character-sample.html');

        const talent = extractTalentData(doc);
        const ascension = extractAscensionData(doc);

        return {
            ...row.data,
            talentCosts: talent,
            ascensionCosts: ascension,
        };
    } catch (error) {
        throw new Error(`Failed to extend url '${row.url}' due to error: ${error.message}`);
    }
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