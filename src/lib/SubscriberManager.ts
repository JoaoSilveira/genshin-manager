import type { Subscriber } from "svelte/store";

export class SubscriberManager<T> {
    private subs: Set<Subscriber<T>> = new Set();

    public get length(): number {
        return this.subs.size;
    }

    subscribe(sub: Subscriber<T>): void {
        this.subs.add(sub);
    }

    unsubscribe(sub: Subscriber<T>): void {
        this.subs.delete(sub);
    }

    notify(value: T): void {
        this.subs.forEach(sub => sub(value));
    }
}
