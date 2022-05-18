import type { Readable } from "svelte/store";

export function waitForValue<T>(store: Readable<T>): Promise<T> {
    let unsub: ReturnType<Readable<T>['subscribe']>;

    return new Promise((resolve) => {
        unsub = store.subscribe((v) => {
            if (v == null) return;

            resolve(v);
        });
    })
        .then((value: T) => {
            unsub();
            return value;
        });
}