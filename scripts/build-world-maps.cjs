#!/usr/bin/env node
/**
 * Compiles all individual maps in public/assets/data/maps/*.json into a single
 * consolidated payload public/assets/data/world_maps.json to eliminate 315+
 * concurrent network requests during initial application boot (Ticket Sprint 09).
 */
const fs = require('fs');
const path = require('path');

const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
const outPath = path.resolve(__dirname, '../public/assets/data/world_maps.json');

const files = fs
  .readdirSync(mapsDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

const worldMaps = [];
for (const file of files) {
  const filePath = path.join(mapsDir, file);
  const mapData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  worldMaps.push(mapData);
}

fs.writeFileSync(outPath, JSON.stringify(worldMaps));
const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`📦 Consolidated ${worldMaps.length} maps into public/assets/data/world_maps.json (${sizeKb} kB).`);
