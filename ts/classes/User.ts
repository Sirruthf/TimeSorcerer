import { RangeList, UserData, timestamp } from "../types";

export default class User {
    name: string;
    timezone: number;
    data: RangeList;
    tables: RangeList[] = [];
    image: string;

    constructor (init: UserData) {
        this.name = init.name ?? "";
        this.timezone = init.timezone ?? 0;
        this.data = init.data ?? [];
        this.image = init.image ?? this.name.toLowerCase();
    }
    
    spliceData (ranges: timestamp[][]) {
        this.tables = [];

        for (let range of ranges) {
            this.tables.push(this.getInRange(range));
        }
    }

    getInRange (range: timestamp[]): RangeList {
        let result = [];

        for (let entry of this.data) {
            if (range.includes(entry.start) || range.includes(entry.end)) {
                
                result.push({
                    start: clampTimestamp(entry.start, range[0], range[range.length - 1]),
                    end: clampTimestamp(entry.end, range[0], range[range.length - 1])
                });
            }
        }

        return result;
    }
}

function clampTimestamp (target: timestamp, lb: timestamp, rb: timestamp) {
    return target < lb ? lb : target > rb ? rb : target;
}