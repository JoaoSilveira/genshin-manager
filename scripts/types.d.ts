declare type RowToExtend<P> = {
    url: string,
    data: P,
};

declare type ImageWithDescription = {
    description: string,
    image: string,
};

declare type ImageWithDescriptionAndValue = ImageWithDescription & {
    quantity: number;
};