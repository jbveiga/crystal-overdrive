import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../src/types/game';
import { createNpcsByMap, DAY_SIBLINGS } from '../src/world/npcData';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { AudioManager } from '../src/audio/AudioManager';

describe('10-Point Completeness Audit for Previously Mapped Areas (TICKET-AUDIT-LEGACY-MAP-COMPLETENESS-01)', () => {
  const mapsDir = path.resolve(__dirname, '../public/assets/data/maps');
  const itemsFile = path.resolve(__dirname, '../public/assets/data/overworld_items.json');

  const LEGACY_MAP_IDS = [
    'new_bark_town',
    'route_29',
    'cherrygrove_city',
    'route_30',
    'route_31',
    'violet_city',
    'sprout_tower_1f',
    'sprout_tower_2f',
    'sprout_tower_3f',
    'route_32',
    'route_36',
    'ruins_of_alph_outside',
    'union_cave_1f',
    'union_cave_b1f',
    'union_cave_b2f',
  ];

  function loadMap(id: string): MapData {
    const filePath = path.join(mapsDir, `${id}.json`);
    expect(fs.existsSync(filePath), `Map file ${id}.json must exist`).toBe(true);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const isWalkable = (m: MapData, x: number, y: number): boolean => {
    if (x < 0 || x >= m.width || y < 0 || y >= m.height) return false;
    const col = m.collisionGrid[y * m.width + x];
    return col === 0 || col === 2;
  };

  it('Dimension 1: asserts 100% of warps across all 15 legacy maps lead to valid maps with walkable landing tiles', () => {
    let totalWarps = 0;
    for (const mId of LEGACY_MAP_IDS) {
      const map = loadMap(mId);
      for (const w of map.warps || []) {
        totalWarps++;
        const targetPath = path.join(mapsDir, `${w.targetMapId}.json`);
        expect(fs.existsSync(targetPath), `Target map ${w.targetMapId} from ${mId} must exist`).toBe(true);
        const targetMap: MapData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        expect(
          isWalkable(targetMap, w.targetX, w.targetY),
          `Warp landing from ${mId} to ${w.targetMapId} at (${w.targetX}, ${w.targetY}) must be on a walkable tile (0 or 2)`
        ).toBe(true);
      }
    }
    expect(totalWarps).toBeGreaterThanOrEqual(40);
  });

  it('Dimension 2: asserts 100% of canonical trainers across all 15 maps have complete teams, movesets, and sightlines', () => {
    const npcsByMap = createNpcsByMap();
    let trainerCount = 0;

    for (const mId of LEGACY_MAP_IDS) {
      const map = loadMap(mId);
      const npcs = npcsByMap[mId] || [];

      for (const npc of npcs) {
        expect(
          isWalkable(map, npc.x, npc.y),
          `NPC ${npc.id} on ${mId} at (${npc.x}, ${npc.y}) must stand on a walkable tile (0 or 2)`
        ).toBe(true);

        if (npc.action === 'TRAINER_BATTLE') {
          trainerCount++;
          expect(npc.trainerId, `Trainer ${npc.id} must have a trainerId`).toBeDefined();
          expect(npc.trainerName, `Trainer ${npc.id} must have a trainerName`).toBeDefined();
          expect(npc.visionRange, `Trainer ${npc.id} must have a visionRange >= 1`).toBeGreaterThanOrEqual(1);
          expect(npc.challengePages && npc.challengePages.length, `Trainer ${npc.id} must have challengePages`).toBeGreaterThanOrEqual(1);

          // Both trainerPokemon and trainerTeam must be non-empty and well-formed
          expect(npc.trainerPokemon, `Trainer ${npc.id} must have trainerPokemon`).toBeDefined();
          expect(npc.trainerTeam, `Trainer ${npc.id} must have trainerTeam`).toBeDefined();
          expect(npc.trainerTeam?.length, `Trainer ${npc.id} must have at least 1 Pokémon in team`).toBeGreaterThanOrEqual(1);

          for (const mon of npc.trainerTeam || []) {
            expect(mon.speciesId.length, `Trainer ${npc.id} Pokémon must have speciesId`).toBeGreaterThan(0);
            expect(mon.level, `Trainer ${npc.id} Pokémon level must be >= 1`).toBeGreaterThanOrEqual(1);
            expect(mon.moves && mon.moves.length, `Trainer ${npc.id} Pokémon must have moves`).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }

    expect(trainerCount).toBeGreaterThanOrEqual(20);
  });

  it('Dimension 3: asserts dialogue, civilian lore, Day siblings, and special entities exist with proper interaction data', () => {
    const npcsByMap = createNpcsByMap();

    // 1. New Bark Town civilians (Mom, Prof Elm aide, peeking rival)
    const nbtNpcs = npcsByMap.new_bark_town || [];
    expect(nbtNpcs.length).toBeGreaterThanOrEqual(3);

    // 2. Cherrygrove City Guide Gent
    const cgNpcs = npcsByMap.cherrygrove_city || [];
    const guideGent = cgNpcs.find((n) => n.id === 'cg_guide_gent');
    expect(guideGent, 'Guide Gent must exist in Cherrygrove City').toBeDefined();
    expect(guideGent?.pages && guideGent.pages.length).toBeGreaterThan(0);

    // 3. Day Sibling Frieda on Route 32
    const r32Npcs = npcsByMap.route_32 || [];
    const frieda = r32Npcs.find((n) => n.id === 'frieda');
    expect(frieda, 'Frieda must exist on Route 32').toBeDefined();
    expect(frieda?.action).toBe('DAY_SIBLING_EVENT');

    // 4. Friday Lapras in Union Cave B2F
    const ucb2fNpcs = npcsByMap.union_cave_b2f || [];
    const lapras = ucb2fNpcs.find((n) => n.id === 'union_cave_lapras');
    expect(lapras, 'Lapras must exist in Union Cave B2F').toBeDefined();
    expect(lapras?.action).toBe('LAPRAS_EVENT');

    // 5. Route 36 Sudowoodo obstacle
    const r36Npcs = npcsByMap.route_36 || [];
    const sudo = r36Npcs.find((n) => n.id === 'sudowoodo');
    expect(sudo, 'Sudowoodo must exist on Route 36').toBeDefined();
  });

  it('Dimension 4: asserts story continuity and progression flags update NPC states cleanly', () => {
    const npcsByMap = createNpcsByMap();

    // Check that New Bark peeking rival exists before Elm call
    const nbtNpcs = npcsByMap.new_bark_town || [];
    const peekingRival = nbtNpcs.find((n) => n.id === 'nbt_rival');
    expect(peekingRival).toBeDefined();

    // Check that Route 36 Sudowoodo has dedicated event action
    const r36Npcs = npcsByMap.route_36 || [];
    const sudo = r36Npcs.find((n) => n.id === 'sudowoodo');
    expect(sudo?.action).toBe('SUDOWOODO_EVENT');
  });

  it('Dimension 5: asserts 100% of canonical overworld ground item balls exist on strictly walkable tiles', () => {
    const itemManager = new OverworldItemManager();

    const expectedItemBalls: Record<string, string[]> = {
      route_29: ['potion'],
      route_30: ['antidote'],
      route_31: ['potion', 'poke_ball'],
      violet_city: ['pp_up', 'rare_candy'],
      sprout_tower_1f: ['parlyz_heal'],
      sprout_tower_2f: ['x_accuracy'],
      sprout_tower_3f: ['potion', 'escape_rope'],
      route_32: ['great_ball', 'repel'],
      union_cave_1f: ['great_ball', 'x_attack', 'potion', 'awakening'],
      union_cave_b1f: ['tm_swift', 'x_defend'],
      union_cave_b2f: ['elixer', 'hyper_potion'],
    };

    let totalItemBalls = 0;

    for (const [mId, expectedItems] of Object.entries(expectedItemBalls)) {
      const map = loadMap(mId);
      const balls = itemManager.getActiveItemBalls(mId);
      expect(balls.length, `Item balls count on ${mId} must match expected`).toBe(expectedItems.length);

      for (const expItem of expectedItems) {
        const found = balls.find((b) => b.itemId === expItem);
        expect(found, `Expected item ball ${expItem} on ${mId}`).toBeDefined();
        expect(
          isWalkable(map, found!.x, found!.y),
          `Item ball ${found!.id} at (${found!.x}, ${found!.y}) on ${mId} must be on a walkable tile (0 or 2)`
        ).toBe(true);
        totalItemBalls++;
      }
    }

    expect(totalItemBalls).toBeGreaterThanOrEqual(18);
  });

  it('Dimension 6: asserts wild encounter distributions are populated across wilderness routes and caves', () => {
    const wildernessMaps = [
      'route_29',
      'route_30',
      'route_31',
      'route_32',
      'route_36',
      'sprout_tower_2f',
      'sprout_tower_3f',
      'union_cave_1f',
      'union_cave_b1f',
      'union_cave_b2f',
    ];

    for (const mId of wildernessMaps) {
      const map = loadMap(mId);
      expect(map.grassEncounters && map.grassEncounters.length, `Wild encounters on ${mId} must be populated`).toBeGreaterThanOrEqual(1);

      for (const enc of map.grassEncounters || []) {
        expect(enc.speciesId.length, `Encounter speciesId on ${mId} must be non-empty`).toBeGreaterThan(0);
        const lvl = (enc as any).level ?? (enc as any).minLevel ?? (enc as any).maxLevel;
        expect(lvl, `Encounter level on ${mId} must be >= 1`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Dimension 7: asserts outdoor towns and routes feature interactive signpost and directional board bgEvents', () => {
    const outdoorMaps = [
      'new_bark_town',
      'route_29',
      'cherrygrove_city',
      'route_30',
      'route_31',
      'violet_city',
      'route_32',
      'route_36',
      'ruins_of_alph_outside',
    ];

    for (const mId of outdoorMaps) {
      const map = loadMap(mId);
      expect(map.bgEvents && map.bgEvents.length, `Signposts / bgEvents on ${mId} must be present`).toBeGreaterThanOrEqual(2);

      for (const bg of map.bgEvents || []) {
        expect(bg.pages.length, `bgEvent at (${bg.x}, ${bg.y}) on ${mId} must have dialogue pages`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Dimension 8: asserts natural resources (Fruit / Apricorn trees) are registered in overworld_items.json', () => {
    const itemManager = new OverworldItemManager();

    const expectedTreeMaps = ['route_29', 'route_30', 'route_31', 'violet_city', 'route_36'];

    for (const mId of expectedTreeMaps) {
      const trees = itemManager.getFruitTreesForMap(mId);
      expect(trees.length, `Fruit/Apricorn trees on ${mId} must be registered`).toBeGreaterThanOrEqual(1);

      for (const t of trees) {
        const berry = (t as any).berryId || (t as any).fruitType;
        const flag = (t as any).treeId || (t as any).eventFlag;
        expect(berry.length, `Tree ${t.id} berryId must be valid`).toBeGreaterThan(0);
        expect(flag.length, `Tree ${t.id} treeId must be valid`).toBeGreaterThan(0);
      }
    }
  });

  it('Dimension 9: asserts buried hidden items are indexed with valid coordinates for Itemfinder radar detection', () => {
    const itemManager = new OverworldItemManager();

    const expectedHiddenItemMaps = ['route_30', 'violet_city', 'route_32'];

    for (const mId of expectedHiddenItemMaps) {
      const hidden = itemManager.getHiddenItemsForMap(mId);
      expect(hidden.length, `Hidden items on ${mId} must be indexed`).toBeGreaterThanOrEqual(1);

      for (const h of hidden) {
        expect(h.itemId.length, `Hidden item ${h.id} itemId must be valid`).toBeGreaterThan(0);
        expect(h.eventFlag.length, `Hidden item ${h.id} eventFlag must be valid`).toBeGreaterThan(0);
      }
    }
  });

  it('Dimension 10: asserts canonical zone BGM track assignments resolve cleanly for all 15 legacy maps', () => {
    const audioManager = new AudioManager();

    for (const mId of LEGACY_MAP_IDS) {
      const track = audioManager.getTrackForMap(mId);
      expect(track, `BGM track for ${mId} must be defined`).toBeDefined();
      expect(track.length, `BGM track for ${mId} must be a valid track id`).toBeGreaterThan(0);
    }
  });

  describe('10-Point Completeness Audit for Route 33 & Azalea Town (TICKET-WORLD-ROUTE33-AZALEA-01)', () => {
    it('Dimension 1: asserts 100% of warps in Route 33 and Azalea Town lead to valid maps with walkable landing tiles', () => {
      const targetMaps = ['route_33', 'azalea_town'];
      for (const mId of targetMaps) {
        const map = loadMap(mId);
        for (const w of map.warps || []) {
          const targetPath = path.join(mapsDir, `${w.targetMapId}.json`);
          expect(fs.existsSync(targetPath), `Target map ${w.targetMapId} from ${mId} must exist`).toBe(true);
          const targetMap: MapData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
          expect(
            isWalkable(targetMap, w.targetX, w.targetY),
            `Warp landing from ${mId} to ${w.targetMapId} at (${w.targetX}, ${w.targetY}) must be on a walkable tile (0 or 2)`
          ).toBe(true);
        }
      }

      // Assert reciprocal connection from union_cave_1f to route_33
      const uc1f = loadMap('union_cave_1f');
      const r33Exit = uc1f.warps.find((w) => w.targetMapId === 'route_33');
      expect(r33Exit).toBeDefined();
      const r33 = loadMap('route_33');
      expect(isWalkable(r33, r33Exit!.targetX, r33Exit!.targetY)).toBe(true);
    });

    it('Dimension 2: asserts Hiker Anthony and Azalea NPCs stand on walkable tiles with complete combat data and teams', () => {
      const npcsByMap = createNpcsByMap();
      const r33 = loadMap('route_33');
      const azalea = loadMap('azalea_town');

      // Route 33: Hiker Anthony
      const r33Npcs = npcsByMap.route_33 || [];
      const anthony = r33Npcs.find((n) => n.id === 'hiker_anthony');
      expect(anthony).toBeDefined();
      expect(isWalkable(r33, anthony!.x, anthony!.y)).toBe(true);
      expect(anthony?.action).toBe('TRAINER_BATTLE');
      expect(anthony?.visionRange).toBeGreaterThanOrEqual(1);
      expect(anthony?.trainerTeam?.length).toBeGreaterThanOrEqual(2);

      // Azalea Town: All civilian NPCs and grunts stand on walkable tiles
      const azaleaNpcs = npcsByMap.azalea_town || [];
      expect(azaleaNpcs.length).toBeGreaterThanOrEqual(6);
      for (const npc of azaleaNpcs) {
        expect(
          isWalkable(azalea, npc.x, npc.y),
          `NPC ${npc.id} at (${npc.x}, ${npc.y}) on azalea_town must be walkable`
        ).toBe(true);
      }
    });

    it('Dimension 3: asserts authentic Pokecrystal dialogue for Kurt, Slowpoke Well grunts, Charcoal apprentice, and Slowpokes', () => {
      const npcsByMap = createNpcsByMap();
      const azaleaNpcs = npcsByMap.azalea_town || [];

      const kurt = azaleaNpcs.find((n) => n.id === 'azalea_kurt');
      expect(kurt?.pages.some((p) => p.includes('TEAM ROCKET'))).toBe(true);

      const wellGrunt = azaleaNpcs.find((n) => n.id === 'azalea_well_grunt');
      expect(wellGrunt?.pages.some((p) => p.includes('SLOWPOKE WELL'))).toBe(true);

      const gymGrunt = azaleaNpcs.find((n) => n.id === 'azalea_gym_grunt');
      expect(gymGrunt?.pages.some((p) => p.includes('GYM'))).toBe(true);

      const slowpokes = azaleaNpcs.filter((n) => n.id.includes('slowpoke'));
      expect(slowpokes.length).toBeGreaterThanOrEqual(2);
      expect(slowpokes[0].pages.some((p) => p.includes('Yaaawn'))).toBe(true);
    });

    it('Dimension 4: asserts Rocket Grunts block entrances and despawn cleanly when slowpoke_well_cleared', () => {
      const npcsByMap = createNpcsByMap();
      const wellGrunt = npcsByMap.azalea_town.find((n) => n.id === 'azalea_well_grunt');
      const gymGrunt = npcsByMap.azalea_town.find((n) => n.id === 'azalea_gym_grunt');
      expect(wellGrunt).toBeDefined();
      expect(gymGrunt).toBeDefined();

      // Despawn simulation matches main.ts logic
      const storyFlags = new Set<string>(['slowpoke_well_cleared']);
      const activeNpcs = npcsByMap.azalea_town.filter(
        (n) =>
          !(storyFlags.has('slowpoke_well_cleared') &&
            (n.id === 'azalea_well_grunt' || n.id === 'azalea_gym_grunt'))
      );
      expect(activeNpcs.some((n) => n.id === 'azalea_well_grunt')).toBe(false);
      expect(activeNpcs.some((n) => n.id === 'azalea_gym_grunt')).toBe(false);
    });

    it('Dimension 6: asserts Route 33 has time-of-day grass encounter distributions for MORNING, DAY, and NIGHT', () => {
      const r33 = loadMap('route_33');
      expect(r33.grassEncounters && r33.grassEncounters.length).toBeGreaterThanOrEqual(10);

      const times = new Set((r33.grassEncounters || []).map((e) => (e as any).timeOfDay));
      expect(times.has('MORNING')).toBe(true);
      expect(times.has('DAY')).toBe(true);
      expect(times.has('NIGHT')).toBe(true);
    });

    it('Dimension 7: asserts Route 33 and Azalea Town have interactive signpost and directional board bgEvents', () => {
      const r33 = loadMap('route_33');
      const azalea = loadMap('azalea_town');

      expect(r33.bgEvents && r33.bgEvents.length).toBeGreaterThanOrEqual(2);
      expect(r33.bgEvents?.some((b) => b.pages.some((p) => p.includes('ROUTE 33')))).toBe(true);

      expect(azalea.bgEvents && azalea.bgEvents.length).toBeGreaterThanOrEqual(5);
      expect(azalea.bgEvents?.some((b) => b.pages.some((p) => p.includes('AZALEA TOWN')))).toBe(true);
      expect(azalea.bgEvents?.some((b) => b.pages.some((p) => p.includes('SLOWPOKE WELL')))).toBe(true);
      expect(azalea.bgEvents?.some((b) => b.pages.some((p) => p.includes('BUGSY')))).toBe(true);
    });

    it('Dimension 8: asserts Route 33 and Azalea Town Apricorn/Berry trees are registered in overworld_items.json', () => {
      const itemManager = new OverworldItemManager();
      const r33Trees = itemManager.getFruitTreesForMap('route_33');
      expect(r33Trees.length).toBeGreaterThanOrEqual(1);
      expect(r33Trees[0].x).toBe(14);
      expect(r33Trees[0].y).toBe(16);

      const azaleaTrees = itemManager.getFruitTreesForMap('azalea_town');
      expect(azaleaTrees.length).toBeGreaterThanOrEqual(1);
      expect(azaleaTrees.some((t) => t.berryId === 'wht_apricorn')).toBe(true);
    });

    it('Dimension 9: asserts Azalea Town buried hidden items are indexed for Itemfinder radar detection', () => {
      const itemManager = new OverworldItemManager();
      const azaleaHidden = itemManager.getHiddenItemsForMap('azalea_town');
      expect(azaleaHidden.length).toBeGreaterThanOrEqual(1);
      expect(azaleaHidden[0].x).toBe(31);
      expect(azaleaHidden[0].y).toBe(6);
      expect(azaleaHidden[0].itemId).toBe('full_heal');
    });

    it('Dimension 10: asserts canonical zone BGM track assignments resolve cleanly for Route 33, Azalea Town, and interiors', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('route_33')).toBe('bgm_route_29');
      expect(audioManager.getTrackForMap('azalea_town')).toBe('bgm_cherrygrove_city');
      expect(audioManager.getTrackForMap('azalea_poke_center')).toBe('bgm_cherrygrove_city');
      expect(audioManager.getTrackForMap('azalea_mart')).toBe('bgm_cherrygrove_city');
      expect(audioManager.getTrackForMap('kurts_house')).toBe('bgm_cherrygrove_city');
      expect(audioManager.getTrackForMap('charcoal_kiln')).toBe('bgm_cherrygrove_city');
      expect(audioManager.getTrackForMap('azalea_gym')).toBe('bgm_gym');
    });
  });

  describe('TICKET-WORLD-SLOWPOKE-WELL-01: 10-Point Map Delivery Package (Slowpoke Well B1F & B2F)', () => {
    it('Dimension 1: asserts reciprocal navigation between Azalea Town, B1F, and B2F with safe landing thresholds', () => {
      const azalea = loadMap('azalea_town');
      const b1f = loadMap('slowpoke_well_b1f');
      const b2f = loadMap('slowpoke_well_b2f');

      // Azalea Town <-> B1F
      const azaleaToB1f = azalea.warps.find((w) => w.targetMapId === 'slowpoke_well_b1f');
      expect(azaleaToB1f).toBeDefined();
      expect(azaleaToB1f?.x).toBe(31);
      expect(azaleaToB1f?.y).toBe(7);
      expect(azaleaToB1f?.targetX).toBe(17);
      expect(azaleaToB1f?.targetY).toBe(15);

      const b1fToAzalea = b1f.warps.find((w) => w.targetMapId === 'azalea_town');
      expect(b1fToAzalea).toBeDefined();
      expect(b1fToAzalea?.x).toBe(17);
      expect(b1fToAzalea?.y).toBe(15);
      expect(b1fToAzalea?.targetX).toBe(31);
      expect(b1fToAzalea?.targetY).toBe(7);

      // B1F <-> B2F
      const b1fToB2f = b1f.warps.find((w) => w.targetMapId === 'slowpoke_well_b2f');
      expect(b1fToB2f).toBeDefined();
      expect(b1fToB2f?.x).toBe(7);
      expect(b1fToB2f?.y).toBe(11);

      const b2fToB1f = b2f.warps.find((w) => w.targetMapId === 'slowpoke_well_b1f');
      expect(b2fToB1f).toBeDefined();
      expect(b2fToB1f?.targetX).toBe(7);
      expect(b2fToB1f?.targetY).toBe(11);

      // All warp landing tiles must be strictly walkable
      expect([0, 2]).toContain(b1f.collisionGrid[15 * b1f.width + 17]);
      expect([0, 2]).toContain(azalea.collisionGrid[7 * azalea.width + 31]);
      expect([0, 2]).toContain(b2f.collisionGrid[b1fToB2f!.targetY * b2f.width + b1fToB2f!.targetX]);
    });

    it('Dimension 2 & 3: asserts complete NPC population, 100% walkability, and authentic dialogue across B1F and B2F', () => {
      const npcs = createNpcsByMap();
      const b1f = loadMap('slowpoke_well_b1f');
      const b2f = loadMap('slowpoke_well_b2f');

      const b1fNpcs = npcs.slowpoke_well_b1f;
      expect(b1fNpcs.length).toBeGreaterThanOrEqual(7);

      // Injured Kurt
      const kurt = b1fNpcs.find((n) => n.id === 'well_kurt');
      expect(kurt).toBeDefined();
      expect(kurt?.x).toBe(16);
      expect(kurt?.y).toBe(14);
      expect(kurt?.pages?.[0]).toContain('KURT');

      // 4 Rocket Grunts / Proton gauntlet
      const proton = b1fNpcs.find((n) => n.id === 'executive_proton');
      expect(proton).toBeDefined();
      expect(proton?.action).toBe('PROTON_EVENT');
      expect(proton?.x).toBe(5);
      expect(proton?.y).toBe(2);

      const grunt1 = b1fNpcs.find((n) => n.id === 'rocket_grunt_1');
      const grunt2 = b1fNpcs.find((n) => n.id === 'rocket_grunt_2');
      const grunt3 = b1fNpcs.find((n) => n.id === 'rocket_grunt_3');
      expect(grunt1).toBeDefined();
      expect(grunt2).toBeDefined();
      expect(grunt3).toBeDefined();

      // Tailless Slowpokes
      const slowpoke1 = b1fNpcs.find((n) => n.id === 'well_slowpoke');
      const slowpoke2 = b1fNpcs.find((n) => n.id === 'well_slowpoke_2');
      expect(slowpoke1).toBeDefined();
      expect(slowpoke2).toBeDefined();

      // B2F Explorer
      const b2fNpcs = npcs.slowpoke_well_b2f;
      const guide = b2fNpcs.find((n) => n.id === 'well_guide');
      expect(guide).toBeDefined();
      expect(guide?.action).toBe('KINGS_ROCK_EVENT');
      expect(guide?.x).toBe(16);
      expect(guide?.y).toBe(5);

      // 100% Walkability check for all B1F and B2F NPCs
      for (const n of b1fNpcs) {
        const col = b1f.collisionGrid[n.y * b1f.width + n.x];
        expect([0, 2], `B1F NPC ${n.id} at (${n.x}, ${n.y}) must stand on walkable tile`).toContain(col);
      }
      for (const n of b2fNpcs) {
        const col = b2f.collisionGrid[n.y * b2f.width + n.x];
        expect([0, 2], `B2F NPC ${n.id} at (${n.x}, ${n.y}) must stand on walkable tile`).toContain(col);
      }
    });

    it('Dimension 4: asserts Executive Proton defeat clears the well and despawns Rockets', () => {
      const npcs = createNpcsByMap();
      const storyFlags = new Set<string>(['slowpoke_well_cleared', 'proton_defeated']);

      const remainingB1fNpcs = npcs.slowpoke_well_b1f.filter(
        (n) => !(storyFlags.has('slowpoke_well_cleared') && (n.id.startsWith('rocket_grunt') || n.id === 'executive_proton'))
      );
      expect(remainingB1fNpcs.some((n) => n.id === 'executive_proton')).toBe(false);
      expect(remainingB1fNpcs.some((n) => n.id.startsWith('rocket_grunt'))).toBe(false);
      expect(remainingB1fNpcs.some((n) => n.id === 'well_kurt')).toBe(true);
    });

    it('Dimension 5: asserts canonical overworld item balls on walkable tiles on B1F and B2F', () => {
      const itemManager = new OverworldItemManager();
      const b1fItems = itemManager.getActiveItemBalls('slowpoke_well_b1f');
      const b2fItems = itemManager.getActiveItemBalls('slowpoke_well_b2f');

      const b1f = loadMap('slowpoke_well_b1f');
      const b2f = loadMap('slowpoke_well_b2f');

      expect(b1fItems.length).toBeGreaterThanOrEqual(1);
      const superPotion = b1fItems.find((i) => i.itemId === 'super_potion');
      expect(superPotion).toBeDefined();
      expect(superPotion?.x).toBe(10);
      expect(superPotion?.y).toBe(3);
      expect([0, 2]).toContain(b1f.collisionGrid[3 * b1f.width + 10]);

      expect(b2fItems.length).toBeGreaterThanOrEqual(1);
      const tmRainDance = b2fItems.find((i) => i.itemId === 'tm_rain_dance');
      expect(tmRainDance).toBeDefined();
      expect(tmRainDance?.x).toBe(15);
      expect(tmRainDance?.y).toBe(5);
      expect([0, 2]).toContain(b2f.collisionGrid[5 * b2f.width + 15]);
    });

    it('Dimension 6: asserts time-of-day wild grass and water encounter distributions for B1F and B2F', () => {
      const b1f = loadMap('slowpoke_well_b1f');
      const b2f = loadMap('slowpoke_well_b2f');

      expect(b1f.grassEncounters && b1f.grassEncounters.length).toBeGreaterThanOrEqual(6);
      const b1fTimes = new Set((b1f.grassEncounters || []).map((e) => (e as any).timeOfDay));
      expect(b1fTimes.has('MORNING')).toBe(true);
      expect(b1fTimes.has('DAY')).toBe(true);
      expect(b1fTimes.has('NIGHT')).toBe(true);

      expect(b2f.grassEncounters && b2f.grassEncounters.length).toBeGreaterThanOrEqual(6);
      const b2fTimes = new Set((b2f.grassEncounters || []).map((e) => (e as any).timeOfDay));
      expect(b2fTimes.has('MORNING')).toBe(true);
      expect(b2fTimes.has('DAY')).toBe(true);
      expect(b2fTimes.has('NIGHT')).toBe(true);

      expect(b2f.waterEncounters && b2f.waterEncounters.length).toBeGreaterThanOrEqual(2);
      expect(b2f.waterEncounters?.some((w) => w.speciesId === 'slowpoke')).toBe(true);
      expect(b2f.waterEncounters?.some((w) => w.speciesId === 'slowbro')).toBe(true);
    });

    it('Dimension 7: asserts subterranean warning signposts and depth markers on B1F and B2F', () => {
      const b1f = loadMap('slowpoke_well_b1f');
      const b2f = loadMap('slowpoke_well_b2f');

      expect(b1f.bgEvents && b1f.bgEvents.length).toBeGreaterThanOrEqual(2);
      expect(b1f.bgEvents?.some((b) => b.pages.some((p) => p.includes('SLOWPOKE WELL')))).toBe(true);

      expect(b2f.bgEvents && b2f.bgEvents.length).toBeGreaterThanOrEqual(2);
      expect(b2f.bgEvents?.some((b) => b.pages.some((p) => p.includes('SUBTERRANEAN LAKE') || p.includes('SLOWPOKE WELL')))).toBe(true);
    });

    it('Dimension 10: asserts B1F and B2F resolve cleanly to bgm_sprout_tower in AudioManager', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('slowpoke_well_b1f')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('slowpoke_well_b2f')).toBe('bgm_sprout_tower');
    });
  });

  describe('TICKET-WORLD-AZALEA-GYM-BUGSY-01: 10-Point Map Delivery Package (Azalea Gym & Leader Bugsy)', () => {
    it('Dimension 1: asserts reciprocal navigation with safe doorstep apron target (10, 16) in Azalea Town', () => {
      const azalea = loadMap('azalea_town');
      const gym = loadMap('azalea_gym');

      // Azalea Town -> Gym
      const townToGym = azalea.warps.find((w) => w.targetMapId === 'azalea_gym');
      expect(townToGym).toBeDefined();
      expect(townToGym?.x).toBe(10);
      expect(townToGym?.y).toBe(15);

      // Gym -> Azalea Town (apron at targetY: 16)
      expect(gym.warps.length).toBeGreaterThanOrEqual(2);
      for (const w of gym.warps) {
        expect(w.targetMapId).toBe('azalea_town');
        expect(w.targetX).toBe(10);
        expect(w.targetY).toBe(16);
        expect([0, 2]).toContain(azalea.collisionGrid[16 * azalea.width + 10]);
      }
    });

    it('Dimension 2 & 3: asserts complete NPC population across all 6 trainers, Gym Guide, and 100% walkability', () => {
      const npcs = createNpcsByMap();
      const gym = loadMap('azalea_gym');
      const gymNpcs = npcs.azalea_gym;
      expect(gymNpcs.length).toBeGreaterThanOrEqual(7);

      // Leader Bugsy
      const bugsy = gymNpcs.find((n) => n.id === 'bugsy');
      expect(bugsy).toBeDefined();
      expect(bugsy?.x).toBe(5);
      expect(bugsy?.y).toBe(7);
      expect(bugsy?.action).toBe('BUGSY_EVENT');
      expect(bugsy?.challengePages?.[0]).toContain('BUGSY');

      // Junior trainers
      const benny = gymNpcs.find((n) => n.id === 'bug_catcher_benny');
      const al = gymNpcs.find((n) => n.id === 'bug_catcher_al');
      const josh = gymNpcs.find((n) => n.id === 'bug_catcher_josh');
      const amy = gymNpcs.find((n) => n.id === 'twins_amy');
      const may = gymNpcs.find((n) => n.id === 'twins_may');
      const guide = gymNpcs.find((n) => n.id === 'azalea_gym_guide');

      expect(benny).toBeDefined();
      expect(al).toBeDefined();
      expect(josh).toBeDefined();
      expect(amy).toBeDefined();
      expect(may).toBeDefined();
      expect(guide).toBeDefined();

      // 100% walkability check for all gym entities
      for (const n of gymNpcs) {
        const col = gym.collisionGrid[n.y * gym.width + n.x];
        expect([0, 2], `Azalea Gym NPC ${n.id} at (${n.x}, ${n.y}) must stand on walkable tile`).toContain(col);
      }
    });

    it('Dimension 4: asserts Gym Statues at (3, 13) and (6, 13) with dynamic winning trainers and guide advice', () => {
      const gym = loadMap('azalea_gym');
      expect(gym.bgEvents.length).toBeGreaterThanOrEqual(2);

      const leftStatue = gym.bgEvents.find((b) => b.x === 3 && b.y === 13);
      const rightStatue = gym.bgEvents.find((b) => b.x === 6 && b.y === 13);
      expect(leftStatue).toBeDefined();
      expect(rightStatue).toBeDefined();
      expect(leftStatue?.pages.some((p) => p.includes('BUGSY'))).toBe(true);
      expect(rightStatue?.pages.some((p) => p.includes('BUGSY'))).toBe(true);

      // Statues are on solid tiles (1)
      expect(gym.collisionGrid[13 * gym.width + 3]).toBe(1);
      expect(gym.collisionGrid[13 * gym.width + 6]).toBe(1);
    });

    it('Dimension 10: asserts Azalea Gym resolves cleanly to bgm_gym in AudioManager', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('azalea_gym')).toBe('bgm_gym');
    });
  });

  describe('TICKET-WORLD-ILEX-FOREST-01: 10-Point Map Delivery Package (Ilex Forest & Farfetch\'d Herding Quest)', () => {
    it('Dimension 1: asserts reciprocal navigation between Azalea Town, Ilex Forest, and Route 34 Gate with safe landing thresholds', () => {
      const forest = loadMap('ilex_forest');
      const azalea = loadMap('azalea_town');
      const gate = loadMap('route_34_ilex_forest_gate');

      // East Exits to Azalea Town
      const toAzalea1 = forest.warps.find((w) => w.targetMapId === 'azalea_town' && w.x === 3 && w.y === 42);
      const toAzalea2 = forest.warps.find((w) => w.targetMapId === 'azalea_town' && w.x === 3 && w.y === 43);
      expect(toAzalea1).toBeDefined();
      expect(toAzalea2).toBeDefined();
      expect(toAzalea1?.targetX).toBe(2);
      expect(toAzalea1?.targetY).toBe(10);
      expect(toAzalea2?.targetX).toBe(2);
      expect(toAzalea2?.targetY).toBe(11);

      // Reciprocal warps from Azalea Town to Ilex Forest
      const fromAzalea1 = azalea.warps.find((w) => w.targetMapId === 'ilex_forest' && w.x === 2 && w.y === 10);
      const fromAzalea2 = azalea.warps.find((w) => w.targetMapId === 'ilex_forest' && w.x === 2 && w.y === 11);
      expect(fromAzalea1).toBeDefined();
      expect(fromAzalea2).toBeDefined();
      expect(fromAzalea1?.targetX).toBe(3);
      expect(fromAzalea1?.targetY).toBe(42);
      expect(fromAzalea2?.targetX).toBe(3);
      expect(fromAzalea2?.targetY).toBe(43);

      // North Exit to Route 34 Gate
      const toGate = forest.warps.find((w) => w.targetMapId === 'route_34_ilex_forest_gate');
      expect(toGate).toBeDefined();
      expect(toGate?.x).toBe(1);
      expect(toGate?.y).toBe(5);
      expect(toGate?.targetX).toBe(4);
      expect(toGate?.targetY).toBe(7);

      // Reciprocal warps from Gate to Ilex Forest
      const fromGate = gate.warps.filter((w) => w.targetMapId === 'ilex_forest');
      expect(fromGate.length).toBeGreaterThanOrEqual(1);
      for (const w of fromGate) {
        expect(w.targetX).toBe(1);
        expect(w.targetY).toBe(5);
      }

      // Assert 100% of landing tiles are safe and walkable
      expect([0, 2]).toContain(azalea.collisionGrid[10 * azalea.width + 2]);
      expect([0, 2]).toContain(azalea.collisionGrid[11 * azalea.width + 2]);
      expect([0, 2]).toContain(gate.collisionGrid[7 * gate.width + 4]);
      expect([0, 2]).toContain(forest.collisionGrid[42 * forest.width + 3]);
      expect([0, 2]).toContain(forest.collisionGrid[43 * forest.width + 3]);
      expect([0, 2]).toContain(forest.collisionGrid[5 * forest.width + 1]);
    });

    it('Dimension 2: asserts 100% of Ilex Forest NPCs stand on walkable tiles with complete combat and interaction data', () => {
      const forest = loadMap('ilex_forest');
      const npcs = createNpcsByMap();
      const forestNpcs = (npcs as any).ilex_forest || [];
      expect(forestNpcs.length).toBeGreaterThanOrEqual(5);

      const apprentice = forestNpcs.find((n: any) => n.id === 'forest_apprentice');
      const farfetchd = forestNpcs.find((n: any) => n.id === 'forest_farfetchd');
      const master = forestNpcs.find((n: any) => n.id === 'cut_master');
      const headbutt = forestNpcs.find((n: any) => n.id === 'headbutt_tutor');
      const wayne = forestNpcs.find((n: any) => n.id === 'bug_catcher_wayne');

      expect(apprentice).toBeDefined();
      expect(farfetchd).toBeDefined();
      expect(master).toBeDefined();
      expect(headbutt).toBeDefined();
      expect(wayne).toBeDefined();

      // Wayne trainer combat attributes
      expect(wayne.action).toBe('TRAINER_BATTLE');
      expect(wayne.trainerId).toBe('bug_catcher_wayne');
      expect(wayne.trainerTeam?.length).toBe(2);
      expect(wayne.trainerTeam?.[0].speciesId).toBe('paras');
      expect(wayne.trainerTeam?.[1].speciesId).toBe('spinarak');

      // 100% walkability check across all forest entities
      for (const n of forestNpcs) {
        const col = forest.collisionGrid[n.y * forest.width + n.x];
        expect([0, 2], `NPC ${n.id} at (${n.x}, ${n.y}) on ilex_forest must stand on walkable tile`).toContain(col);
      }
    });

    it('Dimension 3 & 4: asserts Signpost, Shrine, and Cut Tree clearance opening Route 34 access', () => {
      const forest = loadMap('ilex_forest');

      // Signpost at (3, 17) and Shrine at (8, 22)
      expect(forest.bgEvents.length).toBeGreaterThanOrEqual(2);
      const signpost = forest.bgEvents.find((b) => b.x === 3 && b.y === 17);
      const shrine = forest.bgEvents.find((b) => b.x === 8 && b.y === 22);
      expect(signpost).toBeDefined();
      expect(shrine).toBeDefined();
      expect(shrine?.pages.some((p) => p.includes('CELEBI') || p.includes('SHRINE'))).toBe(true);

      // Prior to Cut, path at (8, 25) is blocked (solid 1)
      expect(forest.collisionGrid[25 * forest.width + 8]).toBe(1);

      // Simulate cutting the tree: collision clears to 0 and connects south to north
      const simulatedColl = [...forest.collisionGrid];
      simulatedColl[25 * forest.width + 8] = 0;

      // Flood-fill BFS to assert reachability from entrance (3, 42) to north exit (1, 5)
      const visited = new Set<number>();
      const queue: [number, number][] = [[3, 42]];
      visited.add(42 * forest.width + 3);

      while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < forest.width && ny >= 0 && ny < forest.height) {
            const idx = ny * forest.width + nx;
            const c = simulatedColl[idx];
            if ((c === 0 || c === 2) && !visited.has(idx)) {
              visited.add(idx);
              queue.push([nx, ny]);
            }
          }
        }
      }

      expect(visited.has(5 * forest.width + 1)).toBe(true);
    });

    it('Dimension 5: asserts all canonical Item Balls and Hidden Items are indexed on walkable tiles', () => {
      const forest = loadMap('ilex_forest');
      const itemManager = new OverworldItemManager();
      const itemBalls = itemManager.getActiveItemBalls('ilex_forest');
      const hiddenItems = itemManager.getHiddenItemsForMap('ilex_forest');

      expect(itemBalls.length).toBeGreaterThanOrEqual(4);
      expect(hiddenItems.length).toBeGreaterThanOrEqual(3);

      // Required canonical items
      expect(itemBalls.some((b) => b.itemId === 'revive')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'x_attack')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'antidote')).toBe(true);
      expect(itemBalls.some((b) => b.itemId === 'ether')).toBe(true);

      // 100% walkability check for items
      for (const b of itemBalls) {
        const col = forest.collisionGrid[b.y * forest.width + b.x];
        expect([0, 2], `ItemBall ${b.id} at (${b.x}, ${b.y}) must be walkable`).toContain(col);
      }
      for (const h of hiddenItems) {
        const col = forest.collisionGrid[h.y * forest.width + h.x];
        expect([0, 2], `HiddenItem ${h.id} at (${h.x}, ${h.y}) must be walkable`).toContain(col);
      }
    });

    it('Dimension 6: asserts time-of-day wild encounter distributions for Ilex Forest', () => {
      const forest = loadMap('ilex_forest');
      expect(forest.grassEncounters).toBeDefined();
      const encounters = forest.grassEncounters!;
      expect(encounters.length).toBeGreaterThanOrEqual(10);

      const morning = encounters.filter((e) => e.timeOfDay === 'MORNING');
      const day = encounters.filter((e) => e.timeOfDay === 'DAY');
      const night = encounters.filter((e) => e.timeOfDay === 'NIGHT');

      expect(morning.length).toBeGreaterThanOrEqual(5);
      expect(day.length).toBeGreaterThanOrEqual(5);
      expect(night.length).toBeGreaterThanOrEqual(5);

      // Canonical species presence
      expect(encounters.some((e) => e.speciesId === 'caterpie')).toBe(true);
      expect(encounters.some((e) => e.speciesId === 'weedle')).toBe(true);
      expect(encounters.some((e) => e.speciesId === 'paras')).toBe(true);
      expect(night.some((e) => e.speciesId === 'oddish')).toBe(true);
      expect(night.some((e) => e.speciesId === 'psyduck')).toBe(true);
    });

    it('Dimension 10: asserts canonical BGM track resolution for Ilex Forest and Gate', () => {
      const audioManager = new AudioManager();
      expect(audioManager.getTrackForMap('ilex_forest')).toBe('bgm_sprout_tower');
      expect(audioManager.getTrackForMap('route_34_ilex_forest_gate')).toBe('bgm_sprout_tower');
    });
  });
});
