// // npm install genetic-js
// const Genetic = require('genetic-js');

import { Session, Timeslot, Timetable, Module } from './DataStructures.js';

// Purpose: output a list of Modules (as defined in GeneticAlgo.js) 
// remove other semester's data (e.g. only take data for sem 1)
// clean any duplicate timeslots (for now just remove duplicates)`

/* what we know so far about duplicate timeslots
same timing diff loc e..g 16A 16B 16C

*/



export default class ModFetcher {
  constructor(modList, sem) {
    this._modList = modList; // Array of module codes
    this._sem = sem;
    this.baseUrl = 'https://api.nusmods.com/v2/2024-2025/modules'; //might need to add AY eventually
  }

  async fetchSingleModuleData(moduleCode) {
    try {
      const response = await fetch(`${this.baseUrl}/${moduleCode}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${moduleCode}:`, error);
      return null;
    }
  }

  async fetchAllModuleData() {
    try {
      return await Promise.all(
        this._modList.map(mod => this.fetchSingleModuleData(mod))
      );
    } catch (error) {
      console.error('Batch fetch failed:', error);
      return [];
    }
  }





  async fetchAllCleanModuleData() {
    var output = {};
    var modData = await this.fetchAllModuleData();

    for (var data of modData) {
      /* check semester availability */
      var isSemAvail = false;
      var semData;
      for (var _semData of data.semesterData) {
        if (_semData.semester == this._sem) {
          isSemAvail = true;
          semData = _semData;
        }
      }
      if (!isSemAvail) throw new Error(`${data.moduleCode} is not available in semester ${this._sem}`)
      else console.log(`semester data is available for ${data.moduleCode}`);

      console.log(`number of sessions to assign is: ${semData.timetable.length}`);

      output[data.moduleCode] = this.convertToModule(data.moduleCode, semData.timetable, semData.timetable.length);

    }

    return output;
  }


  convertToModule(moduleCode, semesterData, noToAssign) {
    /* package semesterData into Timeslots */
    // each Timeslot EITHER shares the same classNo
    // OR shares the same timings
    // not both

    var output = new Module(moduleCode);
    const assigned = new Set();

    // Step 1: group by classNo
    const groupByClassNo = Object.groupBy(semesterData,
      item => item.classNo
    );
    for (const group of Object.values(groupByClassNo)) {
      if (group.length > 1) {
        var _timeslot = new Timeslot();

        group.forEach(obj => {
          assigned.add(obj);
          _timeslot.insertSession(new Session(obj));
        });

        var activity = group[0].lessonType;
        output.addTimeslot(activity, _timeslot);
      }
    }

    // Step 2: group by Timings
    const unassigned = semesterData.filter(obj => !assigned.has(obj));
    const groupByTimings = Object.groupBy(unassigned,
      item => `${item.startTime}-${item.endTime}-${item.day}`
    );

    for (const group of Object.values(groupByTimings)) {
      if (group.length > 1) {
        var _timeslot = new Timeslot();

        group.forEach(obj => {
          assigned.add(obj);
          _timeslot.insertSession(new Session(obj));
        });

        var activity = group[0].lessonType;
        output.addTimeslot(activity, _timeslot);
      }
    }

    // Singletons (e.g. CS1010 sectional teaching)
    const remaining = semesterData.filter(obj => !assigned.has(obj));
    remaining.forEach(obj => {
      var _timeslot = new Timeslot();
      _timeslot.insertSession(new Session(obj));
      output.addTimeslot(obj.lessonType, _timeslot);
    });

    // console.log("=======================================");
    // console.log(moduleCode);
    // console.log(output.availableTimeslots['Laboratory']);
    // console.log(output.availableTimeslots['Tutorial']);
    // console.log(output.availableTimeslots['Sectional Teaching']);

    return output;
  }


}


