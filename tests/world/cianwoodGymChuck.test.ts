import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { MapData } from '../../src/types/map';
import { createOlivineToIndigoNpcs } from '../../src/world/npcs/olivineToIndigoNpcs';
import { getGymLeaderInteractions } from '../../src/world/interactions/GymLeaderInteractions';
import { getJohtoTownServiceInteractions } from '../../src/world/interactions/JohtoTownServiceInteractions';
import { PokemonFactory } from '../../src/battle/PokemonFactory';

describe('TICKET-BATTLE-CIANWOOD-GYM-CHUCK-01: Cianwood Gym & Leader Chuck', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const spritesDir = path.resolve(__dirname, '../../public/assets/sprites/characters');

  const gymMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_gym.json'), 'utf8'));
  const cityMap: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'cianwood_city.json'), 'utf8'));
  const allNpcs = createOlivineToIndigoNpcs();
  const gymNpcs = allNpcs['cianwood_gym'] || [];
  const cityNpcs = allNpcs['cianwood_city'] || [];

  describe('1. Map Geometry, Reciprocal Warps & Statues', () => {
    it('verifies gym dimensions (10x18) and collision grid', () => {
      expect(gymMap.id).toBe('cianwood_gym');
      expect(gymMap.width).toBe(10);
      expect(gymMap.height).toBe(18);
      expect(gymMap.collisionGrid.length).toBe(10 * 18);
    });

    it('asserts gym exit warps (4, 17) & (5, 17) lead to cianwood_city (8, 44) on walkable tiles', () => {
      const exitWarps = gymMap.warps.filter((w) => w.targetMapId === 'cianwood_city');
      expect(exitWarps.length).toBe(2);
      expect(exitWarps.some((w) => w.x === 4 && w.y === 17 && w.targetX === 8 && w.targetY === 44)).toBe(true);
      expect(exitWarps.some((w) => w.x === 5 && w.y === 17 && w.targetX === 8 && w.targetY === 44)).toBe(true);

      // Verify entrance warp in cianwood_city leads to gym
      const gymEntranceWarp = cityMap.warps.find((w) => w.x === 8 && w.y === 43 && w.targetMapId === 'cianwood_gym');
      expect(gymEntranceWarp).toBeDefined();
      expect(gymEntranceWarp?.targetX).toBe(4);
      expect(gymEntranceWarp?.targetY).toBe(17);

      // Verify target tile in city is walkable (0 or 2)
      const cityIdx = 44 * cityMap.width + 8;
      expect([0, 2]).toContain(cityMap.collisionGrid[cityIdx]);
    });

    it('asserts Cianwood Gym statues are registered in bgEvents at (3, 15) and (6, 15)', () => {
      const statue1 = gymMap.bgEvents?.find((bg) => bg.x === 3 && bg.y === 15);
      const statue2 = gymMap.bgEvents?.find((bg) => bg.x === 6 && bg.y === 15);
      expect(statue1).toBeDefined();
      expect(statue2).toBeDefined();
    });
  });

  describe('2. Gym Trainer Roster, Vision & Walkability Invariants', () => {
    it('verifies all 6 NPCs exist and stand on walkable tiles (collision 0)', () => {
      expect(gymNpcs.length).toBe(6);

      for (const npc of gymNpcs) {
        const idx = npc.y * gymMap.width + npc.x;
        expect(gymMap.collisionGrid[idx], `NPC ${npc.id} must stand on collision 0`).toBe(0);
      }
    });

    it('verifies overworld sprite files exist on disk for all Gym NPCs', () => {
      const spriteFiles: Record<string, string> = {
        fat_man: 'npc_fat_man.png',
        boy: 'npc_boy.png',
        teacher: 'teacher.png',
      };

      for (const npc of gymNpcs) {
        const fileName = spriteFiles[npc.spriteType];
        expect(fileName, `Unknown sprite ${npc.spriteType} for ${npc.id}`).toBeDefined();
        const fullPath = path.join(spritesDir, fileName);
        expect(fs.existsSync(fullPath), `Sprite file ${fullPath} must exist on disk`).toBe(true);
      }
    });

    it('verifies Blackbelt Yoshi at (2, 12) facing RIGHT with vision 3 and Hitmonlee Lv. 27', () => {
      const yoshi = gymNpcs.find((n) => n.id === 'blackbelt_yoshi');
      expect(yoshi).toBeDefined();
      expect(yoshi?.x).toBe(2);
      expect(yoshi?.y).toBe(12);
      expect(yoshi?.direction).toBe('RIGHT');
      expect(yoshi?.visionRange).toBe(3);
      expect(yoshi?.action).toBe('TRAINER_BATTLE');
      expect(yoshi?.trainerTeam).toEqual([
        { speciesId: 'hitmonlee', level: 27, moves: ['doublekick', 'meditate', 'jumpkick', 'focusenergy'] },
      ]);
    });

    it('verifies Blackbelt Lao at (7, 12) facing LEFT with vision 3 and Hitmonchan Lv. 27', () => {
      const lao = gymNpcs.find((n) => n.id === 'blackbelt_lao');
      expect(lao).toBeDefined();
      expect(lao?.x).toBe(7);
      expect(lao?.y).toBe(12);
      expect(lao?.direction).toBe('LEFT');
      expect(lao?.visionRange).toBe(3);
      expect(lao?.action).toBe('TRAINER_BATTLE');
      expect(lao?.trainerTeam).toEqual([
        { speciesId: 'hitmonchan', level: 27, moves: ['cometpunch', 'thunderpunch', 'icepunch', 'firepunch'] },
      ]);
    });

    it('verifies Blackbelt Nob at (3, 9) facing RIGHT with vision 2 and Machop Lv. 25, Machoke Lv. 25', () => {
      const nob = gymNpcs.find((n) => n.id === 'blackbelt_nob');
      expect(nob).toBeDefined();
      expect(nob?.x).toBe(3);
      expect(nob?.y).toBe(9);
      expect(nob?.direction).toBe('RIGHT');
      expect(nob?.visionRange).toBe(2);
      expect(nob?.action).toBe('TRAINER_BATTLE');
      expect(nob?.trainerTeam).toEqual([
        { speciesId: 'machop', level: 25, moves: ['leer', 'focusenergy', 'karatechop', 'seismictoss'] },
        { speciesId: 'machoke', level: 25, moves: ['leer', 'karatechop', 'seismictoss', 'rockslide'] },
      ]);
    });

    it('verifies Blackbelt Lung at (5, 5) facing LEFT with vision 1 and Mankey Lv. 23 (x2), Primeape Lv. 25', () => {
      const lung = gymNpcs.find((n) => n.id === 'blackbelt_lung');
      expect(lung).toBeDefined();
      expect(lung?.x).toBe(5);
      expect(lung?.y).toBe(5);
      expect(lung?.direction).toBe('LEFT');
      expect(lung?.visionRange).toBe(1);
      expect(lung?.action).toBe('TRAINER_BATTLE');
      expect(lung?.trainerTeam).toEqual([
        { speciesId: 'mankey', level: 23, moves: ['scratch', 'leer', 'karatechop', 'focusenergy'] },
        { speciesId: 'mankey', level: 23, moves: ['scratch', 'leer', 'karatechop', 'focusenergy'] },
        { speciesId: 'primeape', level: 25, moves: ['karatechop', 'furyswipes', 'rage', 'seismictoss'] },
      ]);
    });

    it('verifies Gym Guide at (7, 14) offering advice on Fighting-type weaknesses', () => {
      const guide = gymNpcs.find((n) => n.id === 'cianwood_gym_guide');
      expect(guide).toBeDefined();
      expect(guide?.x).toBe(7);
      expect(guide?.y).toBe(14);
      expect(guide?.pages?.some((d) => d.includes('FLYING and PSYCHIC moves'))).toBe(true);
    });
  });

  describe('3. Leader Chuck Battle, Storm Badge & TM01 DynamicPunch', () => {
    const gymInteractions = getGymLeaderInteractions();
    const chuckHandler = gymInteractions.find((i) => i.actions?.includes('CHUCK_EVENT'))?.handler;

    it('verifies Leader Chuck configuration and dialogue', () => {
      const chuck = gymNpcs.find((n) => n.id === 'leader_chuck');
      expect(chuck).toBeDefined();
      expect(chuck?.x).toBe(4);
      expect(chuck?.y).toBe(2);
      expect(chuck?.action).toBe('CHUCK_EVENT');
      expect(chuck?.challengePages?.some((p) => p.includes('boulder') || p.includes('crush stones'))).toBe(true);
      expect(chuck?.trainerTeam).toEqual([
        { speciesId: 'primeape', level: 27, moves: ['leer', 'rage', 'karatechop', 'furyswipes'] },
        { speciesId: 'poliwrath', level: 30, moves: ['hypnosis', 'mindreader', 'surf', 'dynamicpunch'] },
      ]);
    });

    it('triggers Leader Chuck battle, awards Storm Badge and TM01 DynamicPunch upon victory', () => {
      expect(chuckHandler).toBeDefined();
      const chuckNpc = gymNpcs.find((n) => n.id === 'leader_chuck')!;

      let dialogueCalled = false;
      let postBattleDialogueCalled = false;
      let toastMessage = '';
      let gameSaved = false;
      let battleTriggered = false;
      let battleConfig: any = null;

      const mockCtx: any = {
        storyFlags: new Set<string>(),
        defeatedTrainers: new Set<string>(),
        inventory: { badges: [], tms: [] },
        audioManager: { playSfx: () => {} },
        buildTrainerTeamInstances: (npc: any) =>
          npc.trainerTeam.map((t: any) => PokemonFactory.create(t.speciesId, t.level, t.moves)),
        openDialogue: (pages: string[], _speaker?: string, callback?: () => void) => {
          if (!battleTriggered) {
            dialogueCalled = true;
            if (callback) callback();
          } else {
            postBattleDialogueCalled = true;
            if (callback) callback();
          }
        },
        triggerBattle: (_opponent: any, config: any) => {
          battleTriggered = true;
          battleConfig = config;
        },
        showToast: (msg: string) => {
          toastMessage = msg;
        },
        saveCurrentGame: () => {
          gameSaved = true;
        },
      };

      const result = chuckHandler!(chuckNpc, gymMap, mockCtx);
      expect(result).toBe(true);
      expect(dialogueCalled).toBe(true);
      expect(battleTriggered).toBe(true);
      expect(battleConfig.isGymLeader).toBe(true);
      expect(battleConfig.trainerName).toBe('Leader Chuck');
      expect(battleConfig.trainerTeam.length).toBe(2);

      // Simulate player victory
      battleConfig.onVictory();

      expect(mockCtx.storyFlags.has('chuck_defeated')).toBe(true);
      expect(mockCtx.defeatedTrainers.has('chuck')).toBe(true);
      expect(mockCtx.inventory.badges).toContain('storm');
      expect(mockCtx.inventory.tms).toContain('TM01');
      expect(postBattleDialogueCalled).toBe(true);
      expect(gameSaved).toBe(true);
      expect(toastMessage).toContain('Received STORM BADGE & TM01 DYNAMICPUNCH');
    });

    it('returns false if Chuck was already defeated', () => {
      const chuckNpc = gymNpcs.find((n) => n.id === 'leader_chuck')!;
      const mockCtx: any = {
        storyFlags: new Set<string>(['chuck_defeated']),
      };
      const result = chuckHandler!(chuckNpc, gymMap, mockCtx);
      expect(result).toBe(false);
    });
  });

  describe("4. Chuck's Wife HM02 Fly Progression Gate", () => {
    const serviceInteractions = getJohtoTownServiceInteractions();
    const chucksWifeHandler = serviceInteractions.find((i) => i.npcIds?.includes('chucks_wife'))?.handler;
    const chucksWifeNpc = cityNpcs.find((n) => n.id === 'chucks_wife')!;

    it("tells player to challenge Chuck if player does not have Storm Badge", () => {
      expect(chucksWifeHandler).toBeDefined();
      expect(chucksWifeNpc).toBeDefined();
      expect(chucksWifeNpc.x).toBe(10);
      expect(chucksWifeNpc.y).toBe(46);

      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(),
        inventory: { badges: [], tms: [] },
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = chucksWifeHandler!(chucksWifeNpc, cityMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('training inside the Gym! Defeat him to earn his respect!');
      expect(mockCtx.inventory.tms.includes('HM02')).toBe(false);
    });

    it("awards HM02 FLY when player holds Storm Badge", () => {
      let dialogueText = '';
      let toastMessage = '';
      let saved = false;

      const mockCtx: any = {
        storyFlags: new Set<string>(),
        inventory: { badges: ['storm'], tms: [] },
        audioManager: { playSfx: () => {} },
        openDialogue: (pages: string[], _speaker?: string, callback?: () => void) => {
          dialogueText = pages.join(' ');
          if (callback) callback();
        },
        showToast: (msg: string) => {
          toastMessage = msg;
        },
        saveCurrentGame: () => {
          saved = true;
        },
      };

      const res = chucksWifeHandler!(chucksWifeNpc, cityMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('Take this HM02 FLY!');
      expect(mockCtx.inventory.tms).toContain('HM02');
      expect(mockCtx.storyFlags.has('has_hm02_fly')).toBe(true);
      expect(mockCtx.storyFlags.has('EVENT_GOT_HM02_FLY')).toBe(true);
      expect(toastMessage).toContain('Received HM02 FLY');
      expect(saved).toBe(true);
    });

    it("gives reminder dialogue once HM02 FLY has already been acquired", () => {
      let dialogueText = '';
      const mockCtx: any = {
        storyFlags: new Set<string>(['chuck_defeated', 'has_hm02_fly', 'EVENT_GOT_HM02_FLY']),
        inventory: { badges: ['storm'], tms: ['HM02'] },
        openDialogue: (pages: string[]) => {
          dialogueText = pages.join(' ');
        },
      };

      const res = chucksWifeHandler!(chucksWifeNpc, cityMap, mockCtx);
      expect(res).toBe(true);
      expect(dialogueText).toContain('Use FLY to soar through the skies');
    });
  });
});
