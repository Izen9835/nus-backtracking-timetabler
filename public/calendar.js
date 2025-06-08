import ModFetcher from './nusmodsFetcher.mjs';

// Helper to generate a random color for event borders
function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// Helper to convert "HHMM" (e.g. "0930") to minutes since 8am
function timeToMinutes(time) {
    // time is a string like "0900", "1330"
    const hour = parseInt(time.substring(0, 2), 10);
    const min = parseInt(time.substring(2, 4), 10);
    return (hour - 8) * 60 + min;
}

// Helper to format "HHMM" as "HH:MM"
function formatMilitaryTime(time) {
    return time.substring(0, 2) + ':' + time.substring(2, 4);
}

function renderCalendar(sessions) {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error("No calendar div found!");
        return;
    }
    calendar.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let sessionsByDay = {};
    days.forEach(day => sessionsByDay[day] = []);
    sessions.forEach(session => {
        if (sessionsByDay[session.day]) {
            sessionsByDay[session.day].push(session);
        }
    });

    days.forEach(day => {
        const dayCol = document.createElement('div');
        dayCol.className = 'day-column';
        dayCol.style.position = 'relative';

        const title = document.createElement('div');
        title.className = 'day-title';
        title.textContent = day;
        dayCol.appendChild(title);

        sessionsByDay[day].forEach(session => {
            const startMins = timeToMinutes(session.startTime);
            const endMins = timeToMinutes(session.endTime);
            const durationMins = endMins - startMins;

            if (durationMins <= 0) return;

            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = `${formatMilitaryTime(session.startTime)} - ${formatMilitaryTime(session.endTime)}: ${session.title || ''}`;
            eventDiv.title = eventDiv.textContent;

            eventDiv.style.top = (startMins / 60 * 50 + 30) + 'px';
            eventDiv.style.height = (durationMins / 60 * 50) + 'px';
            eventDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            eventDiv.style.border = `2px solid ${getRandomColor()}`;
            dayCol.appendChild(eventDiv);
        });

        calendar.appendChild(dayCol);
    });
}

// Your genetic algorithm code (dummy version for this example)
function genSeed(allModData) {
    var output = [];
    for (var mod of Object.values(allModData)) {
        for (var activity of Object.values(mod.availableTimeslots)) {
            output.push(Math.floor(Math.random() * activity.length));
        }
    }
    return output;
}

function express(modData, seed) {
    var output = [];
    var alltimeslots = [];
    var iter = 0;
    for (var mod of Object.values(modData)) {
        for (var activity of Object.values(mod.availableTimeslots)) {
            alltimeslots.push(activity[seed[iter]]);
            iter++;
        }
    }
    for (var timeslot of alltimeslots) {
        if (Array.isArray(timeslot.sessions)) {
            timeslot.sessions.forEach(element => {
                console.log(`${element.moduleCode}`);
                output.push({ day: element.day, startTime: element.startTime, endTime: element.endTime, title: `${element.moduleCode}, ${element.classNo}` });
            });
        }
    }
    return output;
}

async function initCalendar() {
    var _modList = ['CS1010', 'GEA1000', 'MA1511', 'MA1512', 'EG1311', 'CG1111A'];
    var _sem = 1;

    const fetcher = new ModFetcher(_modList, _sem);
    const allModData = await fetcher.fetchAllCleanModuleData();
    console.log("allModData:", allModData);

    var seed = genSeed(allModData);
    console.log("seed:", seed);

    var sessions = express(allModData, seed);
    console.log("sessions:", sessions);

    renderCalendar(sessions);
}

document.addEventListener('DOMContentLoaded', () => {
    initCalendar().catch(error => {
        console.error("Initialization failed:", error);
    });
});
