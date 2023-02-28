export function arrayToObject<TIn, TOut>(arr: TIn[], func: (item: TIn, index: number, array: TIn[]) => [string, TOut]): Record<string, TOut> {
    return arr.reduce(
        (obj, ...rest) => {
            const [key, value] = func.apply(undefined, rest);

            obj[key] = value;

            return obj;
        },
        {},
    );
}

export function sum(arr: number[]): number {
    return arr.reduce((acc, v) => acc + v, 0);
}

export function isNil(value: any): value is null | undefined {
    return value == null;
}

export function deepClone<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(v => deepClone(v)) as unknown as T;
    }

    if (typeof value === 'object') {
        const clone: Partial<T> = {};
        for (const key in value) {
            clone[key] = deepClone(value[key]);
        }

        return clone as T;
    }

    return value;
}

export function isClickInside(rect: DOMRect, point: { clientX: number, clientY: number }): boolean {
    return point.clientX >= rect.left &&
        point.clientY >= rect.top &&
        point.clientX <= (rect.left + rect.width) &&
        point.clientY <= (rect.top + rect.height);
}