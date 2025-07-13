import express from 'express';
import ModFetcher from './nusmodsFetcher.mjs';
import { solve, convertToURL } from './Solver.js';

const app = express();
app.use(express.json());

// Example: GET /modules/cleaned?mods=CS2100,CS2101&sem=1&acadYear=2025-2026
app.get('/modules/cleaned', async (req, res) => {
    try {
        const modList = (req.query.mods || '').split(',').map(s => s.trim()).filter(Boolean);
        const sem = parseInt(req.query.sem, 10);
        const acadYear = req.query.acadYear;

        if (!modList.length || !sem || !acadYear) {
            return res.status(400).json({ error: 'Missing required query parameters: mods, sem, acadYear' });
        }

        const fetcher = new ModFetcher(modList, sem, acadYear);
        const cleaned = await fetcher.getCleaned();
        res.json(cleaned);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Example: GET /modules/validate?mods=CS2100,CS2101&sem=1&acadYear=2025-2026
app.get('/modules/validate', async (req, res) => {
    try {
        const modList = (req.query.mods || '').split(',').map(s => s.trim()).filter(Boolean);
        const sem = parseInt(req.query.sem, 10);
        const acadYear = req.query.acadYear;

        if (!modList.length || !sem || !acadYear) {
            return res.status(400).json({ error: 'Missing required query parameters: mods, sem, acadYear' });
        }

        const fetcher = new ModFetcher(modList, sem, acadYear);
        const modData = await fetcher.fetchAllModuleData();
        const missing = fetcher.findUnavailModules(modData, modList, sem);
        res.json({ missing });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Example: GET /nusmodsURL?mods=CS2100,CS2101&sem=1&acadYear=2025-2026
app.get('/nusmodsURL', async (req, res) => {
    try {
        const modList = (req.query.mods || '').split(',').map(s => s.trim()).filter(Boolean);
        const sem = parseInt(req.query.sem, 10);
        const acadYear = req.query.acadYear;

        if (!modList.length || !sem || !acadYear) {
            return res.status(400).json({ error: 'Missing required query parameters: mods, sem, acadYear' });
        }

        const fetcher = new ModFetcher(modList, sem, acadYear);
        const modData = await fetcher.getCleaned();
        const output = convertToURL(solve(modData, []), sem);
        res.json({ output });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('NUSMods REST API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
