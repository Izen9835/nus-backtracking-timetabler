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

    const groupBy = key => array =>
      array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
      }, {});


    var modData = await this.fetchAllModuleData();


    // process modData
    for (var mod in this._modList) {

      /* check semester availability */
      var isSemAvail = false;
      var semIndex = -1;
      for (var semData in modData[mod].semesterData) {
        if (modData[mod].semesterData[semData].semester == this._sem) {
          isSemAvail = true;
          semIndex = semData;
        }
      }
      if (!isSemAvail) throw new Error(`${this._modList[mod]} is not available in semester ${this._sem}`);
      else console.log(`semester data is available for ${this._modList[mod]}`);


      /* package timetableData into Modules */
      // timetableData is a set of Sessions that has repeats uncleaned
      // ignoring any Sessions that have identical timings.
      var _Module = new Module(this._modList[mod]);
      var timetableData = modData[mod].semesterData[semIndex].timetable;

      /* var timetableData = [
      {
        classNo: '05',
          startTime: '1400',
            endTime: '1700',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'COM3-01-19',
                  day: 'Monday',
                    lessonType: 'Laboratory',
                      size: 50,
                        covidZone: 'C'
      },

      {
        classNo: '01',
          startTime: '0900',
            endTime: '1200',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Wednesday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '01',
          startTime: '1400',
            endTime: '1700',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Monday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '02',
          startTime: '1400',
            endTime: '1700',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Tuesday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '03',
          startTime: '1400',
            endTime: '1700',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Wednesday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '04',
          startTime: '0900',
            endTime: '1200',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Tuesday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '03',
          startTime: '0900',
            endTime: '1200',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Monday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '02',
          startTime: '1400',
            endTime: '1700',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Friday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '04',
          startTime: '0900',
            endTime: '1200',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'E4A-04-08',
                  day: 'Thursday',
                    lessonType: 'Laboratory',
                      size: 60,
                        covidZone: 'C'
      },
      {
        classNo: '05',
          startTime: '0900',
            endTime: '1200',
              weeks: [
                1, 2, 3, 4, 5, 6,
                7, 8, 9, 10, 11, 12,
                13
              ],
                venue: 'COM3-01-19',
                  day: 'Wednesday',
                    lessonType: 'Laboratory',
                      size: 50,
                        covidZone: 'C'
      }
      ]*/
      // console.log(timetableData);
      var groupedTimetableData = groupBy('classNo')(timetableData);
      // console.log(groupedTimetableData);

      for (var classNo in groupedTimetableData) {
        var _Timeslot = new Timeslot(classNo,);

        for (var session in groupedTimetableData[classNo]) {
          var _Session = new Session(groupedTimetableData[classNo][session]);
          _Timeslot.insertSession(_Session);
        }

        var activity = groupedTimetableData[classNo][0].lessonType;
        _Module.addTimeslot(activity, _Timeslot);

      }

      output[this._modList[mod]] = _Module;
    }

    return output;
  }
}


