import q from './for_short.js';
import Row from './classes/Row.js';
const NONE = -1;
let userID = getID();
let token = document.location.search.substring(1);
try {
    init(userID, await getData(token, userID));
}
catch (err) {
    document.documentElement.innerHTML = "";
    throw err;
}
function getID() {
    return +(document.cookie
        .split("; ")
        .find((row) => row.startsWith("userID="))
        ?.split("=")[1] || NONE);
}
async function getData(token, id) {
    let response = null;
    let result = [];
    const formData = new FormData();
    formData.append("token", token);
    formData.append("user_id", `${id}`);
    response = await fetch("https://j78805858.myjino.ru/projects/DND/load.php", {
        method: "POST",
        body: formData
    });
    result = await response.json();
    return result;
}
function init(user_id, data) {
    let root = q('.root');
    let content = q(".content");
    let rows = [];
    for (let i = 0; i < 3; i++) {
        let table = q.tmplt('<div class="day_card"><div class="sch_table"></div></div>');
        rows.push(...populateCard(table.firstElementChild, user_id, data));
        root.append(table.raw);
    }
    let dialogue = q(".dialogue_overlay");
    if (user_id != NONE) {
        document.cookie = "userID=" + user_id;
        dialogue.remove();
    }
    dialogue.style.visibility = "visible";
    for (let i = 0; i < data.length; i++) {
        let option = q.tmplt(`<div class="dialogue_option"><img src="images/${data[i].name?.toLowerCase()}.png">${data[i].name}</div>`).raw;
        option.addEventListener("click", () => {
            rows.filter(row => row.name == data[i].name).forEach(row => {
                row.isActive = true;
            });
            document.cookie = "userID=" + i;
            dialogue.remove();
        });
        content.append(option);
    }
}
async function update(user, data) {
    let queryData = {
        name: user.name,
        timezone: user.timezone,
        data: []
    };
    for (let entry of data) {
        if (!queryData.data)
            continue;
        queryData.data.push({
            start: entry.start,
            end: entry.end
        });
    }
    const formData = new FormData();
    formData.append("user_id", `${userID}`);
    formData.append("data", JSON.stringify(queryData));
    try {
        await fetch("https://j78805858.myjino.ru/projects/DND/update.php", {
            method: "POST",
            body: formData
        });
    }
    catch (err) {
        console.log(err);
    }
}
function populateCard(table, user_id, data) {
    let now = new Date();
    let rows = [];
    let offset = -now.getTimezoneOffset() / 60;
    let myZone = (offset >= 0 ? "+" : "") + offset;
    let month = (now.getMonth() < 9 ? "0" : "") + (now.getMonth() + 1);
    let header = new Row(`${now.getDate()}.${month}`, true);
    table.append(header.element);
    for (let j = 0; j < data.length; j++) {
        if (!data[j].name)
            throw new Error("empty name");
        let row = new Row(data[j].name ?? "", j == user_id, update);
        table.append(row.element);
        rows.push(row);
        requestAnimationFrame(() => row.init(data[j]));
    }
    return rows;
}
//# sourceMappingURL=main.js.map