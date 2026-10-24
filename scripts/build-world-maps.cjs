const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const bundlePath = path.join(root, 'public/assets/data/world_maps.json');
const mapsDir = path.join(root, 'public/assets/data/maps');

if (fs.existsSync(bundlePath) && fs.statSync(bundlePath).size > 0) {
  console.log('⚡ [Map Build] Existing world_maps.json bundle verified.');
  process.exit(0);
}

if (fs.existsSync(mapsDir)) {
  console.log('⚡ [Map Build] Bundling map JSON files...');
  const files = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json'));
  const maps = files.map((f) => JSON.parse(fs.readFileSync(path.join(mapsDir, f), 'utf8')));
  fs.writeFileSync(bundlePath, JSON.stringify(maps));
  console.log(`⚡ [Map Build] Successfully bundled ${maps.length} maps into world_maps.json`);
} else {
  console.log('⚡ [Map Build] No maps directory found, skipping.');
}
