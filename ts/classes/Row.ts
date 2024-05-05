import q from '../for_short.js';
import { UserData, idx, px } from '../types.js';
import TimeSelection from './Selection.js';


type update_cb_t = (user: UserData, data: TimeSelection[]) => void;


export default class Row {
    _isActive: boolean;
    isRanging: boolean;
    element: HTMLElement;
    selections: TimeSelection[] = [];
    userData: UserData | null = null;
    _title: string = "";
    range_cb = (event: MouseEvent) => {};
    end_cb = (event: MouseEvent) => {};
    update_cb: update_cb_t = () => {};

    constructor (title: string, isHeader: true);
    constructor (title: string, isActive: boolean, update_cb: update_cb_t);
    constructor (title: string, isActive: boolean, update_cb?: update_cb_t) {
        this._isActive = false;
        this.isRanging = false;
        let isHeader = false;

        if (update_cb) {
            this.update_cb = update_cb;
            this._isActive = isActive;
        } else
            isHeader = true;

        let now = new Date();
        let result: string = "";
        let row = new Date(now.getFullYear(),
            now.getMonth(), now.getDay(), now.getHours() + 1);

        result += `<div class="row${isHeader ? " header" : ""}${this._isActive ? " active" : ""}"><div class="name-cell"><div class="name">${title}</div></div>`;
        
        for (let i = 0; i < 24; i++) {
            result += `<div class='hour' data-hour='${row.getHours()}'>${isHeader ? _24_to_12(row.getHours()).join(" ") : ""}</div>`;
            row.setHours(row.getHours() + 1);
        }
        
        result += "</div>";

        this.element = q.tmplt(result).raw as HTMLElement;

        this.element.addEventListener("click",
            (event: MouseEvent) => this.manageSelection(event));
    }

    init (data: UserData) {
        this.name = data.name ?? this.name;
        this.userData = data;

        for (let entry of data.data ?? []) {
            this.selections.push(new TimeSelection(
                this.element, this.cellStart, entry.start, entry.end, this.step
            ));
            this.markCell(entry.start, "from");
            this.markCell(entry.end, "til");
        }
    }

    get name () {
        return this._title;
    }

    set name (value: string) {
        this._title = value;
        (this.element.firstElementChild?.firstElementChild as HTMLElement).innerHTML = value;
    }

    set isActive (value: boolean) {
        this._isActive = value;
        value ?
            this.element.classList.add("active") : 
            this.element.classList.remove("active");
    }

    get isActive () {
        return this._isActive;
    }

    get step () {
        if (!(this.element.querySelector(".hour") as HTMLElement).getBoundingClientRect().width) throw new Error("Unitialized element");
        return (this.element.querySelector(".hour") as HTMLElement).getBoundingClientRect().width as px;
    }

    get cellStart () {
        return (this.element.querySelector(".hour") as HTMLElement).offsetLeft as px;
    }

    get tableStart () {
        return this.element.getBoundingClientRect().left;
    }

    nthCell (index: idx) {
        return this.element.querySelector(`.hour:nth-child(${index + 2})`) as HTMLElement;
    }

    clearCell (index: idx) {
        this.nthCell(index).classList.remove("selected");
        this.nthCell(index).innerHTML = "";
    }

    markCell (index: idx, type: "from" | "til") {
        let cell = this.nthCell(index);
        cell.classList.add("selected");
        if (type == "from") {
            let [time, qual] = _24_to_12(parseInt(cell.dataset.hour || ""));
            cell.innerHTML = `<h3>from<div class='time'>${time}</div>${qual}</h3>`;
        } else {
            let [time, qual] = _24_to_12(parseInt(cell.dataset.hour || "") + 1);
            cell.innerHTML = `<h3>'til<div class='time'>${time}</div>${qual}</h3>`;
        }
    }

    toIndex (offset: px): idx {
        return intToInd(offset - this.tableStart - this.cellStart, this.step);
    }

    selectionsBetween (from: idx, to: idx, active: TimeSelection | null = null): TimeSelection[] {
        let result: TimeSelection[] = [];

        for (let i = from; i < to; i++) {
            let item = this.selectionAt(i, active);
            if (!item) continue;
            if (!(item.start > from && item.end <= to)) continue;
            result.push(item);
        }

        return result;
    }

    selectionAt (index: idx, active: TimeSelection | null = null) {
        let result = null;

        for (let i = 0; i < this.selections.length; i++) {
            if (
                (this.selections[i].start <= index && this.selections[i].end >= index) &&
                (!active || active && this.selections[i] != active)
            ) {
                if (result !== null) throw new Error("Overlapping selections?");
                result = this.selections[i];
            }
        }

        return result;
    }

