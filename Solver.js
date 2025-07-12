function solve(slots, breaks) {
    const threshold = 10000;
    slots.sort((a, b) => a.slots.length - b.slots.length);

    const start = {
        fitness: 0,
        selected: []
    };

    let best = null;
    backtrack(slots, 0, start, threshold, (candidate) => {
        if (!best || candidate.fitness < best.fitness) {
            best = candidate;
        }
    });
    return best;
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

function convertToURL(slots, sem) {
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