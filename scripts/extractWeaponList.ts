import { urls } from "./compile_data";
import { fetchPage, firstHtmlChild, getImageUrl, htmlChildren, IsProduction, linkFromPath, traverseElement } from "./util";
import type { HTMLElement } from 'node-html-parser';
import { extractAscensionData } from "./extractAscensionData";

type PartialWeapon = {
    name: string,
    image: string,
    stars: string,
    baseAttack: number,
    finalAttack: number,
    baseSub: number,
    finalSub: number,
    sub: string,
    passive?: {
        name: string,
        description: string,
    },
};

export type Weapon = PartialWeapon & {
    ascension: ImageWithDescriptionAndValue[][],
};


export async function extractWeaponList(): Promise<Weapon[]> {
    const doc = await fetchPage(urls.weapon_list);
    const handle = traverseElement(doc.querySelector('#List_of_All_Weapons'), '^>>v');

    return await Promise.all(
        [...htmlChildren(handle)]
            .slice(1)
            .map(processWeaponRow)
            .map(extendWeapon)
    );
}

function processWeaponRow(handle: HTMLElement): RowToExtend<PartialWeapon> {
    const link = traverseElement(handle, 'vv');
    const atackStatus = parseStatusValue(traverseElement(handle, '$<<').textContent);
    const subStatus = parseStatusValue(traverseElement(handle, '$<').textContent);


    return {
        url: linkFromPath(link.attributes['href']),
        data: {
            name: link.attributes['title'],
            image: getImageUrl(firstHtmlChild(link)),
            stars: traverseElement(handle, 'v>>v').attributes['alt'],
            baseAttack: atackStatus.base,
            finalAttack: atackStatus.final,
            baseSub: subStatus.base,
            finalSub: subStatus.final,
            sub: subStatus.subStatus,
            passive: parsePasiveAbility(traverseElement(handle, '$')),
        }
    };
}

async function extendWeapon(partial: RowToExtend<PartialWeapon>): Promise<Weapon> {
    const doc = await fetchPage(IsProduction ? partial.url : "scripts/samples/weapon-sample.html");

    return {
        ...partial.data,
        ascension: extractAscensionData(doc),
    };
}

function parseStatusValue(text: string): { base: number, final: number, subStatus?: string } {
    const matches = text.match(/([\w\s]+ )?([\d\.]+)%?[\s\n]*\(([\d\.]+)%?\)/);

    if (!matches) {
        let base = parseFloat(text.substring(0, text.indexOf('(')));
        base = isNaN(base) ? undefined : base;

        return { base, final: undefined, subStatus: undefined };
    }

    return {
        subStatus: matches[1]?.trimEnd(),
        base: parseFloat(matches[2]),
        final: parseFloat(matches[3]),
    };
}

function parsePasiveAbility(parent: HTMLElement): { name: string, description: string } | undefined {
    if (parent.childNodes.length < 2) {
        return undefined;
    }

    const [name, ...text] = parent.childNodes.map(n => n.textContent);

    return {
        name,
        description: text.join('').trim(),
    };
}