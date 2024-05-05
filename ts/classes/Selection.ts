import q from '../for_short.js';
import { idx, px } from '../types.js';


type h_t = "left" | "right";

export default class TimeSelection {
    parent: HTMLElement;
    _left: px = 0 as px;
    _width: px = 0 as px;
    element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
    handle?: h_t;
    _start: idx = 0 as idx;
    _end: idx = 0 as idx;
    step: px = 0 as px;
    offset: px = 0 as px;
    name: string;

    toString () {
        return this.name;
    }

    constructor (parent: HTMLElement, offset: px = 0 as px, start: idx = 0 as idx, end: idx = 0 as idx, step: px = 0 as px) {
        this.name = Math.random().toString(36).slice(2, 7);

        this.parent = parent;
        this.step = step;
        this.offset = offset;

        this._start = start;
        this._left = this.indexToValue(start);
        this._end = end;
        this._width = this.indexToValue(end - start + 1 as idx);

        this.update();

        this.parent.append(this.element.raw);
        this.element.style.transition = "transform ease-out .3s";
    }

    remove () {
        this.element.remove();
    }

    get width (): px {
        return this._width;
    }

    set width (value: px) {
        this._end = this._start + this.valueToIndex(value) as idx;
        this._width = this.indexToValue(this._end - this._start as idx);

        this.update();
    }

    set end (value: idx) {
        this._end = value;
        this._width = this.indexToValue(value - this._start + 1 as idx);

        this.update();
    }

    get end (): idx {
        return this._end;
    }

    set start (value: idx) {
        this._start = value;
        this._left = this.indexToValue(value);
        this._width = this.indexToValue(this._end - value + 1 as idx);

        this.update();
    }

    get start (): idx { 
        return this._start;
    }

    startUpdateInstant (): void {
        this.element.style.transition = "";
    }

    endUpdateInstant (): void {
        this.element.style.transition = "transform ease-out .3s";
    }

    update (): void {
        this.element.style.transform = `translateX(${this.offset + this._left}px) scaleX(${this._width})`;
    }

    indexToValue (index: idx): px {
        return index * this.step as px;
    }

    valueToIndex (value: px): idx {
        return Math.trunc(value / this.step) as idx;
    }
}