import { createWriteStream, mkdirSync } from 'fs';
import { dirname } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { get as httpGet } from 'https';

type ObjectImageExtractor = {
    path: string[],
    description: string,
    image: string,
};

function extractor(path: string[], description: string = 'name', image: string = 'image'): ObjectImageExtractor {
    return {
        path,
        description,
        image,
    };
}

function get(obj: object, props: string[]): any {
    for (const prop of props) {
        if (obj == null) return obj;

        obj = obj[prop];
    }

    return obj;
}

function processName(name: string): string {
    return name.replaceAll(/[^\da-z]/gi, '_').toLowerCase();
}

async function readData(): Promise<object> {
    const data = JSON.parse((await readFile('data_test/genshin_data.json')).toString());

    return data;
}

async function downloadImage(url: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`fetching ${path}`);

        httpGet(url, res => {
            if (res.statusCode === 200) {
                mkdirSync(dirname(path), { recursive: true });

                res.pipe(createWriteStream(path))
                    .on('error', reject)
                    .once('close', () => resolve());
            } else {
                res.resume();
                reject(new Error(`Request failed with status ${res.statusCode} for url ${url}`));
            }
        });
    });
}

async function run(): Promise<void> {
    const data = await readData();

    const pairs: [ObjectImageExtractor, string][] = [
        [extractor(['items']), 'items'],
        [extractor(['elements'], 'description'), 'elements'],
        [extractor(['weapon', 'list']), 'weapons'],
        [extractor(['weapon', 'types'], 'description'), 'weapons'],
        [extractor(['character', 'list']), 'characters'],
    ];

    for (const [ext, out] of pairs) {
        const list: object[] = get(data, ext.path);

        for (const item of list) {
            if (!((ext.image in item) && (ext.description in item))) {
                continue;
            }

            item[ext.image] = item[ext.image].substring('docs/'.length);

            // try {
            //     await downloadImage(item[ext.image], `docs/images/${out}/${processName(item[ext.description])}.png`);
            // } catch (e) {
            //     console.error(e);
            // }
        }

        // const promises = list.filter(i => (ext.image in i) && (ext.description in i))
        //     .map(i => [i[ext.image], `docs/images/${out}/${processName(i[ext.description])}.png`])
        //     .map(t => downloadImage.apply(undefined, t));

        // const settled = await Promise.allSettled(promises);

        // settled.filter(s => s.status === 'rejected')
        //     .forEach(s => console.log((s as PromiseRejectedResult).reason));
    }

    await writeFile('data_test/genshin_data.json', JSON.stringify(data));
}

run();