import { readable } from "svelte/store";
import genshinDataTransform from "../lib/genshinDataTransform";

export default readable<GenshinDataExpanded>(undefined, (set) => {
    fetch("./genshin_data.json")
        .then((r) => r.json() as unknown as GenshinDataPristine)
        .then((d) => genshinDataTransform(d))
        .then((value) => set(value));
});