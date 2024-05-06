export type UserData = {
    name?: string,
    timezone?: number,
    data?: RangeList,
};

export type RangeList = {
    start: timestamp,
    end: timestamp
}[];

export type px = number & { _brand: "px" };
export type idx = number & { _brand: "idx" };
export type timestamp = number & { _brand: "timestamp" }