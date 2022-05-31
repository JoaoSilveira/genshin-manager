import type { StartStopNotifier, Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";
import { SubscriberManager } from "../lib/SubscriberManager";

export type Revive<T> = (json: any) => T;
export type PersistenceConfig<T> = {
    parse: (value: string) => T,
    stringify: (value: T) => string,
};

export default function localStorageStore<T>(key: string, value?: T, start?: StartStopNotifier<T>, config?: PersistenceConfig<T>): Writable<T> {
    const subs = new SubscriberManager<T>();

    (() => {
        let stored = localStorage.getItem(key);
        if (stored) {
            value = config != null ? config.parse(stored) : JSON.parse(stored);
        } else {
            localStorage.setItem(key, config != null ? config.stringify(value) : JSON.stringify(value));
        }
    })();

    return {
        set,
        subscribe,
        update: (updater: Updater<T>) => void (set(updater(value))),
    };

    function set(newValue: T): void {
        if (newValue === value) return;

        value = newValue;
        localStorage.setItem(key, config != null ? config.stringify(value) : JSON.stringify(value));
        subs.notify(value);
    }

    function subscribe(sub: Subscriber<T>): Unsubscriber {
        let emptyNotifier = undefined;

        if (subs.length === 0)
            emptyNotifier = start?.call(undefined, set);

        subs.subscribe(sub);
        sub(value);

        return () => {
            subs.unsubscribe(sub);

            if (subs.length === 0) {
                emptyNotifier?.call();
                emptyNotifier = undefined;
            }
        };
    }
}