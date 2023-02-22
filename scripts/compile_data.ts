// import { fetchCharacterData } from "./fetchCharacterData";
// import { fetchExperienceData } from "./fetchExperienceData";
import { ArgumentError, assertArg, enumerate, IsProduction } from "./util";
import { readFile, writeFile } from 'fs/promises';
import { fetchWeaponData } from "./fetchWeaponData";
import { fetchExperienceData } from "./fetchExperienceData";
import { fetchCharacterData } from "./fetchCharacterData";
import { fetchMaterials } from "./fetchMaterials";
import { Manager, WeaponBaseManager } from "./Manager";

const prod_urls = {
    character_exp: 'https://genshin-impact.fandom.com/wiki/Character_EXP',
    character_list: 'https://genshin-impact.fandom.com/wiki/Characters/List',
    weapon_exp: 'https://genshin-impact.fandom.com/wiki/Weapon_EXP',
    weapon_list: 'https://genshin-impact.fandom.com/wiki/Weapons/List',
    weapon_atack_scaling: 'https://genshin-impact.fandom.com/wiki/Weapons/Base_Attack_Scaling',
    weapon_sub_scaling: 'https://genshin-impact.fandom.com/wiki/Weapons/Sub_Stat_Scaling',
    common_ascension_materials: 'https://genshin-impact.fandom.com/wiki/Common_Ascension_Materials',
    talent_materials: 'https://genshin-impact.fandom.com/wiki/Talent_Level-Up_Materials',
    character_ascension_meterials: 'https://genshin-impact.fandom.com/wiki/Character_Ascension_Materials',
    weapon_ascension_meterials: 'https://genshin-impact.fandom.com/wiki/Weapon_Ascension_Materials',
};

const debug_urls = {
    character_exp: 'samples/character-exp.html',
    character_list: 'samples/character-list.html',
    weapon_exp: 'samples/weapon-exp.html',
    weapon_list: 'samples/weapon-list.html',
    weapon_atack_scaling: 'samples/weapon-attack.html',
    weapon_sub_scaling: 'samples/weapon-sub.html',
    common_ascension_materials: 'samples/common-ascension-material.html',
    talent_materials: 'samples/talent-level-up-material.html',
    character_ascension_meterials: 'samples/character-ascension-material.html',
    weapon_ascension_meterials: 'samples/weapon-ascension-material.html',
};

export const urls = IsProduction ? prod_urls : debug_urls;

export const factors = {
    char_exp_to_mora: 5,
    weapon_exp_to_mora: 10,
};

async function build() {
    return Promise.all([
        fetchCharacterData().then(data => writeFile('data_test/characters.json', JSON.stringify(data))),
        false && fetchExperienceData().then(data => writeFile('data_test/experience.json', JSON.stringify(data))),
        false && fetchWeaponData()
            .then(([weapons, baseInfo, subInfo]) => Promise.all([
                writeFile('data_test/weapons.json', JSON.stringify(weapons)),
                writeFile('data_test/baseInfo.json', JSON.stringify(baseInfo)),
                writeFile('data_test/subInfo.json', JSON.stringify(subInfo)),
            ])),
        false && fetchMaterials().then(data => writeFile('data_test/materials.json', JSON.stringify(data))),
    ]);
}

type FilesReturnType = [
    AsyncReturnType<typeof fetchCharacterData>,
    AsyncReturnType<typeof fetchExperienceData>,
    AsyncReturnType<typeof fetchWeaponData>['0'],
    AsyncReturnType<typeof fetchWeaponData>['1'],
    AsyncReturnType<typeof fetchWeaponData>['2'],
    AsyncReturnType<typeof fetchMaterials>,
];

async function transform() {
    const [characters, experience, weapons, baseInfo, subInfo, materials] = await Promise.all<FilesReturnType>([
        null ?? JSON.parse((await readFile('data_test/characters.json')).toString()),
        null ?? JSON.parse((await readFile('data_test/experience.json')).toString()),
        null ?? JSON.parse((await readFile('data_test/weapons.json')).toString()),
        null ?? JSON.parse((await readFile('data_test/baseInfo.json')).toString()),
        null ?? JSON.parse((await readFile('data_test/subInfo.json')).toString()),
        null ?? JSON.parse((await readFile('data_test/materials.json')).toString()),
    ]);

    // const subs = weapons
    //     .filter(w => w.sub !== 'Elemental Mastery')
    //     .filter(w => w.subScaling != null)
    //     .reduce((un: number[][], w) => {
    //         const l = w.subScaling;
    //         const contains = un.some(sub => l.every((v, i) => v === sub[i]));
    //         if (!contains) {
    //             un.push(l);
    //         }

    //         return un;
    //     }, [])
    //     .sort((a, b) => {
    //         for (let i = 0; i < a.length; i++) {
    //             if (a[i] !== b[i]) {
    //                 return a[i] - b[i]
    //             }
    //         }
    //         return 0;
    //     });
    // console.log(JSON.stringify(subs));

    const manager = new Manager(characters, materials, [weapons, baseInfo, subInfo], experience);

    await writeFile('data_test/genshin_data.json', JSON.stringify(manager.serialize()));
}

// fetchWeaponData().then(r => console.log(JSON.stringify(r, undefined, 2)), console.error);
// build();
transform();