import q from './for_short.js';
import Row from './classes/Row.js';
import TimeSelection from './classes/Selection.js';
import { UserData, idx } from './types.js';


const NONE = -1;
let userID = getID();
let token = document.location.search.substring(1);

try {
    
    init(userID, await getData(token, userID));
} catch (err) {
    document.documentElement.innerHTML = "";
    throw err;
}

function getID () {
    return +(document.cookie
        .split("; ")
        .find((row) => row.startsWith("userID="))
        ?.split("=")[1] || NONE);
}

async function getData (token: string, id: number) {
    let response = null;
    let result: UserData[] = [];
    
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

function init (user_id: number, data: UserData[]) {
    let root  = q('.root');
    let content = q(".content");
    let rows: Row[] = [];
    
    for (let i = 0; i < 3; i++) {
        let table: any = q.tmplt('<div class="day_card"><div class="sch_table"></div></div>');
        rows.push(...populateCard(table.firstElementChild as HTMLElement, user_id, i, data));
        root.append(table.raw);
    }

    let dialogue = q(".dialogue_overlay");

    if (user_id != NONE) {
        document.cookie = "userID=" + user_id;
        dialogue.remove();
    }

    dialogue.style.visibility = "visible";

    for (let i = 0; i < data.length; i++) {
        let option = q.tmplt(`<div class="dialogue_option"><img src="https://j78805858.myjino.ru/projects/DND/images/${data[i].name?.toLowerCase()}.png?${token}">${data[i].name}</div>`).raw;
        option.addEventListener("click", () => {
            rows.filter(row => row.name == data[i].name).forEach(row => {
                row.isActive = true;
            });
        
            document.cookie = "userID=" + i;
            dialogue.remove();
        });
        content.append(option);
    }

    let currentCard = 0;

    document.body.addEventListener("wheel", event => {
        event.deltaY > 0 ? currentCard++ : currentCard--;
        currentCard < 0 ? currentCard++ : 0;
        currentCard > 2 ? currentCard-- : 0;
        
        let day_card: HTMLElement = q(".day_card", true)[currentCard];
        
        day_card.scrollIntoView({
            "block": "center",
            "behavior": "smooth"
        });

        event.preventDefault();
    }, { passive: false });
}

async function update (user: UserData, data: TimeSelection[], table_id: idx) {
    let queryData = user;

    if (!queryData.data) { queryData.data = [[],[],[]]; }
    queryData.data[table_id] = [];

    for (let entry of data) {
        queryData.data[table_id].push({
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
    } catch (err) {
        console.log(err);
    }
}

function populateCard (table: HTMLElement, user_id: number, table_id: number, data: UserData[]) {
    let now = new Date();
    let rows = [];

    let offset = -now.getTimezoneOffset() / 60;
    let myZone = (offset >= 0 ? "+" : "") + offset;

    let month = (now.getMonth() < 9 ? "0" : "") + (now.getMonth() + 1)
    let header = new Row(`${now.getDate() + table_id}.${month}`, true);
    table.append(header.element);

    for (let j = 0; j < data.length; j++)
    {
        if (!data[j].name) throw new Error("empty name");
        let row = new Row(data[j].name ?? "", j == user_id, (_, range) => update(data[j], range, table_id as idx));
        table.append(row.element);
        rows.push(row);
        requestAnimationFrame(() => row.init((data[j].data ?? [])[table_id] ?? []));
    }

    return rows;

}