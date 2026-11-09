/**
 * Writes dist/offline-manifest.json: the list of every built file the game needs to run offline.
 * Run automatically after `vite build` (see package.json "build").
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXCLUDE = new Set(['sw.js', 'offline-manifest.json']);

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else {
      const rel = path.relative(base, full).split(path.sep).join('/');
      if (!EXCLUDE.has(rel) && !entry.name.startsWith('.')) out.push({ url: rel, size: fs.statSync(full).size });
    }
  }
  return out;
}

function buildManifest(distDir) {
  const files = listFiles(distDir).sort((a, b) => (a.url < b.url ? -1 : 1));
  const hash = crypto.createHash('sha1');
  for (const f of files) hash.update(`${f.url}:${f.size}\n`);
  // Same-sized edits are caught by hashing the entry HTML (it references every hashed bundle)
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) hash.update(fs.readFileSync(indexPath));
  return { version: hash.digest('hex').slice(0, 12), totalBytes: files.reduce((a, f) => a + f.size, 0), files };
}

module.exports = { listFiles, buildManifest };

if (require.main === module) {
  const dist = path.resolve(__dirname, '..', 'dist');
  const manifest = buildManifest(dist);
  fs.writeFileSync(path.join(dist, 'offline-manifest.json'), JSON.stringify(manifest));
  console.log(`📦 [Offline] manifest ${manifest.version}: ${manifest.files.length} files, ${(manifest.totalBytes / 1048576).toFixed(1)} MB`);
}
