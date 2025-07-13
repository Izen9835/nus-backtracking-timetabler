// Purpose: output a list of Modules (as defined in GeneticAlgo.js) 
// remove other semester's data (e.g. only take data for sem 1)
// clean any duplicate timeslots (for now just remove duplicates)`

/* 

          "classNo": "B03",
          "startTime": "1000",
          "endTime": "1200",
          "weeks": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          "venue": "COM1-B108",
          "day": "Thursday",
          "lessonType": "Laboratory",
          "size": 15,
          "covidZone": "C"

I have a list of these json objects of the above format
I need to group them first by lessonType
 - within lessonType groups, merge items that have the same class number
 - merge them into the following format:
        "classNo":"B03",
        "timing":[
            [011400, 011600], 
            [031400, 031600]
        ],
        "weeks":[1,2,3,4],
- where the timings are converted into minutes after Monday 0000hrs, which is calculated using "day" and "startTime"/"endTime"

the final output will be a list of objects, each object having a format like the following

{"module":"CS1010",
"type":"Laboratory",
"slots":[
    {
        "classNo":"B03",
        "timing":[
            [011400, 011600], 
            [031400, 031600]
        ],
        "weeks":[1,2,3,4],
    },
    {
        "classNo":"B07",
        "timing":[
            [011400, 011600],
            [031400, 031600]
        ],
        "weeks":[1,2,3,4],
    },
]}

for the initial input list of json objects, the "module" is known and is the same for all items

*/



export default class ModFetcher {
  constructor(modList, sem, acadYear) {
    this._modList = modList; // Array of module codes
    this._sem = sem;
    this._acadYear = acadYear;
    this.baseUrl = 'https://api.nusmods.com/v2/'; //might need to add AY eventually

    // Mapping lessonType to short codes
    this.lessonTypeMap = {
      "Laboratory": "LAB",
      "Lecture": "LEC",
      "Tutorial": "TUT",
      "Recitation": "REC",
      "Sectional Teaching": "SEC",
      "Workshop": "WS",
      "Seminar-Style Module Class": "SEM",
    };

    // Mapping day to minutes since Monday 0000
    this.dayToMinutes = {
      "Monday": 0,
      "Tuesday": 1 * 24 * 60,
      "Wednesday": 2 * 24 * 60,
      "Thursday": 3 * 24 * 60,
      "Friday": 4 * 24 * 60,
      "Saturday": 5 * 24 * 60,
      "Sunday": 6 * 24 * 60
    };
  }

  async fetchSingleModuleData(moduleCode) {
    try {
      const response = await fetch(`${this.baseUrl}/${this._acadYear}/modules/${moduleCode}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${moduleCode}:`, error);
      return null;
    }
  }

  async fetchAllModuleData() {
    const results = await Promise.all(
      this._modList.map(mod => this.fetchSingleModuleData(mod))
    );
    if (results.some(r => r === null)) {
      throw new Error('One or more module fetches failed');
    }
    return results;
  }

  // Helper: Converts "HHMM" to minutes
  timeToMinutes(timeStr) {
    const hour = parseInt(timeStr.slice(0, 2), 10);
    const min = parseInt(timeStr.slice(2), 10);
    return hour * 60 + min;
  }

  // Helper: Converts day + time to absolute minutes since Monday 0000
  absoluteMinutes(day, timeStr) {
    return this.dayToMinutes[day] + this.timeToMinutes(timeStr);
  }

