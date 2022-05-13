export default function deepClone<T>(value: T): T {
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