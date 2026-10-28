import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import {
  getMahoganyGymInteractions,
  handlePryceBossBattle,
  handleMahoganyGymGuide,
  handleMahoganyGymStatue,
} from '../../src/world/interactions/MahoganyGymInteractions';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import { EAST_JOHTO_GENERATED_NPCS } from '../../src/world/generated-npcs/eastJohtoGeneratedNpcs';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { ModernHMHandler } from '../../src/world/ModernHMHandler';
import { MAP_BGM_TABLE } from '../../src/audio/mapBgmTable';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('TICKET-BATTLE-MAHOGANY-GYM-PRYCE-01: Mahogany Gym, Ice Floor & Leader Pryce', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let triggeredBattleEnemy: any = null;
  let triggeredBattleOptions: any = null;
  let completedMissionId: string | null = null;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    triggeredBattleEnemy = null;
    triggeredBattleOptions = null;
    completedMissionId = null;

    mockContext = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('typhlosion', 40, ['flamethrower', 'swift', 'quickattack', 'smokescreen'])],
      player: {
        id: 'player',
        x: 5,
        y: 5,
        targetX: 5,
        targetY: 5,
        renderX: 5 * 64,
        renderY: 5 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 20000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral'],
        items: {},
        balls: {},
        tms: ['hm06'],
        keyItems: [],
      },
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      openDialogue: (pages, speaker, onComplete) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        if (onComplete) onComplete();
      },
      showToast: () => {},
      saveCurrentGame: () => {},
      triggerBattle: (enemy, opts) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = opts;
      },
      audioManager: {
        playSfx: () => {},
      } as any,
      missionManager: {
        checkStoryFlags: () => {},
        completeMission: (mId: string) => {
          completedMissionId = mId;
        },
      } as any,
      buildTrainerTeamInstances: (npc: any) => {
        if (!npc.trainerTeam) return [];
        return npc.trainerTeam.map((t: any) => PokemonFactory.create(t.speciesId, t.level, t.moves));
      },
    };
  });

  describe('1. Map Schema & Ice Floor Walkability Audit', () => {
    it('asserts mahogany_gym.json exists with valid 10x18 geometry and 180 tiles', () => {
      const gymPath = path.join(mapsDir, 'mahogany_gym.json');
      expect(fs.existsSync(gymPath), 'mahogany_gym.json must exist').toBe(true);

      const gymData: MapData = JSON.parse(fs.readFileSync(gymPath, 'utf8'));
      expect(gymData.id).toBe('mahogany_gym');
      expect(gymData.width).toBe(10);
      expect(gymData.height).toBe(18);
      expect(gymData.collisionGrid.length).toBe(180);
      expect(gymData.tileMap).toBeDefined();
      expect(gymData.tileMap!.length).toBe(180);
    });

    it('asserts all 102 ice floor tiles are walkable (collision 0)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      let iceCount = 0;

      gymData.tileMap!.forEach((tile, idx) => {
        if (tile === 'in_elite_four_room_05_06_15_16') {
          iceCount++;
          expect(gymData.collisionGrid[idx], `Ice tile at index ${idx} must be walkable (0)`).toBe(0);
        }
      });

      expect(iceCount).toBe(102);
    });

    it('asserts dais platforms and entrance carpet tiles are walkable (collision 0)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));

      gymData.tileMap!.forEach((tile, idx) => {
        if (tile === 'in_elite_four_room_28_28_28_28' || tile === 'in_elite_four_room_04_04_14_14') {
          expect(gymData.collisionGrid[idx], `Platform/carpet tile at ${idx} must be walkable (0)`).toBe(0);
        }
      });
    });

    it('asserts perimeter walls are solid obstacles (collision 1)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));

      gymData.tileMap!.forEach((tile, idx) => {
        if (tile === 'in_elite_four_room_50_50_24_24' || tile === 'in_elite_four_room_2a_2b_3a_3b') {
          expect(gymData.collisionGrid[idx], `Wall tile at ${idx} must be solid (1)`).toBe(1);
        }
      });
    });
  });

  describe('2. Reciprocal Warps Network', () => {
    it('asserts entrance warps at (4, 17) and (5, 17) connect to mahogany_town (6, 14)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      expect(gymData.warps).toHaveLength(2);

      const warp1 = gymData.warps.find((w) => w.x === 4 && w.y === 17);
      expect(warp1).toBeDefined();
      expect(warp1).toEqual({ x: 4, y: 17, targetMapId: 'mahogany_town', targetX: 6, targetY: 14 });

      const warp2 = gymData.warps.find((w) => w.x === 5 && w.y === 17);
      expect(warp2).toBeDefined();
      expect(warp2).toEqual({ x: 5, y: 17, targetMapId: 'mahogany_town', targetX: 6, targetY: 14 });
    });

    it('asserts mahogany_town contains reciprocal warp leading into mahogany_gym (4, 17)', () => {
      const townData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_town.json'), 'utf8'));
      const gymWarp = townData.warps.find((w) => w.targetMapId === 'mahogany_gym');
      expect(gymWarp).toBeDefined();
      expect(gymWarp).toEqual({ x: 6, y: 13, targetMapId: 'mahogany_gym', targetX: 4, targetY: 17 });
    });
  });

  describe('3. Gym Statues bgEvents & Interaction Verification', () => {
    it('asserts bgEvents catalog contains statues at (3, 15) and (6, 15)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      expect(gymData.bgEvents).toBeDefined();
      expect(gymData.bgEvents!.length).toBeGreaterThanOrEqual(2);

      const statueLeft = gymData.bgEvents!.find((b) => b.x === 3 && b.y === 15);
      expect(statueLeft).toBeDefined();
      expect(statueLeft!.action).toBe('MAHOGANY_GYM_STATUE');

      const statueRight = gymData.bgEvents!.find((b) => b.x === 6 && b.y === 15);
      expect(statueRight).toBeDefined();
      expect(statueRight!.action).toBe('MAHOGANY_GYM_STATUE');
    });

    it('displays Silver as sole winning trainer on statue before Pryce is defeated', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const handled = handleMahoganyGymStatue(null, gymData, mockContext as NpcInteractionContext);

      expect(handled).toBe(true);
      expect(lastSpeaker).toBe('🏛️ MAHOGANY GYM STATUE');
      expect(lastDialoguePages[0]).toContain('LEADER: PRYCE');
      expect(lastDialoguePages[0]).toContain('WINNING TRAINERS: SILVER');
      expect(lastDialoguePages[0]).not.toContain('GOLD');
    });

    it('dynamically displays player name alongside Silver after Pryce defeat', () => {
      mockContext.storyFlags!.add('pryce_defeated');
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const handled = handleMahoganyGymStatue(null, gymData, mockContext as NpcInteractionContext);

      expect(handled).toBe(true);
      expect(lastDialoguePages[0]).toContain('WINNING TRAINERS: SILVER, GOLD');
    });
  });

  describe('4. Gym Guide Tactical Advice & Post-Victory Banter', () => {
    it('offers ice advice and ice-sliding caution before Pryce is defeated', () => {
      const handled = handleMahoganyGymGuide(null, null, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastSpeaker).toBe('🏆 GYM GUIDE');
      expect(lastDialoguePages[0]).toContain('Yo! Champ in the making!');
      expect(lastDialoguePages[0]).toContain('PRYCE, a venerable veteran');
      expect(lastDialoguePages[1]).toContain('ICE-type POKéMON');
      expect(lastDialoguePages[2]).toContain('FIRE');
      expect(lastDialoguePages[3]).toContain('ice floor');
    });

    it('congratulates player on melting Pryce cold exterior after victory', () => {
      mockContext.storyFlags!.add('pryce_defeated');
      const handled = handleMahoganyGymGuide(null, null, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastDialoguePages[0]).toContain('You melted PRYCE\'s cold exterior with pure passion!');
      expect(lastDialoguePages[1]).toContain('Bridging the generation gap');
    });
  });

  describe('5. 5 Canonical Gym Trainers Dataset & Placement', () => {
    const gymNpcs = EAST_JOHTO_GENERATED_NPCS.mahogany_gym;

    it('asserts all 5 canonical gym trainers exist in mahogany_gym NPC dataset', () => {
      expect(gymNpcs).toBeDefined();

      const roxanne = gymNpcs.find((n) => n.id === 'mahogany_gym_beauty_1');
      expect(roxanne).toBeDefined();
      expect(roxanne!.trainerId).toBe('mahogany_gym_roxanne');
      expect(roxanne!.x).toBe(4);
      expect(roxanne!.y).toBe(7);

      const ronald = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_2');
      expect(ronald).toBeDefined();
      expect(ronald!.trainerId).toBe('mahogany_gym_ronald');
      expect(ronald!.x).toBe(0);
      expect(ronald!.y).toBe(16);

      const clarissa = gymNpcs.find((n) => n.id === 'mahogany_gym_beauty_3');
      expect(clarissa).toBeDefined();
      expect(clarissa!.trainerId).toBe('mahogany_gym_clarissa');
      expect(clarissa!.x).toBe(9);
      expect(clarissa!.y).toBe(16);

      const brad = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_4');
      expect(brad).toBeDefined();
      expect(brad!.trainerId).toBe('mahogany_gym_brad');
      expect(brad!.x).toBe(5);
      expect(brad!.y).toBe(10);

      const douglas = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_5');
      expect(douglas).toBeDefined();
      expect(douglas!.trainerId).toBe('mahogany_gym_douglas');
      expect(douglas!.x).toBe(3);
      expect(douglas!.y).toBe(4);
    });

    it('asserts all 5 trainers stand on walkable tiles (collision 0)', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const trainerPositions = [
        { id: 'roxanne', x: 4, y: 7 },
        { id: 'ronald', x: 0, y: 16 },
        { id: 'clarissa', x: 9, y: 16 },
        { id: 'brad', x: 5, y: 10 },
        { id: 'douglas', x: 3, y: 4 },
      ];

      for (const t of trainerPositions) {
        const col = gymData.collisionGrid[t.y * gymData.width + t.x];
        expect(col, `Trainer ${t.id} at (${t.x}, ${t.y}) must be on collision 0`).toBe(0);
      }
    });

    it('asserts canonical teams for Roxanne, Ronald, Clarissa, Brad, and Douglas', () => {
      const roxanne = gymNpcs.find((n) => n.id === 'mahogany_gym_beauty_1');
      expect(roxanne!.team![0].speciesId).toBe('jynx');
      expect(roxanne!.team![0].level).toBe(28);

      const ronald = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_2');
      expect(ronald!.team!).toHaveLength(3);
      expect(ronald!.team![0].speciesId).toBe('seel');
      expect(ronald!.team![1].speciesId).toBe('dewgong');

      const clarissa = gymNpcs.find((n) => n.id === 'mahogany_gym_beauty_3');
      expect(clarissa!.team![0].speciesId).toBe('dewgong');
      expect(clarissa!.team![0].level).toBe(28);

      const brad = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_4');
      expect(brad!.team!).toHaveLength(2);
      expect(brad!.team![0].speciesId).toBe('swinub');

      const douglas = gymNpcs.find((n) => n.id === 'mahogany_gym_rocker_5');
      expect(douglas!.team!).toHaveLength(3);
      expect(douglas!.team![0].speciesId).toBe('shellder');
      expect(douglas!.team![1].speciesId).toBe('cloyster');
    });
  });

  describe('6. Leader Pryce Boss Battle, Glacier Badge & TM16 Icy Wind', () => {
    it('asserts Leader Pryce NPC is positioned at (5, 4) on dais platform', () => {
      const pryceNpc = EAST_JOHTO_GENERATED_NPCS.mahogany_gym.find((n) => n.id === 'mahogany_gym_pryce_0');
      expect(pryceNpc).toBeDefined();
      expect(pryceNpc!.x).toBe(5);
      expect(pryceNpc!.y).toBe(4);
      expect(pryceNpc!.dir).toBe('DOWN');
      expect(pryceNpc!.action).toBe('PRYCE_EVENT');
    });

    it('triggers Leader Pryce 3-mon battle with Seel, Dewgong, and Piloswine', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const pryceNpc = EAST_JOHTO_GENERATED_NPCS.mahogany_gym.find((n) => n.id === 'mahogany_gym_pryce_0');

      const handled = handlePryceBossBattle(pryceNpc as any, gymData, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(triggeredBattleEnemy).not.toBeNull();
      expect(triggeredBattleOptions).toBeDefined();
      expect(triggeredBattleOptions.isTrainer).toBe(true);
      expect(triggeredBattleOptions.isGymLeader).toBe(true);
      expect(triggeredBattleOptions.trainerName).toBe('Leader Pryce');

      const team = triggeredBattleOptions.trainerTeam;
      expect(team).toHaveLength(3);
      expect(team[0].speciesId).toBe('seel');
      expect(team[0].level).toBe(27);
      expect(team[1].speciesId).toBe('dewgong');
      expect(team[1].level).toBe(29);
      expect(team[2].speciesId).toBe('piloswine');
      expect(team[2].level).toBe(31);

      const piloswineMoves = team[2].moves.map((m: any) => m.moveId);
      expect(piloswineMoves).toContain('blizzard');
      expect(piloswineMoves).toContain('icywind');
    });

    it('awards Glacier Badge, TM16 Icy Wind, sets story flags, and completes M08 upon victory', () => {
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const pryceNpc = EAST_JOHTO_GENERATED_NPCS.mahogany_gym.find((n) => n.id === 'mahogany_gym_pryce_0');

      handlePryceBossBattle(pryceNpc as any, gymData, mockContext as NpcInteractionContext);
      expect(triggeredBattleOptions).toBeDefined();

      // Trigger victory callback
      triggeredBattleOptions.onVictory();

      expect(mockContext.storyFlags!.has('pryce_defeated')).toBe(true);
      expect(mockContext.storyFlags!.has('has_glacier_badge')).toBe(true);
      expect(mockContext.storyFlags!.has('has_tm16_icy_wind')).toBe(true);
      expect(mockContext.defeatedTrainers!.has('pryce')).toBe(true);
      expect(mockContext.inventory!.badges).toContain('glacier');
      expect(mockContext.inventory!.tms).toContain('TM16');
      expect(completedMissionId).toBe('M08');

      expect(lastDialoguePages.some((p) => p.includes('Take the GLACIERBADGE!'))).toBe(true);
      expect(lastDialoguePages.some((p) => p.includes('Obtained TM16 ICY WIND!'))).toBe(true);
      expect(lastDialoguePages.some((p) => p.includes('enables your POKéMON to use WHIRLPOOL'))).toBe(true);
    });

    it('displays veteran wisdom without re-triggering battle after defeat', () => {
      mockContext.storyFlags!.add('pryce_defeated');
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));
      const pryceNpc = EAST_JOHTO_GENERATED_NPCS.mahogany_gym.find((n) => n.id === 'mahogany_gym_pryce_0');

      const handled = handlePryceBossBattle(pryceNpc as any, gymData, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(lastDialoguePages[0]).toContain("POKéMON and humans both grow stronger as they endure life's bitter cold.");
      expect(triggeredBattleEnemy).toBeNull();
    });
  });

  describe('7. Overworld HM06 Whirlpool Authorization Lifecycle', () => {
    it('authorizes HM06 Whirlpool field usage after receiving Glacier Badge', () => {
      mockContext.inventory!.badges = ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral']; // No glacier
      mockContext.inventory!.tms = ['hm06'];
      mockContext.playerParty = [PokemonFactory.create('feraligatr', 40, ['surf', 'whirlpool', 'bite'])];

      const checkBefore = ModernHMHandler.canUseWhirlpool(
        mockContext.playerParty,
        mockContext.inventory!,
        mockContext.storyFlags!
      );
      expect(checkBefore.canUse).toBe(false);
      expect(checkBefore.missingReason).toContain('GLACIER BADGE');

      // Add Glacier Badge
      mockContext.inventory!.badges.push('glacier');
      mockContext.storyFlags!.add('pryce_defeated');
      mockContext.storyFlags!.add('has_glacier_badge');

      const checkAfter = ModernHMHandler.canUseWhirlpool(
        mockContext.playerParty,
        mockContext.inventory!,
        mockContext.storyFlags!
      );
      expect(checkAfter.canUse).toBe(true);
    });
  });

  describe('8. Router Registration & Audio BGM Table Audit', () => {
    it('dispatches PRYCE_EVENT, MAHOGANY_GYM_GUIDE, and MAHOGANY_GYM_STATUE via NpcInteractionRouter', () => {
      const router = createDefaultNpcInteractionRouter();
      const gymData: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_gym.json'), 'utf8'));

      const pryceDispatched = router.dispatch(
        { id: 'mahogany_gym_pryce_0', action: 'PRYCE_EVENT', isMoving: false, direction: 'DOWN' } as any,
        gymData,
        mockContext as NpcInteractionContext
      );
      expect(pryceDispatched).toBe(true);

      const guideDispatched = router.dispatch(
        { id: 'mahogany_gym_gym_guide_6', isMoving: false, direction: 'DOWN' } as any,
        gymData,
        mockContext as NpcInteractionContext
      );
      expect(guideDispatched).toBe(true);

      const statueDispatched = router.dispatch(
        { id: 'mahogany_gym_statue_left', action: 'MAHOGANY_GYM_STATUE', isMoving: false, direction: 'DOWN' } as any,
        gymData,
        mockContext as NpcInteractionContext
      );
      expect(statueDispatched).toBe(true);
    });

    it('verifies mahogany_gym is mapped to bgm_gym in MAP_BGM_TABLE', () => {
      expect(MAP_BGM_TABLE.mahogany_gym).toBe('bgm_gym');
    });
  });
});
