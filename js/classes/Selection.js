import q from '../for_short.js';
export default class TimeSelection {
    constructor(parent, width_cb, left = 0, width = 0) {
        var _a, _b;
        this._left = 0;
        this._width = 0;
        this.element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
        this.initX = 0;
        this.width_cb = () => [0, 0];
        this.parent = parent;
        this.left = left;
        this.width = width;
        this.initX = left;
        this.width_cb = width_cb;
        this.adjust_cb = (event) => this.adjust(event);
        this.parent.append(this.element.raw);
        (_a = this.element.querySelector(".selection-left-border")) === null || _a === void 0 ? void 0 : _a.addEventListener("mousedown", (event) => this.grab(event, "left"));
        (_b = this.element.querySelector(".selection-right-border")) === null || _b === void 0 ? void 0 : _b.addEventListener("mousedown", (event) => this.grab(event, "right"));
    }
    grab(event, handle) {
        this.initX = event.clientX;
        this.handle = handle;
        q().style.cursor = "col-resize";
        q().addEventListener("mousemove", this.adjust_cb);
        q().addEventListener("mouseup", this.release.bind(this));
        event.stopPropagation();
    }
    adjust(event) {
        if (!this.width_cb)
            return;
        [this.left, this.width] =
            this.width_cb(event, this.handle, this.element.offsetLeft, this.element.offsetWidth);
    }
    release() {
        q().style.cursor = "";
        q().removeEventListener("mousemove", this.adjust_cb);
    }
    get left() {
        return this._left;
    }
    set left(value) {
        this._left = value;
        this.element.style.left = value + "px";
    }
    get width() {
        return this._width;
    }
    set width(value) {
        this._width = value;
        this.element.style.width = value + "px";
    }
}
