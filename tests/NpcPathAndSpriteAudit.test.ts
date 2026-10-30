import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../src/world/npcData';
import type { NpcSpriteType } from '../src/rendering/npcSprites';

interface MapJson {
  id: string;
  name: string;
  width: number;
  height: number;
  collisionGrid: number[];
  warps: Array<{ x: number; y: number; targetMapId: string; targetX: number; targetY: number }>;
}

function loadMapJson(mapId: string): MapJson | null {
  const filePath = path.join(process.cwd(), 'public/assets/data/maps', `${mapId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as MapJson;
}

const VALID_SPRITE_TYPES: Set<string> = new Set<NpcSpriteType>([
  'player',
  'boy',
  'girl',
  'fat_man',
  'elder',
  'receptionist',
  'rocket_grunt_m',
  'rocket_grunt_f',
  'bug_catcher',
  'silver',
  'red',
  'blue',
  'prof_oak',
  'falkner',
  'bugsy',
  'whitney',
  'morty',
  'chuck',
  'jasmine',
  'pryce',
  'clair',
  'will',
  'koga',
  'bruno',
  'karen',
  'lance',
  'bill',
  'kris',
  'nurse_joy',
  'clerk',
  'officer',
  'gentleman',
  'sailor',
  'super_nerd',
  'kimono_girl',
  'gramps',
  'granny',
  'swimmer_m',
  'swimmer_f',
  'cooltrainer_m',
  'cooltrainer_f',
  'beauty',
  'pokemaniac',
  'firebreather',
  'juggler',
  'schoolboy',
  'psychic_m',
  'camper',
  'picnicker',
  'lass',
  'youngster',
  'teacher',
  'twin',
  'bird_keeper',
  'fisherman',
  'black_belt',
  'blackbelt',
  'hiker',
  'cue_ball',
  'biker',
  'burglar',
  'scientist',
  'boarder',
  'skier',
  'medium',
  'daycare_man',
  'daycare_lady',
  'pokefan_m',
  'pokefan_f',
  'school_kid_m',
  'school_kid_f',
  'sightseer_m',
  'sightseer_f',
  'eusine',
  'suicune',
  'raikou',
  'entei',
  'lugia',
  'ho_oh',
  'celebi',
  'snorlax',
  'lapras',
  'clefairy',
  'jigglypuff',
  'meowth',
  'psyduck',
  'machop',
  'geodude',
  'slowpoke',
  'farfetchd',
  'poliwag',
  'growlithe',
  'eevee',
  'pika',
  'miltank',
  'oddish',
  'voltorb',
  'staryu',
  'seel',
  'rattata',
  'cut_tree',
  'boulder',
  'smash_rock',
  'headbutt_tree',
  'whirlpool',
  'waterfall',
  'item_ball',
  'pokedex',
  'paper',
  'book',
  'sign',
  'invisible',
  'mom',
  'red_gyarados',
  'kurt',
  'earl',
  'psychic',
  'oak',
  'prof_elm',
  'sage',
  'elder_li',
  'sudowoodo',
  'fruit_tree',
  'butterfree',
  'bike_shop_owner',
  'fisher',
]);

describe('NPC Path and Sprite Audit', () => {
  const npcsByMap = createNpcsByMap();

  it('all assigned sprite types exist in the engine NpcSpriteType definition', () => {
    let checkedCount = 0;
    for (const [mapId, npcs] of Object.entries(npcsByMap)) {
      for (const npc of npcs) {
        const sprite = npc.spriteType;
        expect(
          VALID_SPRITE_TYPES.has(sprite!),
          `Map ${mapId} NPC ${npc.id} has invalid sprite type: "${sprite}"`
        ).toBe(true);
        checkedCount++;
      }
    }
    expect(checkedCount).toBeGreaterThan(50);
  });

  it('no elevator attendant or gate officer stands directly on a warp tile', () => {
    // Goldenrod Dept Store 1F to 6F elevator attendants
    const elevatorFloors = [
      'goldenrod_dept_store_1f',
      'goldenrod_dept_store_2f',
      'goldenrod_dept_store_3f',
      'goldenrod_dept_store_4f',
      'goldenrod_dept_store_5f',
      'goldenrod_dept_store_6f',
    ];

    for (const floorId of elevatorFloors) {
      const mapDef = loadMapJson(floorId);
      const npcs = npcsByMap[floorId] || [];
      expect(mapDef).not.toBeNull();

      for (const npc of npcs) {
        if (npc.id.includes('elevator')) {
          const overlapsWarp = mapDef!.warps.some((w) => w.x === npc.x && w.y === npc.y);
          expect(
            overlapsWarp,
            `${floorId} attendant ${npc.id} at (${npc.x}, ${npc.y}) must not overlap warp tile!`
          ).toBe(false);
          // Verify attendant stands adjacent at (1, 1) so elevator entry (2, 0) is clear
          expect(npc.x).toBe(1);
          expect(npc.y).toBe(1);
        }
      }
    }

    // Route 29 Gate Officer
    const r29Npcs = npcsByMap['route_29_route_46_gate'] || [];
    for (const npc of r29Npcs) {
      if (npc.id.includes('officer')) {
        const mapDef = loadMapJson('route_29_route_46_gate');
        if (mapDef) {
          const overlapsWarp = mapDef.warps.some((w) => w.x === npc.x && w.y === npc.y);
          expect(overlapsWarp).toBe(false);
        }
      }
    }
  });

  it('verifies Burned Tower 1F has unblocked corridors and authentic NPC placement', () => {
    const bt1fNpcs = npcsByMap['burned_tower_1f'];
    expect(bt1fNpcs).toBeDefined();

    const eusine = bt1fNpcs.find((n) => n.id === 'eusine');
    const morty = bt1fNpcs.find((n) => n.id === 'morty_burned');
    const silver = bt1fNpcs.find((n) => n.id === 'silver_burned');

    expect(eusine).toBeDefined();
    expect(morty).toBeDefined();
    expect(silver).toBeDefined();

    expect(eusine?.x).toBe(10);
    expect(eusine?.y).toBe(12);
    expect(eusine?.spriteType).toBe('eusine');

    expect(morty?.x).toBe(12);
    expect(morty?.y).toBe(12);
    expect(morty?.spriteType).toBe('morty');

    expect(silver?.x).toBe(10);
    expect(silver?.y).toBe(10);
    expect(silver?.spriteType).toBe('silver');

    // Entrance corridor rows y=13..14 are completely free of any NPC
    const blocksCorridor = bt1fNpcs.some((n) => n.y === 13 || n.y === 14);
    expect(blocksCorridor).toBe(false);
  });

  it('verifies Burned Tower B1F has all 3 authentic legendary beasts and open ladder access', () => {
    const b1fNpcs = npcsByMap['burned_tower_b1f'];
    expect(b1fNpcs).toBeDefined();

    const raikou = b1fNpcs.find((n) => n.id === 'burned_raikou');
    const suicune = b1fNpcs.find((n) => n.id === 'beasts');
    const entei = b1fNpcs.find((n) => n.id === 'burned_entei');

    expect(raikou).toBeDefined();
    expect(suicune).toBeDefined();
    expect(entei).toBeDefined();

    expect(raikou?.x).toBe(8);
    expect(raikou?.y).toBe(3);
    expect(raikou?.spriteType).toBe('raikou');

    expect(suicune?.x).toBe(10);
    expect(suicune?.y).toBe(3);
    expect(suicune?.spriteType).toBe('suicune');

    expect(entei?.x).toBe(12);
    expect(entei?.y).toBe(3);
    expect(entei?.spriteType).toBe('entei');

    // Ladder at (7, 15) must not be blocked
    const blocksLadder = b1fNpcs.some((n) => n.x === 7 && n.y === 15);
    expect(blocksLadder).toBe(false);
  });

  it('verifies rich class fidelity sprite assignments across key maps', () => {
    // Dance Theater Kimono girls
    const danceNpcs = npcsByMap['dance_theater'] || [];
    for (const npc of danceNpcs) {
      if (npc.id.includes('kimono')) {
        expect(npc.spriteType).toBe('kimono_girl');
      }
    }

    // Goldenrod Gym Whitney & Lasses
    const goldenrodGymNpcs = npcsByMap['goldenrod_gym'] || [];
    const whitney = goldenrodGymNpcs.find((n) => n.id === 'whitney');
    expect(whitney?.spriteType).toBe('whitney');
    const carrie = goldenrodGymNpcs.find((n) => n.id === 'lass_carrie');
    expect(carrie?.spriteType).toBe('lass');
    const victoria = goldenrodGymNpcs.find((n) => n.id === 'beauty_victoria');
    expect(victoria?.spriteType).toBe('beauty');

    // Route 34 Cooltrainer sisters
    const r34Npcs = npcsByMap['route_34'] || [];
    const irene = r34Npcs.find((n) => n.id === 'cooltrainer_irene');
    const jenn = r34Npcs.find((n) => n.id === 'cooltrainer_jenn');
    const kate = r34Npcs.find((n) => n.id === 'cooltrainer_kate');
    expect(irene?.spriteType).toBe('cooltrainer_f');
    expect(jenn?.spriteType).toBe('cooltrainer_f');
    expect(kate?.spriteType).toBe('cooltrainer_f');

    // Day siblings
    const lakeNpcs = npcsByMap['lake_of_rage'] || [];
    const wesley = lakeNpcs.find((n) => n.id === 'wesley_of_wednesday');
    expect(wesley?.spriteType).toBe('black_belt');

    const blackthornNpcs = npcsByMap['blackthorn_city'] || [];
    const santos = blackthornNpcs.find((n) => n.id === 'santos_of_saturday');
    expect(santos?.spriteType).toBe('pokefan_m');

    // Indigo Plateau Teleport Gramps
    const indigoNpcs = npcsByMap['indigo_plateau_poke_center'] || [];
    const teleportGuy = indigoNpcs.find((n) => n.id === 'indigo_teleport_guy');
    expect(teleportGuy?.spriteType).toBe('gramps');
  });

  it('verifies no NPCs are trapped inside solid collision walls in modified maps', () => {
    // Goldenrod Underground
    const undergroundNpcs = npcsByMap['goldenrod_underground'] || [];
    const undergroundMap = loadMapJson('goldenrod_underground');
    if (undergroundMap && undergroundMap.collisionGrid) {
      for (const npc of undergroundNpcs) {
        const isWall = undergroundMap.collisionGrid[npc.y * undergroundMap.width + npc.x] === 1;
        expect(isWall, `NPC ${npc.id} in underground at (${npc.x}, ${npc.y}) is inside solid wall`).toBe(false);
      }
    }

    // Ecruteak Itemfinder House
    const itemHouseNpcs = npcsByMap['ecruteak_itemfinder_house'] || [];
    const itemHouseMap = loadMapJson('ecruteak_itemfinder_house');
    if (itemHouseMap && itemHouseMap.collisionGrid) {
      for (const npc of itemHouseNpcs) {
        const isWall = itemHouseMap.collisionGrid[npc.y * itemHouseMap.width + npc.x] === 1;
        expect(isWall, `NPC ${npc.id} in itemfinder house at (${npc.x}, ${npc.y}) is inside solid wall`).toBe(false);
      }
    }
  });

  it('verifies globally across all maps: exactly 0 warp overlaps and 0 solid wall collisions', () => {
    let checkedNpcs = 0;
    const OBSTACLE_SPRITES = new Set(['boulder', 'cut_tree', 'smash_rock', 'headbutt_tree', 'whirlpool']);

    for (const [mapId, npcs] of Object.entries(npcsByMap)) {
      const mapData = loadMapJson(mapId);
      if (!mapData) continue;

      for (const n of npcs) {
        checkedNpcs++;

        // 1. Warp overlap check (for human/pokemon NPCs, excluding puzzle boulders that bridge holes)
        if (mapData.warps && mapData.warps.length > 0 && !OBSTACLE_SPRITES.has(n.spriteType || '')) {
          const overlapsWarp = mapData.warps.some((w) => w.x === n.x && w.y === n.y);
          expect(
            overlapsWarp,
            `NPC ${n.id} in map ${mapId} at (${n.x}, ${n.y}) overlaps warp tile!`
          ).toBe(false);
        }

        // 2. Solid wall check (non-field obstacles)
        if (mapData.collisionGrid && mapData.width && !OBSTACLE_SPRITES.has(n.spriteType || '')) {
          const idx = n.y * mapData.width + n.x;
          const isWall = mapData.collisionGrid[idx] === 1;
          expect(
            isWall,
            `NPC ${n.id} in map ${mapId} at (${n.x}, ${n.y}) is inside solid wall collision!`
          ).toBe(false);
        }
      }
    }

    expect(checkedNpcs).toBeGreaterThan(100);
  });
});

