import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { createGoldenrodBuildingsAndParkNpcs } from '../../src/world/npcs/goldenrodBuildingsAndParkNpcs';
import { createKantoVermilionNpcs } from '../../src/world/npcs/kantoVermilionNpcs';
import { createEcruteakToRoute39Npcs } from '../../src/world/npcs/ecruteakToRoute39Npcs';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { SuicuneAndBeastsCutscenes } from '../../src/world/SuicuneAndBeastsCutscenes';
import { StoryCutscenes, type StoryCutsceneContext } from '../../src/world/StoryCutscenes';
import { createDefaultNpcInteractionRouter } from '../../src/world/interactions';
import {
  handleTinTowerSage,
  handleWiseTrioSage,
  handleTinTowerEusine,
  getTinTowerHoOhInteractions,
} from '../../src/world/interactions/TinTowerHoOhInteractions';
import type { NpcInteractionContext } from '../../src/types/gameContext';

describe('Story Arc A: Eusine Quest, Multi-Stage Suicune Sightings & Wise Trio Trial', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  let mockContext: Partial<NpcInteractionContext>;
  let lastDialoguePages: string[] = [];
  let lastSpeaker: string | undefined;
  let savedGameCalled = false;
  let lastToastMessage = '';
  let triggeredBattleEnemy: any = null;
  let triggeredBattleOptions: any = null;

  beforeEach(() => {
    lastDialoguePages = [];
    lastSpeaker = undefined;
    savedGameCalled = false;
    lastToastMessage = '';
    triggeredBattleEnemy = null;
    triggeredBattleOptions = null;

    mockContext = {
      playerName: 'Gold',
      playerParty: [
        PokemonFactory.create('typhlosion', 50, ['flamethrower', 'thunderpunch', 'earthquake', 'quickattack']),
      ],
      player: {
        id: 'player',
        x: 9,
        y: 6,
        targetX: 9,
        targetY: 6,
        renderX: 9 * 64,
        renderY: 6 * 64,
        direction: 'UP',
        isMoving: false,
        progress: 0,
        isPlayer: true,
      } as any,
      getOppositeDirection: (dir: any) =>
        dir === 'UP' ? 'DOWN' : dir === 'DOWN' ? 'UP' : dir === 'LEFT' ? 'RIGHT' : 'LEFT',
      inventory: {
        money: 50000,
        badges: ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising'],
        items: [],
        keyItems: ['CLEAR BELL'],
        balls: { 'master-ball': 1, 'ultra-ball': 20 },
        tms: ['TM24'],
      },
      storyFlags: new Set<string>(['starter_chosen', 'has_clear_bell', 'beasts_awakened', 'sudowoodo_cleared']),
      defeatedTrainers: new Set<string>(),
      seenSpecies: new Set<string>(['raikou', 'entei', 'suicune']),
      caughtSpecies: new Set<string>(),
      playerBox: [],
      openDialogue: (pages: string[], speaker?: string, callback?: () => void) => {
        lastDialoguePages = pages;
        lastSpeaker = speaker;
        callback?.();
      },
      showToast: (msg: string) => {
        lastToastMessage = msg;
      },
      saveCurrentGame: () => {
        savedGameCalled = true;
      },
      audioManager: {
        playSfx: () => {},
        playBattleBgm: () => {},
        restoreOverworldBgm: () => {},
      } as any,
      mapManager: {
        getCurrentMap: () => ({ id: 'tin_tower_1f' } as any),
      } as any,
      missionManager: {
        checkStoryFlags: () => {},
        completeMission: () => {},
      } as any,
      triggerBattle: (enemy: any, options: any) => {
        triggeredBattleEnemy = enemy;
        triggeredBattleOptions = options;
      },
    };
  });

  describe('1. Map Walkability & Invariants', () => {
    it('verifies route_36_suicune is on a walkable tile (0) in route_36.json', () => {
      const npcs = createGoldenrodBuildingsAndParkNpcs().route_36 || [];
      const suicune = npcs.find((n) => n.id === 'route_36_suicune');
      expect(suicune).toBeDefined();

      const r36Map = JSON.parse(fs.readFileSync(path.join(mapsDir, 'route_36.json'), 'utf8'));
      const collision = r36Map.collisionGrid[suicune!.y * r36Map.width + suicune!.x];
      expect(collision).toBe(0);
    });

    it('verifies vermilion_port_suicune is on a walkable tile (0) in vermilion_port.json', () => {
      const npcs = createKantoVermilionNpcs().vermilion_port || [];
      const suicune = npcs.find((n) => n.id === 'vermilion_port_suicune');
      expect(suicune).toBeDefined();

      const portMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'vermilion_port.json'), 'utf8'));
      const collision = portMap.collisionGrid[suicune!.y * portMap.width + suicune!.x];
      expect(collision).toBe(0);
    });

    it('verifies all Tin Tower 1F NPCs (Wise Trio, Suicune, Eusine, Sage) stand on walkable tiles (0)', () => {
      const npcs = createEcruteakToRoute39Npcs().tin_tower_1f || [];
      const expectedIds = [
        'suicune_altar',
        'tin_tower_sage',
        'wise_trio_gaku',
        'wise_trio_masa',
        'wise_trio_koji',
        'tin_tower_eusine',
      ];

      for (const id of expectedIds) {
        const npc = npcs.find((n) => n.id === id);
        expect(npc, `NPC ${id} should exist in tin_tower_1f`).toBeDefined();
      }

      const tt1fMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'tin_tower_1f.json'), 'utf8'));
      for (const npc of npcs) {
        const col = tt1fMap.collisionGrid[npc.y * tt1fMap.width + npc.x];
        expect(col, `NPC ${npc.id} at (${npc.x}, ${npc.y}) must have collision 0`).toBe(0);
      }
    });
  });

  describe('2. Multi-Stage Suicune Sighting Lifecycles & Cutscenes', () => {
    it('asserts route_36_suicune lifecycle requires beasts_awakened and sudowoodo_cleared', () => {
      // 1. Not visible when beasts not awakened
      expect(
        isNpcActiveForStoryFlags('route_36_suicune', new Set(['sudowoodo_cleared']))
      ).toBe(false);

      // 2. Not visible when sudowoodo still blocking
      expect(
        isNpcActiveForStoryFlags('route_36_suicune', new Set(['beasts_awakened']))
      ).toBe(false);

      // 3. Visible when both conditions satisfied
      expect(
        isNpcActiveForStoryFlags('route_36_suicune', new Set(['beasts_awakened', 'sudowoodo_cleared']))
      ).toBe(true);

      // 4. Despawns once witnessed
      expect(
        isNpcActiveForStoryFlags(
          'route_36_suicune',
          new Set(['beasts_awakened', 'sudowoodo_cleared', 'EVENT_SAW_SUICUNE_ON_ROUTE_36'])
        )
      ).toBe(false);
    });

    it('triggers triggerRoute36Suicune cutscene and sets EVENT_SAW_SUICUNE_ON_ROUTE_36', () => {
      const cutsceneCtx: StoryCutsceneContext = {
        player: { x: 35, y: 10, isMoving: true } as any,
        setCutsceneLocked: () => {},
        overworldHUD: {
          openDialogue: (pages: string[], speaker?: string, cb?: () => void) => {
            lastDialoguePages = pages;
            lastSpeaker = speaker;
            cb?.();
          },
          showToast: (msg: string) => {
            lastToastMessage = msg;
          },
        } as any,
        storyFlags: new Set<string>(),
        saveCurrentGame: () => {
          savedGameCalled = true;
        },
        npcsByMap: {},
      } as any;

      StoryCutscenes.triggerRoute36Suicune(cutsceneCtx);
      expect(cutsceneCtx.storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_36')).toBe(true);
      expect(lastSpeaker).toContain('SUICUNE');
      expect(lastDialoguePages[0]).toContain('Route 36');
      expect(lastToastMessage).toContain('Route 36');
      expect(savedGameCalled).toBe(true);
    });

    it('triggers triggerVermilionPortSuicune cutscene and sets EVENT_SAW_SUICUNE_AT_VERMILION_PORT', () => {
      const cutsceneCtx: StoryCutsceneContext = {
        player: { x: 12, y: 11, isMoving: true } as any,
        setCutsceneLocked: () => {},
        overworldHUD: {
          openDialogue: (pages: string[], speaker?: string, cb?: () => void) => {
            lastDialoguePages = pages;
            lastSpeaker = speaker;
            cb?.();
          },
          showToast: (msg: string) => {
            lastToastMessage = msg;
          },
        } as any,
        storyFlags: new Set<string>(),
        saveCurrentGame: () => {
          savedGameCalled = true;
        },
        npcsByMap: {},
      } as any;

      StoryCutscenes.triggerVermilionPortSuicune(cutsceneCtx);
      expect(cutsceneCtx.storyFlags.has('EVENT_SAW_SUICUNE_AT_VERMILION_PORT')).toBe(true);
      expect(lastSpeaker).toContain('SUICUNE');
      expect(lastDialoguePages[0]).toContain('pier');
      expect(lastToastMessage).toContain('Vermilion Port');
      expect(savedGameCalled).toBe(true);
    });
  });

  describe("3. The Wise Trio's Trial in Tin Tower 1F", () => {
    it('initiates battle for Sage Gaku, Sage Masa, and Sage Koji', () => {
      const npcs = createEcruteakToRoute39Npcs().tin_tower_1f || [];
      const gaku = npcs.find((n) => n.id === 'wise_trio_gaku')!;
      const masa = npcs.find((n) => n.id === 'wise_trio_masa')!;
      const koji = npcs.find((n) => n.id === 'wise_trio_koji')!;

      expect(gaku.trainerTeam).toBeDefined();
      expect(gaku.trainerTeam!.length).toBe(2);
      expect(gaku.trainerTeam![0].speciesId).toBe('noctowl');
      expect(gaku.trainerTeam![1].speciesId).toBe('flareon');

      expect(masa.trainerTeam![1].speciesId).toBe('jolteon');
      expect(koji.trainerTeam![1].speciesId).toBe('vaporeon');

      // Test battling Gaku
      handleWiseTrioSage(gaku, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(triggeredBattleEnemy).toBeDefined();
      expect(triggeredBattleEnemy.speciesId).toBe('noctowl');
      expect(triggeredBattleOptions.isTrainer).toBe(true);

      // Simulate defeating Gaku
      triggeredBattleOptions.onVictory();
      expect(mockContext.defeatedTrainers?.has('wise_trio_gaku')).toBe(true);
      expect(mockContext.storyFlags?.has('wise_trio_cleared')).toBe(false);

      // Test battling Masa
      handleWiseTrioSage(masa, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      triggeredBattleOptions.onVictory();
      expect(mockContext.defeatedTrainers?.has('wise_trio_masa')).toBe(true);
      expect(mockContext.storyFlags?.has('wise_trio_cleared')).toBe(false);

      // Test battling Koji (3rd sage)
      handleWiseTrioSage(koji, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      triggeredBattleOptions.onVictory();
      expect(mockContext.defeatedTrainers?.has('wise_trio_koji')).toBe(true);

      // All 3 defeated -> clears Wise Trio trial!
      expect(mockContext.storyFlags?.has('wise_trio_cleared')).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_BEAT_WISE_TRIO')).toBe(true);
      expect(lastToastMessage).toContain('Cleared the Wise Trio Trial');
    });

    it('delivers authentic lore dialogues when speaking to defeated sages', () => {
      mockContext.defeatedTrainers?.add('wise_trio_gaku');
      mockContext.defeatedTrainers?.add('wise_trio_masa');
      mockContext.defeatedTrainers?.add('wise_trio_koji');
      mockContext.storyFlags?.add('wise_trio_cleared');

      const npcs = createEcruteakToRoute39Npcs().tin_tower_1f || [];
      const gaku = npcs.find((n) => n.id === 'wise_trio_gaku')!;
      const masa = npcs.find((n) => n.id === 'wise_trio_masa')!;
      const koji = npcs.find((n) => n.id === 'wise_trio_koji')!;

      handleWiseTrioSage(gaku, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages.some((p) => p.includes('Brass Tower'))).toBe(true);

      handleWiseTrioSage(masa, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages.some((p) => p.includes('RAIKOU'))).toBe(true);

      handleWiseTrioSage(koji, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages.some((p) => p.includes('northern winds'))).toBe(true);
    });
  });

  describe('4. Suicune Altar Battle & Eusine Recognition', () => {
    it('blocks Suicune challenge if Wise Trio has not been cleared', () => {
      const router = createDefaultNpcInteractionRouter();
      mockContext.storyFlags?.delete('wise_trio_cleared');
      mockContext.storyFlags?.delete('EVENT_BEAT_WISE_TRIO');

      const handled = router.dispatch(
        { id: 'suicune_altar', action: 'SUICUNE_TIN_TOWER_EVENT', speaker: '💎 SUICUNE' } as any,
        { id: 'tin_tower_1f' } as any,
        mockContext as NpcInteractionContext
      );

      expect(handled).toBe(true);
      expect(triggeredBattleEnemy).toBeNull();
      expect(lastDialoguePages.some((p) => p.includes('WISE TRIO must test your spirit'))).toBe(true);
    });

    it('triggers Suicune battle once Wise Trio is cleared and handles victory / Eusine cameo', () => {
      const router = createDefaultNpcInteractionRouter();
      mockContext.storyFlags?.add('wise_trio_cleared');
      mockContext.storyFlags?.add('EVENT_BEAT_WISE_TRIO');

      const handled = router.dispatch(
        { id: 'suicune_altar', action: 'SUICUNE_TIN_TOWER_EVENT', speaker: '💎 SUICUNE' } as any,
        { id: 'tin_tower_1f' } as any,
        mockContext as NpcInteractionContext
      );

      expect(handled).toBe(true);
      expect(triggeredBattleEnemy).toBeDefined();
      expect(triggeredBattleEnemy.speciesId).toBe('suicune');
      expect(triggeredBattleEnemy.level).toBe(40);

      // Simulate capturing Suicune
      triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER', caught: true });
      expect(mockContext.storyFlags?.has('suicune_caught_or_defeated')).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_FOUGHT_SUICUNE')).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_CAUGHT_SUICUNE')).toBe(true);

      // Eusine cameo becomes active once Suicune is caught/defeated
      expect(
        isNpcActiveForStoryFlags('tin_tower_eusine', mockContext.storyFlags!)
      ).toBe(true);

      // Speak with Eusine in Tin Tower 1F
      const eusineNpc = (createEcruteakToRoute39Npcs().tin_tower_1f || []).find(
        (n) => n.id === 'tin_tower_eusine'
      )!;
      handleTinTowerEusine(eusineNpc, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(lastDialoguePages.some((p) => p.includes('SUICUNE chose you'))).toBe(true);
    });
  });

  describe('5. Tower Sage Rainbow Wing Mastery Recognition', () => {
    it('awards Rainbow Wing when player has proven mastery over all 3 legendary beasts', () => {
      // Player caught Suicune, Raikou, and Entei
      mockContext.storyFlags?.add('suicune_caught_or_defeated');
      mockContext.storyFlags?.add('caught_raikou');
      mockContext.storyFlags?.add('caught_entei');
      mockContext.storyFlags?.delete('has_rainbow_wing');

      const sageNpc = (createEcruteakToRoute39Npcs().tin_tower_1f || []).find(
        (n) => n.id === 'tin_tower_sage'
      )!;

      const handled = handleTinTowerSage(sageNpc, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(handled).toBe(true);
      expect(mockContext.storyFlags?.has('has_rainbow_wing')).toBe(true);
      expect(mockContext.storyFlags?.has('EVENT_GOT_RAINBOW_WING')).toBe(true);
      expect(mockContext.inventory?.keyItems).toContain('RAINBOW WING');
      expect(lastDialoguePages.some((p) => p.includes('received the RAINBOW WING'))).toBe(true);
      expect(lastToastMessage).toContain('Rainbow Wing');
    });

    it('Wise Trio sages award the Rainbow Wing only after the trial AND all 3 beasts; never twice', () => {
      const sages = createEcruteakToRoute39Npcs().tin_tower_1f || [];
      const koji = sages.find((n) => n.id === 'wise_trio_koji')!;
      const map = { id: 'tin_tower_1f' } as any;
      for (const id of ['wise_trio_gaku', 'wise_trio_masa', 'wise_trio_koji']) mockContext.defeatedTrainers?.add(id);
      mockContext.storyFlags?.delete('has_rainbow_wing');
      mockContext.storyFlags?.delete('beasts_mastered');

      // Trial not flagged cleared yet -> lore only, no wing
      handleWiseTrioSage(koji, map, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags?.has('has_rainbow_wing')).toBe(false);

      // Trial cleared but beasts not mastered -> still no wing
      mockContext.storyFlags?.add('wise_trio_cleared');
      handleWiseTrioSage(koji, map, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags?.has('has_rainbow_wing')).toBe(false);

      // Trial cleared + Suicune, Raikou and Entei mastered -> the Wise Trio bestow the Rainbow Wing
      mockContext.storyFlags?.add('suicune_caught_or_defeated');
      mockContext.storyFlags?.add('caught_raikou');
      mockContext.storyFlags?.add('caught_entei');
      handleWiseTrioSage(koji, map, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags?.has('has_rainbow_wing')).toBe(true);
      expect(mockContext.inventory?.keyItems).toContain('RAINBOW WING');
      expect(lastDialoguePages.some((p) => p.includes('received the RAINBOW WING'))).toBe(true);

      // Spamming A again only repeats lore (single award)
      const count = (mockContext.inventory?.keyItems || []).filter((k: string) => k === 'RAINBOW WING').length;
      handleWiseTrioSage(koji, map, mockContext as NpcInteractionContext);
      expect((mockContext.inventory?.keyItems || []).filter((k: string) => k === 'RAINBOW WING').length).toBe(count);
      expect(lastDialoguePages.some((p) => p.includes('received the RAINBOW WING'))).toBe(false);
    });

    it('unblocks the sacred staircase when player possesses both Clear Bell and Rainbow Wing', () => {
      mockContext.storyFlags?.add('has_clear_bell');
      mockContext.storyFlags?.add('has_rainbow_wing');

      const sageNpc = (createEcruteakToRoute39Npcs().tin_tower_1f || []).find(
        (n) => n.id === 'tin_tower_sage'
      )!;

      handleTinTowerSage(sageNpc, { id: 'tin_tower_1f' } as any, mockContext as NpcInteractionContext);
      expect(mockContext.storyFlags?.has('EVENT_TIN_TOWER_SAGE_UNBLOCKED')).toBe(true);
      expect(lastDialoguePages.some((p) => p.includes('sacred staircase to the upper heights is open'))).toBe(true);
    });

    it('router correctly dispatches Wise Trio and Tin Tower Eusine events', () => {
      const router = createDefaultNpcInteractionRouter();

      const wiseTrioHandled = router.dispatch(
        { id: 'wise_trio_gaku', action: 'WISE_TRIO_SAGE_EVENT', speaker: '🏮 SAGE GAKU' } as any,
        { id: 'tin_tower_1f' } as any,
        mockContext as NpcInteractionContext
      );
      expect(wiseTrioHandled).toBe(true);

      const eusineHandled = router.dispatch(
        { id: 'tin_tower_eusine', action: 'TIN_TOWER_EUSINE_EVENT', speaker: '🎩 EUSINE' } as any,
        { id: 'tin_tower_1f' } as any,
        mockContext as NpcInteractionContext
      );
      expect(eusineHandled).toBe(true);
    });
  });
});