    removeSelection (x_x: TimeSelection) {
        this.selections = this.selections.filter(item => item != x_x);
        x_x.remove();
    }

    manageSelection (event: MouseEvent): void {
        if (!this.isActive) return;
        if (this.isRanging) return;

        this.isRanging = true;

        let startX = event.clientX as px;
        let startI = this.toIndex(startX);
        let activeSelection = this.selectionAt(startI);

        if (!activeSelection) {
            activeSelection = new TimeSelection(
                this.element, this.cellStart, startI, startI, this.step
            );

            this.selections.push(activeSelection);
        } else {
            [this.nthCell(activeSelection.start), this.nthCell(activeSelection.end)].forEach(item => {
                item.classList.remove("selected");
                item.innerHTML = "";
            });

            [activeSelection.start, activeSelection.end] = [
                startI, startI
            ];
        }

        this.markCell(startI, "from");

        this.range_cb = (event: MouseEvent) => {

            let endI = this.toIndex(event.clientX as px);

            event.clientX < startX ?
                this.markCell(startI, "til") :
                this.markCell(startI, "from");
            
            [activeSelection.start, activeSelection.end] = event.clientX < startX ? [
                endI, startI
            ] : [
                startI, endI
            ];
        };

        this.end_cb = (event: MouseEvent) => {
            this.endSelectionManage(activeSelection, startI, event);
        }

        this.element.addEventListener("mousemove", this.range_cb);
        setTimeout(() => this.element.addEventListener("click", this.end_cb));

    }

    endSelectionManage (activeSelection: TimeSelection, startI: idx, event: MouseEvent) {
        let endI = this.toIndex(event.clientX as px);

        if (startI == endI) return;
        
        this.isRanging = false;
        this.element.removeEventListener("mousemove", this.range_cb);
        this.element.removeEventListener("click", this.end_cb);

        let overlap = this.selectionAt(endI, activeSelection);
        let overshadow = this.selectionsBetween(startI, endI, activeSelection);
        
        for (let sub of overshadow) {
            if (sub == activeSelection) continue;
            this.removeSelection(sub);
            this.clearCell(sub.start);
            this.clearCell(sub.end);
        }

        if (!overlap) {
            if (this.userData)
                this.update_cb(this.userData, this.selections);

            endI > startI ?
                this.markCell(endI, "til") :
                this.markCell(endI, "from");
            return;
        }

        this.clearCell(startI);
        this.removeSelection(activeSelection);
        this.processOverlap(startI, endI, overlap);

        if (this.userData)
            this.update_cb(this.userData, this.selections);
    };

    processOverlap (startI: idx, endI: idx, overlap: TimeSelection) {

        overlap.startUpdateInstant();
        if (startI < endI) {
            if (endI < overlap.start) {
                this.clearCell(overlap.start);
                overlap.start = startI;
                this.markCell(startI, "from");
                console.log("a < b < c < d");
            } else {
                if (startI >= overlap.end) {
                    this.clearCell(overlap.end);
                    overlap.end = endI;
                    this.markCell(endI, "til");
                    console.log("c < d < a < b");
                } else if (startI < overlap.start) {
                    this.clearCell(overlap.start);
                    overlap.start = startI;
                    this.markCell(startI, "from");
                    console.log("a < c < b < d");
                } else if (startI > overlap.start)  {
                    this.clearCell(overlap.end);
                    overlap.end = endI;
                    this.markCell(endI, "til");
                    console.log("c < a < d < b");
                } else {
                    throw new Error("should be handled above");
                }
            }
        } else {
            if (startI < overlap.start) {
                this.clearCell(overlap.start);
                overlap.start = endI;
                this.markCell(endI, "from");
                console.log("b < a < c < d");
            } else {
                if (endI >= overlap.end) {
                    this.clearCell(overlap.end);
                    overlap.end = startI;
                    this.markCell(startI, "til");
                    console.log("c < d < b < a");
                } else if (endI < overlap.start) {
                    this.clearCell(overlap.start);
                    overlap.start = endI;
                    this.markCell(endI, "from");
                    console.log("b < c < a < d");
                } else if (endI > overlap.start) {
                    this.clearCell(overlap.end);
                    overlap.end = startI;
                    this.markCell(startI, "til");
                    console.log("c < b < d < a");
                } else {
                    throw new Error("should be handled above");
                }
            }
        }
        requestAnimationFrame(() => overlap.endUpdateInstant());
    }
}


function intToInd (value: number, step: number): idx {
    return Math.trunc(value / step) as idx;
}

function _24_to_12 (_24: number): [number, string] {
    let _12 = _24 % 12;
    let str = _24 >= 12 ? "pm" : "am";
    
    return [_12, str];
}