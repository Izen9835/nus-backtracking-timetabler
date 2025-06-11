import { Session, Break } from './modules/DataStructures.js';
import ModFetcher from './modules/nusmodsFetcher.mjs';

// Hash a string to a color (hex)
function hashStringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
}

// Convert hex color to rgba with given alpha
function hexToRgba(hex, alpha) {
    // Remove "#" if present
    hex = hex.replace(/^#/, '');
    if (hex.length !== 6) return `rgba(76,175,80,${alpha})`; // fallback green
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// Convert "HHMM" to minutes since 8am
function timeToMinutes(time) {
    const hour = parseInt(time.substring(0, 2), 10);
    const min = parseInt(time.substring(2, 4), 10);
    return (hour - 8) * 60 + min;
}

// Format "HHMM" as "HH:MM"
function formatMilitaryTime(time) {
    return time.substring(0, 2) + ':' + time.substring(2, 4);
}

function renderCalendar(sessions, breaks) {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error("No calendar div found!");
        return;
    }
    calendar.innerHTML = '';


    // initialise an object sessionsByDay
    // key: day of the week
    // values: list of events
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let sessionsByDay = {};
    days.forEach(day => sessionsByDay[day] = []);
    sessions.forEach(session => {
        if (sessionsByDay[session.day]) {
            sessionsByDay[session.day].push(session);
        }
    });

    // make the same but for breaks
    let breaksByDay = {};
    days.forEach(day => breaksByDay[day] = []);
    breaks.forEach(brk => {
        if (breaksByDay[brk.day]) {
            breaksByDay[brk.day].push(brk);
        }
    });


    // for each day, generate a column containing all events and breaks
    days.forEach(day => {
        const dayCol = document.createElement('div');
        dayCol.className = 'day-column';
        dayCol.style.position = 'relative';

        // day title (e.g. Monday, Tuesday, placed at the top of each column)
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
            eventDiv.textContent = `${formatMilitaryTime(session.startTime)} - ${formatMilitaryTime(session.endTime)}: ${session.moduleCode || ''}`;
            eventDiv.title = eventDiv.textContent;

            // Use translucent color based on title
            const hexColor = hashStringToColor(session.moduleCode || '');
            const rgbaColor = hexToRgba(hexColor, 0.4); // 0.4 = 40% opacity
            eventDiv.style.backgroundColor = rgbaColor;
            eventDiv.style.color = '#222'; // dark text for contrast
            eventDiv.style.top = (startMins / 60 * 50 + 30) + 'px';
            eventDiv.style.height = (durationMins / 60 * 50) + 'px';
            eventDiv.style.border = 'none';
            dayCol.appendChild(eventDiv);
        });

        breaksByDay[day].forEach(brk => {
            const startMins = timeToMinutes(brk.startTime);
            const endMins = timeToMinutes(brk.endTime);
            const durationMins = endMins - startMins;

            if (durationMins <= 0) return;

            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = `${formatMilitaryTime(brk.startTime)} - ${formatMilitaryTime(brk.endTime)}: ${brk.moduleCode || ''}`;
            eventDiv.title = eventDiv.textContent;

            // Use translucent color based on title
            const rgbaColor = hexToRgba('#3b4a63', 0.4); // 0.4 = 40% opacity
            eventDiv.style.backgroundColor = rgbaColor;
            eventDiv.style.color = '#222'; // dark text for contrast
            eventDiv.style.top = (startMins / 60 * 50 + 30) + 'px';
            eventDiv.style.height = (durationMins / 60 * 50) + 'px';
            eventDiv.style.border = 'none';
            dayCol.appendChild(eventDiv);
        });

        calendar.appendChild(dayCol);
    });
}

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
                output.push(element);
            });
        }
    }
    return output;
}

function getFitness(sessions, breaks) {
    var output = 0; // optimal case is fitness 0

    // overlaps between breaks and sessions
    breaks.forEach(brk => {
        sessions.forEach(session => {
            output += session.overlaps(brk) * brk.priority;
        });
    });

    // overlaps between sessions
    for (var i = 0; i < sessions.length; i++) {
        for (var j = 0; j < sessions.length; j++) {
            if (i != j) {
                output += sessions[i].overlaps(sessions[j]) * 1000;
            }
        }
    }

    return output;
}

async function initCalendar() {

    // user inputs start
    var _modList = ['CS1010', 'GEA1000', 'CG1111A', 'MA1511', 'MA1512', 'EG1311'];
    var _sem = 1;

    var _breaks = [
        new Break({ day: 'Monday', startTime: '1230', endTime: '1330' }, 4),  // could add 'weeks' data for breaks in the future
        new Break({ day: 'Tuesday', startTime: '1300', endTime: '1400' }, 3),
        new Break({ day: 'Wednesday', startTime: '1100', endTime: '1200' }, 2),
        new Break({ day: 'Friday', startTime: '1000', endTime: '1100' }, 1),
    ];

    // user inputs end

    const fetcher = new ModFetcher(_modList, _sem);
    const allModData = await fetcher.fetchAllCleanModuleData();
    console.log("allModData:", allModData);

    var seed = genSeed(allModData);
    console.log("seed:", seed);

    var sessions = express(allModData, seed);
    console.log("sessions:", sessions);

    var fitness = getFitness(sessions, _breaks);
    console.log("fitness: ", fitness);

    renderCalendar(sessions, _breaks);
}

document.addEventListener('DOMContentLoaded', () => {
    initCalendar().catch(error => {
        console.error("Initialization failed:", error);
    });
});
