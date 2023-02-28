import { urls } from "./compile_data";
import { fetchPage, htmlChildren, traverseElement } from "./util";
import type { HTMLElement } from 'node-html-parser';
import { extractWeaponList, type Weapon } from "./extractWeaponList";

export async function fetchWeaponData(): Promise<[Weapon[], BaseAttackInfo, SubStatusInfo]> {
    return await Promise.all([
        extractWeaponList(),
        fetchBaseAttackInfo(),
        fetchSubInfo(),
    ]);
}

type BaseAttackInfo = {
    [stars: string]: {
        baseType: string,
        levels: number[],
        beforeAscension: number[],
        afterAscension: number[],
    }[],
}

async function fetchBaseAttackInfo(): Promise<BaseAttackInfo> {
    try {
        const doc = await fetchPage(urls.weapon_atack_scaling);
        const data: BaseAttackInfo = {};

        for (let i = 5; i > 0; i--) {
            let table = traverseElement(doc.querySelector(`#${i}-Star_Weapons`), '^>');
            data[`${i} Stars`] = [];

            while (table?.tagName === 'TABLE') {
                const handle = traverseElement(table, 'vv');

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
    } catch (err) {
        throw new Error(`fetchBaseAttackInfo: ${err}`);
    }
}

type WeaponStatusRow = {
    description: string,
    values: (number | null)[]
};

function parseWeaponStatusRow(row: HTMLElement): WeaponStatusRow {
    let [description, ...values] = [...htmlChildren(row)].map(el => el.textContent.trim());

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

type SubStatusInfo = {
    percentual: {
        levels: number[],
        values: number[][],
    },
    absolute: {
        levels: number[],
        values: number[][],
    },
}

async function fetchSubInfo(): Promise<SubStatusInfo> {
    try {
        const doc = await fetchPage(urls.weapon_sub_scaling);

        const percHandle = traverseElement(doc.querySelector('#Percentage_Value_Growth_Pattern'), '^>v');
        const [percFirst, ...percValues] = [...htmlChildren(percHandle)].map(row => [...htmlChildren(row)].map(el => el.textContent.trim()));

        const absHandle = traverseElement(doc.querySelector('#Elemental_Mastery_Growth_Pattern'), '^>v');
        const [absFirst, ...absValues] = [...htmlChildren(absHandle)].map(row => [...htmlChildren(row)].map(el => el.textContent.trim()));

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
    } catch (err) {
        throw new Error(`fetchSubInfo: ${err}`);
    }
}