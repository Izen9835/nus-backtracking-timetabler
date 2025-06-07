// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../nusmodsFetcher.mjs'

// user input after cleaning
var _modList = ['CG1111A', 'CS1010'];
var _sem = 1

const fetcher = new ModFetcher(_modList, _sem);

const allModuleCleanData = await fetcher.fetchAllCleanModuleData();


// console.log(allModuleCleanData);
