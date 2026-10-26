import { GameClock } from './core/GameClock';
import { eventBus } from './core/EventBus';
import { AssetManifestQueue } from './core/AssetManifestQueue';
import { MapManager } from './world/MapManager';
import { GridPhysics, type GridEntity } from './world/GridPhysics';
import { OverworldRenderer } from './render/OverworldRenderer';
import { OverworldHUD } from './ui/OverworldHUD';
import { BattleRenderer } from './render/BattleRenderer';
import { BattleHUD } from './ui/BattleHUD';
import {
  BattleStateMachine,
  type BattleTurnResult,
  type DoubleBattleConfig,
} from './battle/BattleStateMachine';
import { StadiumArenaManager } from './battle/StadiumArenaManager';
import { PokemonFactory, type PartyExpAward } from './battle/PokemonFactory';
import { BattleSessionController } from './battle/BattleSessionController';
import { FieldObstacleDispatcher, createDefaultNpcInteractionRouter } from './world/interactions';
import type { BattleSessionContext, FieldObstacleContext, NpcInteractionContext, TriggerBattleOptions } from './types/gameContext';
import { MoveReplacementModalUI } from './ui/MoveReplacementModalUI';
import { BattleAudio } from './audio/BattleAudio';
import { AudioManager } from './audio/AudioManager';
import { RoamingManager } from './world/RoamingManager';
import { SaveManager, type SaveData } from './core/SaveManager';
import { BagAndMartUI, type BagInventory } from './ui/BagAndMartUI';
import { PartyManagementUI } from './ui/PartyManagementUI';
import { StartMenuUI } from './ui/StartMenuUI';
import { TitleScreenUI } from './ui/TitleScreenUI';
import { IntroSequenceUI } from './ui/IntroSequenceUI';
import { MissionLogUI } from './ui/MissionLogUI';
import { MissionManager } from './world/MissionManager';
import { OverworldItemManager } from './world/OverworldItemManager';
import { ItemfinderRadar } from './world/ItemfinderRadar';
import { ItemfinderHUD } from './ui/ItemfinderHUD';
import { NamingModalUI } from './ui/NamingModalUI';
import { StorageManager, BoxManager } from './world/StorageManager';
import { BoxManagementUI } from './ui/BoxManagementUI';
import { TownMapUI } from './ui/TownMapUI';
import { RuinsPuzzleModalUI } from './ui/RuinsPuzzleModalUI';
import { DayCareManager } from './world/DayCareManager';
import { DayCareModalUI } from './ui/DayCareModalUI';
import { DeptStoreElevatorUI, type DeptStoreFloor } from './ui/DeptStoreElevatorUI';
import { RadioTowerQuizUI } from './ui/RadioTowerQuizUI';
import { BugContestManager, isContestDay } from './world/BugContestManager';
import { BugContestHUDWidget } from './ui/BugContestHUDWidget';
import { BugContestSpecimenSwapModal } from './ui/BugContestSpecimenSwapModal';
import { KurtCraftingManager } from './world/KurtCraftingManager';
import { KurtCraftingModalUI } from './ui/KurtCraftingModalUI';
import { ModernHMHandler } from './world/ModernHMHandler';
import { EvolutionManager } from './world/EvolutionManager';
import { EvolutionSceneUI } from './ui/EvolutionSceneUI';
import { isEcruteakGymSafeTile, ECRUTEAK_GYM_RESPAWN } from './world/ecruteakGymMaze';
import { DisplayThemeManager } from './ui/DisplayThemeManager';
import type {
  MapData,
  WarpEvent,
  Direction,
  PokeballId,
  PokemonInstance,
  PokemonStorageState,
  PlayerGender,
  GameOptions,
  SpeedMultiplier,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from './types/game';
import type { Graphics } from 'pixi.js';
import {
  makeNpc,
  createNpcsByMap,
  DAY_SIBLINGS,
  GUIDE_GENT_TOUR_LEGS,
  isNpcActiveForStoryFlags,
  applyMapNpcStoryMutations,
  resolveElmLabDialogue,
} from './world/npcData';
import { TrackedStoryFlagSet, ActiveNpcCache } from './world/ActiveNpcCache';
export {
  npcsByMap,
  createNpcsByMap,
  DAY_SIBLINGS,
  GUIDE_GENT_TOUR_LEGS,
  isNpcActiveForStoryFlags,
  applyMapNpcStoryMutations,
} from './world/npcData';
import { syncGitHubIssues } from './sync/githubSync';
import { mountGitHubReportButton } from './ui/BugReportModal';
import { StoryCutscenes, type StoryCutsceneContext } from './world/StoryCutscenes';
import { BattleController } from './battle/BattleController';

declare global {
  interface Window {
    updateLoaderProgress?: (pct: number, label: string) => void;
    dismissLoader?: () => void;
    syncGitHubIssues?: typeof syncGitHubIssues;
  }
}

async function bootstrap() {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) {
    throw new Error('Canvas container #canvas-container not found');
  }

  // 1. Initialize Core Systems
  const gameClock = new GameClock();
  const mapManager = new MapManager();
  const roamingManager = new RoamingManager();
  const saveManager = new SaveManager();
  const audioManager = new AudioManager();
  const missionManager = new MissionManager();
  const overworldItemManager = new OverworldItemManager();
  let gameState: 'TITLE' | 'OVERWORLD' | 'BATTLE' = 'TITLE';

  // 2. Load or Initialize Game State
  const existingSave = await saveManager.loadGame();
  const initialSavePreview = await saveManager.getSavePreview();

  let playerParty: PokemonInstance[] = [];
  let playerBox: PokemonInstance[] = [];
  let storageState: PokemonStorageState =
    existingSave?.storage || StorageManager.createDefaultStorage(existingSave?.box);
  const boxManager = new BoxManager(storageState);
  playerBox = boxManager.flatten();
  let playTimeSeconds = 0;
  const inventory: BagInventory = {
    balls: {},
    items: {},
    berries: {},
    tms: [],
    money: 3000,
    badges: [],
    keyItems: [],
  };
  const defeatedTrainers: Set<string> = new Set();
  const storyFlags = new TrackedStoryFlagSet();
  const activeNpcCache = new ActiveNpcCache();
  const seenSpecies: Set<string> = new Set();

  let initialMapId = 'new_bark_town';
  let initialPlayerX = 13;
  let initialPlayerY = 6;
  let initialPlayerDir: Direction = 'DOWN';
  let playerName = 'GOLD';
  let playerGender: PlayerGender = 'BOY';
  let rivalName = 'SILVER';
  let gameOptions: GameOptions = SaveManager.getDefaultOptions();
  let lastVisitedPokecenter = { mapId: 'new_bark_town', x: 6, y: 4 };

  if (existingSave) {
    console.log('📦 Restoring save state from IndexedDB...');
    playerName = existingSave.player.name || 'GOLD';
    playerGender = existingSave.player.gender || 'BOY';
    rivalName = existingSave.rivalName || existingSave.player.rivalName || 'SILVER';
    if (existingSave.options) {
      gameOptions = existingSave.options;
    }
    playerParty = existingSave.party;
    playerBox = existingSave.box || [];
    playTimeSeconds = existingSave.playTimeSeconds || 0;
    inventory.balls = existingSave.inventory.balls;
    if (existingSave.inventory.items) {
      inventory.items = existingSave.inventory.items;
    }
    if (existingSave.inventory.berries) {
      inventory.berries = existingSave.inventory.berries;
    }
    if (existingSave.inventory.keyItems) {
      inventory.keyItems = existingSave.inventory.keyItems;
    }
    inventory.tms = existingSave.inventory.tms;
    inventory.money = existingSave.player.money;
    inventory.badges = existingSave.player.badges;
    existingSave.defeatedTrainers.forEach((t) => defeatedTrainers.add(t));
    existingSave.storyFlags?.forEach((f) => storyFlags.add(f));
    existingSave.seenSpecies?.forEach((s) => seenSpecies.add(s));
    playerParty.forEach((p) => seenSpecies.add(p.speciesId));
    playerBox.forEach((p) => seenSpecies.add(p.speciesId));
    overworldItemManager.setCollectedFlags([
      ...(existingSave.collectedItems || []),
      ...(existingSave.collectedItemFlags || []),
      ...Array.from(storyFlags),
    ]);
    overworldItemManager.setFruitTreePicks(
      existingSave.fruitTreePicks || existingSave.harvestedFruitTrees
    );
    missionManager.deserialize(existingSave.missions);
    missionManager.reconcileStarterState(playerParty, storyFlags);

    initialMapId = existingSave.player.mapId;
    initialPlayerX = existingSave.player.x;
    initialPlayerY = existingSave.player.y;
    initialPlayerDir = existingSave.player.direction;
    if (initialMapId.endsWith('_poke_center')) {
      lastVisitedPokecenter = { mapId: initialMapId, x: 3, y: 3 };
    }

    gameClock.playerSpeed =
      existingSave.player.speedMultiplier || existingSave.options?.playerSpeedDefault || 3;
    gameClock.battleSpeed =
      existingSave.player.battleSpeedMultiplier || existingSave.options?.battleSpeedMultiplier || 1;
    gameOptions.playerSpeedDefault = gameClock.playerSpeed;
    gameOptions.battleSpeedMultiplier = gameClock.battleSpeed;

    // Only awaken Legendary Beasts if player has reached the Ecruteak Burned Tower story milestone
    if (existingSave.storyFlags?.includes('beasts_awakened') || storyFlags.has('beasts_awakened') || inventory.badges.length >= 4) {
      roamingManager.awakenBeasts();
    } else {
      roamingManager.sleepBeasts();
    }
  } else {
    // Default empty party for fresh adventure (Starter partner chosen at Elm's Lab - Ticket 6.1)
    playerParty = [];
  }

  const displayThemeManager = new DisplayThemeManager(
    gameOptions.crtScanlines ?? false,
    gameOptions.gbcPalette ?? 'VIBRANT'
  );
  BattleAudio.setLowHpBeepEnabled(gameOptions.lowHpBeepEnabled ?? true);
  audioManager.setChiptuneMode(gameOptions.chiptuneMode ?? false);

  // 3. Fetch and Register Outdoor & Indoor Maps (lazy-loaded on-demand with 1-hop prefetch)


  const ensureMapAndNeighborsLoaded = async (targetId: string): Promise<MapData | undefined> => {
    return mapManager.ensureZoneAndConnectionsLoaded(targetId);
  };


  const criticalBootMapIds = Array.from(
    new Set([initialMapId, 'new_bark_town', 'players_house_2f', 'players_house_1f'])
  );
  const bootMapManifest = new AssetManifestQueue();
  for (const mapId of criticalBootMapIds) {
    bootMapManifest.enqueue({
      id: `boot_map:${mapId}`,
      label: `Loading map ${mapId}.json`,
      category: 'MAP_JSON',
      execute: async () => {
        await ensureMapAndNeighborsLoaded(mapId);
      },
    });
  }
  await bootMapManifest.run({
    startPercent: 12,
    endPercent: 40,
    concurrency: 4,
    onProgress: (snap) => {
      window.updateLoaderProgress?.(snap.percent, snap.currentLabel);
    },
  });

  // Performance optimization: eliminate eager 3.2MB heap memory spike at t+1.5s.
  // Maps stream asynchronously on-demand via mapManager.ensureMapLoaded (fallback: './assets/data/world_maps.json').
  let initialMap = mapManager.setCurrentMap(initialMapId);
  if (!mapManager.isWalkable(initialPlayerX, initialPlayerY)) {
    initialMapId = 'new_bark_town';
    initialMap = mapManager.setCurrentMap(initialMapId);
    initialPlayerX = 13;
    initialPlayerY = 6;
  }
  missionManager.registerMapEntry(initialMap.id, storyFlags);

  // 4. Save Game Helper
  const saveCurrentGame = async () => {
    missionManager.checkStoryFlags(storyFlags);
    gameOptions.playerSpeedDefault = gameClock.playerSpeed;
    gameOptions.battleSpeedMultiplier = gameClock.battleSpeed;
    if (overworldHUD) {
      gameOptions.touchControlStyle = overworldHUD.getTouchControlStyle();
    }
    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      playTimeSeconds: Math.floor(playTimeSeconds),
      player: {
        name: playerName,
        gender: playerGender,
        mapId: mapManager.getCurrentMap()?.id || 'new_bark_town',
        x: player.x,
        y: player.y,
        direction: player.direction,
        speedMultiplier: gameClock.playerSpeed,
        battleSpeedMultiplier: gameClock.battleSpeed,
        badges: inventory.badges,
        money: inventory.money,
        rivalName,
      },
      rivalName,
      party: playerParty,
      box: boxManager.flatten(),
      storage: boxManager.getState(),
      inventory: {
        balls: inventory.balls,
        items: inventory.items,
        berries: inventory.berries,
        tms: inventory.tms,
        keyItems: inventory.keyItems,
      },
      roamers: roamingManager.getAllRoamers(),
      defeatedTrainers: Array.from(defeatedTrainers),
      storyFlags: Array.from(storyFlags),
      collectedItems: overworldItemManager.getCollectedFlags(),
      collectedItemFlags: overworldItemManager.getCollectedFlags(),
      harvestedFruitTrees: overworldItemManager.getHarvestedTreeIds(),
      fruitTreePicks: overworldItemManager.getFruitTreePicksRecord(),
      seenSpecies: Array.from(seenSpecies),
      options: gameOptions,
      missions: missionManager.serialize(),
      dayCare: dayCareManager.getState(),
      kurtCraftingOrder: kurtCraftingManager.activeOrder,
      bugContestRecords: bugContestManager.serializeRecords(),
    };
    await saveManager.saveGame(saveData);
    console.log('💾 Game state successfully saved to IndexedDB.');
  };

  const TM_MOVE_CODE_MAP: Record<string, string> = {
    tm_dynamicpunch: 'TM01',
    tm_headbutt: 'TM02',
    tm_curse: 'TM03',
    tm_rollout: 'TM04',
    tm_roar: 'TM05',
    tm_toxic: 'TM06',
    tm_zap_cannon: 'TM07',
    tm_zapcannon: 'TM07',
    tm_rock_smash: 'TM08',
    tm_rocksmash: 'TM08',
    tm_psych_up: 'TM09',
    tm_hidden_power: 'TM10',
    tm_sunny_day: 'TM11',
    tm_sweet_scent: 'TM12',
    tm_snore: 'TM13',
    tm_blizzard: 'TM14',
    tm_hyper_beam: 'TM15',
    tm_icy_wind: 'TM16',
    tm_protect: 'TM17',
    tm_rain_dance: 'TM18',
    tm_giga_drain: 'TM19',
    tm_endure: 'TM20',
    tm_frustration: 'TM21',
    tm_solarbeam: 'TM22',
    tm_iron_tail: 'TM23',
    tm_dragonbreath: 'TM24',
    tm_thunder: 'TM25',
    tm_earthquake: 'TM26',
    tm_return: 'TM27',
    tm_dig: 'TM28',
    tm_psychic: 'TM29',
    tm_shadow_ball: 'TM30',
    tm_shadowball: 'TM30',
    tm_mud_slap: 'TM31',
    tm_mudslap: 'TM31',
    tm_double_team: 'TM32',
    tm_ice_punch: 'TM33',
    tm_swagger: 'TM34',
    tm_sleep_talk: 'TM35',
    tm_sludge_bomb: 'TM36',
    tm_sandstorm: 'TM37',
    tm_fire_blast: 'TM38',
    tm_swift: 'TM39',
    tm_defense_curl: 'TM40',
    tm_thunderpunch: 'TM41',
    tm_dream_eater: 'TM42',
    tm_detect: 'TM43',
    tm_rest: 'TM44',
    tm_attract: 'TM45',
    tm_thief: 'TM46',
    tm_steel_wing: 'TM47',
    tm_fire_punch: 'TM48',
    tm_fury_cutter: 'TM49',
    tm_nightmare: 'TM50',
    tm_false_swipe: 'TM54',
    tm_thunder_wave: 'TM73',
    hm_cut: 'HM01',
    hm_fly: 'HM02',
    hm_surf: 'HM03',
    hm_strength: 'HM04',
    hm_flash: 'HM05',
    hm_whirlpool: 'HM06',
    hm_waterfall: 'HM07',
  };

  const addOverworldItemToInventory = (rawItemId: string) => {
    const norm = rawItemId.toLowerCase().replace(/_/g, '-');
    const pocket = OverworldItemManager.resolveItemPocket(rawItemId);
    if (pocket === 'TMS') {
      const lower = rawItemId.toLowerCase();
      const code =
        TM_MOVE_CODE_MAP[lower] ||
        rawItemId.toUpperCase().match(/^(TM\d+|HM\d+)/)?.[1] ||
        rawItemId.toUpperCase().split('_')[0];
      if (!inventory.tms.includes(code)) {
        inventory.tms.push(code);
      }
    } else if (pocket === 'BALLS') {
      const ballKey = norm as PokeballId;
      inventory.balls[ballKey] = (inventory.balls[ballKey] || 0) + 1;
    } else if (pocket === 'BERRIES') {
      if (!inventory.berries) inventory.berries = {};
      inventory.berries[rawItemId] = (inventory.berries[rawItemId] || 0) + 1;
    } else if (pocket === 'KEY_ITEMS') {
      if (!inventory.keyItems) inventory.keyItems = [];
      if (!inventory.keyItems.includes(rawItemId)) {
        inventory.keyItems.push(rawItemId);
      }
    } else {
      if (!inventory.items) inventory.items = {};
      inventory.items[norm] = (inventory.items[norm] || 0) + 1;
    }

    // Auto-detect key progression HMs/items and trigger associated story/mission flags
    if (rawItemId.toLowerCase().includes('waterfall') || rawItemId.toLowerCase().includes('hm07')) {
      if (!inventory.tms.includes('HM07')) inventory.tms.push('HM07');
      if (!inventory.tms.includes('HM07_WATERFALL')) inventory.tms.push('HM07_WATERFALL');
      storyFlags.add('has_hm07_waterfall');
      storyFlags.add('EVENT_GOT_HM07_WATERFALL');
      missionManager.checkStoryFlags(storyFlags);
    }
    if (rawItemId.toLowerCase().includes('basement')) {
      storyFlags.add('has_basement_key');
      storyFlags.add('warehouse_unlocked');
      missionManager.checkStoryFlags(storyFlags);
    }
    if (rawItemId.toLowerCase().includes('card')) {
      storyFlags.add('has_card_key');
      storyFlags.add('card_key_obtained');
      missionManager.checkStoryFlags(storyFlags);
    }
    if (rawItemId.toLowerCase().includes('clear_bell') || rawItemId.toLowerCase().includes('clear-bell')) {
      storyFlags.add('has_clear_bell');
      missionManager.checkStoryFlags(storyFlags);
    }
  };

  let triggerItemfinderScan = () => {};

  mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);
  if (gameOptions.encounterRateMode) {
    mapManager.setEncounterRateMode(gameOptions.encounterRateMode);
  }

  // 5. Initialize HUDs, Party Management, Start Menu & Renderers
  const bagUI = new BagAndMartUI(
    'modal-container',
    inventory,
    playerParty,
    () => {
      saveCurrentGame();
    },
    () => {
      triggerItemfinderScan();
    },
    (steps: number, itemName: string) => {
      mapManager.setRepelSteps(steps);
      if (overworldHUD) {
        overworldHUD.showToast(`🛡️ ${itemName} active! Wild encounters warded off for ${steps} steps.`);
      }
    }
  );

  const partyUI = new PartyManagementUI('modal-container', playerParty, () => {
    saveCurrentGame();
  });

  const missionLogUI = new MissionLogUI('modal-container', missionManager);
  const itemfinderHUD = new ItemfinderHUD('overworld-hud-container');
  const namingModalUI = new NamingModalUI('overworld-hud-container');

  // Lazy-instantiated secondary modal controllers (zero DOM allocation on boot)
  let _boxManagementUI: BoxManagementUI | null = null;
  const getBoxManagementUI = () => {
    if (!_boxManagementUI) _boxManagementUI = new BoxManagementUI('modal-container');
    return _boxManagementUI;
  };
  const boxManagementUI = {
    isOpen: () => _boxManagementUI?.isOpen() ?? false,
    open: (...args: Parameters<BoxManagementUI['open']>) => getBoxManagementUI().open(...args),
    close: () => _boxManagementUI?.close(),
  };

  let _townMapUI: TownMapUI | null = null;
  const getTownMapUI = () => {
    if (!_townMapUI) _townMapUI = new TownMapUI({ containerId: 'modal-container' });
    return _townMapUI;
  };
  const townMapUI = {
    isOpen: () => _townMapUI?.isOpen() ?? false,
    open: (...args: Parameters<TownMapUI['open']>) => getTownMapUI().open(...args),
    close: () => _townMapUI?.close(),
    handleKeyDown: (e: KeyboardEvent) => _townMapUI?.handleKeyDown(e) ?? false,
  };

  let _ruinsPuzzleModalUI: RuinsPuzzleModalUI | null = null;
  const getRuinsPuzzleModalUI = () => {
    if (!_ruinsPuzzleModalUI) _ruinsPuzzleModalUI = new RuinsPuzzleModalUI('modal-container');
    return _ruinsPuzzleModalUI;
  };
  const ruinsPuzzleModalUI = {
    isOpen: () => _ruinsPuzzleModalUI?.isOpen() ?? false,
    open: (...args: Parameters<RuinsPuzzleModalUI['open']>) => getRuinsPuzzleModalUI().open(...args),
    close: () => _ruinsPuzzleModalUI?.close(),
  };

  const dayCareManager = new DayCareManager(existingSave?.dayCare);
  let _dayCareModalUI: DayCareModalUI | null = null;
  const getDayCareModalUI = () => {
    if (!_dayCareModalUI) _dayCareModalUI = new DayCareModalUI(dayCareManager, 'modal-container');
    return _dayCareModalUI;
  };
  const dayCareModalUI = {
    isOpen: () => _dayCareModalUI?.isOpen() ?? false,
    open: (...args: Parameters<DayCareModalUI['open']>) => getDayCareModalUI().open(...args),
    close: () => _dayCareModalUI?.close(),
  };

  let _deptStoreElevatorUI: DeptStoreElevatorUI | null = null;
  const getDeptStoreElevatorUI = () => {
    if (!_deptStoreElevatorUI) _deptStoreElevatorUI = new DeptStoreElevatorUI('modal-container');
    return _deptStoreElevatorUI;
  };
  const deptStoreElevatorUI = {
    isOpen: () => _deptStoreElevatorUI?.isOpen() ?? false,
    open: (...args: Parameters<DeptStoreElevatorUI['open']>) => getDeptStoreElevatorUI().open(...args),
    close: () => _deptStoreElevatorUI?.close(),
  };

  let _radioTowerQuizUI: RadioTowerQuizUI | null = null;
  const getRadioTowerQuizUI = () => {
    if (!_radioTowerQuizUI) _radioTowerQuizUI = new RadioTowerQuizUI('modal-container');
    return _radioTowerQuizUI;
  };
  const radioTowerQuizUI = {
    isOpen: () => _radioTowerQuizUI?.isOpen() ?? false,
    open: (...args: Parameters<RadioTowerQuizUI['open']>) => getRadioTowerQuizUI().open(...args),
    close: () => _radioTowerQuizUI?.close(),
  };

  const bugContestManager = new BugContestManager(existingSave?.bugContestRecords);
  const stadiumArenaManager = new StadiumArenaManager();
  const bugContestHUD = new BugContestHUDWidget('overworld-hud-container');
  const kurtCraftingManager = new KurtCraftingManager(existingSave?.kurtCraftingOrder);
  const visitedMaps = new Set<string>([initialMapId]);

  const getApricornCount = (apricornId: string): number => {
    const normUnderscore = apricornId.toLowerCase().replace(/-/g, '_');
    const normHyphen = apricornId.toLowerCase().replace(/_/g, '-');
    return (
      (inventory.berries?.[normUnderscore] || 0) +
      (inventory.berries?.[normHyphen] || 0) +
      ((inventory as any).items?.[normUnderscore] || 0) +
      ((inventory as any).items?.[normHyphen] || 0) +
      ((inventory as any).apricorns?.[normUnderscore] || 0) +
      ((inventory as any).apricorns?.[normHyphen] || 0)
    );
  };

  const deductApricorn = (apricornId: string, quantity: number): void => {
    const normUnderscore = apricornId.toLowerCase().replace(/-/g, '_');
    const normHyphen = apricornId.toLowerCase().replace(/_/g, '-');
    let remaining = quantity;
    const buckets = [inventory.berries, (inventory as any).items, (inventory as any).apricorns];
    for (const bucket of buckets) {
      if (!bucket || remaining <= 0) continue;
      for (const key of [normUnderscore, normHyphen]) {
        if (bucket[key]) {
          const take = Math.min(bucket[key], remaining);
          bucket[key] -= take;
          remaining -= take;
          if (bucket[key] <= 0) delete bucket[key];
          if (remaining <= 0) break;
        }
      }
    }
  };

  let handleInteract = () => {};
  let toggleLiveItemfinderRadar = (): boolean => false;

  const getCaughtSpeciesSet = () =>
    new Set([...playerParty.map((p) => p.speciesId), ...boxManager.flatten().map((p) => p.speciesId)]);

  let overworldHUD: OverworldHUD;
  let battleRenderer: BattleRenderer;
  let battleHUD: BattleHUD;

  const setBattleSpeed = (speed: SpeedMultiplier): SpeedMultiplier => {
    gameClock.battleSpeed = speed;
    gameOptions.battleSpeedMultiplier = speed;
    if (battleRenderer) battleRenderer.setSpeedMultiplier(speed);
    if (battleHUD) battleHUD.setSpeedMultiplier(speed);
    void saveCurrentGame();
    return speed;
  };

  const cycleBattleSpeed = (): SpeedMultiplier => {
    const nextSpeed: SpeedMultiplier = gameClock.battleSpeed === 1 ? 2 : gameClock.battleSpeed === 2 ? 3 : 1;
    return setBattleSpeed(nextSpeed);
  };

  const setTextSpeed = (speed: GameOptions['textSpeed']): GameOptions['textSpeed'] => {
    gameOptions.textSpeed = speed;
    if (overworldHUD) overworldHUD.setTextSpeed(speed);
    if (battleHUD) battleHUD.setTextSpeed(speed);
    void saveCurrentGame();
    return speed;
  };

  const cycleTextSpeed = (): GameOptions['textSpeed'] => {
    const speeds: Array<GameOptions['textSpeed']> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
    const current = gameOptions.textSpeed ?? 'MID';
    const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
    return setTextSpeed(speeds[nextIdx]);
  };

  const cyclePlayerSpeed = (): SpeedMultiplier => {
    const newSpeed = gameClock.cyclePlayerSpeed();
    gameOptions.playerSpeedDefault = newSpeed;
    bagUI.setSpeedMultiplier(newSpeed);
    partyUI.setSpeedMultiplier(newSpeed);
    startMenuUI.setSpeedMultiplier(newSpeed);
    if (overworldHUD) overworldHUD.updateSpeedDisplay(newSpeed);
    eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
    return newSpeed;
  };

  const startMenuUI = new StartMenuUI(
    'modal-container',
    {
      getTrainerName: () => playerName,
      getMoney: () => inventory.money,
      getBadges: () => inventory.badges,
      getPartyCount: () => playerParty.length,
      getCaughtCount: () => getCaughtSpeciesSet().size,
      getCaughtSpeciesIds: () => getCaughtSpeciesSet(),
      getSeenSpeciesIds: () => {
        const set = new Set(seenSpecies);
        for (const id of getCaughtSpeciesSet()) set.add(id);
        return set;
      },
      getKeyItems: () => {
        const items = ['POKéGEAR'];
        if (storyFlags.has('HAS_MYSTERY_EGG') && !storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
          items.push('🥚 MYSTERY EGG');
        }
        if (storyFlags.has('HAS_POKEDEX')) items.push('📕 POKéDEX');
        if (storyFlags.has('has_squirtbottle')) items.push('💧 SQUIRTBOTTLE');
        if (storyFlags.has('has_secret_potion')) items.push('💊 SECRETPOTION');
        return items;
      },
      getPlayTimeSeconds: () => playTimeSeconds,
      getMapName: () => mapManager.getCurrentMap()?.name || 'New Bark Town',
      isMuted: () => audioManager.isMuted(),
      getSpeedMultiplier: () => gameClock.playerSpeed,
      getBattleSpeedMultiplier: () => gameClock.battleSpeed,
      getTextSpeed: () => gameOptions.textSpeed ?? 'MID',
      isGamepadActive: () => overworldHUD?.isGamepadActive() ?? false,
      getTouchControlStyle: () => overworldHUD?.getTouchControlStyle() ?? gameOptions.touchControlStyle ?? 'DPAD',
      getExpShareMode: () => gameOptions.expShare ?? 'CAPPED',
      getEncounterRateMode: () => mapManager.getEncounterRateMode(),
      getAutoHm: () => gameOptions.autoHm ?? true,
      getCrtScanlines: () => displayThemeManager.isCrtEnabled(),
      getGbcPalette: () => displayThemeManager.getPalette(),
      getLowHpBeep: () => gameOptions.lowHpBeepEnabled ?? true,
      getChiptuneMode: () => audioManager.isChiptuneMode(),
      getBugContestLeaderboard: () => bugContestManager.getTopLeaderboard(5),
      getBugContestPersonalBest: () => bugContestManager.getPersonalBestRecord(),
    },
    {
      onOpenParty: () => {
        bagUI.hide();
        partyUI.open();
      },
      onOpenBag: () => {
        partyUI.hide();
        bagUI.open('ITEMS');
      },
      onOpenPokegear: () => {
        partyUI.hide();
        bagUI.hide();
        missionLogUI.hide();
        if (!storyFlags.has('has_map_card')) {
          overworldHUD.showToast(
            "⚠️ Your POKéGEAR doesn't have a MAP CARD installed yet! Talk to the GUIDE GENT in CHERRYGROVE CITY."
          );
          return;
        }
        townMapUI.open(mapManager.getCurrentMap()?.id || initialMapId, visitedMaps, roamingManager.getAllRoamers());
      },
      onOpenTownMapAtLandmark: (landmarkId: string) => {
        partyUI.hide();
        bagUI.hide();
        missionLogUI.hide();
        townMapUI.open(
          mapManager.getCurrentMap()?.id || initialMapId,
          visitedMaps,
          roamingManager.getAllRoamers(),
          landmarkId
        );
      },
      onOpenMissions: () => {
        partyUI.hide();
        bagUI.hide();
        missionManager.checkStoryFlags(storyFlags);
        missionLogUI.open();
      },
      onLaunchStadiumBattle: (challengerId: string, cupId: string) => {
        launchStadiumChallenge(challengerId, cupId);
      },
      onSaveGame: async () => {
        await saveCurrentGame();
      },
      onToggleMute: () => {
        const muted = audioManager.toggleMute();
        overworldHUD.updateMuteDisplay(muted);
        return muted;
      },
      onCycleSpeed: () => {
        return cyclePlayerSpeed();
      },
      onCycleBattleSpeed: () => {
        return cycleBattleSpeed();
      },
      onSetBattleSpeed: (spd: SpeedMultiplier) => {
        return setBattleSpeed(spd);
      },
      onCycleTextSpeed: () => {
        return cycleTextSpeed();
      },
      onSetTextSpeed: (spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
        return setTextSpeed(spd);
      },
      onToggleGamepad: () => {
        return overworldHUD.toggleGamepad();
      },
      onToggleTouchControlStyle: () => {
        const nextStyle = overworldHUD.toggleTouchControlStyle();
        gameOptions.touchControlStyle = nextStyle;
        saveCurrentGame();
        return nextStyle;
      },
      onCycleExpShareMode: () => {
        const modes: ExpShareMode[] = ['OFF', 'ALL', 'CAPPED'];
        const current = gameOptions.expShare ?? 'CAPPED';
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        gameOptions.expShare = next;
        saveCurrentGame();
        return next;
      },
      onSetExpShareMode: (mode: ExpShareMode) => {
        gameOptions.expShare = mode;
        saveCurrentGame();
        return mode;
      },
      onSetEncounterRateMode: (mode: EncounterRateMode) => {
        gameOptions.encounterRateMode = mode;
        mapManager.setEncounterRateMode(mode);
        saveCurrentGame();
        return mode;
      },
      onToggleAutoHm: (enabled: boolean) => {
        gameOptions.autoHm = enabled;
        const surfCheck = ModernHMHandler.checkSurf(inventory, storyFlags, playerParty);
        mapManager.setSurfEnabled(enabled && surfCheck.canUse);
        saveCurrentGame();
        overworldHUD.showToast(
          enabled ? '🌊 Auto-HM Mode: ON (Unbound Style)' : '💬 Auto-HM Mode: OFF (Classic Prompts)'
        );
        return enabled;
      },
      onToggleCrtScanlines: () => {
        const next = displayThemeManager.toggleCrtScanlines();
        gameOptions.crtScanlines = next;
        saveCurrentGame();
        return next;
      },
      onSetGbcPalette: (palette: GbcPaletteMode) => {
        const next = displayThemeManager.setPalette(palette);
        gameOptions.gbcPalette = next;
        saveCurrentGame();
        return next;
      },
      onToggleLowHpBeep: (enabled: boolean) => {
        gameOptions.lowHpBeepEnabled = enabled;
        BattleAudio.setLowHpBeepEnabled(enabled);
        saveCurrentGame();
        return enabled;
      },
      onToggleChiptuneMode: (enabled: boolean) => {
        gameOptions.chiptuneMode = enabled;
        audioManager.setChiptuneMode(enabled);
        saveCurrentGame();
        return enabled;
      },
    }
  );

  bagUI.setSpeedMultiplier(gameClock.playerSpeed);
  partyUI.setSpeedMultiplier(gameClock.playerSpeed);
  startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

  const isAnyOverworldModalOpen = () =>
    gameState === 'TITLE' ||
    startMenuUI.isOpen() ||
    partyUI.isOpen() ||
    bagUI.isOpen() ||
    missionLogUI.isOpen() ||
    boxManagementUI.isOpen() ||
    namingModalUI.isOpen() ||
    townMapUI.isOpen() ||
    ruinsPuzzleModalUI.isOpen() ||
    dayCareModalUI.isOpen() ||
    deptStoreElevatorUI.isOpen() ||
    radioTowerQuizUI.isOpen();

  overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => {
      return cyclePlayerSpeed();
    },
    onMuteToggle: () => {
      return audioManager.toggleMute();
    },
    onMenuToggle: () => {
      if (dayCareModalUI.isOpen()) {
        dayCareModalUI.close();
        return;
      }
      if (ruinsPuzzleModalUI.isOpen()) {
        ruinsPuzzleModalUI.close();
        return;
      }
      if (boxManagementUI.isOpen()) {
        boxManagementUI.close();
        return;
      }
      if (missionLogUI.isOpen()) {
        missionLogUI.hide();
        return;
      }
      if (partyUI.isOpen()) {
        partyUI.hide();
        return;
      }
      if (bagUI.isOpen()) {
        bagUI.hide();
        return;
      }
      startMenuUI.toggle();
    },
    onPartyOpen: () => {
      startMenuUI.closeAll();
      bagUI.hide();
      partyUI.open();
    },
    onBagOpen: () => {
      startMenuUI.closeAll();
      partyUI.hide();
      bagUI.open('ITEMS');
    },
    onMartOpen: () => {
      startMenuUI.closeAll();
      partyUI.hide();
      bagUI.openMart();
    },
    onSaveGame: () => {
      saveCurrentGame();
    },
    onInteract: () => {
      handleInteract();
    },
    onRadarToggle: () => {
      return toggleLiveItemfinderRadar();
    },
    isModalOpen: isAnyOverworldModalOpen,
  });
  overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
  overworldHUD.setTouchControlStyle(gameOptions.touchControlStyle || 'DPAD');
  overworldHUD.setTextSpeed(gameOptions.textSpeed ?? 'MID');
  overworldHUD.updateMuteDisplay(audioManager.isMuted());
  overworldHUD.updateRouteName(initialMap.name);
  overworldHUD.updatePokegear(roamingManager.getAllRoamers());
  overworldHUD.hide();

  missionManager.setCallbacks({
    onMissionUnlocked: (mission) => {
      overworldHUD.showMissionToast(mission.title, mission.summary, 'unlocked');
    },
    onMissionAdvanced: (mission, step) => {
      overworldHUD.showMissionToast(mission.title, step.description, 'progress');
    },
    onMissionCompleted: (mission) => {
      BattleAudio.playOverworldSound('KEY_ITEM');
      overworldHUD.showMissionToast(mission.title, 'All objectives completed!', 'completed');
    },
  });

  window.updateLoaderProgress?.(40, 'Mounting overworld engine...');
  const overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer, {
    startPercent: 40,
    endPercent: 72,
    concurrency: 6,
    onProgress: (snap) => {
      window.updateLoaderProgress?.(snap.percent, snap.currentLabel);
    },
  });
  overworldRenderer.setPlayerGender(playerGender);
  const lookupMap = (id: string) => mapManager.getMap(id);

  const getActiveMapNpcs = (mapId: string): GridEntity[] =>
    activeNpcCache.getActiveNpcs(
      mapId,
      npcsByMap[mapId],
      storyFlags,
      isNpcActiveForStoryFlags
    );

  const resetMapNpcsToOrigin = (mapId: string) => {
    if (npcsByMap[mapId]) {
      npcsByMap[mapId] = applyMapNpcStoryMutations(
        mapId,
        npcsByMap[mapId],
        storyFlags,
        defeatedTrainers
      );
    }
    activeNpcCache.invalidate(mapId);
  };

  mapManager.setNpcLifecycleCallbacks({
    onMapLoaded: (map) => {
      resetMapNpcsToOrigin(map.id);
      getActiveMapNpcs(map.id);
    },
    onMapEvicted: (mapId) => {
      activeNpcCache.invalidate(mapId);
    },
  });

  overworldRenderer.setNpcLookup((id) => getActiveMapNpcs(id));
  resetMapNpcsToOrigin(initialMap.id);

  const detectChosenStarterSpecies = (): 'cyndaquil' | 'totodile' | 'chikorita' | undefined => {
    if (storyFlags.has('starter_cyndaquil')) return 'cyndaquil';
    if (storyFlags.has('starter_totodile')) return 'totodile';
    if (storyFlags.has('starter_chikorita')) return 'chikorita';
    const allOwned = [...playerParty.map((p) => p.speciesId), ...playerBox.map((p) => p.speciesId), ...Array.from(seenSpecies)];
    if (allOwned.some((id) => id === 'totodile' || id === 'croconaw' || id === 'feraligatr')) return 'totodile';
    if (allOwned.some((id) => id === 'chikorita' || id === 'bayleef' || id === 'meganium')) return 'chikorita';
    if (allOwned.some((id) => id === 'cyndaquil' || id === 'quilava' || id === 'typhlosion')) return 'cyndaquil';
    return undefined;
  };

  const applyMapStoryMutations = (map: MapData | null) => {
    if (!map) return;
    if (map.id === 'ilex_forest' && storyFlags.has('ilex_tree_cut')) {
      map.collisionGrid[25 * map.width + 8] = 0;
      if (map.tileMap) {
        map.tileMap[25 * map.width + 8] = 'in_forest_05_05_05_05';
      }
    }
  };

  const syncMapOverworldItems = (map: MapData | null) => {
    if (!map) return;
    applyMapStoryMutations(map);
    const itemBalls = [...overworldItemManager.getActiveItemBalls(map.id)];
    if (map.id === 'elms_lab') {
      itemBalls.push(...OverworldItemManager.getStarterBallsForLab(storyFlags, detectChosenStarterSpecies()));
    }
    overworldRenderer.renderOverworldItems(
      itemBalls,
      overworldItemManager.getFruitTreesForMap(map.id),
      new Set(overworldItemManager.getHarvestedTreeIds())
    );
  };

  await overworldRenderer.ensureMapTilesLoaded(initialMap, lookupMap, {
    startPercent: 72,
    endPercent: 95,
    concurrency: 8,
    onProgress: (snap) => {
      window.updateLoaderProgress?.(snap.percent, snap.currentLabel);
    },
  });
  applyMapStoryMutations(initialMap);
  overworldRenderer.renderMap(initialMap, lookupMap);
  syncMapOverworldItems(initialMap);

  window.updateLoaderProgress?.(97, 'Initializing battle engine...');
  battleRenderer = new BattleRenderer(overworldRenderer.app);
  battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
  battleHUD = new BattleHUD('battle-hud-container');
  battleHUD.setSpeedMultiplier(gameClock.battleSpeed);
  battleHUD.setTextSpeed(gameOptions.textSpeed ?? 'MID');
  window.updateLoaderProgress?.(100, 'Ready!');
  window.dismissLoader?.();

  // 5b. Mount Professor Oak Intro Sequence (Ticket 4.3) & Title Screen UI (Ticket 4.2)
  const introSequenceUI = new IntroSequenceUI('modal-container', {
    onComplete: async ({ name, gender }) => {
      // Set created character profile & walk sprite sheet
      playerName = name;
      playerGender = gender;
      overworldRenderer.setPlayerGender(gender);

      // Reset fresh adventure state (Starter chosen at Elm's Lab - Ticket 6.1)
      playTimeSeconds = 0;
      playerParty.length = 0;
      playerBox.length = 0;
      inventory.balls = {
        'quick-ball': 5,
        'fast-ball': 5,
        'net-ball': 5,
        'ultra-ball': 10,
        'great-ball': 15,
        'poke-ball': 30,
        'master-ball': 1,
      };
      inventory.items = {
        potion: 5,
        'super-potion': 2,
        antidote: 3,
        'parlyz-heal': 2,
        awakening: 2,
        revive: 1,
      };
      inventory.tms = ['TM54', 'TM73', 'TM99'];
      inventory.berries = {};
      inventory.keyItems = [];
      inventory.money = 3000;
      inventory.badges = [];
      defeatedTrainers.clear();
      storyFlags.clear();
      seenSpecies.clear();
      rivalName = 'SILVER';
      boxManager.getState().boxes.forEach((b) => b.pokemon.fill(null));
      boxManager.changeBox(0);
      playerBox = [];
      overworldItemManager.setCollectedFlags([]);
      overworldItemManager.setFruitTreePicks({});
      const freshNpcs = createNpcsByMap();
      npcsByMap.mr_pokemons_house = freshNpcs.mr_pokemons_house;
      npcsByMap.new_bark_town = freshNpcs.new_bark_town;
      npcsByMap.cherrygrove_city = freshNpcs.cherrygrove_city;
      npcsByMap.route_36 = freshNpcs.route_36;
      npcsByMap.elms_lab = freshNpcs.elms_lab;
      npcsByMap.azalea_town = freshNpcs.azalea_town;
      npcsByMap.slowpoke_well_b1f = freshNpcs.slowpoke_well_b1f;
      npcsByMap.union_cave_b2f = freshNpcs.union_cave_b2f;
      roamingManager.sleepBeasts();
      missionManager.deserialize(new MissionManager().serialize());

      gameClock.playerSpeed = gameOptions.playerSpeedDefault;
      overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
      bagUI.setSpeedMultiplier(gameClock.playerSpeed);
      partyUI.setSpeedMultiplier(gameClock.playerSpeed);
      startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

      // Spawn in Player's 2F Bedroom at (7, 1) facing DOWN
      const startMap = mapManager.setCurrentMap('players_house_2f');
      player.x = 7;
      player.y = 1;
      player.targetX = 7;
      player.targetY = 1;
      player.renderX = 7;
      player.renderY = 1;
      player.direction = 'DOWN';
      player.isMoving = false;
      player.progress = 0;

      await overworldRenderer.ensureMapTilesLoaded(startMap, lookupMap);
      overworldRenderer.renderMap(startMap, lookupMap);
      syncMapOverworldItems(startMap);
      overworldHUD.updateRouteName(startMap.name);
      overworldHUD.updatePokegear(roamingManager.getAllRoamers());
      await saveCurrentGame();

      gameState = 'OVERWORLD';
      overworldHUD.show();
      audioManager.playMapBgm(startMap.id, 0.6);
    },
  });

  const titleScreenUI = new TitleScreenUI('modal-container', initialSavePreview, gameOptions, {
    onUnlockAudio: async () => {
      await audioManager.unlockAudio();
    },
    onContinue: async () => {
      titleScreenUI.hide();
      overworldRenderer.setPlayerGender(playerGender);
      gameState = 'OVERWORLD';
      overworldHUD.show();
      const activeMap = mapManager.getCurrentMap();
      if (activeMap) {
        overworldHUD.updateRouteName(activeMap.name);
        audioManager.playMapBgm(activeMap.id, 0.6);
      }
    },
    onNewGame: async () => {
      // Note: Previous save is not deleted upon starting New Game; it is only replaced when the player saves the new game.
      titleScreenUI.hide();
      introSequenceUI.start();
    },
    onOptionsChanged: (updatedOptions) => {
      gameOptions = updatedOptions;
      audioManager.setBgmVolume(updatedOptions.bgmVolume);
      audioManager.setSfxVolume(updatedOptions.soundVolume);
      gameClock.playerSpeed = updatedOptions.playerSpeedDefault;
      if (updatedOptions.battleSpeedMultiplier) {
        setBattleSpeed(updatedOptions.battleSpeedMultiplier);
      }
      if (updatedOptions.textSpeed) {
        setTextSpeed(updatedOptions.textSpeed);
      }
      if (updatedOptions.touchControlStyle) {
        overworldHUD.setTouchControlStyle(updatedOptions.touchControlStyle);
      }
      if (updatedOptions.crtScanlines !== undefined) {
        displayThemeManager.setCrtScanlines(updatedOptions.crtScanlines);
      }
      if (updatedOptions.gbcPalette) {
        displayThemeManager.setPalette(updatedOptions.gbcPalette);
      }
      if (updatedOptions.lowHpBeepEnabled !== undefined) {
        BattleAudio.setLowHpBeepEnabled(updatedOptions.lowHpBeepEnabled);
      }
      if (updatedOptions.chiptuneMode !== undefined) {
        audioManager.setChiptuneMode(updatedOptions.chiptuneMode);
      }
      overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
      bagUI.setSpeedMultiplier(gameClock.playerSpeed);
      partyUI.setSpeedMultiplier(gameClock.playerSpeed);
      startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);
    },
  });

  // Support Shift key to cycle Battle Speed while in Battle mode, and Start Menu / Overworld keyboard navigation
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !e.repeat && gameState === 'BATTLE') {
      battleHUD.triggerSpeedToggle();
      return;
    }
    if (gameState === 'OVERWORLD') {
      if (townMapUI.isOpen()) {
        townMapUI.handleKeyDown(e);
        return;
      }
      if (missionLogUI.isOpen()) {
        missionLogUI.handleKeyDown(e);
        return;
      }
      if (startMenuUI.isOpen()) {
        startMenuUI.handleKeyDown(e);
        return;
      }
      if (!isAnyOverworldModalOpen() && !overworldHUD.isDialogueOpen() && !isCutsceneLocked && !e.repeat) {
        if (startMenuUI.triggerShortcut(e.code, false)) {
          e.preventDefault();
        }
      }
    }
  });

  // Helper to heal the player's party to full HP, PP, and clear status (Ticket 6.3 Nurse Joy jingle)
  const healPlayerParty = (playSound: boolean = true) => {
    if (playSound) {
      BattleAudio.playOverworldSound('HEAL_JINGLE');
    }
    for (const pkmn of playerParty) {
      pkmn.currentHp = pkmn.stats.hp;
      pkmn.status = 'NONE';
      pkmn.isTrapped = false;
      for (const m of pkmn.moves) {
        m.currentPp = m.maxPp;
      }
    }
  };

  // 6. Initialize Entities
  const player: GridEntity = {
    id: 'player',
    x: initialPlayerX,
    y: initialPlayerY,
    targetX: initialPlayerX,
    targetY: initialPlayerY,
    renderX: initialPlayerX,
    renderY: initialPlayerY,
    direction: initialPlayerDir,
    isMoving: false,
    progress: 0,
    isPlayer: true,
  };

  const npcsByMap: Record<string, GridEntity[]> = createNpcsByMap();

  if (storyFlags.has('sudowoodo_cleared') && npcsByMap.route_36) {
    npcsByMap.route_36 = npcsByMap.route_36.filter((n) => n.id !== 'sudowoodo');
  }
  if (
    (storyFlags.has('HAS_MYSTERY_EGG') ||
      storyFlags.has('mystery_egg_received') ||
      storyFlags.has('rival_1_defeated') ||
      storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') ||
      storyFlags.has('EVENT_RIVAL_NAMED')) &&
    npcsByMap.new_bark_town
  ) {
    npcsByMap.new_bark_town = npcsByMap.new_bark_town.filter((n) => n.id !== 'nbt_rival');
  }
  if (storyFlags.has('has_map_card') && npcsByMap.cherrygrove_city) {
    npcsByMap.cherrygrove_city = npcsByMap.cherrygrove_city.filter((n) => n.id !== 'cg_guide_gent');
  }
  if ((storyFlags.has('HAS_MYSTERY_EGG') || storyFlags.has('HAS_POKEDEX')) && npcsByMap.mr_pokemons_house) {
    npcsByMap.mr_pokemons_house = npcsByMap.mr_pokemons_house.filter((n) => n.id !== 'prof_oak_npc');
  }
  if ((!storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') || storyFlags.has('EVENT_RIVAL_NAMED')) && npcsByMap.elms_lab) {
    npcsByMap.elms_lab = npcsByMap.elms_lab.filter((n) => n.id !== 'lab_police_officer');
  }
  // Recover existing saves where Executive Proton was defeated via line-of-sight before story flags were set
  if (defeatedTrainers.has('executive_proton') && !storyFlags.has('slowpoke_well_cleared')) {
    storyFlags.add('proton_defeated');
    storyFlags.add('slowpoke_well_cleared');
    if (!storyFlags.has('EVENT_KURT_GAVE_YOU_LURE_BALL')) {
      inventory.balls['lure-ball'] = (inventory.balls['lure-ball'] || 0) + 1;
      storyFlags.add('EVENT_KURT_GAVE_YOU_LURE_BALL');
      storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
    }
  }
  // Recover existing saves where Leader Falkner or Leader Bugsy was defeated via line-of-sight
  if (defeatedTrainers.has('falkner') && !storyFlags.has('falkner_defeated')) {
    storyFlags.add('falkner_defeated');
    storyFlags.add('CAN_USE_FLASH');
    if (!inventory.badges.includes('zephyr')) inventory.badges.push('zephyr');
    if (!inventory.tms.includes('TM31')) inventory.tms.push('TM31');
  }
  if (defeatedTrainers.has('bugsy') && !storyFlags.has('bugsy_defeated')) {
    storyFlags.add('bugsy_defeated');
    storyFlags.add('CAN_USE_CUT');
    if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
    if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
  }
  // Recover existing saves where Farfetch'd was herded before HM01 Cut was awarded
  if (
    (storyFlags.has('EVENT_HERDED_FARFETCHD') || storyFlags.has('forest_farfetchd_herded')) &&
    !storyFlags.has('has_hm01_cut')
  ) {
    storyFlags.add('has_hm01_cut');
    storyFlags.add('EVENT_GOT_HM01_CUT');
    if (!inventory.tms.includes('HM01')) inventory.tms.push('HM01');
    if (!inventory.tms.includes('HM01_CUT')) inventory.tms.push('HM01_CUT');
  }

  const emptyNpcs: GridEntity[] = [];
  const npcObstaclesScratch: GridEntity[] = [];
  const worldNpcsScratch: GridEntity[] = [];

  const populateWorldNpcs = (map: MapData | null): GridEntity[] => {
    worldNpcsScratch.length = 0;
    if (!map) return worldNpcsScratch;

    const currentList = getActiveMapNpcs(map.id);
    for (let i = 0; i < currentList.length; i++) {
      const n = currentList[i];
      n.worldOffsetX = 0;
      n.worldOffsetY = 0;
      worldNpcsScratch.push(n);
    }

    if (map.connections.WEST) {
      const conn = map.connections.WEST;
      const westMap = mapManager.getMap(conn.mapId);
      if (westMap) {
        const westList = getActiveMapNpcs(westMap.id);
        for (let i = 0; i < westList.length; i++) {
          const n = westList[i];
          n.worldOffsetX = -westMap.width;
          n.worldOffsetY = conn.offset;
          worldNpcsScratch.push(n);
        }
      }
    }

    if (map.connections.EAST) {
      const conn = map.connections.EAST;
      const eastMap = mapManager.getMap(conn.mapId);
      if (eastMap) {
        const eastList = getActiveMapNpcs(eastMap.id);
        for (let i = 0; i < eastList.length; i++) {
          const n = eastList[i];
          n.worldOffsetX = map.width;
          n.worldOffsetY = conn.offset;
          worldNpcsScratch.push(n);
        }
      }
    }

    if (map.connections.NORTH) {
      const conn = map.connections.NORTH;
      const northMap = mapManager.getMap(conn.mapId);
      if (northMap) {
        const northList = getActiveMapNpcs(northMap.id);
        for (let i = 0; i < northList.length; i++) {
          const n = northList[i];
          n.worldOffsetX = conn.offset;
          n.worldOffsetY = -northMap.height;
          worldNpcsScratch.push(n);
        }
      }
    }

    if (map.connections.SOUTH) {
      const conn = map.connections.SOUTH;
      const southMap = mapManager.getMap(conn.mapId);
      if (southMap) {
        const southList = getActiveMapNpcs(southMap.id);
        for (let i = 0; i < southList.length; i++) {
          const n = southList[i];
          n.worldOffsetX = conn.offset;
          n.worldOffsetY = map.height;
          worldNpcsScratch.push(n);
        }
      }
    }

    return worldNpcsScratch;
  };

  let npcMoveTimer = 0;
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  // Handle Map Border Transition Helper
  const handleMapTransition = (entity: GridEntity) => {
    const current = mapManager.getCurrentMap();
    if (!current) return;

    let nextMapId: string | null = null;
    let targetX = entity.x;
    let targetY = entity.y;

    // Transitioning West
    if (entity.x < 0 && current.connections.WEST) {
      const conn = current.connections.WEST;

      // Prevent leaving New Bark Town into Route 29 without a partner Pokémon (Ticket 6.1)
      if (current.id === 'new_bark_town' && conn.mapId === 'route_29' && playerParty.length === 0) {
        entity.x = 0;
        entity.targetX = 0;
        entity.renderX = 0;
        entity.progress = 0;
        entity.isMoving = false;
        BattleAudio.playOverworldSound('EXCLAMATION');
        overworldHUD.openDialogue(
          [
            `Wait, ${playerName}!`,
            "Wild POKéMON live in tall grass! It's dangerous to go out without a POKéMON of your own!",
            "Visit PROF. ELM's LAB first to receive your partner POKéMON!",
          ],
          "🔬 PROF. ELM'S AIDE"
        );
        return;
      }

      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = nextMap.width - 1;
      targetY -= conn.offset;
      applyMapStoryMutations(nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      syncMapOverworldItems(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning East
    else if (entity.x >= current.width && current.connections.EAST) {
      const conn = current.connections.EAST;
      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = 0;
      targetY -= conn.offset;
      applyMapStoryMutations(nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      syncMapOverworldItems(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning North
    else if (entity.y < 0 && current.connections.NORTH) {
      const conn = current.connections.NORTH;
      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX -= conn.offset;
      targetY = nextMap.height - 1;
      applyMapStoryMutations(nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      syncMapOverworldItems(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning South
    else if (entity.y >= current.height && current.connections.SOUTH) {
      const conn = current.connections.SOUTH;
      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX -= conn.offset;
      targetY = 0;
      applyMapStoryMutations(nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      syncMapOverworldItems(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }

    if (nextMapId) {
      visitedMaps.add(nextMapId);
      missionManager.registerMapEntry(nextMapId, storyFlags);
      resetMapNpcsToOrigin(nextMapId);
      const nextMapObj = mapManager.getMap(nextMapId);
      if (nextMapObj) {
        overworldRenderer.evictDistantTileTextures(nextMapObj, lookupMap);
      }
      entity.x = targetX;
      entity.targetX = targetX;
      entity.renderX = targetX;
      entity.y = targetY;
      entity.targetY = targetY;
      entity.renderY = targetY;

      // Roaming Beast Markov Transition Roll on Route Change
      roamingManager.onPlayerRouteChange(nextMapId);
      eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
      audioManager.playMapBgm(nextMapId, 0.8);

      const roamerOnRoute = roamingManager.getActiveRoamerOnRoute(nextMapId);
      if (roamerOnRoute) {
        overworldHUD.showRoamerAlert(roamerOnRoute.speciesId, nextMapId);
      } else {
        overworldHUD.hideRoamerAlert();
      }

      // Prefetch newly connected neighbor maps in the background and maintain resident LRU cap
      void ensureMapAndNeighborsLoaded(nextMapId).then((loadedMap) => {
        if (loadedMap) {
          mapManager.evictDistantMaps(nextMapId, 16);
          activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(nextMapId));
          overworldRenderer.evictDistantTileTextures(loadedMap, lookupMap);
        }
      });

      // Reset 4-step grace period on route transition
      mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);

      // Autosave on route transition
      saveCurrentGame();
    }
  };

  const getBattleSessionContext = (): BattleSessionContext => ({
    setGameState: (state: 'TITLE' | 'OVERWORLD' | 'BATTLE') => { gameState = state; },
    overworldHUD: { hide: () => overworldHUD.hide(), show: () => overworldHUD.show(), showToast: (msg: string) => overworldHUD.showToast(msg), hideRoamerAlert: () => overworldHUD.hideRoamerAlert() },
    itemfinderHUD: { suspend: () => itemfinderHUD.suspend(), resume: () => itemfinderHUD.resume() },
    player,
    audioManager,
    seenSpecies,
    playerParty,
    playerBox,
    setPlayerBox: (box: PokemonInstance[]) => { playerBox = box; },
    healPlayerParty: (playAnim?: boolean) => healPlayerParty(playAnim),
    battleHUD,
    battleRenderer,
    inventory,
    gameClock,
    gameOptions,
    eventBus,
    mapManager,
    boxManager,
    storyFlags,
    bugContestManager,
    roamingManager,
    missionManager,
    playerName,
    cycleBattleSpeed: () => cycleBattleSpeed(),
    saveCurrentGame: () => saveCurrentGame(),
    respawnAtLastPokecenter: async () => {
      const respawnMapId = mapManager.getMap(lastVisitedPokecenter.mapId) ? lastVisitedPokecenter.mapId : 'new_bark_town';
      const respawnMap = mapManager.setCurrentMap(respawnMapId);
      player.x = player.targetX = player.renderX = lastVisitedPokecenter.x;
      player.y = player.targetY = player.renderY = lastVisitedPokecenter.y;
      player.direction = 'DOWN';
      player.isMoving = false;
      player.progress = 0;
      await overworldRenderer.ensureMapTilesLoaded(respawnMap, lookupMap);
      overworldRenderer.renderMap(respawnMap, lookupMap);
      syncMapOverworldItems(respawnMap);
      overworldHUD.updateRouteName(respawnMap.name);
      audioManager.playMapBgm(respawnMap.id, 0.8);
      overworldHUD.show();
      itemfinderHUD.resume();
      healPlayerParty(false);
      saveCurrentGame();
      if (respawnMap.id.endsWith('_poke_center')) {
        overworldHUD.playHealingAnimation(playerParty.length, () => overworldHUD.showToast('💖 Your party was restored to full HP & PP at the Pokémon Center!'));
      } else {
        overworldHUD.playFieldRestAnimation(() => overworldHUD.showToast('💖 Your party was restored to full HP & PP at home!'));
      }
    },
    promptBugContestSpecimenSwap: async (newCatch: PokemonInstance) => {
      const catchResult = bugContestManager.recordCatch(newCatch);
      if (catchResult.promptSwap && bugContestManager.state.bestCaughtPokemon) {
        new BugContestSpecimenSwapModal('modal-container', {
          currentSpecimen: bugContestManager.state.bestCaughtPokemon,
          newCatch,
          ballsRemaining: bugContestManager.state.ballsRemaining,
          timeRemainingSec: bugContestManager.state.timeRemainingSec,
          onDecision: (choice) => {
            if (choice === 'replace') bugContestManager.swapSpecimen(newCatch); else bugContestManager.keepCurrentSpecimen();
            bugContestHUD.update(bugContestManager.state.ballsRemaining, bugContestManager.state.timeRemainingSec, bugContestManager.state.bestCaughtPokemon);
          },
        });
      } else {
        bugContestHUD.update(bugContestManager.state.ballsRemaining, bugContestManager.state.timeRemainingSec, bugContestManager.state.bestCaughtPokemon);
      }
    },
    playEvolutionScene: (pokemon, targetSpeciesId) => new EvolutionSceneUI('modal-container').play(pokemon, targetSpeciesId),
    openMoveReplacementModal: (pokemon, moveData) => new MoveReplacementModalUI('modal-container').open(pokemon, moveData),
  });

  // 7. Start Battle (Wild, Trainer, or 2v2 Stadium Double Battle)
  const triggerBattle = async (
    initialOpponentPokemon: PokemonInstance,
    options: TriggerBattleOptions = {}
  ): Promise<void> => {
    await BattleSessionController.runBattleSession(
      getBattleSessionContext(),
      initialOpponentPokemon,
      options
    );
  };

  const launchStadiumChallenge = (challengerId: string, cupId: string) => {
    if (gameState !== 'OVERWORLD' || isCutsceneLocked) return;
    if (playerParty.length === 0) {
      overworldHUD.showToast('⚠️ You need at least 1 Pokémon in your party to enter the Stadium Arena!');
      return;
    }

    // Temporarily provide a rental partner if player only has 1 Pokémon for a 2v2 Double Battle
    const cup = stadiumArenaManager.getCupById(cupId);
    const effectiveParty = [...playerParty];
    if (
      (cup?.isDoubleBattle || challengerId !== 'stadium_cal') &&
      effectiveParty.filter((p) => !p.isEgg && p.currentHp > 0).length < 2
    ) {
      const rentalPikachu = PokemonFactory.create('pikachu', effectiveParty[0]?.level || 20, [
        'thundershock',
        'quickattack',
        'swift',
        'thunderwave',
      ]);
      rentalPikachu.nickname = 'PIKACHU (RENTAL)';
      effectiveParty.push(rentalPikachu);
    }

    const battleSetup = stadiumArenaManager.createStadiumBattle(
      effectiveParty,
      challengerId,
      challengerId === 'stadium_weather_lance_clair' ? 'weather_clash_cup' : cupId
    );
    if (!battleSetup) return;

    const { challenger, enemyLead, doubleConfig, rules } = battleSetup;
    const badgeParts: string[] = [cup?.cupName || 'STADIUM CUP'];
    if (rules.weather && rules.weather !== 'NONE') {
      badgeParts.push(`WEATHER: ${rules.weather}`);
    }
    if (rules.itemClause) {
      badgeParts.push('ITEM CLAUSE');
    }

    overworldHUD.openDialogue(
      [`🏟️ ${challenger.name} (${challenger.title}) challenges you under ${rules.cupName || 'Stadium'} rules!`],
      `🏟️ ${challenger.title.toUpperCase()}`,
      () => {
        triggerBattle(enemyLead, {
          isTrainer: true,
          isGymLeader: true,
          trainerName: challenger.name,
          trainerTeam: doubleConfig.enemyPartner
            ? [enemyLead, doubleConfig.enemyPartner]
            : [enemyLead],
          doubleConfig,
          stadiumBadgeLabel: `🏟️ ${badgeParts.join(' • ')}`,
          onVictory: () => {
            inventory.money += challenger.rewardMoney;
            stadiumArenaManager.recordVictory(challenger.id);
            storyFlags.add(`stadium_${challenger.id}_cleared`);
            BattleAudio.playOverworldSound('FANFARE');
            saveCurrentGame();
            overworldHUD.showToast(
              `🏆 Defeated ${challenger.name} in the Stadium Arena! Bonus +$${challenger.rewardMoney}!`
            );
          },
        });
      }
    );
  };

  let isCutsceneLocked = false;

  const getCutsceneContext = (): StoryCutsceneContext => ({
    player,
    storyFlags,
    defeatedTrainers,
    playerParty,
    rivalName,
    playerName,
    audioManager,
    overworldRenderer,
    overworldHUD,
    npcsByMap,
    gameClock,
    mapManager,
    roamingManager,
    triggerBattle,
    buildTrainerTeamInstances,
    handleTrainerDefeatRewards,
    saveCurrentGame,
    setCutsceneLocked: (locked: boolean) => {
      isCutsceneLocked = locked;
    },
  });

  const buildTrainerTeamInstances = (trainer: GridEntity): PokemonInstance[] => {
    return BattleController.buildTrainerTeamInstances(trainer);
  };

  const getOppositeDirection = (dir: Direction): Direction => {
    return BattleController.getOppositeDirection(dir);
  };

  const runTrainerSightSequence = async (trainer: GridEntity) => {
    return BattleController.runTrainerSightSequence(trainer, getCutsceneContext());
  };

  const completeSlowpokeWellProtonVictory = () => {
    defeatedTrainers.add('executive_proton');
    storyFlags.add('proton_defeated');
    storyFlags.add('slowpoke_well_cleared');
    if (npcsByMap.slowpoke_well_b1f) {
      npcsByMap.slowpoke_well_b1f = npcsByMap.slowpoke_well_b1f.filter(
        (n) => !n.id.startsWith('rocket_grunt') && n.id !== 'executive_proton'
      );
    }
    if (npcsByMap.azalea_town) {
      npcsByMap.azalea_town = npcsByMap.azalea_town.filter(
        (n) => n.id !== 'azalea_well_grunt' && n.id !== 'azalea_gym_grunt'
      );
    }
    missionManager.checkStoryFlags(storyFlags);
    overworldHUD.openDialogue(
      [
        "PROTON: You did OK today, but don't think you've stopped us!",
        'TEAM ROCKET will never give up! Retreat!',
        'The Rocket Grunts and Executive Proton scrambled out of the cavern!',
        "KURT: Way to go! Team Rocket has taken off! Let's get out of here.",
      ],
      '⚡ EXECUTIVE PROTON',
      () => {
        overworldHUD.playFieldRestAnimation(() => {
          healPlayerParty(false);
          const kurtMap = mapManager.setCurrentMap('kurts_house');
          player.x = 3;
          player.y = 4;
          player.targetX = 3;
          player.targetY = 4;
          player.renderX = 3;
          player.renderY = 4;
          player.direction = 'UP';
          overworldRenderer.renderMap(kurtMap, lookupMap);
          syncMapOverworldItems(kurtMap);
          overworldHUD.updateRouteName(kurtMap.name);
          audioManager.playMapBgm(kurtMap.id, 0.8);

          inventory.balls['lure-ball'] = (inventory.balls['lure-ball'] || 0) + 1;
          storyFlags.add('EVENT_KURT_GAVE_YOU_LURE_BALL');
          storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
          missionManager.checkStoryFlags(storyFlags);
          BattleAudio.playOverworldSound('KEY_ITEM');
          overworldHUD.openDialogue(
            [
              "KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You're a wonderful trainer!",
              'Take this LURE BALL as a token of my gratitude!',
              `${playerName} received a LURE BALL from KURT!`,
              "KURT: Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
            ],
            '👴 KURT',
            () => {
              saveCurrentGame();
              overworldHUD.showToast('⚡ Rescued the Slowpoke & received LURE BALL from Kurt!');
            }
          );
        });
      }
    );
  };

  const handleTrainerDefeatRewards = (trainer: GridEntity) => {
    if (
      trainer.id === 'executive_proton' ||
      trainer.trainerId === 'executive_proton' ||
      trainer.action === 'PROTON_EVENT'
    ) {
      completeSlowpokeWellProtonVictory();
      return;
    }
    if (
      trainer.id === 'bugsy' ||
      trainer.trainerId === 'bugsy' ||
      trainer.action === 'BUGSY_EVENT'
    ) {
      defeatedTrainers.add('bugsy');
      storyFlags.add('bugsy_defeated');
      storyFlags.add('CAN_USE_CUT');
      if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
      if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
      missionManager.checkStoryFlags(storyFlags);
      missionManager.completeMission('M03');
      audioManager.playSfx('sfx_badge_get');
      BattleAudio.playOverworldSound('KEY_ITEM');
      overworldHUD.openDialogue(
        [
          "BUGSY: Whoa, amazing! You're an expert on POKéMON! My research isn't complete yet… OK, you win. Take this BADGE.",
          `${playerName} received the HIVEBADGE from BUGSY!`,
          "BUGSY: If you have the HIVEBADGE, POKéMON up to Lv. 30 will obey you without question! POKéMON that know CUT can also chop down small trees outside of battle! Here, take TM49 FURY CUTTER too!",
        ],
        trainer.speaker || '🐞 LEADER BUGSY',
        () => {
          saveCurrentGame();
          overworldHUD.showToast('🐞 Received HIVE BADGE & TM49 FURY CUTTER from Leader Bugsy!');
        }
      );
      return;
    }
    if (trainer.trainerId === 'camper_todd') {
      storyFlags.add('TODD_REGISTERED');
      overworldHUD.showToast("📱 Registered Todd's number in Pokégear!");
      saveCurrentGame();
    } else if (trainer.trainerId === 'picnicker_gina') {
      storyFlags.add('GINA_REGISTERED');
      overworldHUD.showToast("📱 Registered Gina's number in Pokégear!");
      saveCurrentGame();
    } else if (trainer.trainerId === 'cooltrainer_kate') {
      if (!storyFlags.has('KATE_DEFEATED_REWARD')) {
        storyFlags.add('KATE_DEFEATED_REWARD');
        if (!inventory.items) inventory.items = {};
        inventory.items['soft_sand'] = (inventory.items['soft_sand'] || 0) + 1;
        BattleAudio.playOverworldSound('KEY_ITEM');
        overworldHUD.showToast('✨ Received SOFT SAND from Cooltrainer Kate!');
        saveCurrentGame();
      }
    }

    // Reset line-of-sight trainer back to origin coordinates upon defeat so paths/corridors stay unblocked
    if (
      trainer.originX !== undefined &&
      trainer.originY !== undefined &&
      (trainer.x !== trainer.originX || trainer.y !== trainer.originY)
    ) {
      trainer.x = trainer.originX;
      trainer.y = trainer.originY;
      trainer.gridX = trainer.originX;
      trainer.gridY = trainer.originY;
      trainer.targetX = trainer.originX;
      trainer.targetY = trainer.originY;
      trainer.renderX = trainer.originX;
      trainer.renderY = trainer.originY;
      if (trainer.originDirection) {
        trainer.direction = trainer.originDirection;
      }
      trainer.isMoving = false;
      trainer.progress = 0;
    }
  };

  /**
   * Executes the 1:1 authentic Gen 2 Cherrygrove City Guide Gent Scripted Walking Tour:
   * Leg 1: (32, 6) -> Pokemon Center (29, 5) facing UP; Player follows to (30, 5) facing UP. Stop 1 dialogue.
   * Leg 2: Pokemon Center -> Poke Mart (23, 5) facing UP; Player follows to (24, 5) facing UP. Stop 2 dialogue.
   * Leg 3: Poke Mart -> Route 30 road (16, 5) facing UP; Player follows to (17, 5) facing UP. Stop 3 dialogue.
   * Leg 4: Route 30 -> The Sea (10, 7) facing LEFT; Player follows to (10, 6) facing LEFT. Stop 4 dialogue.
   * Leg 5: The Sea -> Guide Gent's House porch (25, 11) facing LEFT; Player arrives at (24, 11) facing RIGHT. Stop 5 gift dialogue, awards Map Card.
   * Leg 6: Guide Gent enters house at (25, 9) with DOOR sound. Despawns from Cherrygrove City. Unlocks isCutsceneLocked = false.
   */
  const runGuideGentWalkingTour = async (guide: GridEntity) => {
    return StoryCutscenes.runGuideGentWalkingTour(guide, getCutsceneContext());
  };

  const executeWarpTransition = async (warp: WarpEvent) => {
    const currentM = mapManager.getCurrentMap();
    if (!currentM) return;

    let targetMapExists = mapManager.getMap(warp.targetMapId);
    if (!targetMapExists) {
      targetMapExists = await ensureMapAndNeighborsLoaded(warp.targetMapId);
    }
    if (!targetMapExists) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          'The way ahead is closed for construction!',
          'Workers and road crews are currently preparing this route. Please check back later!',
        ],
        '🚧 ROADBLOCK'
      );
      return;
    }

    if (warp.targetMapId === 'azalea_gym' && !storyFlags.has('slowpoke_well_cleared')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          'The GYM door is firmly locked!',
          'A notice on the door says: "GYM temporarily closed due to disturbance in SLOWPOKE WELL."',
        ],
        '🔒 AZALEA GYM'
      );
      return;
    }

    if (
      warp.targetMapId === 'slowpoke_well_b1f' &&
      !storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') &&
      !storyFlags.has('slowpoke_well_cleared')
    ) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
        ],
        '⚡ ROCKET GRUNT'
      );
      return;
    }

    if (
      warp.targetMapId === 'ruins_of_alph_inner_chamber' &&
      !storyFlags.has('unown_awakened_kabuto')
    ) {
      // The stone floor has not collapsed into a trapdoor hole yet
      return;
    }

    if (warp.targetMapId === 'ecruteak_gym' && !storyFlags.has('beasts_awakened')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          'The GYM door is firmly locked!',
          'A note on the door reads: "LEADER MORTY is currently investigating ancient phenomena at the BURNED TOWER."',
        ],
        '🔒 ECRUTEAK GYM'
      );
      return;
    }

    if (
      warp.targetMapId === 'burned_tower_b1f' &&
      !storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')
    ) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          "SILVER: Hey, hold it right there! You're not going down that hole before me!",
        ],
        '❓ RIVAL SILVER'
      );
      return;
    }

    if (
      currentM.id === 'azalea_town' &&
      warp.targetMapId === 'ilex_forest' &&
      !storyFlags.has('azalea_rival_defeated')
    ) {
      player.isMoving = false;
      player.progress = 0;
      if (!storyFlags.has('slowpoke_well_cleared') && !storyFlags.has('bugsy_defeated')) {
        isCutsceneLocked = false;
        BattleAudio.playMenuSound('CANCEL');
        overworldHUD.openDialogue(
          [
            'TEAM ROCKET is causing a commotion in AZALEA TOWN!',
            'Visit KURT in his house and help clear SLOWPOKE WELL before venturing into ILEX FOREST!',
          ],
          '🌲 ILEX FOREST GATE'
        );
        return;
      }
      triggerAzaleaRivalAmbush();
      return;
    }

    // Elite Four Chambers & Tin Tower Progression Gating
    if (warp.targetMapId === 'wills_room' && (inventory.badges.length < 8 && !storyFlags.has('clair_defeated'))) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['GUARD: You cannot challenge the ELITE FOUR until you have conquered all 8 JOHTO GYMS and earned their BADGES!'],
        '👮 LEAGUE GUARD'
      );
      return;
    }

    if (warp.targetMapId === 'kogas_room' && !storyFlags.has('will_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR WILL to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'brunos_room' && !storyFlags.has('koga_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR KOGA to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'karens_room' && !storyFlags.has('bruno_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR BRUNO to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'lances_room' && !storyFlags.has('karen_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the CHAMPION\'S chamber remains firmly shut! Defeat ELITE FOUR KAREN to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'tin_tower_1f' && !storyFlags.has('has_clear_bell') && !storyFlags.has('radio_tower_liberated')) {
      player.isMoving = false;
      player.progress = 0;
      isCutsceneLocked = false;
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['WISE SAGE: Tin Tower is forbidden to all unless they bear the sacred CLEAR BELL!'],
        '🏮 WISE SAGE'
      );
      return;
    }

    const previousMapId = currentM.id;
    const transitionConfig = mapManager.resolveWarpTransition(warp);

    player.isMoving = false;
    player.progress = 0;
    isCutsceneLocked = true;
    BattleAudio.playWarpSound(transitionConfig.soundCue);

    overworldRenderer
      .playDoorwayFade(async () => {
        await ensureMapAndNeighborsLoaded(transitionConfig.targetMapId);
        const targetMap = mapManager.setCurrentMap(transitionConfig.targetMapId);
        visitedMaps.add(targetMap.id);
        missionManager.registerMapEntry(targetMap.id, storyFlags);
        resetMapNpcsToOrigin(targetMap.id);
        if (targetMap.id.endsWith('_poke_center')) {
          lastVisitedPokecenter = {
            mapId: targetMap.id,
            x: transitionConfig.landingX,
            y: Math.max(2, transitionConfig.landingY - 1),
          };
        }
        player.direction = transitionConfig.landingFacing;
        player.x = transitionConfig.landingX;
        player.y = transitionConfig.landingY;
        player.targetX = transitionConfig.landingX;
        player.targetY = transitionConfig.landingY;
        player.renderX = transitionConfig.landingX;
        player.renderY = transitionConfig.landingY;

        // Strictly await 100% texture hydration while transition veil is 100% black (BUGFIX-ASYNC-TILE-TEXTURE-FADE-SYNC-01)
        await overworldRenderer.ensureMapTilesLoaded(targetMap, lookupMap);
        applyMapStoryMutations(targetMap);
        overworldRenderer.renderMap(targetMap, lookupMap);
        overworldRenderer.evictDistantTileTextures(targetMap, lookupMap);
        mapManager.evictDistantMaps(targetMap.id, 16);
        activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(targetMap.id));
        syncMapOverworldItems(targetMap);
        overworldHUD.updateRouteName(targetMap.name);
        audioManager.playMapBgm(targetMap.id, 0.8);
      }, transitionConfig.fadeDurationMs)
      .then(() => {
        isCutsceneLocked = false;

        // Trigger Prof. Elm's emergency Pokégear phone call upon stepping out of Mr. Pokémon's House with the Mystery Egg
        if (
          previousMapId === 'mr_pokemons_house' &&
          storyFlags.has('HAS_MYSTERY_EGG') &&
          !storyFlags.has('ELM_CALLED_ABOUT_THEFT')
        ) {
          storyFlags.add('ELM_CALLED_ABOUT_THEFT');
          BattleAudio.playOverworldSound('PHONE_RING');
          overworldHUD.openDialogue(
            [
              '📻 *BEEP! BEEP! Your POKéGEAR is ringing!*',
              "PROF. ELM: H-hello? GOLD? It's a disaster here at the LAB!",
              'A red-haired boy broke in! Please bring that MYSTERY EGG back to NEW BARK TOWN when you can!',
            ],
            '📻 PROF. ELM (POKéGEAR)',
            () => {
              saveCurrentGame();
            }
          );
        }
      });
  };

  const handleRuinsPuzzleSolve = (_puzzleId: string) => {
    storyFlags.add('unown_awakened_kabuto');
    storyFlags.add('EVENT_SOLVED_KABUTO_PUZZLE');
    storyFlags.add('EVENT_MADE_UNOWN_APPEAR_IN_RUINS');

    // Screen shake tremor
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.classList.add('screen-shake');
      setTimeout(() => canvas.classList.remove('screen-shake'), 1200);
    }
    BattleAudio.playWarpSound('CAVE_WARP');

    overworldHUD.openDialogue(
      [
        'The ancient stone tiles clicked perfectly into place!',
        'A rumbling tremor shakes the chamber!',
        'The stone floor collapsed beneath your feet!',
      ],
      '🏛️ RUINS OF ALPH',
      () => {
        executeWarpTransition({
          x: 4,
          y: 6,
          targetMapId: 'ruins_of_alph_inner_chamber',
          targetX: 10,
          targetY: 11,
          direction: 'DOWN',
        });
        setTimeout(() => {
          overworldHUD.showToast('There is a strange presence here…');
        }, 500);
        saveCurrentGame();
      }
    );
  };

  const refreshItemfinderRadar = (playSonar: boolean = true) => {
    if (!itemfinderHUD.isActive()) return;
    const currentMap = mapManager.getCurrentMap();
    if (!currentMap) return;
    const hiddenItems = overworldItemManager.getHiddenItemsForMap(currentMap.id, storyFlags);
    const ping = ItemfinderRadar.scan(
      player.x,
      player.y,
      player.direction,
      hiddenItems,
      storyFlags
    );
    itemfinderHUD.update(ping);
    if (playSonar && ping.hasItemInRange) {
      BattleAudio.playItemfinderSonar(ping.distance, ping.isFacingDirectly);
    }
  };

  const getFieldObstacleContext = (): FieldObstacleContext => ({
    playerName,
    playerParty,
    inventory,
    storyFlags,
    player,
    mapManager,
    overworldItemManager,
    missionManager,
    visitedMaps,
    roamingManager,
    detectChosenStarterSpecies,
    openStarterChoiceModal: (speciesId, name, type, onConfirm, onCancel) => overworldHUD.openStarterChoiceModal(speciesId, name, type, onConfirm, onCancel),
    openDialogue: (pages, speaker, onComplete) => overworldHUD.openDialogue(pages, speaker, onComplete),
    showToast: (msg) => overworldHUD.showToast(msg),
    openPcStorage: () => boxManagementUI.open(playerParty, boxManager.getState(), { onSave: () => saveCurrentGame(), onClose: () => saveCurrentGame() }),
    openTownMap: (mapId, visited, roamers) => townMapUI.open(mapId, visited, roamers),
    openRuinsPuzzleModal: (callbacks) => ruinsPuzzleModalUI.open(callbacks),
    handleRuinsPuzzleSolve,
    openMart: () => bagUI.openMart(),
    healPlayerParty: (playAnim) => healPlayerParty(playAnim),
    playHealingAnimation: (partyCount) => overworldHUD.playHealingAnimation(partyCount),
    playFieldRestAnimation: () => overworldHUD.playFieldRestAnimation(),
    playFlashEffect: () => overworldRenderer.playFlashEffect(),
    playCutSlashEffect: (x, y) => overworldRenderer.playCutSlashEffect(x, y),
    addOverworldItemToInventory,
    removeItemBall: (eventFlag) => overworldRenderer.removeItemBall(eventFlag),
    syncMapOverworldItems,
    refreshItemfinderRadar: (playSonar) => refreshItemfinderRadar(playSonar),
    saveCurrentGame,
    renderMap: (map) => overworldRenderer.renderMap(map, lookupMap),
    setSurfEnabled: (enabled) => mapManager.setSurfEnabled(enabled),
    triggerBattle,
    isItemfinderActive: () => itemfinderHUD.isActive(),
  });

  const npcInteractionRouter = createDefaultNpcInteractionRouter();

  const getNpcInteractionContext = (): NpcInteractionContext => ({
    playerName,
    playerParty,
    inventory,
    storyFlags,
    defeatedTrainers,
    player,
    npcsByMap,
    mapManager,
    gameClock,
    audioManager,
    missionManager,
    bugContestManager,
    dayCareManager,
    kurtCraftingManager,
    boxManager,
    lastVisitedPokecenter,
    setLastVisitedPokecenter: (loc) => { lastVisitedPokecenter = loc; },
    openDialogue: (pages, speaker, onComplete) => overworldHUD.openDialogue(pages, speaker, onComplete),
    showToast: (msg) => overworldHUD.showToast(msg),
    healPlayerParty: (playAnim) => healPlayerParty(playAnim),
    playHealingAnimation: (partyCount, onComplete) => overworldHUD.playHealingAnimation(partyCount, onComplete),
    playFieldRestAnimation: (onComplete) => overworldHUD.playFieldRestAnimation(onComplete),
    saveCurrentGame,
    openMart: () => bagUI.openMart(),
    openPcStorage: () => boxManagementUI.open(playerParty, boxManager.getState(), { onSave: () => saveCurrentGame(), onClose: () => saveCurrentGame() }),
    openTownMap: (mapId, visited, roamers) => townMapUI.open(mapId, visited, roamers),
    addOverworldItemToInventory,
    renderMap: (map) => overworldRenderer.renderMap(map, lookupMap),
    syncMapOverworldItems,
    setSurfEnabled: (enabled) => mapManager.setSurfEnabled(enabled),
    openDayCareModal: () => {
      dayCareModalUI.open({
        onClose: () => {},
        onDeposit: (pkmn) => {
          if (pkmn.isEgg) return false;
          if (playerParty.length <= 1) return false;
          const slotIdx = dayCareManager.deposit(pkmn);
          if (slotIdx >= 0) {
            const idx = playerParty.indexOf(pkmn);
            if (idx >= 0) playerParty.splice(idx, 1);
            saveCurrentGame();
            return true;
          }
          return false;
        },
        onWithdraw: (slotIdx) => {
          const slot = dayCareManager.getSlot(slotIdx);
          if (!slot) return null;
          const fee = DayCareManager.calculateFee(slot);
          if (inventory.money < fee || playerParty.length >= 6) return null;
          inventory.money -= fee;
          const pkmn = dayCareManager.withdraw(slotIdx);
          if (pkmn) {
            playerParty.push(pkmn);
            saveCurrentGame();
          }
          return pkmn;
        },
        onCollectEgg: () => {
          if (playerParty.length >= 6) return null;
          const egg = dayCareManager.collectEgg();
          if (egg) {
            playerParty.push(egg);
            saveCurrentGame();
            overworldHUD.showToast('🥚 Received an Egg from the Day-Care!');
          }
          return egg;
        },
        getPlayerMoney: () => inventory.money,
        getPlayerParty: () => playerParty,
      });
    },
    openNamingModal: (_title, defaultName, onConfirm) => {
      namingModalUI.open({ onConfirm }, defaultName);
    },
    openDeptElevatorModal: (currentMapId, onSelectFloor) => {
      deptStoreElevatorUI.open({
        currentMapId,
        onSelectFloor: (floor) => onSelectFloor(floor.mapId),
        onClose: () => {},
      });
    },
    openRadioTowerQuizModal: (callbacks) => {
      radioTowerQuizUI.open({
        onComplete: callbacks.onComplete,
        onClose: () => {},
      });
    },
    openKurtCraftingModal: (callbacks) => {
      new KurtCraftingModalUI('modal-container', {
        getApricornCount,
        onSubmitOrder: (apricornId, quantity) => {
          deductApricorn(apricornId, quantity);
          kurtCraftingManager.placeOrder(apricornId, quantity);
          storyFlags.add('ENGINE_KURT_MAKING_BALLS');
          callbacks.onOrderPlaced();
          BattleAudio.playOverworldSound('KEY_ITEM');
          overworldHUD.showToast(`Kurt accepted ${quantity}x Apricorn!`);
          saveCurrentGame();
          overworldHUD.openDialogue(
            [
              "KURT: Now that my granddaughter is helping me, I can work much faster.",
              "I'll get to hammering right away! Check back soon!",
            ],
            '👴 KURT'
          );
        },
        onClose: () => {},
      });
    },
    openKyleTradeModal: (callbacks) => {
      const existingTradeModal = document.getElementById('kyle-trade-confirm-modal');
      existingTradeModal?.remove();
      const tradeModal = document.createElement('div');
      tradeModal.id = 'kyle-trade-confirm-modal';
      tradeModal.style.cssText = 'position: fixed; inset: 0; background: rgba(2, 6, 23, 0.78); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 95; pointer-events: auto;';
      tradeModal.innerHTML = '<div style="width: 380px; max-width: 92vw; background: rgba(15, 23, 42, 0.98); border: 3px solid #38bdf8; border-radius: 14px; padding: 20px; color: #f8fafc; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85); display: flex; flex-direction: column; gap: 14px;"><div style="font-size: 16px; font-weight: 900; color: #38bdf8;">🔄 KYLE\'S POKéMON TRADE</div><div style="font-size: 13px; line-height: 1.5; color: #e2e8f0;">Trade your <strong>BELLSPROUT</strong> for Kyle\'s <strong>ONIX (\"ROCKY\")</strong> holding a Bitter Berry?</div><div style="display: flex; gap: 10px;"><button id="kyle-trade-yes-btn" style="flex: 1; background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer;">YES, TRADE</button><button id="kyle-trade-no-btn" style="flex: 1; background: #334155; color: #f8fafc; border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer;">NO THANKS</button></div></div>';
      document.body.appendChild(tradeModal);
      tradeModal.querySelector('#kyle-trade-yes-btn')?.addEventListener('click', () => {
        tradeModal.remove();
        callbacks.onConfirm();
      });
      tradeModal.querySelector('#kyle-trade-no-btn')?.addEventListener('click', () => {
        tradeModal.remove();
        callbacks.onCancel();
      });
    },
    shakeScreen: (durationMs = 400) => {
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.classList.add('screen-shake');
        setTimeout(() => canvas.classList.remove('screen-shake'), durationMs);
      }
    },
    mountBugContestHUD: (balls, timeSec) => bugContestHUD.mount(balls, timeSec),
    destroyBugContestHUD: () => bugContestHUD.destroy(),
    executeWarpTransition: (warp) => executeWarpTransition(warp),
    triggerBattle,
    buildTrainerTeamInstances,
    handleTrainerDefeatRewards,
    getOppositeDirection,
    launchStadiumChallenge,
    runGuideGentWalkingTour,
    triggerBeastsAwakeningCutscene: () => triggerBeastsAwakeningCutscene(),
    triggerBurnedTowerRivalBattle: () => triggerBurnedTowerRivalBattle(),
    triggerAzaleaRivalAmbush: () => triggerAzaleaRivalAmbush(),
    triggerCherrygroveRivalAmbush: () => triggerCherrygroveRivalAmbush(),
    triggerSlowpokeWellGruntIntercept: (grunt) => triggerSlowpokeWellGruntIntercept(grunt),
    setCutsceneLocked: (locked) => { isCutsceneLocked = locked; },
    getCutsceneContext,
  });

  handleInteract = () => {
    if (gameState !== 'OVERWORLD' || isCutsceneLocked || player.isMoving || overworldHUD.isDialogueOpen()) return;
    const currentMap = mapManager.getCurrentMap();
    if (!currentMap) return;

    const { dx, dy } = GridPhysics.getDirectionDelta(player.direction);
    const facingX = player.x + dx;
    const facingY = player.y + dy;
    const acrossX = player.x + dx * 2;
    const acrossY = player.y + dy * 2;

    // 1. Check NPCs on current or connected neighbor maps (direct facing tile or across a counter)
    const visibleWorldNpcs = populateWorldNpcs(currentMap);
    for (let i = 0; i < visibleWorldNpcs.length; i++) {
      const targetNpc = visibleWorldNpcs[i];
      const npcWorldX = targetNpc.x + (targetNpc.worldOffsetX || 0);
      const npcWorldY = targetNpc.y + (targetNpc.worldOffsetY || 0);
      const isDirect = npcWorldX === facingX && npcWorldY === facingY;
      const isAcrossCounter =
        targetNpc.talkAcrossCounter === true && npcWorldX === acrossX && npcWorldY === acrossY;

      if (isDirect || isAcrossCounter) {
        npcInteractionRouter.dispatch(targetNpc, currentMap, getNpcInteractionContext());
        return;
      }
    }

    if (FieldObstacleDispatcher.handleFieldAndBgInteraction(getFieldObstacleContext(), currentMap, facingX, facingY)) {
      return;
    }
  };

  toggleLiveItemfinderRadar = (): boolean => {
    if (gameState !== 'OVERWORLD' || isCutsceneLocked || overworldHUD.isDialogueOpen()) {
      return itemfinderHUD.isActive();
    }
    const active = itemfinderHUD.toggle();
    overworldHUD.updateRadarDisplay(active);
    if (active) {
      refreshItemfinderRadar(true);
      const ping = itemfinderHUD.getLastPing();
      if (!ping?.hasItemInRange) {
        BattleAudio.playItemfinderSonar(null, false);
      }
    } else {
      BattleAudio.playMenuSound('CANCEL');
    }
    return active;
  };

  triggerItemfinderScan = () => {
    if (gameState !== 'OVERWORLD' || isCutsceneLocked || overworldHUD.isDialogueOpen()) return;
    const currentMap = mapManager.getCurrentMap();
    if (!currentMap) return;
    itemfinderHUD.show();
    overworldHUD.updateRadarDisplay(true);
    const hiddenItems = overworldItemManager.getHiddenItemsForMap(currentMap.id, storyFlags);
    const ping = ItemfinderRadar.scan(player.x, player.y, player.direction, hiddenItems, storyFlags);
    itemfinderHUD.update(ping);
    BattleAudio.playItemfinderSonar(ping.distance, ping.isFacingDirectly);
    const result = overworldItemManager.scanItemfinder(currentMap.id, player.x, player.y, 8);
    if (result && result.direction) {
      overworldHUD.openDialogue(
        [`Yes! ITEMFINDER indicates there's an item nearby! It's ${result.direction}!`],
        '📡 ITEMFINDER'
      );
    } else {
      overworldHUD.openDialogue(["... ... Nope! There's no response."], '📡 ITEMFINDER');
    }
  };

  let lastBumpSoundTime = 0;
  const handlePlayerBump = () => {
    const now = performance.now();
    if (now - lastBumpSoundTime > 260) {
      lastBumpSoundTime = now;
      BattleAudio.playOverworldSound('BUMP');
    }
  };

  const stepNeighborNpcs = (
    neighborMapId: string | undefined,
    triggerNewWanderStep: boolean,
    dtWorld: number
  ): void => {
    if (!neighborMapId) return;
    const neighborMap = mapManager.getMap(neighborMapId);
    const neighborNpcs = neighborMap ? getActiveMapNpcs(neighborMap.id) : undefined;
    if (!neighborMap || !neighborNpcs) return;

    mapManager.setNeighborScratchMap(neighborMap);
    for (let i = 0; i < neighborNpcs.length; i++) {
      const npcEntity = neighborNpcs[i];
      if (!npcEntity.wanders) continue;

      const desiredDir =
        triggerNewWanderStep && !npcEntity.isMoving && Math.random() < 0.55
          ? directions[Math.floor(Math.random() * 4)]
          : null;

      GridPhysics.updateEntity(
        npcEntity,
        dtWorld,
        desiredDir,
        mapManager.isWalkableInNeighborBounds,
        mapManager.getTileType,
        undefined,
        neighborNpcs
      );
    }
    mapManager.setNeighborScratchMap(null);
  };

  // Scripted Story Cutscenes (StoryCutscenes.ts domain controller)
  const triggerSlowpokeWellGruntIntercept = async (grunt: GridEntity) => {
    return StoryCutscenes.triggerSlowpokeWellGruntIntercept(grunt, getCutsceneContext());
  };

  const triggerAzaleaRivalAmbush = () => {
    StoryCutscenes.triggerAzaleaRivalAmbush(getCutsceneContext());
  };

  const triggerCherrygroveRivalAmbush = () => {
    StoryCutscenes.triggerCherrygroveRivalAmbush(getCutsceneContext());
  };

  const triggerBurnedTowerRivalBattle = () => {
    StoryCutscenes.triggerBurnedTowerRivalBattle(getCutsceneContext());
  };

  const triggerBeastsAwakeningCutscene = () => {
    StoryCutscenes.triggerBeastsAwakeningCutscene(getCutsceneContext());
  };

  const isTileWalkableForPlayer = (x: number, y: number): boolean => {
    if (!mapManager.isWalkable(x, y)) return false;
    const activeMap = mapManager.getCurrentMap();
    if (activeMap && overworldItemManager.isSolidObstacle(activeMap.id, x, y, storyFlags)) {
      return false;
    }
    return true;
  };

  const isTileWalkableForActiveMapNpc = (x: number, y: number): boolean => {
    if (!mapManager.isWalkableInBounds(x, y)) return false;
    const activeMap = mapManager.getCurrentMap();
    if (activeMap && overworldItemManager.isSolidObstacle(activeMap.id, x, y, storyFlags)) {
      return false;
    }
    return true;
  };

  // 8. Decoupled Main Ticker Loop & Visibility Throttling
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        overworldRenderer.app.ticker.stop();
      } else {
        overworldRenderer.app.ticker.start();
      }
    });
  }

  overworldRenderer.app.ticker.add((ticker) => {
    const rawDeltaSec = ticker.deltaMS / 1000;
    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);
    if (gameState !== 'TITLE') {
      playTimeSeconds += dtWorld;
    }
    const currentMap = mapManager.getCurrentMap();
    const isOutdoor = mapManager.isCurrentMapOutdoor();
    const currentTimeOfDay = gameClock.getTimeOfDay();
    overworldRenderer.updateAmbientLighting(currentTimeOfDay, isOutdoor);

    if (gameState === 'OVERWORLD') {
      // Active NPCs on this map retrieved via O(1) memoized story-flag cache (zero per-frame array allocation)
      const activeNpcs = currentMap ? getActiveMapNpcs(currentMap.id) : emptyNpcs;

      const heldDir = isCutsceneLocked ? null : overworldHUD.getHeldDirection();

      GridPhysics.updateEntity(
        player,
        dtPlayer,
        heldDir,
        isTileWalkableForPlayer,
        mapManager.getTileType,
        (_entity, coord, tileType) => {
          handleMapTransition(player);

          // Check Building Door Warps (Poké Center, Poké Mart, Elm's Lab, Houses, Gatehouses) with smooth fade & Safe Warp Interceptor
          const warp = mapManager.checkWarp(coord);
          if (warp) {
            // Directional Threshold (N/S/E/W Gatehouse and Entrance Carpets):
            const reqDir = currentMap ? MapManager.getRequiredWarpDirection(warp, currentMap) : null;
            if (reqDir && player.direction !== reqDir) {
              return;
            }

            executeWarpTransition(warp);
            return;
          }

          // Passerby Rival 1 Ambush (Cherrygrove City East Exit)
          if (
            currentMap?.id === 'cherrygrove_city' &&
            coord.x >= 37 &&
            coord.y >= 5 &&
            coord.y <= 8 &&
            storyFlags.has('HAS_MYSTERY_EGG') &&
            !storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED')
          ) {
            triggerCherrygroveRivalAmbush();
            return;
          }

          // Azalea Town West Gate Rival 2 Ambush
          if (
            currentMap?.id === 'azalea_town' &&
            coord.x <= 4 &&
            (coord.y === 10 || coord.y === 11) &&
            (storyFlags.has('slowpoke_well_cleared') || storyFlags.has('bugsy_defeated')) &&
            !storyFlags.has('azalea_rival_defeated')
          ) {
            triggerAzaleaRivalAmbush();
            return;
          }

          // Slowpoke Well B1F: First Team Rocket Grunt Approaches & Blocks Corridor Path
          if (
            currentMap?.id === 'slowpoke_well_b1f' &&
            (coord.x === 14 || coord.x === 15) &&
            coord.y <= 10 &&
            !defeatedTrainers.has('rocket_grunt_1') &&
            !storyFlags.has('slowpoke_well_cleared')
          ) {
            const wellNpcs = getActiveMapNpcs('slowpoke_well_b1f');
            const grunt1 = wellNpcs.find((n) => n.id === 'rocket_grunt_1');
            if (grunt1) {
              triggerSlowpokeWellGruntIntercept(grunt1);
              return;
            }
          }

          // Burned Tower 1F Rival Ambush
          if (
            currentMap?.id === 'burned_tower_1f' &&
            coord.x === 10 &&
            coord.y === 10 &&
            !storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')
          ) {
            triggerBurnedTowerRivalBattle();
            return;
          }

          // Burned Tower B1F Beasts Awakening Cutscene
          if (
            currentMap?.id === 'burned_tower_b1f' &&
            coord.y <= 6 &&
            coord.x >= 8 &&
            coord.x <= 12 &&
            !storyFlags.has('beasts_awakened')
          ) {
            triggerBeastsAwakeningCutscene();
            return;
          }

          // Ecruteak Gym Invisible Floor Pitfall Maze
          if (currentMap?.id === 'ecruteak_gym' && coord.y >= 4 && coord.y <= 15) {
            if (!isEcruteakGymSafeTile(coord.x, coord.y)) {
              BattleAudio.playOverworldSound('BUMP');
              player.x = ECRUTEAK_GYM_RESPAWN.x;
              player.y = ECRUTEAK_GYM_RESPAWN.y;
              player.direction = ECRUTEAK_GYM_RESPAWN.direction;
              overworldHUD.showToast('Whoa! Stepped off the invisible path! Returned to entrance.');
              return;
            }
          }

          // Tall Grass Rustle FX + Sound
          if (tileType === 2) {
            overworldRenderer.spawnGrassRustle(coord.x, coord.y);
            BattleAudio.playOverworldSound('RUSTLE');
          }

          // Live Unbound-Style Itemfinder Radar Step Sweep
          if (itemfinderHUD.isActive()) {
            refreshItemfinderRadar(true);
          }

          // Advance Day-Care growth & egg checks
          dayCareManager.onStepTaken();

          // Step-based Egg Hatching (Ticket 5.4 & TICKET-WORLD-ROUTE34-DAYCARE-01)
          for (let i = 0; i < playerParty.length; i++) {
            const p = playerParty[i];
            if (p.isEgg && typeof p.eggSteps === 'number') {
              p.eggSteps--;
              if (p.eggSteps <= 0) {
                p.isEgg = false;
                p.eggSteps = 0;

                const oddEggMoves: Record<string, string[]> = {
                  pichu: ['thundershock', 'charm', 'dizzypunch'],
                  cleffa: ['pound', 'charm', 'dizzypunch'],
                  igglybuff: ['sing', 'charm', 'dizzypunch'],
                  tyrogue: ['tackle', 'dizzypunch'],
                  smoochum: ['pound', 'lick', 'dizzypunch'],
                  elekid: ['quickattack', 'leer', 'dizzypunch'],
                  magby: ['ember', 'leer', 'dizzypunch'],
                };

                const isOdd = p.isOddEgg || Boolean(oddEggMoves[p.speciesId]);
                const hatchSpecies = p.speciesId || (isOdd ? 'pichu' : 'togepi');
                const movesToSet = isOdd
                  ? oddEggMoves[hatchSpecies] || ['tackle', 'dizzypunch']
                  : ['metronome', 'charm'];

                if (!isOdd) {
                  p.nickname = 'TOGEPI';
                } else {
                  p.nickname = hatchSpecies.toUpperCase();
                }
                p.moves = movesToSet.map((m) => {
                  const d = PokemonFactory.getMoveData(m);
                  return { moveId: m, currentPp: d.pp, maxPp: d.pp };
                });

                const hatchedTemplate = PokemonFactory.create(hatchSpecies, 1, movesToSet);
                p.baseStats = hatchedTemplate.baseStats;
                p.stats = hatchedTemplate.stats;
                p.currentHp = hatchedTemplate.stats.hp;
                seenSpecies.add(hatchSpecies);

                player.isMoving = false;
                player.progress = 0;
                BattleAudio.playCry(hatchSpecies);
                BattleAudio.playOverworldSound('KEY_ITEM');

                const hatchMsg = isOdd
                  ? `Huh? The EGG hatched! ... A lively ${p.nickname} hatched from the ODD EGG! It knows DIZZY PUNCH!`
                  : 'Huh? The EGG hatched! ... A lively TOGEPI hatched from the EGG!';

                overworldHUD.openDialogue(
                  [hatchMsg],
                  '🥚 MYSTERY EGG',
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast(`🐣 ${p.nickname} hatched from the Egg!`);
                  }
                );
                return;
              }
            }
          }

          // Check Line-of-Sight Trainer Encounters on active map
          const latestMap = mapManager.getCurrentMap();
          const latestNpcs = latestMap ? getActiveMapNpcs(latestMap.id) : emptyNpcs;
          const spottedTrainer = GridPhysics.checkTrainerLineOfSight(
            player,
            latestNpcs,
            defeatedTrainers,
            mapManager.getTileType
          );
          if (spottedTrainer) {
            if (spottedTrainer.id === 'officer_keith' && gameClock.getTimeOfDay() !== 'NIGHT') {
              // Officer Keith only challenges at night
            } else {
              runTrainerSightSequence(spottedTrainer);
              return;
            }
          }

          // Decrement active Repel step counter and alert when it expires
          const repelStepStatus = mapManager.decrementRepelStep();
          if (repelStepStatus.expiredJustNow) {
            BattleAudio.playMenuSound('CANCEL');
            overworldHUD.showToast("🛡️ Repel's effect wore off!");
          }

          // Wild Encounter Check in Tall Grass (2), Surfing Water (3), or Cave / Dungeon / Forest floors (0)
          const canEncounter = latestMap
            ? MapManager.canTriggerWildEncounter(latestMap.id, tileType)
            : false;

          if (canEncounter && playerParty.length > 0) {
            // In ruins_of_alph_inner_chamber, encounters only occur once Unown are awakened
            if (
              latestMap?.id === 'ruins_of_alph_inner_chamber' &&
              !storyFlags.has('unown_awakened_kabuto')
            ) {
              // Chamber is quiet until puzzle is solved
            } else {
              const roamer = latestMap ? roamingManager.getActiveRoamerOnRoute(latestMap.id) : undefined;
              const encounter = mapManager.rollWildEncounter(
                tileType,
                roamer?.speciesId,
                Math.random,
                currentTimeOfDay
              );

              if (encounter) {
                console.log(`[Wild Encounter] Wild ${encounter.speciesId} (Lv. ${encounter.level}) appeared!`);
                // Use persistent Roamer instance if encountering a Legendary Beast (Specification 4.4.3)
                const wildPkmn =
                  encounter.isRoamer && roamer
                    ? roamer.pokemon
                    : PokemonFactory.create(encounter.speciesId, encounter.level);
                triggerBattle(wildPkmn, { isRoamer: encounter.isRoamer });
              }
            }
          }
        },
        activeNpcs,
        () => {
          BattleAudio.playOverworldSound('HOP');
        },
        () => {
          handlePlayerBump();
        }
      );

      // Directional Doorway Threshold (including players standing idle on a warp tile e.g. at (4, 0)):
      // If player is standing on an indoor doorway/carpet warp and pressing toward the exit edge, trigger egress warp
      if (!player.isMoving && !isCutsceneLocked && heldDir && currentMap) {
        const currentTileWarp = mapManager.checkWarp({ x: player.x, y: player.y });
        if (currentTileWarp) {
          const reqDir = MapManager.getRequiredWarpDirection(currentTileWarp, currentMap);
          if (!reqDir || heldDir === reqDir) {
            executeWarpTransition(currentTileWarp);
          }
        }
      }

      // Update NPCs with dtWorld (strictly 1.0x world speed), colliding with player and staying in bounds
      if (!overworldHUD.isDialogueOpen() && !isCutsceneLocked) {
        npcMoveTimer += dtWorld;
        const triggerNewWanderStep = npcMoveTimer > 1.8;
        if (triggerNewWanderStep) {
          npcMoveTimer = 0;
        }

        // Populate shared obstacle scratch array with player + all active NPCs (zero allocation)
        npcObstaclesScratch.length = 0;
        npcObstaclesScratch.push(player);
        for (let i = 0; i < activeNpcs.length; i++) {
          npcObstaclesScratch.push(activeNpcs[i]);
        }

        for (let i = 0; i < activeNpcs.length; i++) {
          const npcEntity = activeNpcs[i];
          if (!npcEntity.wanders) continue;

          const desiredDir =
            triggerNewWanderStep && !npcEntity.isMoving && Math.random() < 0.55
              ? directions[Math.floor(Math.random() * 4)]
              : null;

          GridPhysics.updateEntity(
            npcEntity,
            dtWorld,
            desiredDir,
            isTileWalkableForActiveMapNpc,
            mapManager.getTileType,
            undefined,
            npcObstaclesScratch
          );
        }

        // Also update wandering NPCs on connected West/East/North/South neighbor maps at 1.0x world time (zero closure allocations)
        stepNeighborNpcs(currentMap?.connections.WEST?.mapId, triggerNewWanderStep, dtWorld);
        stepNeighborNpcs(currentMap?.connections.EAST?.mapId, triggerNewWanderStep, dtWorld);
        stepNeighborNpcs(currentMap?.connections.NORTH?.mapId, triggerNewWanderStep, dtWorld);
        stepNeighborNpcs(currentMap?.connections.SOUTH?.mapId, triggerNewWanderStep, dtWorld);
      }

      // Render active & connected map NPCs after any border/warp transitions during this tick (viewport-culled)
      const mapAfterMove = mapManager.getCurrentMap();
      const npcsToRender = populateWorldNpcs(mapAfterMove);
      overworldRenderer.update(player, npcsToRender, dtWorld);
    }
  });

  // 9. Always-Available Top-Right GitHub Issue Report Button with Clipboard Screenshot
  // Provides github-screenshot-download-link ('SAVE SCREENSHOT PNG') and github-issues-redirect-link ('OPEN GITHUB ISSUE')
  const uiOverlay = document.getElementById('ui-overlay') || document.body;
  mountGitHubReportButton({
    uiOverlay,
    mapManager,
    player,
    getGameState: () => gameState,
    inventory,
    playerParty,
  });

  window.syncGitHubIssues = syncGitHubIssues;

  console.log('⚡ Crystal Overdrive Vertical Slice 100% playable & booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
