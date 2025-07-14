// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../API/nusmodsFetcher.mjs'

import { solve, convertToURL } from '../API/Solver.js';


// user input after cleaning
// var _modList = ['CS2040C', 'CS2107', 'EE2012', 'EE4204', 'EE2026'];
var _modList = ['CS2100', 'CS2103T', 'CS2101', 'MA2104', 'QF1100', 'UTC2110'];
var _sem = 1
var _acadYear = "2025-2026";
const breaks = [{ "day": "Monday", "startTime": "08:00", "endTime": "18:00" }];

const fetcher = new ModFetcher(_modList, _sem, _acadYear);

const allModData = await fetcher.getCleaned();



const solved = solve(allModData, breaks)

const url = convertToURL(solved, _sem);

console.log("Solved Output:");
console.log(solved);

console.log(`URL ${url}`);

