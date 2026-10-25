/**
 * fetch-all-pokemon-sprites.cjs
 * Comprehensive batch extraction of all 251 Generation 2 Pokémon sprites:
 * - Front battle sprites (96x96): public/assets/sprites/pokemon/${speciesId}_front.png
 * - Back battle sprites (96x96): public/assets/sprites/pokemon/${speciesId}_back.png
 * - Menu / Box mini-icons (40x30): public/assets/sprites/pokemon/icons/${speciesId}.png
 *
 * Source: PokeAPI / GitHub raw CDN
 */

const fs = require('fs');
const path = require('path');
const { Dex } = require('@pkmn/dex');

const projectRoot = path.resolve(__dirname, '..');
const POKEMON_DIR = path.join(projectRoot, 'public/assets/sprites/pokemon');
const ICONS_DIR = path.join(POKEMON_DIR, 'icons');

fs.mkdirSync(POKEMON_DIR, { recursive: true });
fs.mkdirSync(ICONS_DIR, { recursive: true });

const BASE_FRONT = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const BASE_BACK = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back';
const BASE_ICON =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons';

// Concurrency pool helper
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return false; // already exists
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error(`Empty response from ${url}`);
  }
  fs.writeFileSync(destPath, buf);
  return true;
}

function getSnakeAlias(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, '_f')
    .replace(/♂/g, '_m')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '');
}

async function main() {
  const startTime = Date.now();
  console.log('===========================================================');
  console.log('⚡ CRYSTAL OVERDRIVE: 251 POKÉMON SPRITES BATCH EXTRACTION');
  console.log('===========================================================');

  // Collect all 251 Gen 1-2 species
  const allSpecies = [];
  for (let num = 1; num <= 251; num++) {
    const sp = Dex.species.all().find((s) => s.num === num && !s.forme);
    if (!sp) {
      throw new Error(`Dex missing species #${num}`);
    }
    allSpecies.push({
      num,
      name: sp.name,
      id: sp.id,
      alias: getSnakeAlias(sp.name),
    });
  }

  console.log(`📋 Total species to verify/download: ${allSpecies.length} (Bulbasaur to Celebi)\n`);

  // Download Tasks
  let downloadedFront = 0;
  let downloadedBack = 0;
  let downloadedIcon = 0;

  await mapConcurrent(allSpecies, 15, async (p) => {
    const frontUrl = `${BASE_FRONT}/${p.num}.png`;
    const backUrl = `${BASE_BACK}/${p.num}.png`;
    const iconUrl = `${BASE_ICON}/${p.num}.png`;

    const frontPath = path.join(POKEMON_DIR, `${p.id}_front.png`);
    const backPath = path.join(POKEMON_DIR, `${p.id}_back.png`);
    const iconPath = path.join(ICONS_DIR, `${p.id}.png`);

    try {
      if (await downloadFile(frontUrl, frontPath)) downloadedFront++;
      if (await downloadFile(backUrl, backPath)) downloadedBack++;
      if (await downloadFile(iconUrl, iconPath)) downloadedIcon++;

      // Create alias duplicates if alias !== id (e.g. mr_mime vs mrmime, ho_oh vs hooh)
      if (p.alias && p.alias !== p.id) {
        const aliasFront = path.join(POKEMON_DIR, `${p.alias}_front.png`);
        const aliasBack = path.join(POKEMON_DIR, `${p.alias}_back.png`);
        const aliasIcon = path.join(ICONS_DIR, `${p.alias}.png`);

        if (!fs.existsSync(aliasFront)) fs.copyFileSync(frontPath, aliasFront);
        if (!fs.existsSync(aliasBack)) fs.copyFileSync(backPath, aliasBack);
        if (!fs.existsSync(aliasIcon)) fs.copyFileSync(iconPath, aliasIcon);
      }
    } catch (err) {
      console.error(`❌ Error downloading #${p.num} (${p.name}):`, err.message);
      throw err;
    }
  });

  console.log('\n--- Download & Cache Status ---');
  console.log(`Front Battle Sprites Downloaded: ${downloadedFront}`);
  console.log(`Back Battle Sprites Downloaded: ${downloadedBack}`);
  console.log(`Menu Icons Downloaded: ${downloadedIcon}`);

  // Validation Audit
  console.log('\n--- Verifying Integrity Across All 251 Species ---');
  let missingFront = 0;
  let missingBack = 0;
  let missingIcon = 0;

  for (const p of allSpecies) {
    const front = path.join(POKEMON_DIR, `${p.id}_front.png`);
    const back = path.join(POKEMON_DIR, `${p.id}_back.png`);
    const icon = path.join(ICONS_DIR, `${p.id}.png`);

    if (!fs.existsSync(front) || fs.statSync(front).size === 0) missingFront++;
    if (!fs.existsSync(back) || fs.statSync(back).size === 0) missingBack++;
    if (!fs.existsSync(icon) || fs.statSync(icon).size === 0) missingIcon++;
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('===========================================================');
  if (missingFront === 0 && missingBack === 0 && missingIcon === 0) {
    console.log(`🎉 100% COMPLETE! All 251 Pokémon fully extracted in ${elapsedSec}s!`);
    console.log(`📁 Front Sprites: 251 / 251 in ${POKEMON_DIR}/*_front.png`);
    console.log(`📁 Back Sprites:  251 / 251 in ${POKEMON_DIR}/*_back.png`);
    console.log(`📁 Menu Icons:    251 / 251 in ${ICONS_DIR}/*.png`);
  } else {
    console.error(
      `⚠️ Audit Failed: Missing Front=${missingFront}, Back=${missingBack}, Icons=${missingIcon}`
    );
    process.exit(1);
  }
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
