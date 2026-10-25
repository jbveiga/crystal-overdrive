import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TMP_REPO = '/tmp/crystal-overdrive';
if (!fs.existsSync(`${TMP_REPO}/public/assets/tiles`)) {
  try {
    execSync(`rm -rf ${TMP_REPO} && git clone --depth 1 https://github.com/jbveiga/crystal-overdrive ${TMP_REPO}`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('Could not bootstrap /tmp/crystal-overdrive:', err);
  }
}

// Ensure Kyle's House and Nickname House use canonical 8x8 House1 tiles & collision grid
try {
  const canonicalGrid = [
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
  ];
  const canonicalTileMap = [
    'in_house_32_33_30_31', 'in_house_32_33_0e_0f', 'in_house_00_00_06_07', 'in_house_2d_2e_3d_3e', 'in_house_00_00_00_00', 'in_house_24_4a_34_2c', 'in_house_00_00_00_00', 'in_house_00_00_0c_0d',
    'in_house_0e_0f_3c_3b', 'in_house_0e_0f_1e_1f', 'in_house_16_17_1e_1f', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_1c_1d_1e_1f',
    'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01',
    'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_02_03_12_13', 'in_house_26_27_36_2f', 'in_house_27_29_2f_39', 'in_house_02_03_12_13', 'in_house_01_01_01_01', 'in_house_01_01_01_01',
    'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_02_03_12_13', 'in_house_05_2f_3c_3a', 'in_house_2f_15_3a_3b', 'in_house_02_03_12_13', 'in_house_01_01_01_01', 'in_house_01_01_01_01',
    'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01',
    'in_house_0a_0b_08_09', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_0a_0b_08_09',
    'in_house_1a_1b_18_19', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_04_04_14_14', 'in_house_04_04_14_14', 'in_house_01_01_01_01', 'in_house_01_01_01_01', 'in_house_1a_1b_18_19',
  ];

  for (const dataRoot of [path.resolve(process.cwd(), 'public/assets/data'), `${TMP_REPO}/public/assets/data`]) {
    if (!fs.existsSync(dataRoot)) continue;
    for (const mapId of ['violet_kyles_house', 'violet_nickname_speech_house']) {
      const p = path.join(dataRoot, 'maps', `${mapId}.json`);
      if (fs.existsSync(p)) {
        const m = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (m.tileMap?.[0] === 'in_house_49_4b_5a_5b') {
          m.groundLayer = [...canonicalGrid];
          m.collisionGrid = [...canonicalGrid];
          m.tileMap = [...canonicalTileMap];
          fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
        }
      }
    }
    const bundlePath = path.join(dataRoot, 'world_maps.json');
    if (fs.existsSync(bundlePath)) {
      const raw = fs.readFileSync(bundlePath, 'utf8');
      if (raw.includes('in_house_49_4b_5a_5b')) {
        const bundle = JSON.parse(raw);
        for (const m of bundle) {
          if (m.id === 'violet_kyles_house' || m.id === 'violet_nickname_speech_house') {
            m.groundLayer = [...canonicalGrid];
            m.collisionGrid = [...canonicalGrid];
            m.tileMap = [...canonicalTileMap];
          }
        }
        fs.writeFileSync(bundlePath, JSON.stringify(bundle));
      }
    }
  }

  // Ensure public/assets/tiles is symlinked to fast /tmp storage
  const localTilesDir = path.resolve(process.cwd(), 'public/assets/tiles');
  const tmpTilesDir = `${TMP_REPO}/public/assets/tiles`;
  if (fs.existsSync(tmpTilesDir)) {
    const isSymlink = fs.existsSync(localTilesDir) && fs.lstatSync(localTilesDir).isSymbolicLink();
    if (!isSymlink) {
      fs.rmSync(localTilesDir, { recursive: true, force: true });
      fs.symlinkSync(tmpTilesDir, localTilesDir, 'dir');
    }
  }
} catch (err) {
  console.warn('Could not sync canonical house maps or tiles symlink:', err);
}

export default defineConfig({
  base: './',
  publicDir: fs.existsSync(`${TMP_REPO}/public`) ? `${TMP_REPO}/public` : 'public',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@pkmn/dex')) {
              return 'dex';
            }
            if (id.includes('pixi.js')) {
              return 'pixi';
            }
            if (id.includes('howler')) {
              return 'audio';
            }
            return 'vendor';
          }
          if (id.includes('src/ui/')) {
            return 'ui';
          }
          if (
            id.includes('generatedNpcs') ||
            id.includes('npcData') ||
            id.includes('missionData') ||
            id.includes('overworld_items')
          ) {
            return 'world-data';
          }
        },
      },
    },
  },
});
