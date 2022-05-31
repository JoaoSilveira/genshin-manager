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