// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../nusmodsFetcher.mjs'

// user input after cleaning
var _modList = ['CS1010'];
var _sem = 2

const fetcher = new ModFetcher(_modList, _sem);

console.log('unclean DATA');
// const allModuleData = await fetcher.fetchAllModuleData();

// console.log(allModuleData[0].semesterData[0].timetable);



console.log('\n'.repeat(6), 'CLEANY DATA');
const allModuleCleanData = await fetcher.fetchAllCleanModuleData();


console.log(allModuleCleanData);

console.log(allModuleCleanData['CS1010']['availableTimeslots']['Sectional Teaching'][0]['sessions']);
