export function solve(slots, breaks) {
    const threshold = 10000;
    //slots.sort((a, b) => a.slots.length - b.slots.length); 
    const combined = appendBreaksToSlots(slots, breaks);
    optimiseForSolving(combined);
    const start = {
        fitness: 0,
        selected: []
    };

    let best = null;
    backtrack(combined, 0, start, threshold, (candidate) => {
        if (!best || candidate.fitness < best.fitness) {
            best = candidate;
        }
    });
    return best;
}

function optimiseForSolving(slots) {
    slots.sort((a, b) => a.slots.length - b.slots.length);
    for (const slot of slots) {
        slot.slots.sort((s1, s2) => {
            const conflictCount = (s) => {
                slots.reduce((acc, otherClass) => {
                    if (otherClass === slot) return acc;
                    for (const otherSlot of otherClass.slots) {
                        for (const sTiming of s.timing) {
                            for (const oTiming of otherSlot.timing) {
                                const overlap = Math.max(
                                    0,
                                    Math.min(sTiming.endTime, oTiming.endTime) -
                                    Math.max(sTiming.startTime, oTiming.startTime)
                                );
                                if (overlap > 0) return acc + 1;
                            }
                        }
                    }
                    return acc;
                }, 0)
            };
            return conflictCount(s1) - conflictCount(s2);
        })
    }
    return;
}

function backtrack(slots, index, curr, threshold, reportBest) {
    if (curr.fitness >= threshold) return;

    if (index === slots.length) {
        reportBest(cloneCombination(curr));
        return;
    }

    for (const slot of slots[index].slots) {
        let hasHardConflict = false;
        let penalty = 0;
        for (const sel of curr.selected) {
            for (const selTiming of sel.timing) {
                for (const slotTiming of slot.timing) {
                    const overlap = Math.max(
                        0,
                        Math.min(selTiming.endTime, slotTiming.endTime) -
                        Math.max(selTiming.startTime, slotTiming.startTime)
                    );
                    if (overlap > 0) {
                        if (sel.lessonType !== 'BREAK' && slot.lessonType !== 'BREAK') {
                            hasHardConflict = true;
                            break;
                        } else {
                            penalty += overlap;
                        }
                    }
                }
                if (hasHardConflict) break;
            }
            if (hasHardConflict) break;
        }
        if (hasHardConflict) continue;
        const newFitness = curr.fitness + penalty;
        if (newFitness >= threshold) continue;
        curr.selected.push(slot);
        curr.fitness = newFitness;
        backtrack(slots, index + 1, curr, threshold, reportBest);
        curr.selected.pop();
        curr.fitness -= penalty;
    }
}
function cloneCombination(comb) {
    return {
        fitness: comb.fitness,
        selected: [...comb.selected]
    };
}

function breakConverter(breaksByDay) {
    const dayToMinutes = {
        Monday: 0,
        Tuesday: 1440,
        Wednesday: 2880,
        Thursday: 4320,
        Friday: 5760,
        Saturday: 7200,
        Sunday: 8640
    };

    function timeToMinutes(timeStr) {
        const [hour, minute] = timeStr.split(':').map(Number);
        return hour * 60 + minute;
    }

    return breaksByDay.map(({ day, startTime, endTime }) => ({
        startTime: dayToMinutes[day] + timeToMinutes(startTime),
        endTime: dayToMinutes[day] + timeToMinutes(endTime)
    }));
}

function appendBreaksToSlots(slots, breaks) {
    const convertedBreaks = breakConverter(breaks);
    const breakSlotGroup = convertedBreaks.map((brk, idx) => ({
        classNo: `B${idx + 1}`,
        timing: [
            {
                startTime: brk.startTime,
                endTime: brk.endTime
            }
        ],
        moduleCode: `BREAK`,
        lessonType: 'BREAK',
        weeks: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    }));

    // Push as individual slot "modules"
    for (const breakSlot of breakSlotGroup) {
        slots.push({
            moduleCode: 'BREAK',
            lessonType: 'BREAK',
            slots: [breakSlot]
        });
    }

    return slots;
}

export function convertToURL(slots, sem) {
    if (slots == null) return 'No Combination Works';
    const base = `https://nusmods.com/timetable/sem-${sem}/share?`;
    const mods = {};

    // Step 1: Collect class lessonTypes and numbers per module
    for (const slot of slots.selected) {
        if (slot.lessonType === 'BREAK') continue;

        const moduleCode = slot.moduleCode;
        const lessonType = slot.lessonType;
        const classNo = slot.classNo;

        if (!mods[moduleCode]) {
            mods[moduleCode] = [];
        }

        mods[moduleCode].push(`${lessonType}:${classNo}`);
    }

    // Step 2: Build module strings (optional: sort for stability)
    const moduleParts = Object.entries(mods)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([moduleCode, entries]) => {
            const sortedEntries = entries.sort().join(',');
            return `${moduleCode}=${sortedEntries}`;
        });

    // Step 3: Construct full URL
    return base + moduleParts.join('&');
}