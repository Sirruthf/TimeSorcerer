import q from '../for_short.js';
export default class TimeSelection {
    parent;
    _left = 0;
    _width = 0;
    element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
    handle;
    _start = 0;
    _end = 0;
    _step = () => 0;
    _offset = () => 0;
    name;
    toString() {
        return this.name;
    }
    constructor(parent, offset = () => 0, start = 0, end = 0, step = () => 0) {
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
    get offset() {
        return this._offset();
    }
    get step() {
        return this._step();
    }
    remove() {
        this.element.remove();
    }
    get width() {
        return this._width;
    }
    set width(value) {
        this._end = this._start + this.valueToIndex(value);
        this.update();
    }
    set end(value) {
        this._end = value;
        this.update();
    }
    get end() {
        return this._end;
    }
    set start(value) {
        this._start = value;
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
        this._left = this.indexToValue(this._start);
        this._width = this.indexToValue(this._end - this._start + 1);
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