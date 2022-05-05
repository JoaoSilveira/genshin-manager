"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumerate = exports.assertArg = exports.ArgumentError = exports.linkFromPath = exports.getImageUrl = exports.findNextByTag = exports.traverseElement = exports.indexInParent = exports.nthHtmlChild = exports.lastHtmlChild = exports.firstHtmlChild = exports.htmlChildren = exports.parseIntWithCommas = exports.requireStringValue = exports.getTextWithBr = exports.fetchPage = exports.IsProduction = void 0;
const node_html_parser_1 = require("node-html-parser");
const axios_1 = __importDefault(require("axios"));
const promises_1 = require("fs/promises");
exports.IsProduction = false;
function isSuccess(request) {
    return Math.floor(request.status / 100) == 2;
}
async function fetchPage(url) {
    if (!exports.IsProduction) {
        return (0, node_html_parser_1.parse)((await (0, promises_1.readFile)(url)).toString());
    }
    const response = await axios_1.default.get(url);
    if (!isSuccess(response)) {
        throw new Error(`Failed to fetch url (${url}): ${response.statusText}`);
    }
    return (0, node_html_parser_1.parse)(response.data);
}
exports.fetchPage = fetchPage;
function getTextWithBr(element) {
    if (!element) {
        return undefined;
    }
    return element.childNodes
        .map(c => c.nodeType === node_html_parser_1.NodeType.ELEMENT_NODE && c.tagName === 'BR' ? '\n' : c.textContent)
        .join('');
}
exports.getTextWithBr = getTextWithBr;
function requireStringValue(value) {
    return value === '' || value == null ? undefined : value;
}
exports.requireStringValue = requireStringValue;
function parseIntWithCommas(number) {
    return parseInt(number.replace(',', ''));
}
exports.parseIntWithCommas = parseIntWithCommas;
function* htmlChildren(element) {
    for (const child of element.childNodes) {
        if (child.nodeType == node_html_parser_1.NodeType.ELEMENT_NODE) {
            yield child;
        }
    }
}
exports.htmlChildren = htmlChildren;
function firstHtmlChild(element) {
    if (!element) {
        return undefined;
    }
    return htmlChildren(element).next().value;
}
exports.firstHtmlChild = firstHtmlChild;
function lastHtmlChild(element) {
    if (!element) {
        return undefined;
    }
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const child = element.childNodes[i];
        if (child.nodeType === node_html_parser_1.NodeType.ELEMENT_NODE) {
            return child;
        }
    }
}
exports.lastHtmlChild = lastHtmlChild;
function nthHtmlChild(element, n) {
    if (!element) {
        return undefined;
    }
    if (n < 0) {
        throw new Error('Negative index for element child');
    }
    for (const child of htmlChildren(element)) {
        if (n === 0) {
            return child;
        }
        n--;
    }
    if (n > 0) {
        throw new Error('Index out of bounds');
    }
}
exports.nthHtmlChild = nthHtmlChild;
function indexInParent(element) {
    let index = 0;
    for (const el of htmlChildren(element.parentNode)) {
        if (el === element) {
            return index;
        }
        index++;
    }
}
exports.indexInParent = indexInParent;
function traverseElement(element, movements) {
    const traverseFunctions = {
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
    return element;
}
exports.traverseElement = traverseElement;
function findNextByTag(element, tagName) {
    if (!element) {
        return undefined;
    }
    do {
        element = element.nextElementSibling;
    } while (element != null && element.tagName !== tagName);
    return element;
}
exports.findNextByTag = findNextByTag;
function getImageUrl(img) {
    const url = img.attributes['src'];
    if (url?.startsWith('https://')) {
        return url;
    }
    return img.attributes['data-src'];
}
exports.getImageUrl = getImageUrl;
function linkFromPath(path) {
    return `https://genshin-impact.fandom.com${path}`;
}
exports.linkFromPath = linkFromPath;
class ArgumentError extends Error {
    constructor(param, message) {
        super(message);
        this.param = param;
    }
}
exports.ArgumentError = ArgumentError;
function assertArg(valid, param, message) {
    if (!valid) {
        throw new ArgumentError(param, message);
    }
}
exports.assertArg = assertArg;
function* enumerate(it) {
    let i = 0;
    for (const v of it) {
        yield [v, i++];
    }
}
exports.enumerate = enumerate;
//# sourceMappingURL=util.js.map