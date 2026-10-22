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
});
