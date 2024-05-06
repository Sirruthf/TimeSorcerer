import q from '../for_short.js';
import TimeSelection from './Selection.js';
export default class Row {
    _isActive;
    isRanging;
    element;
    selections = [];
    _title = "";
    range_cb = (event) => { };
    end_cb = (event) => { };
    update_cb = () => { };
    constructor(title, isActive, update_cb) {
        this._isActive = false;
        this.isRanging = false;
        let isHeader = false;
        if (update_cb) {
            this.update_cb = update_cb;
            this._isActive = isActive;
        }
        else
            isHeader = true;
        let now = new Date();
        let result = "";
        let row = new Date(now.getFullYear(), now.getMonth(), now.getDay(), now.getHours() + 1);
        console.log(this._isActive);
        result += `<div class="row${isHeader ? " header" : ""}${this._isActive ? " active" : ""}"><div class="name-cell"><div class="name">${title}</div></div>`;
        for (let i = 0; i < 24; i++) {
            result += `<div class='hour' data-hour='${row.getHours()}'>${isHeader ? _24_to_12(row.getHours()).join(" ") : ""}</div>`;
            row.setHours(row.getHours() + 1);
        }
        result += "</div>";
        this.element = q.tmplt(result).raw;
        this.element.addEventListener("click", (event) => this.manageSelection(event));
        window.addEventListener("resize", () => {
            this.selections.forEach(item => item.startUpdateInstant());
            this.selections.forEach(item => item.update());
            setTimeout(() => this.selections.forEach(item => item.endUpdateInstant()));
        });
    }
    init(data) {
        for (let entry of data) {
            this.selections.push(new TimeSelection(this.element, () => this.cellStart, entry.start, entry.end, () => this.step));
            this.markCell(entry.start, "from");
            this.markCell(entry.end, "til");
        }
    }
    get name() {
        return this._title;
    }
    set name(value) {
        this._title = value;
        (this.element.firstElementChild?.firstElementChild).innerHTML = value;
    }
    set isActive(value) {
        this._isActive = value;
        value ?
            this.element.classList.add("active") :
            this.element.classList.remove("active");
    }
    get isActive() {
        return this._isActive;
    }
    get step() {
        if (!this.element.querySelector(".hour").getBoundingClientRect().width)
            throw new Error("Unitialized element");
        return this.element.querySelector(".hour").getBoundingClientRect().width;
    }
    get cellStart() {
        return this.element.querySelector(".hour").offsetLeft;
    }
    get tableStart() {
        return this.element.getBoundingClientRect().left;
    }
    nthCell(index) {
        return this.element.querySelector(`.hour:nth-child(${index + 2})`);
    }
    clearCell(index) {
        this.nthCell(index).classList.remove("selected");
        this.nthCell(index).innerHTML = "";
    }
    markCell(index, type) {
        let cell = this.nthCell(index);
        cell.classList.add("selected");
        if (type == "from") {
            let [time, qual] = _24_to_12(parseInt(cell.dataset.hour || ""));
            cell.innerHTML = `<h3>from<div class='time'>${time}</div>${qual}</h3>`;
        }
        else {
            let [time, qual] = _24_to_12(parseInt(cell.dataset.hour || "") + 1);
            cell.innerHTML = `<h3>'til<div class='time'>${time}</div>${qual}</h3>`;
        }
    }
    toIndex(offset) {
        return intToInd(offset - this.tableStart - this.cellStart, this.step);
    }
    selectionsBetween(from, to, active = null) {
        let result = [];
        for (let i = from; i < to; i++) {
            let item = this.selectionAt(i, active);
            if (!item)
                continue;
            if (!(item.start > from && item.end <= to))
                continue;
            result.push(item);
        }
        return result;
    }
    selectionAt(index, active = null) {
        let result = null;
        for (let i = 0; i < this.selections.length; i++) {
            if ((this.selections[i].start <= index && this.selections[i].end >= index) &&
                (!active || active && this.selections[i] != active)) {
                if (result !== null)
                    throw new Error("Overlapping selections?");
                result = this.selections[i];
            }
        }
        return result;
    }
    removeSelection(x_x) {
        this.selections = this.selections.filter(item => item != x_x);
        x_x.remove();
    }
    manageSelection(event) {
        if (!this.isActive)
            return;
        if (this.isRanging)
            return;
        this.isRanging = true;
        let startX = event.clientX;
        let startI = this.toIndex(startX);
        let activeSelection = this.selectionAt(startI);
        if (!activeSelection) {
            activeSelection = new TimeSelection(this.element, () => this.cellStart, startI, startI, () => this.step);
            this.selections.push(activeSelection);
        }
        else {
            [this.nthCell(activeSelection.start), this.nthCell(activeSelection.end)].forEach(item => {
                item.classList.remove("selected");
                item.innerHTML = "";
            });
            [activeSelection.start, activeSelection.end] = [
                startI, startI
            ];
        }
        this.markCell(startI, "from");
        this.range_cb = (event) => {
            let endI = this.toIndex(event.clientX);
            event.clientX < startX ?
                this.markCell(startI, "til") :
                this.markCell(startI, "from");
            [activeSelection.start, activeSelection.end] = event.clientX < startX ? [
                endI, startI
            ] : [
                startI, endI
            ];
        };
        this.end_cb = (event) => {
            this.endSelectionManage(activeSelection, startI, event);
        };
        this.element.addEventListener("mousemove", this.range_cb);
        setTimeout(() => this.element.addEventListener("click", this.end_cb));
    }
    endSelectionManage(activeSelection, startI, event) {
        let endI = this.toIndex(event.clientX);
        if (startI == endI)
            return;
        this.isRanging = false;
        this.element.removeEventListener("mousemove", this.range_cb);
        this.element.removeEventListener("click", this.end_cb);
        let overlap = this.selectionAt(endI, activeSelection);
        let overshadow = this.selectionsBetween(startI, endI, activeSelection);
        for (let sub of overshadow) {
            if (sub == activeSelection)
                continue;
            this.removeSelection(sub);
            this.clearCell(sub.start);
            this.clearCell(sub.end);
        }
        if (!overlap) {
            if (this.update_cb)
                this.update_cb(this.name, this.selections);
            endI > startI ?
                this.markCell(endI, "til") :
                this.markCell(endI, "from");
            return;
        }
        this.clearCell(startI);
        this.removeSelection(activeSelection);
        this.processOverlap(startI, endI, overlap);
        if (this.update_cb)
            this.update_cb(this.name, this.selections);
    }
    ;
    processOverlap(startI, endI, overlap) {
        if (startI < endI) {
            if (endI < overlap.start) {
                this.clearCell(overlap.start);
                overlap.start = startI;
                this.markCell(startI, "from");
                console.log("a < b < c < d");
            }
            else {
                if (startI >= overlap.end) {
                    this.clearCell(overlap.end);
                    overlap.end = endI;
                    this.markCell(endI, "til");
                    console.log("c < d < a < b");
                }
                else if (startI < overlap.start) {
                    this.clearCell(overlap.start);
                    overlap.start = startI;
                    this.markCell(startI, "from");
                    console.log("a < c < b < d");
                }
                else if (startI > overlap.start) {
                    this.clearCell(overlap.end);
                    overlap.end = endI;
                    this.markCell(endI, "til");
                    console.log("c < a < d < b");
                }
                else {
                    throw new Error("should be handled above");
                }
            }
        }
        else {
            if (startI < overlap.start) {
                this.clearCell(overlap.start);
                overlap.start = endI;
                this.markCell(endI, "from");
                console.log("b < a < c < d");
            }
            else {
                if (endI >= overlap.end) {
                    this.clearCell(overlap.end);
                    overlap.end = startI;
                    this.markCell(startI, "til");
                    console.log("c < d < b < a");
                }
                else if (endI < overlap.start) {
                    this.clearCell(overlap.start);
                    overlap.start = endI;
                    this.markCell(endI, "from");
                    console.log("b < c < a < d");
                }
                else if (endI > overlap.start) {
                    this.clearCell(overlap.end);
                    overlap.end = startI;
                    this.markCell(startI, "til");
                    console.log("c < b < d < a");
                }
                else {
                    throw new Error("should be handled above");
                }
            }
        }
    }
}
function intToInd(value, step) {
    return Math.trunc(value / step);
}
function _24_to_12(_24) {
    let _12 = _24 % 12;
    let str = _24 >= 12 ? "pm" : "am";
    return [_12, str];
}
//# sourceMappingURL=Row.js.map