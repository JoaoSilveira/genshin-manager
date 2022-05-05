"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWeaponData = void 0;
const compile_data_1 = require("./compile_data");
const util_1 = require("./util");
const extractWeaponList_1 = require("./extractWeaponList");
async function fetchWeaponData() {
    return await Promise.all([
        (0, extractWeaponList_1.extractWeaponList)(),
        fetchBaseAttackInfo(),
        fetchSubInfo(),
    ]);
}
exports.fetchWeaponData = fetchWeaponData;
async function fetchBaseAttackInfo() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.weapon_atack_scaling);
    const data = {};
    for (let i = 5; i > 0; i--) {
        let table = (0, util_1.traverseElement)(doc.querySelector(`#${i}-Star_Weapons`), '^>');
        data[`${i} Stars`] = [];
        while (table?.tagName === 'TABLE') {
            const handle = (0, util_1.traverseElement)(table, 'vv');
            const { description: weaponBaseType, values: levels } = parseWeaponStatusRow(handle);
            const { values: beforeAscension } = parseWeaponStatusRow(handle.nextElementSibling);
            const { values: afterAscension } = parseWeaponStatusRow(handle.nextElementSibling.nextElementSibling);
            data[`${i} Stars`].push({
                baseType: weaponBaseType,
                levels,
                beforeAscension,
                afterAscension,
            });
            table = table.nextElementSibling;
        }
    }
    return data;
}
function parseWeaponStatusRow(row) {
    let [description, ...values] = [...(0, util_1.htmlChildren)(row)].map(el => el.textContent.trim());
    return {
        description,
        values: values.map(v => {
            // normal value
            let value = parseInt(v);
            if (isNaN(value)) {
                // Lv. values
                value = parseInt(v.substring(3));
            }
            // N/A values
            return isNaN(value) ? null : value;
        }),
    };
}
async function fetchSubInfo() {
    const doc = await (0, util_1.fetchPage)(compile_data_1.urls.weapon_sub_scaling);
    const percHandle = (0, util_1.traverseElement)(doc.querySelector('#Percentage_Value_Growth_Pattern'), '^>v');
    const [percFirst, ...percValues] = [...(0, util_1.htmlChildren)(percHandle)].map(row => [...(0, util_1.htmlChildren)(row)].map(el => el.textContent.trim()));
    const absHandle = (0, util_1.traverseElement)(doc.querySelector('#Elemental_Mastery_Growth_Pattern'), '^>v');
    const [absFirst, ...absValues] = [...(0, util_1.htmlChildren)(absHandle)].map(row => [...(0, util_1.htmlChildren)(row)].map(el => el.textContent.trim()));
    return {
        percentual: {
            levels: percFirst.map((lvl, i) => i === 0 ? 1 : parseInt(lvl.substring(3))),
            values: percValues.map(row => row.map(v => parseFloat(v))),
        },
        absolute: {
            levels: absFirst.map((lvl, i) => i === 0 ? 1 : parseInt(lvl.substring(3))),
            values: absValues.map(row => row.map(v => parseFloat(v))),
        },
    };
}
//# sourceMappingURL=fetchWeaponData.js.map