import type { ActionReturn } from 'svelte/action';
import { isClickInside } from "./lib/util";


export function clickOutsideDialog(node: HTMLDialogElement): ActionReturn<void, { 'on:outsideclick': (e: CustomEvent<MouseEvent>) => void; }> {
    function closeIfClickOutside(event: MouseEvent): void {
        if (!isClickInside(node.getBoundingClientRect(), event)) {
            node.dispatchEvent(new CustomEvent("outsideclick"));
        }
    }

    node.addEventListener("click", closeIfClickOutside, true);

    return {
        destroy() {
            node.removeEventListener("click", closeIfClickOutside, true);
        },
    };
}