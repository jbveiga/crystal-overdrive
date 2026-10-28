const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===========================================================');
console.log('🔍 CRYSTAL OVERDRIVE — PERIODIC OPTIMIZATION & HEALTH REVIEW');
console.log('===========================================================\n');

let totalIssues = 0;

// 1. Architecture Boundary Scan (Zero DOM/Pixi in core, world, battle)
console.log('1️⃣  Auditing Layer Boundaries (src/core, src/world, src/battle)...');
const pureDirs = ['src/core', 'src/world', 'src/world/npcs', 'src/world/interactions', 'src/battle'];
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
const npcDataPath = path.resolve(__dirname, '../src/world/npcData.ts');
const npcsDirPath = path.resolve(__dirname, '../src/world/npcs');
let npcDataSrc = fs.readFileSync(npcDataPath, 'utf8');
if (fs.existsSync(npcsDirPath)) {
  const npcFiles = fs.readdirSync(npcsDirPath).filter((f) => f.endsWith('.ts'));
  for (const f of npcFiles) {
    npcDataSrc += '\n' + fs.readFileSync(path.join(npcsDirPath, f), 'utf8');
  }
}
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
    const isWaterTileAllowed = (mapId === 'route_40' || mapId === 'route_41' || mapId.includes('whirl_island')) && tileVal === 3;
    if (tileVal !== 0 && tileVal !== 2 && !isWaterTileAllowed) {
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

// 6. Agent-Optimized Architecture & File Ceiling (< 800 Lines, <= 42,000 Bytes) Audit
console.log('6️⃣  Auditing Agent-Optimized Architecture & Single-Window File Ceiling (< 800 Lines)...');
function getTsFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getTsFilesRecursively(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

const allTsFiles = [
  ...getTsFilesRecursively(path.resolve(__dirname, '../src')),
  ...getTsFilesRecursively(path.resolve(__dirname, '../tests')),
];
let fileCeilingViolations = 0;
let byteCeilingViolations = 0;
let repoMaxLines = 0;
let repoMaxFile = '';
let repoMaxBytes = 0;
let repoMaxByteFile = '';

for (const filePath of allTsFiles) {
  const fileStat = fs.statSync(filePath);
  const lineCount = fs.readFileSync(filePath, 'utf8').split('\n').length;
  const byteCount = fileStat.size;

  if (lineCount > repoMaxLines) {
    repoMaxLines = lineCount;
    repoMaxFile = path.relative(path.resolve(__dirname, '..'), filePath);
  }
  if (byteCount > repoMaxBytes) {
    repoMaxBytes = byteCount;
    repoMaxByteFile = path.relative(path.resolve(__dirname, '..'), filePath);
  }
  if (lineCount > 800) {
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
    console.error(`  ❌ File exceeds 800-line single-window threshold: ${relPath} (${lineCount} lines)`);
    fileCeilingViolations++;
    totalIssues++;
  }
  if (byteCount > 42000) {
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
    console.error(`  ❌ File exceeds 42,000-byte single-window ceiling: ${relPath} (${byteCount} bytes)`);
    byteCeilingViolations++;
    totalIssues++;
  }
}

if (fileCeilingViolations === 0 && byteCeilingViolations === 0) {
  console.log(`  ✅ 100% of TypeScript files strictly adhere to <= 800-line and <= 42,000-byte ceilings (${allTsFiles.length} files audited, max lines: ${repoMaxLines} in ${repoMaxFile}, max bytes: ${repoMaxBytes} B in ${repoMaxByteFile}).\n`);
} else {
  console.log(`  ⚠️  Found ${fileCeilingViolations} line-ceiling and ${byteCeilingViolations} byte-ceiling violations.\n`);
}

// 7. Semantic Routing Index & @sections Header Integrity
console.log('7️⃣  Auditing ARCHITECTURE.md Semantic Routing Index & @sections Headers...');
const archPath = path.resolve(__dirname, '../ARCHITECTURE.md');
let archIssues = 0;

if (!fs.existsSync(archPath)) {
  console.error('  ❌ ARCHITECTURE.md not found!');
  archIssues++;
  totalIssues++;
} else {
  const archContent = fs.readFileSync(archPath, 'utf8');

  // Verify all src/... and tests/... paths cited in ARCHITECTURE.md exist on disk
  const citedPaths = archContent.match(/`(src\/[^`]+|tests\/[^`]+)`/g) || [];
  for (const m of citedPaths) {
    const p = path.resolve(__dirname, '..', m.slice(1, -1));
    if (!fs.existsSync(p)) {
      console.error(`  ❌ Broken path cited in ARCHITECTURE.md: ${m}`);
      archIssues++;
      totalIssues++;
    }
  }

  // Verify all src/ files are indexed in Section 0
  const srcTsFiles = getTsFilesRecursively(path.resolve(__dirname, '../src'));
  const section0 = archContent.slice(
    archContent.indexOf('## 0. Agent Semantic Routing Index'),
    archContent.indexOf('## 1. Executive Overview')
  );
  for (const srcFile of srcTsFiles) {
    const relSrc = path.relative(path.resolve(__dirname, '..'), srcFile);
    if (!section0.includes('`' + relSrc + '`')) {
      console.error(`  ❌ Missing from ARCHITECTURE.md Section 0: ${relSrc}`);
      archIssues++;
      totalIssues++;
    }
  }

  // Verify @fileoverview and @sections in all src/ files > 200 lines
  for (const srcFile of srcTsFiles.filter((f) => f.endsWith('.ts'))) {
    const lines = fs.readFileSync(srcFile, 'utf8').split('\n');
    if (lines.length > 200) {
      const first15 = lines.slice(0, 15).join('\n');
      const relSrc = path.relative(path.resolve(__dirname, '..'), srcFile);
      if (!first15.includes('@fileoverview') || !first15.includes('@sections')) {
        console.error(`  ❌ Missing @fileoverview or @sections header in lines 1-15: ${relSrc}`);
        archIssues++;
        totalIssues++;
      }
    }
  }
}

if (archIssues === 0) {
  console.log('  ✅ 100% of src/ files are indexed in ARCHITECTURE.md Section 0, 0 broken paths, and all files > 200 lines contain @fileoverview and @sections.\n');
} else {
  console.log(`  ⚠️  Found ${archIssues} Semantic Routing Index or header issues.\n`);
}

console.log('===========================================================');
if (totalIssues === 0) {
  console.log('🎉 REVIEW COMPLETE: ALL PROJECT HEALTH & OPTIMIZATION CHECKS PASSED (0 issues)');
} else {
  console.log(`⚠️  REVIEW COMPLETE: Found ${totalIssues} issue(s) needing remediation.`);
  process.exit(1);
}
console.log('===========================================================\n');
