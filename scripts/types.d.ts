declare type RowToExtend<P> = {
    url: string,
    data: P,
};

declare type ImageWithDescription = {
    description: string,
    image: string,
};

declare type AsyncReturnType<T extends (...args: any[]) => any> =
    T extends (...args: any[]) => Promise<infer R> ? R
    : T extends (...args: any[]) => infer R1 ? R1 : any;