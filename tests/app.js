// const ModFetcher = require('../nusmodsFetcher');
import ModFetcher from '../nusmodsFetcher.mjs'

// user input after cleaning
var _modList = ['CG2111A'];
var _sem = 1
var _acadYear = "2025-2026";

const fetcher = new ModFetcher(_modList, _sem, _acadYear);

const allModData = await fetcher.getCleaned();

console.log(allModData);

import { writeFile } from 'fs/promises';


async function main() {
    const allModData = await fetcher.getCleaned();

    try {
        await writeFile('cs1010cs1231hsi1000cde2000pf1101.json', JSON.stringify(allModData, null, 2), 'utf-8');
        console.log('allModData has been saved to allModData.json');
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

main();