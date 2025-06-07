/* Data Structures

Session
        {
          "classNo": "01",
          "startTime": "1400",
          "endTime": "1700",
          "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          "venue": "E4A-04-08",
          "day": "Monday",
          "lessonType": "Laboratory",
          "size": 60,
          "covidZone": "A"
        },


Timeslot
    a set of sessions
    (because some timeslots have multiple sessions)
    (e.g. Mon 0900-1200 and Wed 0900-1200 can come as a pair)

    within a Timeslot, 
    EITHER sessions share the same classNo
    OR sessions share the same timing
    Not both.

Module
    the set of timeslots available in a module
    grouped into lessonType


Timetable
    a set of timeslots defining the timetable...
    genome : {A, B, C ...}
    For every module, for each of its lessonTypes, choose one timeslot to fill in A,B,C...


*/

export class Session {
  constructor(obj) {
    this.day = obj.day;     // e.g., 'Monday'
    this.start = obj.startTime; // e.g., '1000'
    this.end = obj.endTime;     // e.g., '1100'
    this.weeks = obj.weeks;
    this.classNo = obj.classNo;
    // this.obj = obj; // possibly add back if needed down the line
  }

  overlaps(other) { /*TODO: update this function to check for overlaps*/
    // return the amount of overlap (not just boolean)
    // which will be used later by fitness function
    return this.day === other.day &&
      !(this.end <= other.start || this.start >= other.end);
  }
}

export class Timeslot {
  constructor() {
    this.classNo = new Set(); // for alternative class numbers that share the same timing
    this.sessions = []; // Array of Session objects
  }

  insertSession(_Session) {
    this.sessions.push(_Session);
    this.classNo.add(_Session.classNo);

  }

  overlaps(otherTimeslot) {
    // consider matrix or double for loop (n^2)
    for (const s1 of this.sessions) {
      for (const s2 of otherTimeslot.sessions) {
        if (s1.overlaps(s2)) return true;
      }
    }
    return false;
  }
}

export class Timetable {
  constructor(timeslots) {
    this.timeslots = timeslots;
  }
}

class BreakWindow extends Session {
  constructor(day, start, end, priority) {
    super(day, start, end);
    this.priority = priority; // 1 = highest importance
  }
}

export class Module {
  constructor(code) {
    this.code = code;
    this.availableTimeslots = {}; // Object
    // { lecture: [timeslot, timeslot, ... ],
    //   tutorial: [timeslot, timeslot, ... ]}
  }

  addTimeslot(activity, Timeslot) {
    // e.g. if already has a list of Lecture Timeslots, add to existing list
    // otherwise create a new list
    if (this.availableTimeslots.hasOwnProperty(activity)) this.availableTimeslots[activity].push(Timeslot);
    else {
      this.availableTimeslots[activity] = [Timeslot];
    }
  }
}






