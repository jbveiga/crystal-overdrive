import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { OverworldTickerCoordinator } from '../../src/world/OverworldTickerCoordinator';
import { StoryCutscenes } from '../../src/world/StoryCutscenes';
import { TrackedStoryFlagSet, ActiveNpcCache } from '../../src/world/ActiveNpcCache';
import { FieldObstacleDispatcher } from '../../src/world/interactions/FieldObstacleDispatcher';
import { BattleMoveMenuAndForgetModal } from '../../src/ui/battle/BattleMoveMenuAndForgetModal';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import type { GridEntity } from '../../src/world/GridPhysics';

describe('GitHub Issues #53, #54, #55, #56, and #57 Regression Suite', () => {
  describe('Issue #57: Azalea Town (4, 10) -> Ilex Forest Rival Ambush & Freeze Fix', () => {
    it('wires triggerAzaleaRivalAmbush into cachedTickerContext in src/main.ts', () => {
      const mainSource = fs.readFileSync(path.resolve(__dirname, '../../src/main.ts'), 'utf-8');
      const tickerMatch = mainSource.match(/const cachedTickerContext[\s\S]*?=\s*\{([\s\S]*?)\};/);
      expect(tickerMatch).not.toBeNull();
      expect(tickerMatch![1]).toContain('triggerAzaleaRivalAmbush');
      expect(tickerMatch![1]).toContain('buildTrainerTeamInstances');
      expect(tickerMatch![1]).toContain('npcsByMap');
    });

    it('triggers Azalea Rival Ambush at azalea_town (4, 10) facing LEFT without freezing the ticker', () => {
      const storyFlags = new TrackedStoryFlagSet(['slowpoke_well_cleared', 'bugsy_defeated']);
      let cutsceneLocked = false;
      const npcsByMap: Record<string, GridEntity[]> = { azalea_town: [] };
      const activeNpcCache = new ActiveNpcCache();

      const player: GridEntity = {
        id: 'player',
        x: 5,
        y: 10,
        gridX: 5,
        gridY: 10,
        targetX: 4,
        targetY: 10,
        renderX: 4.9,
        renderY: 10,
        direction: 'LEFT',
        isMoving: true,
        isJumping: false,
        progress: 0.95,
        isPlayer: true,
      };

      const openedDialogues: { pages: string[]; speaker?: string }[] = [];
      const triggerAzaleaRivalAmbush = vi.fn(() => {
        StoryCutscenes.triggerAzaleaRivalAmbush({
          player,
          storyFlags,
          defeatedTrainers: new Set(),
          playerParty: [PokemonFactory.create('quilava', 18)],
          rivalName: 'SILVER',
          playerName: 'GOLD',
          audioManager: { playBattleBgm: vi.fn() } as any,
          overworldRenderer: {} as any,
          overworldHUD: {
            openDialogue: (pages: string[], speaker?: string) => {
              openedDialogues.push({ pages, speaker });
            },
            showToast: vi.fn(),
          } as any,
          npcsByMap,
          gameClock: { playerSpeed: 1, battleSpeed: 1 },
          mapManager: {} as any,
          roamingManager: {} as any,
          triggerBattle: vi.fn(),
          buildTrainerTeamInstances: vi.fn(() => []),
          handleTrainerDefeatRewards: vi.fn(),
          saveCurrentGame: vi.fn(),
          setCutsceneLocked: (locked: boolean) => {
            cutsceneLocked = locked;
          },
        });
      });

      const currentMap = {
        id: 'azalea_town',
        name: 'Azalea Town',
        width: 20,
        height: 18,
        collisionGrid: new Array(20 * 18).fill(0),
        warps: [],
      };

      const ctx: any = {
        getGameState: () => 'OVERWORLD',
        isCutsceneLocked: () => cutsceneLocked,
        isDialogueOpen: () => openedDialogues.length > 0,
        isMenuOpen: () => false,
        isAnyModalOpen: () => false,
        player,
        mapManager: {
          getCurrentMap: () => currentMap,
          isCurrentMapOutdoor: () => true,
          isWalkable: () => true,
          getTileType: () => 0,
          checkWarp: () => null,
          decrementRepelStep: () => ({ active: false, remaining: 0, expiredJustNow: false }),
          rollWildEncounter: () => null,
        },
        overworldItemManager: {
          isSolidObstacle: () => false,
        },
        gameClock: {
          tick: (dt: number) => ({ dtWorld: dt, dtPlayer: dt }),
          getTimeOfDay: () => 'DAY',
        },
        storyFlags,
        visitedMaps: new Set(['azalea_town']),
        roamingManager: {
          getActiveRoamerOnRoute: () => undefined,
        },
        missionManager: {},
        itemfinderHUD: { isActive: () => false },
        overworldHUD: {
          consumePendingTouchTurnDirection: () => null,
          setPlayerDirection: vi.fn(),
          getHeldDirection: () => 'LEFT',
          isDialogueOpen: () => openedDialogues.length > 0,
          openDialogue: vi.fn(),
          showToast: vi.fn(),
        },
        audioManager: {},
        overworldRenderer: {
          updateAmbientLighting: vi.fn(),
          update: vi.fn(),
        },
        getActiveMapNpcs: (id: string) =>
          activeNpcCache.getActiveNpcs(id, npcsByMap[id], storyFlags, () => true),
        populateWorldNpcs: () =>
          activeNpcCache.getActiveNpcs('azalea_town', npcsByMap.azalea_town, storyFlags, () => true),
        handleMapTransition: vi.fn(),
        executeWarpTransition: vi.fn(),
        runTrainerSightSequence: vi.fn(),
        triggerSlowpokeWellGruntIntercept: vi.fn(),
        triggerBeastsAwakeningCutscene: vi.fn(),
        triggerBurnedTowerRivalBattle: vi.fn(),
        triggerCherrygroveRivalAmbush: vi.fn(),
        triggerAzaleaRivalAmbush,
        saveCurrentGame: vi.fn(),
        triggerWildEncounter: vi.fn(),
        addPlayTimeDelta: vi.fn(),
        isSurfEnabled: () => false,
        dayCareManager: { onStepTaken: vi.fn() },
        playerParty: [PokemonFactory.create('quilava', 18)],
        seenSpecies: new Set(['quilava']),
        defeatedTrainers: new Set(),
        inventory: { items: {}, keyItems: [], balls: {}, tms: [], berries: {}, money: 1000, badges: ['zephyr', 'hive'] },
      };

      // Prime cache before stepping onto (4, 10)
      expect(ctx.getActiveMapNpcs('azalea_town')).toHaveLength(0);

      // Step completes onto (4, 10)
      expect(() => OverworldTickerCoordinator.updateOverworldTick(0.05, ctx)).not.toThrow();
      expect(player.x).toBe(4);
      expect(player.y).toBe(10);
      expect(player.isMoving).toBe(false);
      expect(player.progress).toBe(0);
      expect(triggerAzaleaRivalAmbush).toHaveBeenCalledTimes(1);
      expect(cutsceneLocked).toBe(true);
      expect(openedDialogues).toHaveLength(1);
      expect(openedDialogues[0].pages[0]).toContain('TEAM ROCKET');

      // ActiveNpcCache immediately includes the spawned cutscene rival NPC
      expect(ctx.getActiveMapNpcs('azalea_town').some((n: GridEntity) => n.id === 'azalea_rival_cutscene')).toBe(true);
    });
  });

  describe('Issue #55: Ruins of Alph Outside (16, 9) Facing UP Sign at (16, 8)', () => {
    it('includes the Mystery Stone Panel Chamber sign at (16, 8) in ruins_of_alph_outside.json and FieldObstacleDispatcher', () => {
      const mapJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../public/assets/data/maps/ruins_of_alph_outside.json'), 'utf-8')
      );
      const signAt16_8 = mapJson.bgEvents.find((e: any) => e.x === 16 && e.y === 8);
      expect(signAt16_8).toBeDefined();
      expect(signAt16_8.pages[0]).toContain('MYSTERY STONE PANEL CHAMBER');

      const opened: { pages: string[]; speaker?: string }[] = [];
      const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(
        {
          mapManager: {
            checkBgEvent: (x: number, y: number) => mapJson.bgEvents.find((e: any) => e.x === x && e.y === y),
          },
          openDialogue: (pages: string[], speaker?: string) => opened.push({ pages, speaker }),
        } as any,
        mapJson,
        16,
        8
      );
      expect(handled).toBe(true);
      expect(opened).toHaveLength(1);
      expect(opened[0].pages[0]).toContain('MYSTERY STONE PANEL CHAMBER');
    });
  });

  describe('Issue #54: Remove #interact-btn from OverworldHUD', () => {
    it('does not include #interact-btn in OverworldHUD template', () => {
      const hudSource = fs.readFileSync(path.resolve(__dirname, '../../src/ui/OverworldHUD.ts'), 'utf-8');
      expect(hudSource).not.toContain('id="interact-btn"');
      expect(hudSource).toContain('id="desktop-controls-bar"');
    });
  });

  describe('Issue #53: Prevent Playing Moves with 0 PP in Battle', () => {
    it('blocks selecting a move with 0 PP when another move has PP > 0, and uses Struggle when all moves have 0 PP', () => {
      const playerPokemon = PokemonFactory.create('quilava', 18, ['ember', 'tackle']);
      playerPokemon.moves[0].currentPp = 0; // ember has 0 PP
      playerPokemon.moves[1].currentPp = 10; // tackle has 10 PP
      const enemyPokemon = PokemonFactory.create('zubat', 14, ['bite']);

      const selectedMoves: string[] = [];
      const mockTooltip = { innerHTML: '' };
      const fightMenu: any = {
        style: { display: 'grid' },
        innerHTML: '',
        appendChild: vi.fn(),
        querySelector: (sel: string) => (sel === '#battle-move-tooltip' ? mockTooltip : null),
      };

      const ctx: any = {
        fightMenu,
        messageBox: { style: { display: 'none' } },
        actionMenu: { style: { display: 'none' } },
        bagMenu: { style: { display: 'none' } },
        partyMenu: { style: { display: 'none' } },
        modalContainer: {},
        isDoubleBattleMode: false,
        activeCommandSlot: 0,
        setActiveCommandSlot: vi.fn(),
        pendingSlot1MoveId: null,
        setPendingSlot1MoveId: vi.fn(),
        selectedSlot1Target: 0,
        setSelectedSlot1Target: vi.fn(),
        selectedSlot2Target: 0,
        setSelectedSlot2Target: vi.fn(),
        playerPokemon,
        enemyPokemon,
        getOrderingCombatant: () => playerPokemon,
        callbacks: {
          onMoveSelected: (moveId: string) => selectedMoves.push(moveId),
        },
        showActionMenu: vi.fn(),
        showFightMenu: vi.fn(),
      };

      // Selecting slot 0 (0 PP while slot 1 has 10 PP) is blocked
      BattleMoveMenuAndForgetModal.selectMoveSlot(ctx, 0);
      expect(selectedMoves).toHaveLength(0);
      expect(mockTooltip.innerHTML).toContain('no PP left');

      // Selecting slot 1 (10 PP) succeeds and decrements PP to 9
      BattleMoveMenuAndForgetModal.selectMoveSlot(ctx, 1);
      expect(selectedMoves).toEqual(['tackle']);
      expect(playerPokemon.moves[1].currentPp).toBe(9);

      // When all moves have 0 PP, selecting any move falls back to Struggle
      playerPokemon.moves[1].currentPp = 0;
      BattleMoveMenuAndForgetModal.selectMoveSlot(ctx, 0);
      expect(selectedMoves).toEqual(['tackle', 'struggle']);
    });
  });

  describe('Issue #56: Separate CI and Deploy Workflows', () => {
    it('defines separate .github/workflows/ci.yml (for PRs) and .github/workflows/deploy.yml (for Pages deploy)', () => {
      const ciYaml = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/ci.yml'), 'utf-8');
      const deployYaml = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/deploy.yml'), 'utf-8');

      expect(ciYaml).toContain('pull_request:');
      expect(ciYaml).toContain('npm test');
      expect(deployYaml).toContain('deploy-pages');
      expect(deployYaml).not.toContain('npm test');
    });
  });
});
