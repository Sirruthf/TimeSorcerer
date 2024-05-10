import q from './for_short.js';
import Row from './classes/Row.js';
import { RangeList, UserData, idx, timestamp } from './types.js';
import User from './classes/User.js';


const NONE = -1;
const userID = getID();
const token = document.location.search.substring(1);
const day_ranges = getTimeRanges();

try {
    init(userID, await getData(token, userID));
} catch (err) {
    document.documentElement.innerHTML = "";
    throw err;
}

function getTimeRanges () {
    let now = new Date(); 
    let leap = now.getHours() >= 23 ? 1 : 0;

    let day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + leap);

    let day_range: timestamp[] = [...Array(72).keys()].map(_ => {
        day.setHours(day.getHours() + 1);
        return day.getTime() as timestamp;
    });

    return [...Array(3).keys()].map(i => {
        return day_range.slice(i * 24, (i + 1) * 24) as timestamp[];
    });
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
    let theme = q(".theme_button");

    theme.on("click", () => {
        document.body.classList.toggle("dark");
    });

    let root  = q('.root');
    let content = q(".content");
    let rows: Row[] = [];

    let users = data.map(item => new User(item));
    users.forEach(user => user.spliceData(day_ranges))
    
    for (let i = 0; i < 3; i++) {
        let table: any = q.tmplt('<div class="day_card"><div class="sch_table"></div></div>');
        rows.push(...populateCard(table.firstElementChild as HTMLElement, user_id, users, day_ranges[i], i));
        root.append(table.raw);
    }

    let dialogue = q(".dialogue_overlay");

    if (user_id != NONE) {
        document.cookie = "userID=" + user_id;
        dialogue.remove();
    }

    dialogue.style.visibility = "visible";

    for (let i = 0; i < data.length; i++) {
        let option = q.tmplt(`<div class="dialogue_option"><img src="https://j78805858.myjino.ru/projects/DND/images/${data[i].image}?${token}">${data[i].name}</div>`).raw;
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

async function update (user: User, user_id: number, data: RangeList, table_id: number) {

    let queryData: UserData = {
        name: user.name,
        timezone: -new Date().getTimezoneOffset() / 60,
        data: [],
        image: user.image
    };

    for (let i = 0; i < user.tables.length; i++) {
        if (i != table_id)
            for (let range of user.tables[i])
                queryData.data?.push(range);
        else
            for (let range of data)
                queryData.data?.push(range);
    }

    const formData = new FormData();
    formData.append("user_id", `${user_id}`);
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

function populateCard (table: HTMLElement, user_id: number, users: User[], range: timestamp[], table_id: number) {
    let rows = [];

    let now = new Date();
    let leap = now.getHours() >= 23 ? 1 : 0;
    let table_date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + leap + table_id);

    let month = (table_date.getMonth() < 9 ? "0" : "") + (table_date.getMonth() + 1);
    let header = new Row(`${table_date.getDate()}.${month}`, table_date.getDate(), true, range);
    table.append(header.element);

    for (let j = 0; j < users.length; j++)
    {
        if (!users[j].name) throw new Error("empty name");
        
        let row = new Row(users[j].name ?? "", table_date.getDate(), j == user_id, range, (_, selections) => update(users[j], j, selections, table_id));
        
        table.append(row.element);
        rows.push(row);

        requestAnimationFrame(() => row.init(users[j].tables[table_id]));
    }

    return rows;

}