import { readable } from "svelte/store";
import genshinDataTransform from "../lib/genshinDataTransform";

const store = readable<GenshinDataExpanded>(undefined, (set) => {
    fetch("./genshin_data.json")
        .then((r) => r.json() as unknown as GenshinDataPristine)
        .then((d) => genshinDataTransform(d))
        .then((value) => set(value));
});

export default store;