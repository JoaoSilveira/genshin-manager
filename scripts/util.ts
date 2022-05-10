import { parse, Node, NodeType } from 'node-html-parser';
import axios, { AxiosResponse } from 'axios';
import type { HTMLElement } from 'node-html-parser';
import { readFile } from 'fs/promises';

export const IsProduction = false;

function isSuccess(request: AxiosResponse<any, any>): boolean {
    return Math.floor(request.status / 100) == 2;
}

export async function fetchPage(url: string): Promise<HTMLElement> {
    if (!IsProduction) {
        return parse((await readFile(url)).toString());
    }

    const response = await axios.get(url);
    if (!isSuccess(response)) {
        throw new Error(`Failed to fetch url (${url}): ${response.statusText}`);
    }

    return parse(response.data);
}

export function getTextWithBr(element: HTMLElement): string {
    if (!element) {
        return undefined;
    }

    return element.childNodes
        .map(c => c.nodeType === NodeType.ELEMENT_NODE && (c as HTMLElement).tagName === 'BR' ? '\n' : c.textContent)
        .join('');
}

export function requireStringValue(value: string): string | undefined {
    return value === '' || value == null ? undefined : value;
}

export function parseIntWithCommas(number: string): number {
    return parseInt(number.replace(',', ''));
}

export function* htmlChildren(element: Node): IterableIterator<HTMLElement> {
    for (const child of element.childNodes) {
        if (child.nodeType == NodeType.ELEMENT_NODE) {
            yield child as HTMLElement;
        }
    }
}

export function firstHtmlChild(element: Node): HTMLElement | undefined {
    if (!element) {
        return undefined;
    }

    return htmlChildren(element).next().value;
}

export function lastHtmlChild(element: Node): HTMLElement | undefined {
    if (!element) {
        return undefined;
    }

    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const child = element.childNodes[i];

        if (child.nodeType === NodeType.ELEMENT_NODE) {
            return child as HTMLElement;
        }
    }
}

export function nthHtmlChild(element: Node, n: number): HTMLElement | undefined {
    if (!element) {
        return undefined;
    }

    if (n < 0) {
        throw new Error('Negative index for element child');
    }

    for (const child of htmlChildren(element)) {
        if (n === 0) {
            return child as HTMLElement;
        }
        n--;
    }

    if (n > 0) {
        throw new Error('Index out of bounds');
    }
}

export function indexInParent(element: Node): number {
    let index = 0;
    for (const el of htmlChildren(element.parentNode)) {
        if (el === element) {
            return index;
        }
        index++;
    }
}

type TraverseCommandMap = {
    [key: string]: (el: HTMLElement) => HTMLElement;
};

export function traverseElement(element: HTMLElement, movements: string): HTMLElement | undefined {
    const traverseFunctions: TraverseCommandMap = {
        '^': el => el.parentNode,
        '>': el => el.nextElementSibling,
        '<': el => el.previousElementSibling,
        'v': firstHtmlChild,
        '$': lastHtmlChild,
    };

    for (const char of movements) {
        if (!(char in traverseFunctions)) {
            throw new Error(`Unknown command '${char}'`);
        }

        if (!element) {
            return undefined;
        }

        element = traverseFunctions[char](element);
    }

    return element as HTMLElement;
}

export function findNextByTag(element: HTMLElement, tagName: string): HTMLElement | undefined {
    if (!element) {
        return undefined;
    }

    do {
        element = element.nextElementSibling;
    } while (element != null && element.tagName !== tagName);

    return element;
}

export function getImageUrl(img: HTMLElement): string {
    let url = img.attributes['src'];
    if (!url || !url.startsWith('https://')) {
        url = img.attributes['data-src'];
    }

    if (!url) {
        console.log(img);
    }

    const idx = ['.jpg', '.jpeg', '.png', '.svg']
        .map(ext => url.indexOf(ext) + ext.length)
        .filter(i => i >= 5)
        .reduce((min, i) => i < min ? i : min, Number.MAX_SAFE_INTEGER);

    return url.substring(0, expect(idx >= 0, idx, 'Image have unknown extension: ' + url));
}

export function linkFromPath(path: string): string {
    return `https://genshin-impact.fandom.com${path}`;
}

export class ArgumentError extends Error {
    param: string;

    constructor(param: string, message?: string) {
        super(message);
        this.param = param;
    }
}

export function assertArg(valid: boolean, param: string, message?: string): void {
    if (!valid) {
        throw new ArgumentError(param, message);
    }
}

export function expect<T>(valid: boolean | ((v: T) => boolean), value: T, message: string): T {
    valid = typeof valid === 'boolean' ? valid : valid(value);

    if (!valid) {
        console.warn(message);
    }

    return value;
}

export function* enumerate<T>(it: Iterable<T>): IterableIterator<[T, number]> {
    let i = 0;
    for (const v of it) {
        yield [v, i++];
    }
}

export type Material = {
    name: string,
    image: string,
    stars: number,
};

export function extractMaterial(container: HTMLElement): Material {
    const url = traverseElement(container, 'vv');
    const card = container.attributes['class']
        .split(' ')
        .find(cls => cls.startsWith('card_') && cls.length === 6);

    return {
        name: url.attributes['title'],
        image: getImageUrl(firstHtmlChild(url)),
        stars: parseInt(card.substring(5)),
    };
}

export type MaterialWithQuantity = Material & {
    quantity: number,
};

export function extractMaterialAndQuantity(container: HTMLElement, transform: (text: string) => string = undefined): MaterialWithQuantity {
    const text = container.querySelector('.card_text').textContent;

    return {
        ...extractMaterial(container),
        quantity: parseIntWithCommas(transform?.call(undefined, text) ?? text),
    };
}

export function distinctBy<T, K>(it: Iterable<T>, getter: (obj: T) => K): T[] {
    const map = new Map();

    for (const item of it) {
        const key = getter(item);

        if (!map.has(key))
            map.set(key, item);
    }

    return [...map.values()];
}

export function sanitizeName(input: string): string {
    return input.split(/\s|\n/).map(w => w.trim()).filter(w => w.length > 0).join(' ');
}

export function sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
}