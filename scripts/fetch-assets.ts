import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TILES_DIR = path.join(projectRoot, 'public/assets/tiles');
const CHARACTERS_DIR = path.join(projectRoot, 'public/assets/sprites/characters');
const POKEMON_DIR = path.join(projectRoot, 'public/assets/sprites/pokemon');

[TILES_DIR, CHARACTERS_DIR, POKEMON_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`Downloading: ${url} -> ${path.basename(destPath)}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText} (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('=== Step 1: Downloading 64x64px Authentic Johto Overworld Tiles ===');
  const tileBaseUrl = 'https://raw.githubusercontent.com/nikouu/Pokemon-gen-2-style-tilemap/main/Original';
  const tilesToFetch: Record<string, string> = {
    'grass.png': `${tileBaseUrl}/Grass-flat_large.png`,
    'tall_grass.png': `${tileBaseUrl}/Grass-tall_large.png`,
    'tree_tall_0.png': `${tileBaseUrl}/Tree-tall-00_large.png`,
    'tree_tall_1.png': `${tileBaseUrl}/Tree-tall-01_large.png`,
    'tree_short_0.png': `${tileBaseUrl}/Tree-short-00_large.png`,
    'path.png': `${tileBaseUrl}/Path_large.png`,
    'path_gravel.png': `${tileBaseUrl}/Path-Gravel_large.png`,
    'water.png': `${tileBaseUrl}/Water-00_large.png`,
    'water_edge.png': `${tileBaseUrl}/Water-01_large.png`,
    'flower_0.png': `${tileBaseUrl}/Flower-johto-00_large.png`,
    'flower_1.png': `${tileBaseUrl}/Flower-johto-01_large.png`,
    'roof.png': `${tileBaseUrl}/Building-roof-flat-00_large.png`,
    'wall.png': `${tileBaseUrl}/Building-wall-00_large.png`,
    'door.png': `${tileBaseUrl}/Building-door-00_large.png`,
    'sign.png': `${tileBaseUrl}/Sign-metal-00_large.png`,
  };

  for (const [filename, url] of Object.entries(tilesToFetch)) {
    try {
      await downloadFile(url, path.join(TILES_DIR, filename));
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err);
    }
  }

  console.log('\n=== Step 2: Downloading Character Sprite Sheets ===');
  const cdBaseUrl = 'https://raw.githubusercontent.com/Sierraffinity/CrystalDust/master/graphics/object_events/pics/people';
  const charsToFetch: Record<string, string> = {
    'gold_walk.png': `${cdBaseUrl}/gold/walking.png`,
    'gold_run.png': `${cdBaseUrl}/gold/running.png`,
    'kris_walk.png': `${cdBaseUrl}/kris/walking.png`,
    'npc_boy.png': `${cdBaseUrl}/boy_1.png`,
    'npc_girl.png': `${cdBaseUrl}/girl_1.png`,
    'npc_fat_man.png': `${cdBaseUrl}/fat_man.png`,
  };

  for (const [filename, url] of Object.entries(charsToFetch)) {
    try {
      await downloadFile(url, path.join(CHARACTERS_DIR, filename));
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err);
    }
  }

  console.log('\n=== Step 3: Downloading Pokémon Battle Sprites (Front & Back) ===');
  const pokeApiBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const pokemonList: Array<{ id: number; name: string }> = [
    { id: 155, name: 'cyndaquil' },
    { id: 158, name: 'totodile' },
    { id: 152, name: 'chikorita' },
    { id: 16, name: 'pidgey' },
    { id: 161, name: 'sentret' },
    { id: 19, name: 'rattata' },
    { id: 163, name: 'hoothoot' },
    { id: 243, name: 'raikou' },
    { id: 244, name: 'entei' },
    { id: 245, name: 'suicune' },
  ];

  for (const p of pokemonList) {
    try {
      await downloadFile(`${pokeApiBase}/${p.id}.png`, path.join(POKEMON_DIR, `${p.name}_front.png`));
      await downloadFile(`${pokeApiBase}/back/${p.id}.png`, path.join(POKEMON_DIR, `${p.name}_back.png`));
    } catch (err) {
      console.error(`Error downloading sprites for ${p.name}:`, err);
    }
  }

  console.log('\n✅ All assets downloaded successfully!');
}

main().catch((err) => {
  console.error('Fatal asset fetch error:', err);
  process.exit(1);
});
