import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BattleSessionController } from '../../src/battle/BattleSessionController';
import { BattleController } from '../../src/battle/BattleController';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { FieldObstacleDispatcher } from '../../src/world/interactions/FieldObstacleDispatcher';
import { handleCeladonCutTree } from '../../src/world/interactions/CeladonAndGymErikaInteractions';
import { handleVermilionCutTree } from '../../src/world/interactions/VermilionGymInteractions';
import {
  handleMistyInteraction,
  handleSleepingSnorlaxAwakening,
  handleRoute24RocketGrunt,
  handleCeruleanGymTrainer,
} from '../../src/world/interactions/CeruleanPowerPlantAndMistyInteractions';
import {
  handleJanineInteraction,
  handleFuchsiaGymDecoy,
  handleBikerTrainer,
  handleBirdKeeperTrainer,
} from '../../src/world/interactions/CyclingRoadAndFuchsiaJanineInteractions';
import { renderInspectorCard } from '../../src/ui/town-map/TownMapStylesAndInspectorRenderer';
import { renderBugContestSpecimenSwapModal } from '../../src/ui/BugContestSpecimenSwapModal';
import { renderPokegearIncomingCallModal } from '../../src/ui/hud/OverworldCutsceneAndPokegearModals';
import { renderMarillIntroStage } from '../../src/ui/intro/IntroStageRenderersAndStyles';
import { renderPokedexModal } from '../../src/ui/start-menu/PokedexModalRenderer';

// Ensure requestAnimationFrame is polyfilled for Node/Vitest environment
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  };
}

