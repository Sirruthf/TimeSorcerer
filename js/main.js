import q from './for_short.js';
import Row from './classes/Row.js';
init();
function init() {
    let table = q('.sch_table');
    let button = q('input[type=button]');
    button.on("click", () => {
        let now = new Date();
        let offset = -now.getTimezoneOffset() / 60;
        let myZone = (offset >= 0 ? "+" : "") + offset;
        let row = new Row(true, offset);
        table.prepend(row.element);
        table.prepend(q.tmplt(`<div><div class='row-title'>UTC ${myZone} (NEW)</div>`).raw);
    });
    populate(table);
}
function populate(table) {
    let now = new Date();
    let offset = -now.getTimezoneOffset() / 60;
    let myZone = (offset >= 0 ? "+" : "") + offset;
    let name = [
        `UTC ${myZone} (ME)`
    ];
    for (let j = name.length - 1; j >= 0; j--) {
        let row = new Row(j == 0, j);
        table.prepend(row.element);
        table.prepend(q.tmplt(`<div><div class='row-title'>${name[j]}</div>`).raw);
    }
}
