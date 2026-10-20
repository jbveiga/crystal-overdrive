const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===========================================================');
console.log('🔍 CRYSTAL OVERDRIVE — PERIODIC OPTIMIZATION & HEALTH REVIEW');
console.log('===========================================================\n');

let totalIssues = 0;

// 1. Architecture Boundary Scan (Zero DOM/Pixi in core, world, battle)
console.log('1️⃣  Auditing Layer Boundaries (src/core, src/world, src/battle)...');
const pureDirs = ['src/core', 'src/world', 'src/battle'];
const forbiddenPatterns = [
  /from ['"]pixi\.js['"]/,
  /from ['"]@pixi\//,
  /\bdocument\./,
  /\bwindow\./,
  /\bHTMLElement\b/,
  /\bHTMLDivElement\b/,
];

let boundaryViolations = 0;
for (const dir of pureDirs) {
  const fullDir = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(fullDir)) continue;

  const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.ts'));
  for (const file of files) {
    const filePath = path.join(fullDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        console.error(`  ❌ Violation in ${dir}/${file}: forbidden pattern ${pattern}`);
        boundaryViolations++;
        totalIssues++;
      }
    }
  }
}
if (boundaryViolations === 0) {
  console.log('  ✅ Layer Boundaries 100% Pure: Zero DOM/Pixi dependencies in core logic layers.\n');
} else {
  console.log(`  ⚠️  Found ${boundaryViolations} layer boundary violations.\n`);
}

// 2. NPC Walkability & Map Collision Grid Audit
console.log('2️⃣  Auditing NPC Coordinates & Map Walkability...');
const npcDataSrc = fs.readFileSync(path.resolve(__dirname, '../src/world/npcData.ts'), 'utf8');
const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
let npcWalkabilityFailures = 0;

// Parse NPC definitions from npcData.ts
const npcRegex = /makeNpc\(\s*['"]([^'"]+)['"],\s*(\d+),\s*(\d+)/g;
// Map-scoped regex
const mapSectionRegex = /([a-z0-9_]+):\s*\[([\s\S]*?)\]/g;
let mapMatch;

while ((mapMatch = mapSectionRegex.exec(npcDataSrc)) !== null) {
  const mapId = mapMatch[1];
  const sectionContent = mapMatch[2];
  const mapPath = path.join(mapsDir, `${mapId}.json`);

  if (!fs.existsSync(mapPath)) continue;
  const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  let npcMatch;
  const localRegex = /makeNpc\(\s*['"]([^'"]+)['"],\s*(\d+),\s*(\d+)/g;
  while ((npcMatch = localRegex.exec(sectionContent)) !== null) {
    const npcId = npcMatch[1];
    const x = parseInt(npcMatch[2], 10);
    const y = parseInt(npcMatch[3], 10);

    const tileVal = mapData.collisionGrid[y * mapData.width + x];
    if (tileVal !== 0 && tileVal !== 2) {
      console.error(`  ❌ NPC "${npcId}" in ${mapId} at (${x}, ${y}) is non-walkable (tile: ${tileVal})!`);
      npcWalkabilityFailures++;
      totalIssues++;
    }
  }
}

if (npcWalkabilityFailures === 0) {
  console.log('  ✅ 100% of Overworld NPCs are standing on strictly walkable tiles (0 or 2).\n');
} else {
  console.log(`  ⚠️  Found ${npcWalkabilityFailures} non-walkable NPC coordinates.\n`);
}

// 3. Reciprocal Map Warps Integrity Audit
console.log('3️⃣  Auditing Map Warps & Boundary Targets...');
const mapFiles = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json'));
let brokenWarps = 0;

for (const mapFile of mapFiles) {
  const mapData = JSON.parse(fs.readFileSync(path.join(mapsDir, mapFile), 'utf8'));
  for (const warp of mapData.warps || []) {
    const targetPath = path.join(mapsDir, `${warp.targetMapId}.json`);
    if (!fs.existsSync(targetPath)) {
      console.error(`  ❌ Map ${mapData.id} has warp pointing to missing map "${warp.targetMapId}"`);
      brokenWarps++;
      totalIssues++;
    }
  }
}
if (brokenWarps === 0) {
  console.log('  ✅ All warps across all maps resolve to valid, registered target maps.\n');
} else {
  console.log(`  ⚠️  Found ${brokenWarps} broken warps.\n`);
}

// 4. Run Automated Test Suite (Vitest)
console.log('4️⃣  Running Automated Test Suite (npm test)...');
try {
  const testOutput = execSync('npx vitest run', { stdio: 'pipe' }).toString();
  const passMatch = testOutput.match(/Tests\s+([0-9]+)\s+passed/);
  console.log(`  ✅ Test Suite Cleared: ${passMatch ? passMatch[0] : 'All tests passed'}.\n`);
} catch (err) {
  console.error('  ❌ Test Suite Failed:');
  console.error(err.stdout ? err.stdout.toString() : err.message);
  totalIssues++;
}

// 5. Production Build & Chunk Size Audit
console.log('5️⃣  Auditing Production Bundle & Code Splitting (npm run build)...');
try {
  const buildOutput = execSync('npm run build', { stdio: 'pipe' }).toString();
  console.log('  ✅ Production Build Succeeded with Clean Code Splitting:');
  const lines = buildOutput.split('\n');
  lines
    .filter((l) => l.includes('dist/assets/'))
    .forEach((l) => console.log(`     ${l.trim()}`));
  console.log('');
} catch (err) {
  console.error('  ❌ Production Build Failed:');
  console.error(err.stdout ? err.stdout.toString() : err.message);
  totalIssues++;
}

console.log('===========================================================');
if (totalIssues === 0) {
  console.log('🎉 REVIEW COMPLETE: ALL PROJECT HEALTH & OPTIMIZATION CHECKS PASSED (0 issues)');
} else {
  console.log(`⚠️  REVIEW COMPLETE: Found ${totalIssues} issue(s) needing remediation.`);
  process.exit(1);
}
console.log('===========================================================\n');
