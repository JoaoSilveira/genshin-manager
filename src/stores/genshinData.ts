import { readable } from "svelte/store";
import genshinDataTransform from "../lib/genshinDataTransform";
import pristine from '../../data_test/genshin_data.json';

const genshinData = genshinDataTransform(pristine as unknown as GenshinDataPristine);

export default genshinData;