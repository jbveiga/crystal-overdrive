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

const MAX_BUNDLE_FILES = 500;
const MAX_BUNDLE_BYTES = 20 * 1024 * 1024;

/** Splits the (sorted) file list into contiguous bundles of at most 500 files / 20 MB. A single larger file gets its own bundle. */
function groupIntoBundles(files, maxFiles = MAX_BUNDLE_FILES, maxBytes = MAX_BUNDLE_BYTES) {
  const bundles = [];
  let start = 0;
  let count = 0;
  let bytes = 0;
  files.forEach((f, i) => {
    if (count > 0 && (count + 1 > maxFiles || bytes + f.size > maxBytes)) {
      bundles.push({ start, end: i, bytes });
      start = i;
      count = 0;
      bytes = 0;
    }
    count++;
    bytes += f.size;
  });
  if (count > 0) bundles.push({ start, end: files.length, bytes });
  return bundles;
}

function buildManifest(distDir) {
  const files = listFiles(distDir).sort((a, b) => (a.url < b.url ? -1 : 1));
  const hash = crypto.createHash('sha1');
  for (const f of files) hash.update(`${f.url}:${f.size}\n`);
  // Same-sized edits are caught by hashing the entry HTML (it references every hashed bundle)
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) hash.update(fs.readFileSync(indexPath));
  return { version: hash.digest('hex').slice(0, 12), totalBytes: files.reduce((a, f) => a + f.size, 0), files, bundles: groupIntoBundles(files) };
}

module.exports = { listFiles, buildManifest, groupIntoBundles, MAX_BUNDLE_FILES, MAX_BUNDLE_BYTES };

if (require.main === module) {
  const dist = path.resolve(__dirname, '..', 'dist');
  const manifest = buildManifest(dist);
  fs.writeFileSync(path.join(dist, 'offline-manifest.json'), JSON.stringify(manifest));
  console.log(`📦 [Offline] manifest ${manifest.version}: ${manifest.files.length} files in ${manifest.bundles.length} bundles, ${(manifest.totalBytes / 1048576).toFixed(1)} MB`);
}