  /**
   * Main function to process the timetable array.
   * @param {Array} lessons - Array of lesson objects
   * @param {String} moduleCode - Module code (e.g., "CS1010")
   * @returns {Array} - Grouped and merged timetable objects
   */
  processTimetable(lessons, moduleCode) {
    // 1. Group by original lessonType (e.g., "Laboratory")
    const lessonTypeGroups = {};
    for (const lesson of lessons) {
      if (!lessonTypeGroups[lesson.lessonType]) {
        lessonTypeGroups[lesson.lessonType] = [];
      }
      lessonTypeGroups[lesson.lessonType].push(lesson);
    }

    // 2. For each lessonType group, merge by timing & classNo
    const result = [];

    for (const [lessonType, group] of Object.entries(lessonTypeGroups)) {
      // Map from timingKey (string) to slot object
      const timingMap = {};

      for (const lesson of group) {
        // Compute timing in minutes
        const start = this.absoluteMinutes(lesson.day, lesson.startTime);
        const end = this.absoluteMinutes(lesson.day, lesson.endTime);

        // Use timing as part of the key
        const timingKey = `${start}-${end}`;

        // Optionally, you can merge by weeks too if needed, but for now, merge only by timing
        if (!timingMap[timingKey]) {
          timingMap[timingKey] = {
            classNos: new Set(),
            weeks: new Set(),
            timing: { startTime: start, endTime: end }
          };
        }
        timingMap[timingKey].classNos.add(lesson.classNo);
        lesson.weeks.forEach(w => timingMap[timingKey].weeks.add(w));
      }

      // Now, merge slots with identical timings into one slot with multiple classNos
      // But also, if slots have identical classNos and lessonType, merge their timings

      // First, group by classNos
      const classNoMap = {};

      for (const slot of Object.values(timingMap)) {
        // Key by sorted classNos
        const classNoKey = Array.from(slot.classNos).sort().join(",");
        if (!classNoMap[classNoKey]) {
          classNoMap[classNoKey] = {
            classNo: Array.from(slot.classNos).sort(),
            moduleCode,
            lessonType: this.lessonTypeMap[lessonType] || lessonType,
            timing: [],
            weeks: new Set()
          };
        }
        classNoMap[classNoKey].timing.push(slot.timing);
        slot.weeks.forEach(w => classNoMap[classNoKey].weeks.add(w));
      }

      // Prepare the slots array
      const slots = Object.values(classNoMap).map(slot => ({
        classNo: slot.classNo,
        moduleCode: slot.moduleCode,
        lessonType: slot.lessonType,
        timing: slot.timing,
        weeks: Array.from(slot.weeks).sort((a, b) => a - b)
      }));

      // Push to result
      result.push({
        moduleCode,
        lessonType,
        slots
      });
    }

    return result;
  }





  getModuleTimetable(modData, moduleCode, semester) {
    // Find the module by code
    const moduleObj = modData.find(m => m.moduleCode === moduleCode);
    if (!moduleObj) throw new Error(`Module ${moduleCode} not found`);
    // Find the semester data
    const semObj = moduleObj.semesterData.find(s => s.semester === semester);
    if (!semObj) throw new Error(`Semester ${semester} not found for module ${moduleCode}`);
    // Transform timetable
    return this.processTimetable(semObj.timetable, moduleCode);
  }

  async getCleaned() {
    const result = [];
    const modData = await this.fetchAllModuleData();

    // check availability of modules
    const missing = this.findUnavailModules(modData, this._modList, this._sem);
    if (missing.length > 0) {
      throw new Error(`The following modules are not available: ${missing.join(', ')}`);
    }

    for (const mod of this._modList) {
      try {
        const output = this.getModuleTimetable(modData, mod, this._sem);
        // console.log(JSON.stringify(output, null, 2));
        output.forEach(lessonType => result.push(lessonType)); // flatten into one list
      } catch (e) {
        console.error(e.message);
        // Optionally: result.push(null);
        return [];
      }
    }

    return result;
  }


  findUnavailModules(modData, modList, sem) {
    const missing = [];

    if (null in modData) return modList;
    for (const mod of modList) {
      const moduleObj = modData.find(m => m.moduleCode === mod);
      if (!moduleObj) {
        missing.push(mod);
        continue;
      }
      const semObj = moduleObj.semesterData && moduleObj.semesterData.find(s => s.semester === sem);
      if (!semObj) {
        missing.push(mod);
      }
    }
    return missing;
  }

}


