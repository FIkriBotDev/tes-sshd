// utils/jsondb.js
const fs = require('fs-extra');

async function readDB(path) {
  await fs.ensureFile(path);
  const raw = await fs.readFile(path, 'utf8').catch(()=> '');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

async function writeDB(path, data) {
  await fs.outputFile(path, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readDB, writeDB };
