import type { Readable } from "svelte/store";

export function waitForValue<T>(store: Readable<T>): Promise<T> {
    return new Promise((resolve) => {
        const unsub = store.subscribe((v) => {
            if (v === undefined) return;

            unsub();
            resolve(v);
        });
    });
}