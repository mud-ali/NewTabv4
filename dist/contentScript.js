function scrapeClassInfo() {

    chrome.storage.local.get(["info"], (result) => {
        if (result["info"] == undefined) {
            console.log("No info found in storage");
        } else {
            let info = result["info"];
            let lastUpdatedTimestamp = info["lastUpdatedTimestamp"];
            let currentTime = new Date().getTime();
            let timeDifference = currentTime - lastUpdatedTimestamp;
            let timeDifferenceInMinutes = timeDifference / 60_000;
            if (timeDifferenceInMinutes < 5) {
                console.log("Using cached data");
                return;
            } else {
                console.log("gonna update data now gimme a moment");
            }
        }
    });

    console.log("Scraping class info");
    const classesData = document.querySelectorAll('tr[id^="ccid"]');
    console.log(classesData.cells);

    if (classesData.length === 0) {
        console.log("No classes found");
        return;
    }

    let info = {};
    for (let classIndex = 0; classIndex < classesData.length; classIndex++) {
        let cName = classesData[classIndex]
            .querySelector('td[class="table-element-text-align-start"]')
            .innerHTML.split("&nbsp;")[0].trim();

        if (Object.keys(info).includes(cName)) {
            cName += " ";
        }
        
        let cTeacher = classesData[classIndex]
            .querySelector('td[class="table-element-text-align-start"]')
            .querySelectorAll('a[href^="mailto:"]')[0].innerHTML.replace("Email ", "")
            .trim();

        let cRoom = classesData[classIndex]
            .querySelector('td[class="table-element-text-align-start"]')
            .querySelectorAll('span')[2].innerHTML.replace("&nbsp;", "")
            .trim();
        
        if (!Number.isNaN(parseInt(cRoom)))
            cRoom = "Room " + cRoom;

        let tds = Array.from(classesData[classIndex].querySelectorAll("td"));
        let classSchedule = tds[0].innerText;
        tds = tds.slice(12);

        let cGradeKeys = [
            "T1",
            "S1",
            "T2",
            "T3",
            "S2",
            "Y1",
        ];

        let cGradeVals = [];

        for (let gradingTerm = 0; gradingTerm < cGradeKeys.length && gradingTerm < tds.length; gradingTerm++) {
            let td = tds[gradingTerm];
            if (td.classList.contains("notInSession") || /\[\s?i\s?\]/.test(td.innerHTML)) {
                cGradeVals.push(null);
                continue;
            }
            let grade = td.getElementsByTagName("a")[0].innerHTML.split("<br>");
            cGradeVals.push(grade);
        }

        let cDetails = {
            "schedule": classSchedule,
            "teacher": cTeacher,
            "room": cRoom
        };
        for (let i = 0; i < cGradeKeys.length; i++) {
            cDetails[cGradeKeys[i]] = cGradeVals[i];
        }

        info[cName] = cDetails;
    }

    info["lastUpdatedTimestamp"] = new Date().getTime();
    info["name"] = document.getElementById("content-main")
        .querySelector("h1")
        .innerHTML
        .split("&nbsp;")[0]
        .split(":")[1]
        .trim()
        .split(",")
        .reverse()
        .join(" ")
        .trim();

    let setInfo = {};
    setInfo["info"] = info;
    chrome.storage.local.set(setInfo);

    if (scraperInterval === undefined)
        scraperInterval = setInterval(scrapeClassInfo, 60_000);
}

let scraperInterval;

scrapeClassInfo();

document.body.style.backgroundColor = "#134b7099";
