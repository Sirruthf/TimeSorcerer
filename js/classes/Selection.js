import q from '../for_short.js';
export default class TimeSelection {
    parent;
    _left = 0;
    _width = 0;
    element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
    handle;
    _start = 0;
    _end = 0;
    step = 0;
    offset = 0;
    name;
    toString() {
        return this.name;
    }
    constructor(parent, offset = 0, start = 0, end = 0, step = 0) {
        this.name = Math.random().toString(36).slice(2, 7);
        this.parent = parent;
        this.step = step;
        this.offset = offset;
        this._start = start;
        this._left = this.indexToValue(start);
        this._end = end;
        this._width = this.indexToValue(end - start + 1);
        this.update();
        this.parent.append(this.element.raw);
        this.element.style.transition = "transform ease-out .3s";
    }
    remove() {
        this.element.remove();
    }
    get width() {
        return this._width;
    }
    set width(value) {
        this._end = this._start + this.valueToIndex(value);
        this._width = this.indexToValue(this._end - this._start);
        this.update();
    }
    set end(value) {
        this._end = value;
        this._width = this.indexToValue(value - this._start + 1);
        this.update();
    }
    get end() {
        return this._end;
    }
    set start(value) {
        this._start = value;
        this._left = this.indexToValue(value);
        this._width = this.indexToValue(this._end - value + 1);
        this.update();
    }
    get start() {
        return this._start;
    }
    startUpdateInstant() {
        this.element.style.transition = "";
    }
    endUpdateInstant() {
        this.element.style.transition = "transform ease-out .3s";
    }
    update() {
        this.element.style.transform = `translateX(${this.offset + this._left}px) scaleX(${this._width})`;
    }
    indexToValue(index) {
        return index * this.step;
    }
    valueToIndex(value) {
        return Math.trunc(value / this.step);
    }
}
//# sourceMappingURL=Selection.js.map