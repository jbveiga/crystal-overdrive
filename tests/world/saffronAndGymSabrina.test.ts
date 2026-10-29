import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/game';
import { createKantoSaffronNpcs } from '../../src/world/npcs/kantoSaffronNpcs';
import {
  handleSabrinaInteraction,
  handleSaffronGymTrainer,
  handleSaffronGymGuideAndStatues,
  handleCopycatInteraction,
  handleMagnetTrainConductor,
  handleSaffronLandmarkGifts,
  handleRoute6Trainer,
  getSaffronAndRoute6Interactions,
} from '../../src/world/interactions/SaffronAndRoute6Interactions';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import { getNpcsForMap, isNpcActiveForStoryFlags } from '../../src/world/npcData';
import type { NpcInteractionContext } from '../../src/types/worldContext';

describe('TICKET-WORLD-SAFFRON-AND-GYM-SABRINA-01: Saffron City, Saffron Gym & Route 6 Verification', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let saffronCity: MapData;
  let saffronGym: MapData;
  let route6: MapData;
  let route6SaffronGate: MapData;
  let copycatsHouse1F: MapData;
  let copycatsHouse2F: MapData;
  let silphCo1F: MapData;
  let mrPsychicsHouse: MapData;
  let fightingDojo: MapData;
  let saffronStation: MapData;
  let goldenrodStation: MapData;

  beforeEach(() => {
    saffronCity = JSON.parse(fs.readFileSync(path.join(mapsDir, 'saffron_city.json'), 'utf8'));
    saffronGym = JSON.parse(fs.readFileSync(path.join(mapsDir, 'saffron_gym.json'), 'utf8'));
    route6 = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_6.json'), 'utf8'));
    route6SaffronGate = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_6_saffron_gate.json'), 'utf8'));
    copycatsHouse1F = JSON.parse(fs.readFileSync(path.join(mapsDir, 'copycats_house_1f.json'), 'utf8'));
    copycatsHouse2F = JSON.parse(fs.readFileSync(path.join(mapsDir, 'copycats_house_2f.json'), 'utf8'));
    silphCo1F = JSON.parse(fs.readFileSync(path.join(mapsDir, 'silph_co_1f.json'), 'utf8'));
    mrPsychicsHouse = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mr_psychics_house.json'), 'utf8'));
    fightingDojo = JSON.parse(fs.readFileSync(path.join(mapsDir, 'fighting_dojo.json'), 'utf8'));
    saffronStation = JSON.parse(fs.readFileSync(path.join(mapsDir, 'saffron_magnet_train_station.json'), 'utf8'));
    goldenrodStation = JSON.parse(fs.readFileSync(path.join(mapsDir, 'goldenrod_magnet_train_station.json'), 'utf8'));
  });

  describe('1. Map Connectivity & Reciprocal Warps', () => {
    it('verifies route_6_saffron_gate contains north warps to saffron_city at (16..17, 33)', () => {
      expect(route6SaffronGate.warps).toContainEqual({
        x: 4,
        y: 0,
        targetMapId: 'saffron_city',
        targetX: 16,
        targetY: 33,
      });
      expect(route6SaffronGate.warps).toContainEqual({
        x: 5,
        y: 0,
        targetMapId: 'saffron_city',
        targetX: 17,
        targetY: 33,
      });
    });

    it('verifies saffron_city contains south gate reciprocal warps to route_6_saffron_gate at (4..5, 0)', () => {
      expect(saffronCity.warps).toContainEqual({
        x: 16,
        y: 33,
        targetMapId: 'route_6_saffron_gate',
        targetX: 4,
        targetY: 0,
      });
      expect(saffronCity.warps).toContainEqual({
        x: 17,
        y: 33,
        targetMapId: 'route_6_saffron_gate',
        targetX: 5,
        targetY: 0,
      });
    });

    it('verifies copycats_house reciprocal stairs warps between 1F and 2F', () => {
      const warp1F = copycatsHouse1F.warps.find((w) => w.targetMapId === 'copycats_house_2f');
      expect(warp1F).toBeDefined();
      const warp2F = copycatsHouse2F.warps.find((w) => w.targetMapId === 'copycats_house_1f');
      expect(warp2F).toBeDefined();
      expect([0, 2]).toContain(copycatsHouse2F.collisionGrid[warp1F!.targetY * copycatsHouse2F.width + warp1F!.targetX]);
      expect([0, 2]).toContain(copycatsHouse1F.collisionGrid[warp2F!.targetY * copycatsHouse1F.width + warp2F!.targetX]);
    });

    it('verifies world_maps.json bundle includes updated saffron and gatehouse warps', () => {
      const bundle: MapData[] = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/world_maps.json'), 'utf8')
      );
      const bundledGate = bundle.find((m) => m.id === 'route_6_saffron_gate');
      expect(bundledGate?.warps).toContainEqual({
        x: 4,
        y: 0,
        targetMapId: 'saffron_city',
        targetX: 16,
        targetY: 33,
      });
      const bundledSaffron = bundle.find((m) => m.id === 'saffron_city');
      expect(bundledSaffron?.warps).toContainEqual({
        x: 16,
        y: 33,
        targetMapId: 'route_6_saffron_gate',
        targetX: 4,
        targetY: 0,
      });
    });
  });

  describe('2. Saffron Gym 32-Teleport Warp Network', () => {
    it('verifies saffron_gym has 32 warps: 2 exit doors and 30 internal teleporters', () => {
      expect(saffronGym.warps.length).toBe(32);
      const exits = saffronGym.warps.filter((w) => w.targetMapId === 'saffron_city');
      expect(exits.length).toBe(2);
      const teleporters = saffronGym.warps.filter((w) => w.targetMapId === 'saffron_gym');
      expect(teleporters.length).toBe(30);
    });

    it('asserts 100% of internal teleporter warps land on walkable tiles (0 or 2)', () => {
      const teleporters = saffronGym.warps.filter((w) => w.targetMapId === 'saffron_gym');
      for (const t of teleporters) {
        const destCollision = saffronGym.collisionGrid[t.targetY * saffronGym.width + t.targetX];
        expect([0, 2], `Teleport to (${t.targetX}, ${t.targetY}) must be walkable`).toContain(destCollision);
      }
    });
  });

  describe('3. Gym Leader Sabrina Boss Battle & Marsh Badge', () => {
    function createMockContext(): { ctx: NpcInteractionContext; dialogues: Array<{ pages: string[]; speaker?: string }> } {
      const dialogues: Array<{ pages: string[]; speaker?: string }> = [];
      const ctx: any = {
        playerName: 'Gold',
        playerParty: [],
        inventory: {
          items: {},
          keyItems: [],
          balls: {},
          tms: [],
          badges: [],
        },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        player: { x: 9, y: 9, targetX: 9, targetY: 9, renderX: 9, renderY: 9, direction: 'UP' },
        npcsByMap: {},
        mapManager: {
          getCurrentMap: () => saffronGym,
          loadMap: () => {},
          setCurrentMap: () => saffronGym,
        },
        audioManager: {
          playBattleBgm: () => {},
          restoreOverworldBgm: () => {},
          playMapBgm: () => {},
          playSfx: () => {},
        },
        openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
          dialogues.push({ pages, speaker });
          onComplete?.();
        },
        showToast: () => {},
        saveCurrentGame: () => {},
        addOverworldItemToInventory: (itemId: string) => {
          if (itemId === 'tm29' || itemId === 'TM29') {
            ctx.inventory.tms.push('TM29');
          } else if (itemId === 'pass') {
            ctx.inventory.keyItems.push('pass');
          } else {
            ctx.inventory.items[itemId] = (ctx.inventory.items[itemId] || 0) + 1;
          }
        },
        triggerBattle: async (_lead: any, opts: any) => {
          opts.onVictory?.();
        },
      };
      return { ctx, dialogues };
    }

    it('triggers Sabrina battle, grants Marsh Badge, sets sabrina_defeated flag', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const sabrina = npcs.saffron_gym.find((n) => n.action === 'SABRINA_EVENT');
      expect(sabrina).toBeDefined();

      const handled = handleSabrinaInteraction(sabrina!, ctx);
      expect(handled).toBe(true);

      // Verify battle rewards
      expect(ctx.storyFlags.has('sabrina_defeated')).toBe(true);
      expect(ctx.inventory.badges).toContain('marsh');
      expect(ctx.defeatedTrainers.has('sabrina')).toBe(true);

      // Verify dialogues
      expect(dialogues.some((d) => d.pages.some((p) => p.includes('MARSHBADGE')))).toBe(true);
      expect(dialogues.some((d) => d.pages.some((p) => p.includes('I had a vision of your arrival')))).toBe(true);
    });

    it('shows post-battle dialogue when interacting with Sabrina after victory', () => {
      const { ctx, dialogues } = createMockContext();
      ctx.storyFlags.add('sabrina_defeated');
      const npcs = createKantoSaffronNpcs();
      const sabrina = npcs.saffron_gym.find((n) => n.action === 'SABRINA_EVENT');

      const handled = handleSabrinaInteraction(sabrina!, ctx);
      expect(handled).toBe(true);
      expect(dialogues[0].pages[0]).toContain('Your love for your POKéMON overcame my psychic power');
    });
  });

  describe('4. Saffron Gym Guide, Statues & Disciples', () => {
    function createMockContext() {
      const dialogues: Array<{ pages: string[]; speaker?: string }> = [];
      const ctx: any = {
        playerName: 'Gold',
        playerParty: [],
        inventory: { items: {}, keyItems: [], badges: [], tms: [] },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        player: { x: 9, y: 17 },
        audioManager: { playBattleBgm: () => {}, restoreOverworldBgm: () => {}, playMapBgm: () => {}, playSfx: () => {} },
        openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
          dialogues.push({ pages, speaker });
          onComplete?.();
        },
        saveCurrentGame: () => {},
        triggerBattle: async (_lead: any, opts: any) => {
          opts.onVictory?.();
        },
      };
      return { ctx, dialogues };
    }

    it('dynamically displays winning trainers on Gym Statues based on Sabrina defeat', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const statue = npcs.saffron_gym.find((n) => n.action === 'SAFFRON_GYM_STATUE');
      expect(statue).toBeDefined();

      handleSaffronGymGuideAndStatues(statue!, ctx);
      expect(dialogues[dialogues.length - 1].pages[2]).toBe('WINNING TRAINERS:\nRED');

      ctx.storyFlags.add('sabrina_defeated');
      handleSaffronGymGuideAndStatues(statue!, ctx);
      expect(dialogues[dialogues.length - 1].pages[2]).toBe('WINNING TRAINERS:\nRED\nGold');
    });

    it('verifies Gym Guide advice before and after victory', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const guide = npcs.saffron_gym.find((n) => n.action === 'SAFFRON_GYM_GUIDE');
      expect(guide).toBeDefined();

      handleSaffronGymGuideAndStatues(guide!, ctx);
      expect(dialogues[dialogues.length - 1].pages[1]).toContain('Dark and Ghost-type moves');

      ctx.storyFlags.add('sabrina_defeated');
      handleSaffronGymGuideAndStatues(guide!, ctx);
      expect(dialogues[dialogues.length - 1].pages[1]).toContain('You showed SABRINA the power of pure determination');
    });

    it('verifies Saffron Gym trainers challenge, team, and defeat progression', () => {
      const { ctx } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const rebecca = npcs.saffron_gym.find((n) => n.id === 'saffron_gym_rebecca');
      expect(rebecca).toBeDefined();

      expect(ctx.defeatedTrainers.has('saffron_gym_rebecca')).toBe(false);
      handleSaffronGymTrainer(rebecca!, ctx);
      expect(ctx.defeatedTrainers.has('saffron_gym_rebecca')).toBe(true);
    });
  });

  describe('5. Copycat Doll Quest & Magnet Train High-Speed Transit', () => {
    function createMockContext() {
      const dialogues: Array<{ pages: string[]; speaker?: string }> = [];
      let warpedTo: any = null;
      const ctx: any = {
        playerName: 'Gold',
        playerParty: [],
        inventory: { items: {}, keyItems: [], badges: [], tms: [] },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        player: { x: 9, y: 9, direction: 'UP' },
        mapManager: {
          currentMap: saffronStation,
          getCurrentMap: () => ctx.mapManager.currentMap,
          loadMap: (id: string) => {
            ctx.mapManager.currentMap = id === 'goldenrod_magnet_train_station' ? goldenrodStation : saffronStation;
          },
        },
        audioManager: { playBattleBgm: () => {}, restoreOverworldBgm: () => {}, playMapBgm: () => {}, playSfx: () => {} },
        openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
          dialogues.push({ pages, speaker });
          onComplete?.();
        },
        saveCurrentGame: () => {},
        showToast: () => {},
        executeWarpTransition: (warp: any) => {
          warpedTo = warp;
          ctx.mapManager.currentMap = warp.targetMapId === 'goldenrod_magnet_train_station' ? goldenrodStation : saffronStation;
          ctx.player.x = warp.targetX;
          ctx.player.y = warp.targetY;
        },
        addOverworldItemToInventory: (id: string) => {
          if (id === 'pass') ctx.inventory.keyItems.push('pass');
        },
      };
      return { ctx, dialogues, getWarpedTo: () => warpedTo };
    }

    it('initiates Copycat doll search if player does not possess lost-item', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const copycat = npcs.copycats_house_2f.find((n) => n.action === 'COPYCAT_EVENT');
      expect(copycat).toBeDefined();

      handleCopycatInteraction(copycat!, ctx);
      expect(ctx.storyFlags.has('copycat_lost_doll')).toBe(true);
      expect(ctx.storyFlags.has('EVENT_MET_COPYCAT')).toBe(true);
      expect(dialogues[0].pages[1]).toContain('lost my favorite CLEFAIRY DOLL');
    });

    it('exchanges lost-item for Magnet Train Pass with Copycat', () => {
      const { ctx, dialogues } = createMockContext();
      ctx.inventory.keyItems.push('lost-item');
      const npcs = createKantoSaffronNpcs();
      const copycat = npcs.copycats_house_2f.find((n) => n.action === 'COPYCAT_EVENT');

      handleCopycatInteraction(copycat!, ctx);
      expect(ctx.inventory.keyItems).not.toContain('lost-item');
      expect(ctx.inventory.keyItems).toContain('pass');
      expect(ctx.storyFlags.has('got_magnet_train_pass')).toBe(true);
      expect(dialogues.some((d) => d.pages.some((p) => p.includes('MAGNET TRAIN PASS')))).toBe(true);
    });

    it('rejects boarding Magnet Train without Pass', () => {
      const { ctx, dialogues, getWarpedTo } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const conductor = npcs.saffron_magnet_train_station.find((n) => n.action === 'MAGNET_TRAIN_CONDUCTOR');
      expect(conductor).toBeDefined();

      handleMagnetTrainConductor(conductor!, ctx);
      expect(getWarpedTo()).toBeNull();
      expect(dialogues[0].pages[0]).toContain('You need a PASS to ride the MAGNET TRAIN');
    });

    it('boards Magnet Train with Pass and warps player between Saffron and Goldenrod at (9, 6)', () => {
      const { ctx, getWarpedTo } = createMockContext();
      ctx.inventory.keyItems.push('pass');
      const npcs = createKantoSaffronNpcs();
      const conductor = npcs.saffron_magnet_train_station.find((n) => n.action === 'MAGNET_TRAIN_CONDUCTOR');

      // Boarding from Saffron -> Goldenrod
      handleMagnetTrainConductor(conductor!, ctx);
      expect(getWarpedTo()).toMatchObject({
        targetMapId: 'goldenrod_magnet_train_station',
        targetX: 9,
        targetY: 6,
        direction: 'DOWN',
      });
      expect(ctx.player.x).toBe(9);
      expect(ctx.player.y).toBe(6);

      // Return trip from Goldenrod -> Saffron
      handleMagnetTrainConductor(conductor!, ctx);
      expect(getWarpedTo()).toMatchObject({
        targetMapId: 'saffron_magnet_train_station',
        targetX: 9,
        targetY: 6,
        direction: 'DOWN',
      });
    });

    it('asserts BFS path exists from arrival platform (9, 6) to south lobby exits (8..9, 17) in both stations avoiding solid tiles and NPCs', () => {
      function canReachExit(map: MapData, startX: number, startY: number, npcs: Array<{ x: number; y: number }>): boolean {
        const npcBlocked = new Set(npcs.map((n) => `${n.x},${n.y}`));
        const visited = new Set<string>();
        const queue: Array<[number, number]> = [[startX, startY]];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          if ((cx === 8 || cx === 9) && cy === 17) {
            return true;
          }

          const neighbors: Array<[number, number]> = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) continue;
            const key = `${nx},${ny}`;
            if (visited.has(key)) continue;
            const collision = map.collisionGrid[ny * map.width + nx];
            if (collision === 1) continue;
            if (npcBlocked.has(key)) continue;
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
        return false;
      }

      const saffronNpcs = getNpcsForMap('saffron_magnet_train_station', new Set());
      const goldenrodNpcs = getNpcsForMap('goldenrod_magnet_train_station', new Set());

      expect(canReachExit(saffronStation, 9, 6, saffronNpcs)).toBe(true);
      expect(canReachExit(goldenrodStation, 9, 6, goldenrodNpcs)).toBe(true);
    });

    it('verifies copycats_doll lifecycle gating and doduo farfetchd sprite', () => {
      // Inactive before doll returned
      expect(isNpcActiveForStoryFlags('copycats_doll', new Set())).toBe(false);
      // Active after doll returned
      expect(isNpcActiveForStoryFlags('copycats_doll', new Set(['got_magnet_train_pass']))).toBe(true);
      expect(isNpcActiveForStoryFlags('copycats_doll', new Set(['copycat_doll_returned']))).toBe(true);

      // Verify Doduo uses farfetchd bird sprite rather than human trainer
      const npcs = createKantoSaffronNpcs();
      const doduo = npcs.copycats_house_2f.find((n) => n.id === 'copycats_doduo');
      expect(doduo).toBeDefined();
      expect(doduo?.spriteType).toBe('farfetchd');
    });
  });

  describe('6. Saffron Landmarks: Silph Co., Mr. Psychic & Fighting Dojo', () => {
    function createMockContext() {
      const dialogues: Array<{ pages: string[]; speaker?: string }> = [];
      const ctx: any = {
        playerName: 'Gold',
        inventory: { items: {}, keyItems: [], tms: [] },
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        audioManager: { playBattleBgm: () => {}, restoreOverworldBgm: () => {}, playMapBgm: () => {}, playSfx: () => {} },
        openDialogue: (pages: string[], speaker?: string, onComplete?: () => void) => {
          dialogues.push({ pages, speaker });
          onComplete?.();
        },
        saveCurrentGame: () => {},
        showToast: () => {},
        addOverworldItemToInventory: (id: string) => {
          if (id === 'tm29' || id === 'TM29') {
            ctx.inventory.tms.push('TM29');
          } else {
            ctx.inventory.items[id] = (ctx.inventory.items[id] || 0) + 1;
          }
        },
      };
      return { ctx, dialogues };
    }

    it('grants UP-GRADE from Silph Co. Guard and sets got_silph_co_upgrade flag', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const guard = npcs.silph_co_1f.find((n) => n.action === 'SILPH_CO_GUARD');
      expect(guard).toBeDefined();

      handleSaffronLandmarkGifts(guard!, ctx);
      expect(ctx.storyFlags.has('got_silph_co_upgrade')).toBe(true);
      expect(ctx.inventory.items['up-grade']).toBe(1);
      expect(dialogues.some((d) => d.pages.some((p) => p.includes('UP-GRADE')))).toBe(true);

      // Second interaction
      handleSaffronLandmarkGifts(guard!, ctx);
      expect(dialogues[dialogues.length - 1].pages[0]).toContain('SILPH CO. continues developing');
    });

    it('grants TM29 PSYCHIC from Mr. Psychic and sets got_tm29_psychic flag', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const mrPsychic = npcs.mr_psychics_house.find((n) => n.action === 'MR_PSYCHIC');
      expect(mrPsychic).toBeDefined();

      handleSaffronLandmarkGifts(mrPsychic!, ctx);
      expect(ctx.storyFlags.has('got_tm29_psychic')).toBe(true);
      expect(ctx.inventory.tms).toContain('TM29');
      expect(dialogues.some((d) => d.pages.some((p) => p.includes('TM29 PSYCHIC')))).toBe(true);

      // Second interaction
      handleSaffronLandmarkGifts(mrPsychic!, ctx);
      expect(dialogues[dialogues.length - 1].pages[0]).toContain('A mind attuned to the cosmos');
    });

    it('verifies Fighting Dojo disciple lore and Focus Band item ball availability', () => {
      const { ctx, dialogues } = createMockContext();
      const npcs = createKantoSaffronNpcs();
      const disciple = npcs.fighting_dojo.find((n) => n.action === 'FIGHTING_DOJO_DISCIPLE');
      expect(disciple).toBeDefined();

      handleSaffronLandmarkGifts(disciple!, ctx);
      expect(dialogues[0].pages[0]).toContain('KARATE KING, the master of the FIGHTING DOJO');

      // Check Focus Band via OverworldItemManager
      const itemManager = new OverworldItemManager();
      const uncollected = itemManager.checkItemBall('fighting_dojo', 3, 1);
      expect(uncollected).toBeDefined();
      expect(uncollected?.itemId).toBe('focus_band');

      // Also check coordinate (4, 1) alias
      const uncollectedAlias = itemManager.checkItemBall('fighting_dojo', 4, 1);
      expect(uncollectedAlias).toBeDefined();
    });
  });

  describe('7. Route 6 Trainers & NPC Walkability', () => {
    it('verifies 4 canonical Route 6 trainers: Rex, Allan, Jerry, Debby', () => {
      const npcs = createKantoSaffronNpcs();
      const route6Trainers = npcs.route_6.filter((n) => n.action === 'ROUTE_6_TRAINER');
      expect(route6Trainers.length).toBe(4);

      const rex = route6Trainers.find((t) => t.id === 'route_6_rex');
      expect(rex?.trainerTeam?.[0].speciesId).toBe('phanpy');

      const allan = route6Trainers.find((t) => t.id === 'route_6_allan');
      expect(allan?.trainerTeam?.[0].speciesId).toBe('teddiursa');

      const jerry = route6Trainers.find((t) => t.id === 'route_6_jerry');
      expect(jerry?.trainerTeam?.[0].speciesId).toBe('sandslash');

      const debby = route6Trainers.find((t) => t.id === 'route_6_debby');
      expect(debby?.trainerTeam?.[0].speciesId).toBe('jumpluff');
    });

    it('verifies 100% of Saffron and Route 6 NPCs stand on strictly walkable tiles (0 or 2)', () => {
      const npcs = createKantoSaffronNpcs();
      const mapTable: Record<string, MapData> = {
        route_6: route6,
        route_6_saffron_gate: route6SaffronGate,
        saffron_city: saffronCity,
        saffron_gym: saffronGym,
        copycats_house_1f: copycatsHouse1F,
        copycats_house_2f: copycatsHouse2F,
        silph_co_1f: silphCo1F,
        mr_psychics_house: mrPsychicsHouse,
        fighting_dojo: fightingDojo,
        saffron_magnet_train_station: saffronStation,
      };

      for (const [mapId, npcList] of Object.entries(npcs)) {
        const map = mapTable[mapId];
        expect(map, `Map ${mapId} must be loaded`).toBeDefined();
        for (const npc of npcList) {
          const tile = map.collisionGrid[npc.y * map.width + npc.x];
          expect(
            [0, 2],
            `NPC ${npc.id} on map ${mapId} at (${npc.x}, ${npc.y}) must be on walkable tile (0 or 2), got ${tile}`
          ).toContain(tile);
        }
      }
    });

    it('verifies getSaffronAndRoute6Interactions returns all 8 required action routes', () => {
      const routes = getSaffronAndRoute6Interactions();
      expect(routes.length).toBe(8);
      const actions = routes.flatMap((r) => r.actions);
      expect(actions).toContain('SABRINA_EVENT');
      expect(actions).toContain('SAFFRON_GYM_TRAINER');
      expect(actions).toContain('SAFFRON_GYM_GUIDE');
      expect(actions).toContain('SAFFRON_GYM_STATUE');
      expect(actions).toContain('COPYCAT_EVENT');
      expect(actions).toContain('MAGNET_TRAIN_CONDUCTOR');
      expect(actions).toContain('SILPH_CO_GUARD');
      expect(actions).toContain('MR_PSYCHIC');
      expect(actions).toContain('ROUTE_6_TRAINER');
    });

    it('verifies absence of duplicate phantom NPCs in mr_psychics_house, saffron_gym, and saffron_magnet_train_station', () => {
      // Mr. Psychic's House: strictly 1 NPC (mr_psychic)
      const mrPsychicNpcs = getNpcsForMap('mr_psychics_house', new Set());
      expect(mrPsychicNpcs.length).toBe(1);
      expect(mrPsychicNpcs[0].id).toBe('mr_psychic');

      // Saffron Gym: strictly 1 Gym Guide at (9, 16) and 1 Leader Sabrina
      const gymNpcs = getNpcsForMap('saffron_gym', new Set());
      const guides = gymNpcs.filter((n) => n.action === 'SAFFRON_GYM_GUIDE');
      expect(guides.length).toBe(1);
      expect(guides[0].x).toBe(9);
      expect(guides[0].y).toBe(16);

      // Saffron Magnet Train Station: no phantom girl blocking turnstile at (5, 10)
      const stationNpcs = getNpcsForMap('saffron_magnet_train_station', new Set());
      const turnstileBlocker = stationNpcs.find((n) => n.x === 5 && n.y === 10);
      expect(turnstileBlocker).toBeUndefined();
    });
  });
});