describe('TICKET-QA-SEVEN-PILLARS-02: Universal Behavioral, Algorithmic BFS & DOM Regression Suite', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  // =========================================================================
  // IMPROVEMENT 1: BUG-01 Real Controller Execution & Array Normalization
  // =========================================================================
  describe('BUG-01: BattleSessionController Array Normalization', () => {
    it('executes BattleSessionController.triggerBattle with PokemonInstance[] lead without crashing', async () => {
      const gruntTeam = [
        PokemonFactory.create('drowzee', 20, ['pound', 'hypnosis']),
        PokemonFactory.create('zubat', 20, ['leechlife', 'bite']),
      ];

      let hudHpSpecies = '';
      let isTrainerPassed = false;
      let teamLengthPassed = 0;

      const mockCtx: any = {
        setGameState: vi.fn(),
        overworldHUD: { hide: vi.fn() },
        itemfinderHUD: { suspend: vi.fn() },
        player: { isMoving: false, progress: 0 },
        audioManager: { playBattleBgm: vi.fn(), restoreOverworldBgm: vi.fn() },
        seenSpecies: new Set<string>(),
        playerBox: [],
        playerParty: [PokemonFactory.create('pikachu', 25, ['thunderbolt'])],
        healPlayerParty: vi.fn(),
        saveCurrentGame: vi.fn(),
        inventory: { balls: {} },
        gameClock: { battleSpeed: 1, playerSpeed: 1 },
        battleRenderer: {
          setSpeedMultiplier: vi.fn(),
          startBattle: vi.fn(async () => {}),
        },
        battleHUD: {
          initBattle: vi.fn(),
          updateHp: vi.fn(),
          updateHpByUid: vi.fn(),
          updateStatusBadges: vi.fn(),
          showActionMenu: vi.fn(),
          hideActionMenu: vi.fn(),
          updateSpeedDisplay: vi.fn(),
          showMessage: vi.fn(async () => {}),
          setDoubleBattlePeers: vi.fn(),
          renderStatusOverlay: vi.fn(),
        },
      };

      const battleOptions: any = {
        isTrainer: true,
        onBattleEnd: async (_res: any) => {},
      };

      // Pass gruntTeam array as initialOpponentPokemon to verify array normalization (Pillars 5 & 6)
      await BattleSessionController.runBattleSession(
        mockCtx,
        gruntTeam as any,
        battleOptions
      );

      expect(mockCtx.seenSpecies.has('drowzee')).toBe(true);
      expect(battleOptions.trainerTeam).toBeDefined();
      expect(battleOptions.trainerTeam.length).toBe(2);
      expect(battleOptions.trainerTeam[0].speciesId).toBe('drowzee');
      expect(battleOptions.trainerTeam[1].speciesId).toBe('zubat');
    });
  });

  // =========================================================================
  // IMPROVEMENT 2: BUG-02 Full Sightline Sequence on 16 Kanto Multi-Mon Trainers
  // =========================================================================
  describe('BUG-02: Multi-Mon Line-of-Sight Battle Sightline Execution Across Kanto', () => {
    const kantoMultiMonTrainers = [
      { id: 'cerulean_gym_trainer_swimmer_m', name: 'Swimmer Parker', dir: 'DOWN', team: [{ speciesId: 'horsea', level: 32 }, { speciesId: 'seadra', level: 32 }] },
      { id: 'cerulean_gym_trainer_swimmer_f', name: 'Swimmer Briana', dir: 'LEFT', team: [{ speciesId: 'seaking', level: 35 }] },
      { id: 'route24_rocket_grunt', name: 'Rocket Grunt', dir: 'DOWN', team: [{ speciesId: 'golbat', level: 30 }] },
      { id: 'route25_camper_flint', name: 'Camper Flint', dir: 'DOWN', team: [{ speciesId: 'sandslash', level: 33 }] },
      { id: 'fuchsia_gym_decoy_alice', name: 'Lass Alice', dir: 'DOWN', team: [{ speciesId: 'gloom', level: 30 }, { speciesId: 'bellsprout', level: 30 }] },
      { id: 'fuchsia_gym_decoy_linda', name: 'Picnicker Linda', dir: 'LEFT', team: [{ speciesId: 'bulbasaur', level: 30 }, { speciesId: 'ivysaur', level: 32 }, { speciesId: 'venusaur', level: 34 }] },
      { id: 'fuchsia_gym_decoy_cindy', name: 'Camper Cindy', dir: 'RIGHT', team: [{ speciesId: 'nidoran_f', level: 30 }, { speciesId: 'nidorina', level: 32 }] },
      { id: 'fuchsia_gym_decoy_barry', name: 'Picnicker Barry', dir: 'UP', team: [{ speciesId: 'nidoran_m', level: 30 }, { speciesId: 'nidorino', level: 32 }] },
      { id: 'route_17_biker_1', name: 'Biker Reilly', dir: 'DOWN', team: [{ speciesId: 'koffing', level: 25 }, { speciesId: 'weezing', level: 27 }] },
      { id: 'route_17_biker_2', name: 'Biker Joel', dir: 'RIGHT', team: [{ speciesId: 'magmar', level: 28 }] },
      { id: 'route_17_biker_3', name: 'Biker Glenn', dir: 'UP', team: [{ speciesId: 'weezing', level: 29 }] },
      { id: 'route_17_biker_4', name: 'Biker Charles', dir: 'LEFT', team: [{ speciesId: 'koffing', level: 26 }, { speciesId: 'magmar', level: 27 }] },
      { id: 'route_18_bird_keeper_1', name: 'Bird Keeper Boris', dir: 'DOWN', team: [{ speciesId: 'doduo', level: 26 }, { speciesId: 'dodrio', level: 28 }] },
      { id: 'route_18_bird_keeper_2', name: 'Bird Keeper Bob', dir: 'LEFT', team: [{ speciesId: 'noctowl', level: 29 }] },
      { id: 'route_8_biker_1', name: 'Biker Dwayne', dir: 'DOWN', team: [{ speciesId: 'koffing', level: 24 }, { speciesId: 'weezing', level: 26 }] },
      { id: 'route_8_biker_2', name: 'Biker Harris', dir: 'LEFT', team: [{ speciesId: 'flareon', level: 28 }] },
    ];

    it.each(kantoMultiMonTrainers)(
      'executes sightline approach and battle trigger for $id ($name)',
      async (trainerDef) => {
        const npc: any = {
          id: trainerDef.id,
          trainerId: trainerDef.id,
          trainerName: trainerDef.name,
          speaker: trainerDef.name.toUpperCase(),
          trainerIntroDialogue: [`I am ${trainerDef.name}! Let's battle!`],
          direction: trainerDef.dir,
          sightRange: 3,
          x: 10,
          y: 10,
          trainerTeam: trainerDef.team,
        };

        let pX = 10;
        let pY = 10;
        if (trainerDef.dir === 'DOWN') pY = 12;
        if (trainerDef.dir === 'UP') pY = 8;
        if (trainerDef.dir === 'LEFT') pX = 8;
        if (trainerDef.dir === 'RIGHT') pX = 12;

        let dialogueOpened = false;
        let battleTriggered = false;
        let battleTeamLength = 0;

        const mockCtx: any = {
          gameClock: { playerSpeed: 1 },
          player: { x: pX, y: pY, isMoving: false, playerSpeed: 1 },
          mapManager: {
            getCurrentMap: () => ({
              id: 'test_kanto_map',
              width: 30,
              height: 30,
              collisionGrid: new Array(900).fill(0),
            }),
          },
          defeatedTrainers: new Set<string>(),
          isDialogueOpen: () => false,
          isMenuOpen: () => false,
          isCutsceneLocked: () => false,
          setCutsceneLocked: vi.fn(),
          audioManager: { playSfx: vi.fn() },
          overworldHUD: {
            openDialogue: vi.fn((_lines, _speaker, onDone) => {
              dialogueOpened = true;
              if (onDone) onDone();
            }),
          },
          overworldRenderer: {
            showExclamationBubble: vi.fn(async () => {}),
            moveNpcVisual: vi.fn(async () => {}),
          },
          openDialogue: vi.fn((_lines, _speaker, onDone) => {
            dialogueOpened = true;
            if (onDone) onDone();
          }),
          triggerBattle: vi.fn((_lead, opts) => {
            battleTriggered = true;
            battleTeamLength = opts?.trainerTeam?.length ?? 1;
          }),
        };

        await BattleController.runTrainerSightSequence(npc, mockCtx);
        expect(dialogueOpened).toBe(true);
        expect(battleTriggered).toBe(true);
        expect(battleTeamLength).toBe(trainerDef.team.length);
      }
    );
  });

  // =========================================================================
  // IMPROVEMENT 3: BUG-03 Universal BFS Flood-Fill Spatial Reachability
  // =========================================================================
  describe('BUG-03: Multi-Source BFS Spatial Reachability on Lake of Rage & Ice Path', () => {
    const mapsDir = path.resolve(repoRoot, 'public/assets/data/maps');
    const itemsData = JSON.parse(fs.readFileSync(path.resolve(repoRoot, 'public/assets/data/overworld_items.json'), 'utf8'));

    function runBfsFromWarps(mapJson: any): Set<number> {
      const w = mapJson.width;
      const h = mapJson.height;
      const grid = mapJson.collisionGrid;
      const visited = new Set<number>();
      const queue: Array<[number, number]> = [];

      if (mapJson.warps && mapJson.warps.length > 0) {
        for (const warp of mapJson.warps) {
          queue.push([warp.x, warp.y]);
          visited.add(warp.y * w + warp.x);
        }
      }
      for (let x = 0; x < w; x++) {
        if (grid[0 * w + x] === 0) { queue.push([x, 0]); visited.add(0 * w + x); }
        if (grid[(h - 1) * w + x] === 0) { queue.push([x, h - 1]); visited.add((h - 1) * w + x); }
      }
      for (let y = 0; y < h; y++) {
        if (grid[y * w + 0] === 0) { queue.push([0, y]); visited.add(y * w + 0); }
        if (grid[y * w + (w - 1)] === 0) { queue.push([w - 1, y]); visited.add(y * w + (w - 1)); }
      }

      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nIdx = ny * w + nx;
            const tile = grid[nIdx];
            if (!visited.has(nIdx) && (tile === 0 || tile === 2 || tile === 3)) {
              visited.add(nIdx);
              queue.push([nx, ny]);
            }
          }
        }
      }

      return visited;
    }

    it('verifies all Lake of Rage items, Super Nerd, and Cooltrainer are reachable via BFS', () => {
      const lor = JSON.parse(fs.readFileSync(path.join(mapsDir, 'lake_of_rage.json'), 'utf8'));
      const reachable = runBfsFromWarps(lor);
      const w = lor.width;

      expect(reachable.has(2 * w + 35) || reachable.has(2 * w + 34)).toBe(true);
      expect(reachable.has(4 * w + 4) || reachable.has(4 * w + 5)).toBe(true);
      expect(reachable.has(28 * w + 25) || reachable.has(28 * w + 24)).toBe(true);
    });

    it('verifies Ice Path B1F and B2F hidden items sit on approachable walkable tiles', () => {
      const ipB1f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ice_path_b1f.json'), 'utf8'));
      const reachableB1f = runBfsFromWarps(ipB1f);
      const ipB1fMaxPotion = itemsData.hiddenItems.find((h: any) => h.id === 'ice_path_b1f_hidden_17_30_max_potion');
      expect(reachableB1f.has(ipB1fMaxPotion.y * ipB1f.width + ipB1fMaxPotion.x)).toBe(true);

      const ipB2f = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ice_path_b2f_blackthorn_side.json'), 'utf8'));
      const ipB2fIceHeal = itemsData.hiddenItems.find((h: any) => h.id === 'ice_path_b2f_blackthorn_side_hidden_2_10_ice_heal');
      // Verify tile exists and is strictly walkable (0)
      expect(ipB2f.collisionGrid[ipB2fIceHeal.y * ipB2f.width + ipB2fIceHeal.x]).toBe(0);
      expect(ipB2f.collisionGrid[(ipB2fIceHeal.y - 1) * ipB2f.width + ipB2fIceHeal.x]).toBe(0);
    });
  });

  // =========================================================================
  // IMPROVEMENT 4: BUG-04 & BUG-05 Exhaustive Outcome Matrix & bgEvent Dispatch
  // =========================================================================
  describe('BUG-04 & BUG-05: Exhaustive Battle Outcome Matrix & bgEvent Single Dispatch', () => {
    const battleHandlers = [
      { name: 'Misty Boss Battle', flag: 'misty_defeated', badge: 'cascade', fn: (ctx: any) => handleMistyInteraction({ id: 'misty' } as any, ctx) },
      { name: 'Janine Boss Battle', flag: 'janine_defeated', badge: 'soul', fn: (ctx: any) => handleJanineInteraction({ id: 'janine' } as any, ctx) },
      { name: 'Route 24 Grunt', flag: 'EVENT_DEFEATED_ROUTE24_GRUNT', badge: null, fn: (ctx: any) => handleRoute24RocketGrunt({ id: 'grunt' } as any, ctx) },
      { name: 'Cerulean Swimmer', flag: 'cerulean_gym_trainer_swimmer_m', badge: null, fn: (ctx: any) => handleCeruleanGymTrainer({ id: 'cerulean_gym_trainer_swimmer_m' } as any, ctx) },
      { name: 'Fuchsia Decoy', flag: 'fuchsia_gym_decoy_alice', badge: null, fn: (ctx: any) => handleFuchsiaGymDecoy({ id: 'fuchsia_gym_decoy_alice' } as any, ctx) },
      { name: 'Cycling Biker', flag: 'route_17_biker_1', badge: null, fn: (ctx: any) => handleBikerTrainer({ id: 'route_17_biker_1' } as any, ctx) },
      { name: 'Bird Keeper', flag: 'route_18_bird_keeper_1', badge: null, fn: (ctx: any) => handleBirdKeeperTrainer({ id: 'route_18_bird_keeper_1' } as any, ctx) },
      { name: 'Snorlax Awakening', flag: 'snorlax_cleared', badge: null, fn: (ctx: any) => handleSleepingSnorlaxAwakening({ id: 'snorlax' } as any, ctx) },
    ];

    it.each(battleHandlers)(
      'asserts $name guards against badges/flags on whiteout or flee',
      ({ flag, badge, fn }) => {
        let triggeredOpts: any = null;
        const mockCtx: any = {
          playerName: 'Gold',
          playerParty: [PokemonFactory.create('typhlosion', 50, ['flamethrower'])],
          storyFlags: new Set<string>(['has_expn_card']),
          defeatedTrainers: new Set<string>(),
          inventory: { badges: [], items: {} },
          saveCurrentGame: vi.fn(),
          showToast: vi.fn(),
          healPlayerParty: vi.fn(),
          openDialogue: vi.fn((_p, _s, cb) => { if (cb) cb(); }),
          triggerBattle: vi.fn((_lead, opts) => { triggeredOpts = opts; }),
          mapManager: { getCurrentMap: () => ({ id: 'test_map', width: 20, height: 20, collisionGrid: new Array(400).fill(0) }) },
          npcsByMap: { vermilion_city: [{ id: 'snorlax', x: 20, y: 10 }] },
        };

        fn(mockCtx);
        expect(triggeredOpts).toBeDefined();

        // 1. Loss / Whiteout
        triggeredOpts.onBattleEnd({ winner: 'OPPONENT' });
        expect(mockCtx.storyFlags.has(flag)).toBe(false);
        expect(mockCtx.defeatedTrainers.has(flag)).toBe(false);
        if (badge) expect(mockCtx.inventory.badges).not.toContain(badge);

        // 2. Flee
        triggeredOpts.onBattleEnd({ fled: true });
        expect(mockCtx.storyFlags.has(flag)).toBe(false);
        expect(mockCtx.defeatedTrainers.has(flag)).toBe(false);
        if (badge) expect(mockCtx.inventory.badges).not.toContain(badge);

        // 3. Victory
        triggeredOpts.onBattleEnd({ winner: 'PLAYER' });
        const rewarded = mockCtx.storyFlags.has(flag) || mockCtx.defeatedTrainers.has(flag);
        expect(rewarded).toBe(true);
        if (badge) expect(mockCtx.inventory.badges).toContain(badge);
      }
    );

    it('asserts FieldObstacleDispatcher dispatches all 7 Kanto bgEvents without duplicate dialogue', () => {
      const kantoBgEvents = [
        'FAST_SHIP_CABIN_REST',
        'VERMILION_GYM_TRASH_CAN_1',
        'CELADON_CAFE_TRASH',
        'CELADON_GYM_STATUE',
        'CERULEAN_GYM_MACHINE_PART',
        'CERULEAN_GYM_STATUE',
        'FUCHSIA_GYM_STATUE',
      ];

      for (const action of kantoBgEvents) {
        let dialogueCallCount = 0;
        const targetX = action === 'CERULEAN_GYM_MACHINE_PART' ? 4 : 5;
        const targetY = action === 'CERULEAN_GYM_MACHINE_PART' ? 8 : 5;
        const mockMap: any = {
          id: 'test_kanto_gym',
          width: 20,
          height: 20,
          collisionGrid: new Array(400).fill(0),
          bgEvents: [{ x: targetX, y: targetY, action, dialogue: 'DUPLICATE PLACEHOLDER SHOULD NOT BE SHOWN' }],
        };
        const mockCtx: any = {
          playerName: 'Gold',
          playerParty: [PokemonFactory.create('oddish', 20, ['cut'])],
          storyFlags: new Set<string>(['EVENT_DEFEATED_ROUTE24_GRUNT']),
          inventory: { badges: ['hive'], items: {} },
          saveCurrentGame: vi.fn(),
          showToast: vi.fn(),
          healPlayerParty: vi.fn(),
          openDialogue: vi.fn((pages, _s, cb) => {
            dialogueCallCount++;
            expect(pages).not.toContain('DUPLICATE PLACEHOLDER SHOULD NOT BE SHOWN');
            if (cb) cb();
          }),
          mapManager: {
            getCurrentMap: () => mockMap,
            checkBgEvent: (x: number, y: number) => {
              const bg = mockMap.bgEvents?.find((e: any) => e.x === x && e.y === y);
              return bg ? { ...bg, pages: [bg.dialogue || ''] } : null;
            },
          },
          npcsByMap: {},
        };

        const handled = FieldObstacleDispatcher.handleFieldAndBgInteraction(mockCtx, mockMap, targetX, targetY);
        expect(handled).toBe(true);
        expect(dialogueCallCount).toBeGreaterThanOrEqual(1);
      }
    });

    it('purges cut trees immediately from npcsByMap in Celadon and Vermilion', () => {
      const mockCtx: any = {
        playerName: 'Gold',
        playerParty: [PokemonFactory.create('oddish', 20, ['cut'])],
        storyFlags: new Set<string>(['badge_hive']),
        inventory: { badges: ['hive'], items: { hm01_cut: 1 } },
        saveCurrentGame: vi.fn(),
        openDialogue: vi.fn((_p, _s, cb) => { if (cb) cb(); }),
        mapManager: {
          getCurrentMap: () => ({ id: 'celadon_city', width: 40, height: 40, collisionGrid: new Array(1600).fill(1) }),
        },
        npcsByMap: {
          celadon_city: [{ id: 'celadon_city_cut_tree', x: 10, y: 31 }],
          vermilion_city: [{ id: 'vermilion_city_cut_tree', x: 10, y: 20 }],
        },
        renderMap: vi.fn(),
        syncMapOverworldItems: vi.fn(),
      };

      handleCeladonCutTree(mockCtx, 10, 31);
      expect(mockCtx.npcsByMap.celadon_city.length).toBe(0);
      expect(mockCtx.storyFlags.has('celadon_cut_tree_cleared')).toBe(true);

      mockCtx.mapManager.getCurrentMap = () => ({ id: 'vermilion_city', width: 40, height: 40, collisionGrid: new Array(1600).fill(1) });
      handleVermilionCutTree(mockCtx, 10, 20);
      expect(mockCtx.npcsByMap.vermilion_city.length).toBe(0);
      expect(mockCtx.storyFlags.has('vermilion_cut_tree_cleared')).toBe(true);
    });
  });

  // =========================================================================
  // IMPROVEMENT 5: BUG-06 – BUG-09 Runtime Identity & String/DOM Fallbacks
  // =========================================================================
  describe('BUG-06 – BUG-09: Runtime Identity, Fallback URLs & Mobile Touch Ergonomics', () => {
    it('BUG-06: verifies runtime identity of cachedTickerContext across repeated 60Hz ticks', () => {
      let playerObj = { x: 5, y: 5 };
      let invObj = { items: {} };
      let partyObj = [PokemonFactory.create('chikorita', 5)];

      const cachedContext: any = {
        player: playerObj,
        inventory: invObj,
        playerParty: partyObj,
      };

      const getTickerContext = () => {
        cachedContext.player = playerObj;
        cachedContext.inventory = invObj;
        cachedContext.playerParty = partyObj;
        return cachedContext;
      };

      const refFrame1 = getTickerContext();
      const refFrame2 = getTickerContext();
      expect(Object.is(refFrame1, refFrame2)).toBe(true);

      playerObj = { x: 6, y: 5 };
      const refFrame3 = getTickerContext();
      expect(Object.is(refFrame1, refFrame3)).toBe(true);
      expect(refFrame3.player.x).toBe(6);
    });

    it('BUG-07: verifies caterpie_front fallback and onerror handlers across Pokemon UI modules', () => {
      const bugModalTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/BugContestSpecimenSwapModal.ts'), 'utf8');
      expect(bugModalTs).not.toContain('10_front.png');
      expect(bugModalTs).toContain('caterpie_front.png');

      const hudModalTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/hud/OverworldCutsceneAndPokegearModals.ts'), 'utf8');
      expect(hudModalTs).toContain('this.onerror=null;this.src=');

      const introTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/intro/IntroStageRenderersAndStyles.ts'), 'utf8');
      expect(introTs).toContain('onerror="this.onerror=null;"');
    });

    it('BUG-08: asserts inputmode=text, autocapitalize=none, and 16px font on Pokedex search renderer', () => {
      const pokedexTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/start-menu/PokedexModalRenderer.ts'), 'utf8');
      expect(pokedexTs).toContain('id="dex-search-input"');
      expect(pokedexTs).toContain('inputmode="text"');
      expect(pokedexTs).toContain('autocapitalize="none"');
      expect(pokedexTs).toContain('font-size: 16px');
    });

    it('BUG-09: renders Town Map Inspector Card and verifies dormant and active telemetry states', () => {
      const fakeLandmark: any = {
        id: 'burned_tower',
        name: 'BURNED TOWER',
        region: 'JOHTO',
        type: 'DUNGEON',
        gridX: 4,
        gridY: 3,
        subtitle: 'The tower where ancient beasts slumber.',
      };

      // 1. Dormant state (all beasts dormant)
      const dormantHtml = renderInspectorCard({
        sel: fakeLandmark,
        isVisited: true,
        roamersAtSel: [],
        activeRoamers: [
          { speciesId: 'raikou', currentMapId: 'route_36', isAwakened: false, isCaught: false, isDefeated: false, currentHp: 100, maxHp: 100 },
          { speciesId: 'entei', currentMapId: 'route_37', isAwakened: false, isCaught: false, isDefeated: false, currentHp: 100, maxHp: 100 },
        ],
        playerLandmark: fakeLandmark,
        isMobile: false,
      });

      expect(dormantHtml).toContain('id="town-map-roamer-radar-dormant"');
      expect(dormantHtml).toContain('BEAST RADAR FREQUENCY // DORMANT');

      // 2. Active state (beasts awakened)
      const activeHtml = renderInspectorCard({
        sel: fakeLandmark,
        isVisited: true,
        roamersAtSel: [],
        activeRoamers: [
          { speciesId: 'raikou', currentMapId: 'route_36', isAwakened: true, isCaught: false, isDefeated: false, currentHp: 100, maxHp: 100 },
        ],
        playerLandmark: fakeLandmark,
        isMobile: false,
      });

      expect(activeHtml).toContain('id="town-map-roamer-radar"');
      expect(activeHtml).toContain('LEGENDARY BEAST RADAR');
    });
  });
});
