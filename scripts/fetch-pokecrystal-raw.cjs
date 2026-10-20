const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'pokecrystal_raw');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'https://raw.githubusercontent.com/pret/pokecrystal/master';

const FILES = [
  'data/maps/attributes.asm',
  // Overworld Johto tileset
  'gfx/tilesets/johto.png',
  'gfx/tilesets/roofs/new_bark.png',
  'gfx/tilesets/water/water.png',
  'gfx/tilesets/flower/cgb_1.png',
  'gfx/tilesets/bg_tiles.pal',
  'gfx/tilesets/roofs.pal',
  'gfx/tilesets/johto_palette_map.asm',
  'data/tilesets/johto_metatiles.bin',
  'data/tilesets/johto_collision.asm',
  // Indoor tilesets: lab, players_house, house, pokecenter, mart, gate
  'gfx/tilesets/lab.png',
  'gfx/tilesets/lab_palette_map.asm',
  'data/tilesets/lab_metatiles.bin',
  'data/tilesets/lab_collision.asm',
  'gfx/tilesets/players_house.png',
  'gfx/tilesets/players_house_palette_map.asm',
  'data/tilesets/players_house_metatiles.bin',
  'data/tilesets/players_house_collision.asm',
  'gfx/tilesets/house.png',
  'gfx/tilesets/house_palette_map.asm',
  'data/tilesets/house_metatiles.bin',
  'data/tilesets/house_collision.asm',
  'gfx/tilesets/pokecenter.png',
  'gfx/tilesets/pokecenter_palette_map.asm',
  'data/tilesets/pokecenter_metatiles.bin',
  'data/tilesets/pokecenter_collision.asm',
  'gfx/tilesets/mart.png',
  'gfx/tilesets/mart_palette_map.asm',
  'data/tilesets/mart_metatiles.bin',
  'data/tilesets/mart_collision.asm',
  'gfx/tilesets/gate.png',
  'gfx/tilesets/gate_palette_map.asm',
  'data/tilesets/gate_metatiles.bin',
  'data/tilesets/gate_collision.asm',
  // Indoor & Overworld Map .blk and .asm files
  'maps/ElmsLab.blk',
  'maps/ElmsLab.asm',
  'maps/PlayersHouse1F.blk',
  'maps/PlayersHouse1F.asm',
  'maps/PlayersNeighborsHouse.asm',
  'maps/ElmsHouse.asm',
  'maps/House1.blk',
  'maps/House2.blk',
  'maps/Pokecenter1F.blk',
  'maps/Mart.blk',
  'maps/Route29Route46Gate.blk',
  'maps/Route29Route46Gate.asm',
  'maps/CherrygroveMart.asm',
  'maps/CherrygrovePokecenter1F.asm',
  'maps/GuideGentsHouse.asm',
  'maps/Route30.blk',
  'maps/Route30.asm',
  'maps/Route31.blk',
  'maps/Route31.asm',
  'maps/MrPokemonsHouse.asm',
  'maps/Route30BerryHouse.asm',
];

async function main() {
  for (const relPath of FILES) {
    const dest = path.join(OUT_DIR, relPath.replace(/\//g, '__'));
    if (fs.existsSync(dest)) continue;
    const url = `${BASE_URL}/${relPath}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Warning: Failed to fetch ${url} (${res.status})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`Fetched ${relPath} (${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
