export default class User {
    name;
    timezone;
    data;
    tables = [];
    constructor(init) {
        this.name = init.name ?? "";
        this.timezone = init.timezone ?? 0;
        this.data = init.data ?? [];
    }
    spliceData(ranges) {
        this.tables = [];
        for (let range of ranges) {
            this.tables.push(this.getInRange(range));
        }
    }
    getInRange(range) {
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
function clampTimestamp(target, lb, rb) {
    return target < lb ? lb : target > rb ? rb : target;
}
//# sourceMappingURL=User.js.map