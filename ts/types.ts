export type UserData = {
    name?: string,
    timezone?: number,
    data?: RangeList[],
};

export type RangeList = {
    start: idx,
    end: idx
}[];

export type px = number & { _brand: "px" };
export type idx = number & { _brand: "idx" };