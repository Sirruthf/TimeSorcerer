import q from '../for_short.js';
import { idx, px } from '../types.js';


type h_t = "left" | "right";

export default class TimeSelection {
    parent: HTMLElement;
    _left = 0 as px;
    _width = 0 as px;
    element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
    handle?: h_t;
    _start = 0 as idx;
    _end = 0 as idx;
    _step = () => 0 as px;
    _offset = () => 0 as px;
    name: string;

    toString () {
        return this.name;
    }

    constructor (parent: HTMLElement, offset = () => 0 as px, start: idx = 0 as idx, end: idx = 0 as idx, step = () => 0 as px) {
        this.name = Math.random().toString(36).slice(2, 7);

        this.parent = parent;
        this._step = step;
        this._offset = offset;

        this._start = start;
        this._end = end;
        this.update();

        this.parent.append(this.element.raw);
        this.element.style.transition = "transform ease-out .3s";
    }

    get offset () {
        return this._offset();
    }

    get step () {
        return this._step();
    }

    remove () {
        this.element.remove();
    }

    get width (): px {
        return this._width;
    }

    set width (value: px) {
        this._end = this._start + this.valueToIndex(value) as idx;
        this.update();
    }

    set end (value: idx) {
        this._end = value;
        this.update();
    }

    get end (): idx {
        return this._end;
    }

    set start (value: idx) {
        this._start = value;
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
        this._left = this.indexToValue(this._start);
        this._width = this.indexToValue(this._end - this._start + 1 as idx);
        this.element.style.transform = `translateX(${this.offset + this._left}px) scaleX(${this._width})`;
    }

    indexToValue (index: idx): px {
        return index * this.step as px;
    }

    valueToIndex (value: px): idx {
        return Math.trunc(value / this.step) as idx;
    }
}