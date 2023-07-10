import { createWriteStream, mkdirSync, existsSync } from 'fs';
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
    name = name.replace(/[^\da-z]/gi, '_').toLowerCase();

    while (name[0] === '_') {
        name = name.substring(1);
    }

    while (name[name.length - 1] === '_') {
        name = name.substring(0, name.length - 1);
    }

    return name;
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

function fileExtensionFromUrl(value: string): string {
    const dotIndex = value.lastIndexOf('.');

    return dotIndex < 0 ? null : value.substring(dotIndex + 1);
}

export async function run(): Promise<void> {
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

            const extension = fileExtensionFromUrl(item[ext.image]) ?? 'png';
            const output_path = `docs/images/${out}/${processName(item[ext.description])}.${extension}`;
            if (!existsSync(output_path)) {
                try {
                    await downloadImage(item[ext.image], output_path);
                } catch (e) {
                    console.error(e);
                    continue;
                }
            }

            item[ext.image] = output_path.substring('docs/'.length);
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

// run();