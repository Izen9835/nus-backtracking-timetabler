// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../nusmodsFetcher.mjs'

import { solve, convertToURL } from '../Solver.js';


// user input after cleaning
var _modList = ['CS1010'];
var _sem = 1
var _acadYear = "2025-2026";

const fetcher = new ModFetcher(_modList, _sem, _acadYear);

const allModData = await fetcher.getCleaned();

const breaks = [];

const solved = solve(allModData, breaks)

const url = convertToURL(solved, _sem);

console.log("Solved Output:");
console.log(solved);

console.log(`URL ${url}`);

