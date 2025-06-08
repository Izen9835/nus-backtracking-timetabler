// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../nusmodsFetcher.mjs'

// user input after cleaning
var _modList = ['CG1111A', 'CS1010'];
var _sem = 1

const fetcher = new ModFetcher(_modList, _sem);

const allModData = await fetcher.fetchAllCleanModuleData();


// console.log(allModData);



// on to the genetic algorithm


import Genetic from 'genetic-js'

var genetic = Genetic.create();

genetic.optimize = Genetic.Optimize.Maximize;
genetic.select1 = Genetic.Select1.Tournament2;
genetic.select2 = Genetic.Select2.Tournament2;

genetic.seed = function () {
    var output = [];

    // for each mod
    for (var mod of Object.values(allModData)) {
        for (var activity of Object.values(mod.availableTimeslots)) {
            output.push(Math.floor(Math.random() * activity.length));
        }
    }

    console.log(output);
};

genetic.fitness = function () {

};

function genSeed() {
    var output = [];

    // for each mod
    for (var mod of Object.values(allModData)) {
        for (var activity of Object.values(mod.availableTimeslots)) {
            output.push(Math.floor(Math.random() * activity.length));
        }
    }

    return output;
};

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
        timeslot.sessions.forEach(element => {
            output.push({ day: element.day, startTime: element.startTime, endTime: element.endTime, title: "bruh" });
        });
    }

    return output;
}

console.log(express(allModData, genSeed()));





