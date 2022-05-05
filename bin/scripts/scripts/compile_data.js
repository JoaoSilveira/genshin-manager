"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factors = exports.urls = void 0;
// import { fetchCharacterData } from "./fetchCharacterData";
// import { fetchExperienceData } from "./fetchExperienceData";
const util_1 = require("./util");
require("fs/promises");
const fetchMaterials_1 = require("./fetchMaterials");
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
    character_exp: 'scripts/samples/character-exp.html',
    character_list: 'scripts/samples/character-list.html',
    weapon_exp: 'scripts/samples/weapon-exp.html',
    weapon_list: 'scripts/samples/weapon-list.html',
    weapon_atack_scaling: 'scripts/samples/weapon-attack.html',
    weapon_sub_scaling: 'scripts/samples/weapon-sub.html',
    common_ascension_materials: 'scripts/samples/common-ascension-material.html',
    talent_materials: 'scripts/samples/talent-level-up-material.html',
    character_ascension_meterials: 'scripts/samples/character-ascension-material.html',
    weapon_ascension_meterials: 'scripts/samples/weapon-ascension-material.html',
};
exports.urls = util_1.IsProduction ? prod_urls : debug_urls;
exports.factors = {
    char_exp_to_mora: 5,
    weapon_exp_to_mora: 10,
};
// async function run() {
//     const [characters, experience, [weapons, baseInfo, subInfo]] = await Promise.all([
//         fetchCharacterData(),
//         fetchExperienceData(),
//         fetchWeaponData(),
//     ]);
//     await Promise.all([
//         writeFile('data_test/characters.json', JSON.stringify(characters)),
//         writeFile('data_test/experience.json', JSON.stringify(experience)),
//         writeFile('data_test/weapons.json', JSON.stringify(weapons)),
//         writeFile('data_test/baseInfo.json', JSON.stringify(baseInfo)),
//         writeFile('data_test/subInfo.json', JSON.stringify(subInfo)),
//     ]);
// }
async function run() {
    const ret = await (0, fetchMaterials_1.fetchMaterials)();
    console.log(JSON.stringify(ret));
}
var MaterialType;
(function (MaterialType) {
    MaterialType[MaterialType["Simple"] = 0] = "Simple";
    MaterialType[MaterialType["Experience"] = 1] = "Experience";
    MaterialType[MaterialType["Tiered"] = 2] = "Tiered";
})(MaterialType || (MaterialType = {}));
class Manager {
    constructor() {
        this.materials = new Map();
    }
    idOf(name) {
        return this.materials.get(name)?.id;
    }
    addSimpleMaterial(material) {
        if (this.materials.has(material.description))
            return;
        this.addSimMat({
            name: material.description,
            image: material.image,
        });
    }
    addExpMaterials(materials) {
        (0, util_1.assertArg)(materials.length === 3, "materials", "EXP materials come in packs of 3");
        const tier = {};
        const keys = ['low', 'medium', 'high'];
        for (let i = 0; i < 3; i++) {
            if (this.materials.has(materials[i].description))
                continue;
            tier[keys[i]] = this.addExpMat({
                name: materials[i].description,
                image: materials[i].image,
                experience: materials[i].quantity,
            });
        }
        this.addMatTier(tier);
    }
    addTieredMaterials(materials) {
        const tier = {};
        const keys = ['low', 'medium', 'high', 'highest'];
        const matMap = new Map();
        materials.forEach(v => matMap.set(v.description, v));
        if (matMap.size > keys.length) {
            console.log(matMap);
            throw new util_1.ArgumentError('materials', `Materials have a maximum of 4 tiers, ${matMap.size} materials were given`);
        }
        if (matMap.size < keys.length - 1) {
            console.log(materials);
            throw new util_1.ArgumentError('materials', `Materials have a minimum of 3 tiers, ${matMap.size} materials were given`);
        }
        for (const [material, index] of (0, util_1.enumerate)(matMap.values())) {
            if (this.materials.has(material.description))
                return;
            tier[keys[index]] = this.addSimMat({ name: material.description, image: material.image });
        }
        this.addMatTier(tier);
    }
    addSimMat(data) {
        return this.addMat(data, MaterialType.Simple);
    }
    addExpMat(data) {
        return this.addMat(data, MaterialType.Experience);
    }
    addMatTier(data) {
        return this.addMat(data, MaterialType.Tiered);
    }
    addMat(data, materialType) {
        const id = this.composeMaterialIndex(materialType);
        this.materials.set(data.name ?? '' + id, { id, ...data, });
        return id;
    }
    composeMaterialIndex(materialType) {
        return (this.materials.size << Manager.TAG_SHIFT) | materialType;
    }
    static isSimpleMaterial(mat) {
        return (mat.id & Manager.TAG_MASK) == MaterialType.Simple;
    }
    static isExperienceMaterial(mat) {
        return (mat.id & Manager.TAG_MASK) == MaterialType.Experience;
    }
    static isTieredMaterial(mat) {
        return (mat.id & Manager.TAG_MASK) == MaterialType.Tiered;
    }
}
Manager.TAG_SHIFT = 2;
Manager.TAG_MASK = 3;
// async function run() {
//     const [characters, experience, weapons, baseInfo, subInfo] = await Promise.all<FilesReturnType>([
//         null ?? JSON.parse((await readFile('data_test/characters.json')).toString()),
//         null ?? JSON.parse((await readFile('data_test/experience.json')).toString()),
//         null ?? JSON.parse((await readFile('data_test/weapons.json')).toString()),
//         5555 ?? JSON.parse((await readFile('data_test/baseInfo.json')).toString()),
//         5555 ?? JSON.parse((await readFile('data_test/subInfo.json')).toString()),
//     ]);
//     const manager = new Manager();
//     manager.addExpMaterials(experience.character.expItems);
//     manager.addExpMaterials(experience.weapon.expItems);
//     characters.forEach(c => {
//         const lastAscension = c.ascensionCosts[c.ascensionCosts.length - 1];
//         manager.addSimpleMaterial(lastAscension[0]);
//         manager.addTieredMaterials(c.ascensionCosts.map(a => a[1]));
//         manager.addSimpleMaterial(lastAscension[2]);
//         manager.addTieredMaterials(c.ascensionCosts.map(a => a[3]));
//         if (lastAscension.length > 4) {
//             manager.addSimpleMaterial(lastAscension[4]);
//         }
//         if (Array.isArray(c.talentCosts)) {
//             const lastTalent = c.talentCosts[c.talentCosts.length - 1];
//             manager.addSimpleMaterial(lastTalent[0]);
//             manager.addTieredMaterials(c.talentCosts.map(t => t[1]));
//             manager.addTieredMaterials(c.talentCosts.map(t => t[2]));
//             manager.addSimpleMaterial(lastTalent[3]);
//             manager.addSimpleMaterial(lastTalent[4]);
//         } else {
//             for (const key in c.talentCosts) {
//                 if (Array.isArray(c.talentCosts[key])) {
//                     const talentCosts = c.talentCosts[key] as ImageWithDescriptionAndValue[][];
//                     const lastTalent = talentCosts[talentCosts.length - 1];
//                     manager.addSimpleMaterial(lastTalent[0]);
//                     talentCosts.forEach(t => manager.addSimpleMaterial(t[1]));
//                     talentCosts.forEach(t => manager.addSimpleMaterial(t[2]));
//                     manager.addSimpleMaterial(lastTalent[3]);
//                     manager.addSimpleMaterial(lastTalent[4]);
//                 } else {
//                     const talentMap = c.talentCosts[key] as { [otherKey: string]: ImageWithDescriptionAndValue[][] };
//                     for (const subKey in talentMap) {
//                         const talentCosts = talentMap[subKey] as ImageWithDescriptionAndValue[][];
//                         const lastTalent = talentCosts[talentCosts.length - 1];
//                         manager.addSimpleMaterial(lastTalent[0]);
//                         talentCosts.forEach(t => manager.addSimpleMaterial(t[1]));
//                         talentCosts.forEach(t => manager.addSimpleMaterial(t[2]));
//                         manager.addSimpleMaterial(lastTalent[3]);
//                         manager.addSimpleMaterial(lastTalent[4]);
//                     }
//                 }
//             }
//         }
//     });
//     weapons.filter(w => w.ascension.length === 6).forEach(w => {
//         manager.addSimpleMaterial(w.ascension[0][0]);
//         manager.addTieredMaterials(w.ascension.map(a => a[1]));
//         manager.addTieredMaterials(w.ascension.map(a => a[2]));
//         manager.addTieredMaterials(w.ascension.map(a => a[3]));
//     });
//     console.log(JSON.stringify([...manager.materials.values()]));
// }
run();
//# sourceMappingURL=compile_data.js.map