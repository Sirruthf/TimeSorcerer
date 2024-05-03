import q from '../for_short.js';


type h_t = "left" | "right";
type cb_t = (current: MouseEvent, handle: h_t, oldLeft: number, oldWidth: number) => [number, number];
type mm_cb_t = (event: MouseEvent) => void;

export default class TimeSelection {
    parent: HTMLElement;
    _left: number = 0;
    _width: number = 0;
    element = q.tmplt("<div class='selection'><div class='selection-left-border'></div><div class='selection-right-border'></div></div>");
    initX: number = 0;
    width_cb: cb_t = () => [0, 0];
    adjust_cb: mm_cb_t;
    handle?: h_t;

    constructor (parent: HTMLElement, width_cb: cb_t, left: number = 0, width: number = 0) {
        this.parent = parent;
        this.left = left;
        this.width = width;
        this.initX = left;

        this.width_cb = width_cb;
        this.adjust_cb = (event: MouseEvent) => this.adjust(event);

        this.parent.append(this.element.raw);

        this.element.querySelector<HTMLElement>(".selection-left-border")?.
            addEventListener("mousedown", (event: MouseEvent) => this.grab(event, "left"));
        this.element.querySelector<HTMLElement>(".selection-right-border")?.
            addEventListener("mousedown", (event: MouseEvent) => this.grab(event, "right"));
    }

    grab (event: MouseEvent, handle: h_t): void {
        this.initX = event.clientX;
        this.handle = handle;
        q().style.cursor = "col-resize";
        q().addEventListener("mousemove", this.adjust_cb);
        q().addEventListener("mouseup", this.release.bind(this));
        event.stopPropagation();
    }

    adjust (event: MouseEvent): void {
        if (!this.width_cb) return;
        [this.left, this.width] = 
            this.width_cb(event, this.handle as h_t, this.element.offsetLeft, this.element.offsetWidth);
    }

    release () {
        q().style.cursor = "";
        q().removeEventListener("mousemove", this.adjust_cb);
    }

    get left (): number {
        return this._left;
    }

    set left (value: number) {
        this._left = value;
        this.element.style.left = value + "px";
    }

    get width (): number {
        return this._width;
    }

    set width (value: number) {
        this._width = value;
        this.element.style.width = value + "px";
    }
}