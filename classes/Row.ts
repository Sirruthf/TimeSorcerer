import q from '../for_short.js';
import TimeSelection from './Selection.js';


export default class Row {
    isActive: boolean;
    element: HTMLElement;
    selection: TimeSelection | null = null;

    constructor (isActive: boolean, offset: number) {
        this.isActive = isActive;

        let now = new Date();
        let result: string = "";
        let row = new Date(now.getFullYear(),
            now.getMonth(), now.getDay(), now.getHours() + 1 + offset);

        result += `<div class='row'>`;
        
        for (let i = 0; i < 24; i++) {
            result += "<div class='hour'>" + row.getHours() + "</div>";
            row.setHours(row.getHours() + 1);
        }
        
        result += "</div>";

        this.element = q.tmplt(result).raw as HTMLElement;
        this.element.addEventListener("mousedown",
            (event: MouseEvent) => this.manageSelection(event));
    }

    manageSelection (event: MouseEvent): void {
        if (!this.isActive) return;

        let currentX = event.clientX;

        let targetHour = event.target as HTMLElement;
        if (targetHour.className == "hour") {

            let leftBorder = targetHour.offsetLeft;
            let cellWidth = targetHour.offsetWidth;

            if (!this.selection)
                this.selection = new TimeSelection(
                    this.element, (current: MouseEvent, handle: "left" | "right", oldLeft: number, oldWidth: number) => {
                        
                        if (handle == "left") {
                            return this.calcBorders(
                                this.convertToIndices(current.clientX, "down"),
                                this.convertToIndices(oldLeft + oldWidth, "down")
                            );
                        } else {
                            return this.calcBorders(
                                this.convertToIndices(oldLeft, "down"),
                                this.convertToIndices(current.clientX, "up")
                            );
                        }
            
                    }, leftBorder, cellWidth
                );
            else {
                [this.selection.left, this.selection.width] = this.calcBorders(
                    this.convertToIndices(event.clientX, "down"),
                    this.convertToIndices(event.clientX, "up"),
                );
            }
        }

        let rangeCallback = (event: MouseEvent) => {
            if (!this.selection) return;

            if (event.clientX < currentX) {
                [this.selection.left, this.selection.width] = this.calcBorders(
                    this.convertToIndices(event.clientX, "down"),
                    this.convertToIndices(currentX, "up"),
                );
            } else {
                [this.selection.left, this.selection.width] = this.calcBorders(
                    this.convertToIndices(currentX, "down"),
                    this.convertToIndices(event.clientX, "up")
                );
            }
        };

        document.addEventListener("mousemove", rangeCallback);
        document.addEventListener("mouseup", () =>
            document.removeEventListener("mousemove", rangeCallback)
        );

    }

    convertToIndices (value: number, round: "up" | "down"): number {
        let hour = this.element.querySelector(".hour") as HTMLElement;
        let result = round == "down" ?
            Math.floor(value / hour.getBoundingClientRect().width) :
            Math.ceil(value / hour.getBoundingClientRect().width);

        return result < 0 ? 0 : result > 24 ? 24 : result;
    }

    calcBorders (from: number, to: number): [number, number] {
        let hour = this.element.querySelector(".hour") as HTMLElement;
        let cellWidth = hour.getBoundingClientRect().width;
        
        return [from * cellWidth, (to - from < 1 ? 1 : to - from) * cellWidth + 2]
    }
}