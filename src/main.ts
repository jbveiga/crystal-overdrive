/**
 * @fileoverview Application bootstrap, engine initialization, and top-level lifecycle coordination.
 * @module main
 * @role Application Root Coordinator
 * @exports bootstrap
 * @layer core
 * @sections L1-7: Micro-Header & Types | L8-372: Core Implementation | L373-744: Public Interface & Exports
 */

import { GameClock } from './core/GameClock';
import { eventBus } from './core/EventBus';
import { AssetManifestQueue } from './core/AssetManifestQueue';
import { MapManager } from './world/MapManager';
import { GridPhysics, type GridEntity } from './world/GridPhysics';
import { OverworldRenderer } from './render/OverworldRenderer';
import { OverworldHUD } from './ui/OverworldHUD';
import { BattleRenderer } from './render/BattleRenderer';
import { BattleHUD } from './ui/BattleHUD';
import { StadiumArenaManager } from './battle/StadiumArenaManager';
import { PokemonFactory } from './battle/PokemonFactory';
import { BattleSessionController } from './battle/BattleSessionController';
import { FieldObstacleDispatcher, createDefaultNpcInteractionRouter } from './world/interactions';
import type {
  BattleSessionContext, FieldObstacleContext, NpcInteractionContext,
  TriggerBattleOptions, OverworldTransitionContext, OverworldTrainerSightContext, OverworldTickerContext,
} from './types/gameContext';
import { MoveReplacementModalUI } from './ui/MoveReplacementModalUI';
import { BattleAudio } from './audio/BattleAudio';
import { AudioManager } from './audio/AudioManager';
import { RoamingManager } from './world/RoamingManager';
import { SaveManager, type SaveData } from './core/SaveManager';
import { BagAndMartUI, type BagInventory } from './ui/BagAndMartUI';
import { PartyManagementUI } from './ui/PartyManagementUI';
import { TitleScreenUI } from './ui/TitleScreenUI';
import { IntroSequenceUI } from './ui/IntroSequenceUI';
import { MissionLogUI } from './ui/MissionLogUI';
import { MissionManager } from './world/MissionManager';
import { OverworldItemManager } from './world/OverworldItemManager';
import { ItemfinderHUD } from './ui/ItemfinderHUD';
import { NamingModalUI } from './ui/NamingModalUI';
import { BoxManager } from './world/StorageManager';
import { DayCareManager } from './world/DayCareManager';
import { BugContestManager } from './world/BugContestManager';
import { BugContestHUDWidget } from './ui/BugContestHUDWidget';
import { KurtCraftingManager } from './world/KurtCraftingManager';
import { EvolutionSceneUI } from './ui/EvolutionSceneUI';
import { ensureGlobalNeoKantoStyles } from './ui/styles/globalNeoKantoStyles';
import { DisplayThemeManager } from './ui/DisplayThemeManager';
import type { MapData, WarpEvent, Direction, PokemonInstance, PlayerGender, GameOptions, SpeedMultiplier } from './types/game';
import {
  makeNpc, createNpcsByMap, DAY_SIBLINGS, GUIDE_GENT_TOUR_LEGS, isNpcActiveForStoryFlags, applyMapNpcStoryMutations,
  resolveElmLabDialogue, applyStoryRecoveryFlags, filterInitialMapNpcs, resetStoryNpcSpawns,
} from './world/npcData';
import { TrackedStoryFlagSet, ActiveNpcCache } from './world/ActiveNpcCache';
import { AdjacentMapPrefetcher } from './world/AdjacentMapPrefetcher';
export { npcsByMap, createNpcsByMap, DAY_SIBLINGS, GUIDE_GENT_TOUR_LEGS, isNpcActiveForStoryFlags, applyMapNpcStoryMutations } from './world/npcData';
import { syncGitHubIssues } from './sync/githubSync';
import { StoryCutscenes, type StoryCutsceneContext } from './world/StoryCutscenes';
import { OverworldWarpAndMapTransitionController } from './world/OverworldWarpAndMapTransitionController';
import { OverworldTrainerSightAndTourController } from './world/OverworldTrainerSightAndTourController';
import { OverworldTickerCoordinator } from './world/OverworldTickerCoordinator';
import { OverworldModalRegistry } from './ui/OverworldModalRegistry';
declare global {
  interface Window {
    updateLoaderProgress?: (pct: number, label: string) => void;
    dismissLoader?: () => void;
    syncGitHubIssues?: typeof syncGitHubIssues;
  }
}
async function bootstrap() {
  ensureGlobalNeoKantoStyles();
  console.log('⚡ Initializing Crystal Overdrive (Neo-Kanto Protocol)...');
  window.updateLoaderProgress?.(5, 'Parsing save state...');
  let gameState: 'TITLE' | 'OVERWORLD' | 'BATTLE' = 'TITLE';
  let isCutsceneLocked = false, playTimeSeconds = 0, playerName = 'CHRIS', rivalName = 'SILVER';
  let playerGender: PlayerGender = 'BOY', initialMapId = 'players_house_2f', initialPlayerX = 7, initialPlayerY = 1, initialPlayerDir: Direction = 'DOWN';
  let playerParty: PokemonInstance[] = [], playerBox: PokemonInstance[] = [];
  const defeatedTrainers = new Set<string>(), storyFlags = new TrackedStoryFlagSet(), seenSpecies = new Set<string>(), activeNpcCache = new ActiveNpcCache();
  const audioManager = new AudioManager(), gameClock = new GameClock(), saveManager = new SaveManager();
  const existingSave = await saveManager.loadGame();

  let gameOptions: GameOptions = {
    soundVolume: 0.8, bgmVolume: 0.6, battleAnimations: true, playerSpeedDefault: 3,
    battleSpeedMultiplier: 1, textSpeed: 'MID', touchControlStyle: 'DPAD', expShare: 'CAPPED',
    encounterRateMode: 'NORMAL', autoHm: true, crtScanlines: false, gbcPalette: 'VIBRANT',
    lowHpBeepEnabled: true, chiptuneMode: false,
  };

  const inventory: BagInventory = {
    balls: { 'quick-ball': 5, 'fast-ball': 5, 'net-ball': 5, 'ultra-ball': 10, 'great-ball': 15, 'poke-ball': 30, 'master-ball': 1 },
    items: { potion: 5, 'super-potion': 2, antidote: 3, 'parlyz-heal': 2, awakening: 2, revive: 1 },
    berries: {}, tms: ['TM54', 'TM73', 'TM99'], keyItems: [], money: 3000, badges: [],
  };

  const initialSavePreview = await saveManager.getSavePreview();

  const mapManager = new MapManager(), roamingManager = new RoamingManager(), missionManager = new MissionManager();
  const overworldItemManager = new OverworldItemManager(), boxManager = new BoxManager(existingSave?.storage, existingSave?.box);
  let lastVisitedPokecenter = { mapId: 'new_bark_town', x: 13, y: 6 };

  if (existingSave) {
    const playTimeBox = { val: playTimeSeconds }, playerNameBox = { val: playerName }, playerGenderBox = { val: playerGender }, rivalNameBox = { val: rivalName };
    const loc = SaveManager.hydrateGameState(existingSave, {
      playTimeSeconds: playTimeBox, playerName: playerNameBox, playerGender: playerGenderBox, rivalName: rivalNameBox,
      playerParty, playerBox, gameOptions, inventory, defeatedTrainers, storyFlags, seenSpecies, overworldItemManager,
      missionManager, gameClock, roamingManager,
    });
    playTimeSeconds = playTimeBox.val; playerName = playerNameBox.val; playerGender = playerGenderBox.val; rivalName = rivalNameBox.val;
    initialMapId = loc.mapId; initialPlayerX = loc.x; initialPlayerY = loc.y; initialPlayerDir = loc.direction; lastVisitedPokecenter = loc.lastVisitedPokecenter;
  }

  const displayThemeManager = new DisplayThemeManager(gameOptions.crtScanlines ?? false, gameOptions.gbcPalette ?? 'VIBRANT');
  BattleAudio.setLowHpBeepEnabled(gameOptions.lowHpBeepEnabled ?? true);
  audioManager.setChiptuneMode(gameOptions.chiptuneMode ?? false);
  if (gameOptions.bgmVolume !== undefined) audioManager.setBgmVolume(gameOptions.bgmVolume);
  if (gameOptions.soundVolume !== undefined) audioManager.setSfxVolume(gameOptions.soundVolume);
  if (gameOptions.muted !== undefined) audioManager.setMuted(gameOptions.muted);
  if (gameOptions.encounterRateMode) mapManager.setEncounterRateMode(gameOptions.encounterRateMode);

  let overworldRenderer!: OverworldRenderer, overworldHUD!: OverworldHUD, battleRenderer!: BattleRenderer;
  let battleHUD!: BattleHUD, itemfinderHUD!: ItemfinderHUD, bugContestHUD!: BugContestHUDWidget;
  let modalRegistry!: OverworldModalRegistry, cycleBattleSpeed!: () => SpeedMultiplier;
  let adjacentMapPrefetcher: AdjacentMapPrefetcher | null = null;
  let setBattleSpeed!: (speed: SpeedMultiplier) => SpeedMultiplier, cyclePlayerSpeed!: () => SpeedMultiplier;
  let setTextSpeed!: (speed: GameOptions['textSpeed']) => GameOptions['textSpeed'], cycleTextSpeed!: () => GameOptions['textSpeed'];

  const player: GridEntity = {
    id: 'player', x: initialPlayerX, y: initialPlayerY, targetX: initialPlayerX, targetY: initialPlayerY,
    renderX: initialPlayerX, renderY: initialPlayerY, direction: initialPlayerDir, isMoving: false, progress: 0, isPlayer: true,
  };

  const visitedMaps = new Set<string>([initialMapId]);
  const npcsByMap: Record<string, GridEntity[]> = createNpcsByMap();
  filterInitialMapNpcs(npcsByMap, storyFlags);
  applyStoryRecoveryFlags(storyFlags, defeatedTrainers, inventory);

  const dayCareManager = new DayCareManager(existingSave?.dayCare), bugContestManager = new BugContestManager(existingSave?.bugContestRecords);
  const stadiumArenaManager = new StadiumArenaManager(), kurtCraftingManager = new KurtCraftingManager(existingSave?.kurtCraftingOrder);

  const lookupMap = (id: string) => mapManager.getMap(id);
  const getActiveMapNpcs = (mapId: string): GridEntity[] => activeNpcCache.getActiveNpcs(mapId, npcsByMap[mapId], storyFlags, isNpcActiveForStoryFlags);
  const detectChosenStarterSpecies = () => OverworldTrainerSightAndTourController.detectChosenStarterSpecies(storyFlags, playerParty, playerBox, seenSpecies);
  const healPlayerParty = (playSound: boolean = true) => OverworldTrainerSightAndTourController.healParty(playerParty, playSound);
  const getCaughtSpeciesSet = () => new Set([...playerParty.map((p) => p.speciesId), ...boxManager.flatten().map((p) => p.speciesId)]);

  const buildTrainerTeamInstances = (trainer: GridEntity) => OverworldTrainerSightAndTourController.buildTrainerTeamInstances(trainer);
  const handleTrainerDefeatRewards = (trainer: GridEntity) => OverworldTrainerSightAndTourController.handleTrainerDefeatRewards(trainer, getTrainerSightContext());

  const getBattleSessionContext = (): BattleSessionContext => ({
    setGameState: (state) => { gameState = state; },
    overworldHUD: { hide: () => overworldHUD.hide(), show: () => overworldHUD.show(), showToast: (m) => overworldHUD.showToast(m), hideRoamerAlert: () => overworldHUD.hideRoamerAlert() },
    itemfinderHUD: { suspend: () => itemfinderHUD.suspend(), resume: () => itemfinderHUD.resume() },
    player, audioManager, seenSpecies, playerParty, playerBox,
    setPlayerBox: (box) => { playerBox = box; },
    healPlayerParty: (playAnim) => healPlayerParty(playAnim),
    battleHUD, battleRenderer, inventory, gameClock, gameOptions, eventBus, mapManager, boxManager, storyFlags,
    bugContestManager, roamingManager, missionManager, playerName,
    cycleBattleSpeed: () => cycleBattleSpeed(),
    saveCurrentGame: () => saveCurrentGame(),
    respawnAtLastPokecenter: async () => OverworldWarpAndMapTransitionController.respawnAtLastPokecenter(getTransitionContext(), lastVisitedPokecenter, audioManager, itemfinderHUD, healPlayerParty),
    promptBugContestSpecimenSwap: async (newCatch) => modalRegistry.promptBugContestSpecimenSwap(newCatch, bugContestHUD),
    playEvolutionScene: (pokemon, targetSpeciesId) => new EvolutionSceneUI('modal-container').play(pokemon, targetSpeciesId),
    openMoveReplacementModal: (pokemon, moveData) => new MoveReplacementModalUI('modal-container').open(pokemon, moveData),
  });

  const triggerBattle = async (initialOpponent: PokemonInstance, options: TriggerBattleOptions = {}) => {
    await BattleSessionController.runBattleSession(getBattleSessionContext(), initialOpponent, options);
  };

  const getCutsceneContext = (): StoryCutsceneContext => ({
    player, storyFlags, defeatedTrainers, playerParty, rivalName, playerName, audioManager, overworldRenderer,
    overworldHUD, npcsByMap, gameClock, mapManager, roamingManager, triggerBattle, buildTrainerTeamInstances,
    handleTrainerDefeatRewards, saveCurrentGame,
    setCutsceneLocked: (locked) => { isCutsceneLocked = locked; },
  });

  const triggerSlowpokeWellGruntIntercept = async (grunt: GridEntity) => StoryCutscenes.triggerSlowpokeWellGruntIntercept(grunt, getCutsceneContext());
  const triggerAzaleaRivalAmbush = () => StoryCutscenes.triggerAzaleaRivalAmbush(getCutsceneContext());
  const triggerCherrygroveRivalAmbush = () => StoryCutscenes.triggerCherrygroveRivalAmbush(getCutsceneContext());
  const triggerBurnedTowerRivalBattle = () => StoryCutscenes.triggerBurnedTowerRivalBattle(getCutsceneContext());
  const triggerBeastsAwakeningCutscene = () => StoryCutscenes.triggerBeastsAwakeningCutscene(getCutsceneContext());
  const triggerOlivineRivalConfrontation = () => StoryCutscenes.triggerOlivineRivalConfrontation(getCutsceneContext());
  const triggerCianwoodSuicuneAndEusine = () => StoryCutscenes.triggerCianwoodSuicuneAndEusine(getCutsceneContext());
  const triggerRoute42Suicune = () => StoryCutscenes.triggerRoute42Suicune(getCutsceneContext());

  const saveCurrentGame = async () => {
    missionManager.checkStoryFlags(storyFlags);
    gameOptions.playerSpeedDefault = gameClock.playerSpeed;
    gameOptions.battleSpeedMultiplier = gameClock.battleSpeed;
    gameOptions.muted = audioManager.isMuted();
    gameOptions.bgmVolume = audioManager.getBgmVolume();
    gameOptions.soundVolume = audioManager.getSfxVolume();
    gameOptions.chiptuneMode = audioManager.isChiptuneMode();
    gameOptions.lowHpBeepEnabled = BattleAudio.lowHpBeepEnabled;
    gameOptions.crtScanlines = displayThemeManager.isCrtEnabled();
    gameOptions.gbcPalette = displayThemeManager.getPalette();
    gameOptions.encounterRateMode = mapManager.getEncounterRateMode();
    if (overworldHUD) {
      gameOptions.touchControlStyle = overworldHUD.getTouchControlStyle();
      gameOptions.gamepadActive = overworldHUD.isGamepadActive();
    }
    const saveData = SaveManager.createSaveSnapshot({
      playTimeSeconds, playerName, playerGender, rivalName,
      player: { x: player.x, y: player.y, direction: player.direction },
      mapId: mapManager.getCurrentMap()?.id || 'new_bark_town',
      gameClock, inventory, playerParty, boxManager, roamingManager,
      defeatedTrainers, storyFlags, seenSpecies, overworldItemManager,
      gameOptions, missionManager, dayCareManager, kurtCraftingManager, bugContestManager,
    });
    await saveManager.saveGame(saveData);
    console.log('💾 Game state successfully saved to IndexedDB.');
  };

  const getTransitionContext = (): OverworldTransitionContext => ({
    mapManager, overworldRenderer, overworldItemManager, missionManager, storyFlags, defeatedTrainers,
    playerParty, player, activeNpcCache, npcsByMap, roamingManager,
    overworldHUD, isCutsceneLocked: () => isCutsceneLocked, visitedMaps, saveCurrentGame,
    detectChosenStarterSpecies, getLastVisitedPokecenter: () => lastVisitedPokecenter,
    setLastVisitedPokecenter: (loc) => { lastVisitedPokecenter = loc; },
    lookupMap, getActiveMapNpcs, eventBus, triggerAzaleaRivalAmbush, playerName, inventory, audioManager,
    adjacentMapPrefetcher: adjacentMapPrefetcher || undefined,
    setCutsceneLocked: (locked: boolean) => { isCutsceneLocked = locked; },
    triggerCanvasEarthquake: () => {
      const canvas = document.getElementById('game-canvas');
      if (canvas) { canvas.classList.add('screen-shake'); setTimeout(() => canvas.classList.remove('screen-shake'), 1200); }
    },
  });

  // Maps stream asynchronously on-demand via mapManager.ensureMapLoaded (fallback: './assets/data/world_maps.json').
  const ensureMapAndNeighborsLoaded = (targetId: string) => OverworldWarpAndMapTransitionController.ensureMapAndNeighborsLoaded(getTransitionContext(), targetId);
  const resetMapNpcsToOrigin = (mapId: string) => OverworldWarpAndMapTransitionController.resetMapNpcsToOrigin(getTransitionContext(), mapId);
  const applyMapStoryMutations = (map: MapData | null) => OverworldWarpAndMapTransitionController.applyMapStoryMutations(getTransitionContext(), map);
  const syncMapOverworldItems = (map: MapData | null) => OverworldWarpAndMapTransitionController.syncMapOverworldItems(getTransitionContext(), map);
  const populateWorldNpcs = (map: MapData | null) => OverworldWarpAndMapTransitionController.populateWorldNpcs(getTransitionContext(), map);
  const handleMapTransition = (entity: GridEntity) => OverworldWarpAndMapTransitionController.handleMapTransition(getTransitionContext(), entity);
  const executeWarpTransition = (warp: WarpEvent) => OverworldWarpAndMapTransitionController.executeWarpTransition(getTransitionContext(), warp);
  const handleRuinsPuzzleSolve = (puzzleId: string) => OverworldWarpAndMapTransitionController.handleRuinsPuzzleSolve(getTransitionContext(), puzzleId);

  const criticalBootMapIds = Array.from(new Set([initialMapId, 'new_bark_town', 'players_house_2f', 'players_house_1f']));
  const bootMapManifest = new AssetManifestQueue();
  for (const mapId of criticalBootMapIds) {
    bootMapManifest.enqueue({
      id: `boot_map:${mapId}`, label: `Loading map ${mapId}.json`, category: 'MAP_JSON',
      execute: async () => { await ensureMapAndNeighborsLoaded(mapId); },
    });
  }
  await bootMapManifest.run({
    startPercent: 12, endPercent: 40, concurrency: 4,
    onProgress: (snap) => { window.updateLoaderProgress?.(snap.percent, snap.currentLabel); },
  });

  let initialMap = mapManager.setCurrentMap(initialMapId);
  if (!mapManager.isWalkable(initialPlayerX, initialPlayerY)) {
    initialMapId = 'new_bark_town';
    initialMap = mapManager.setCurrentMap(initialMapId);
    initialPlayerX = 13;
    initialPlayerY = 6;
    player.x = 13;
    player.y = 6;
    player.targetX = 13;
    player.targetY = 6;
    player.renderX = 13;
    player.renderY = 6;
  }
  missionManager.registerMapEntry(initialMap.id, storyFlags);
  mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);
  if (gameOptions.encounterRateMode) mapManager.setEncounterRateMode(gameOptions.encounterRateMode);

  const getTrainerSightContext = (): OverworldTrainerSightContext => ({
    inventory, storyFlags, missionManager, playerParty, defeatedTrainers, player, overworldHUD,
    isCutsceneLocked: () => isCutsceneLocked, setCutsceneLocked: (locked) => { isCutsceneLocked = locked; },
    triggerBattle, stadiumArenaManager, saveCurrentGame,
    playerName, rivalName, npcsByMap, gameState: () => gameState, audioManager, overworldRenderer,
    roamingManager, gameClock, healPlayerParty, lookupMap, syncMapOverworldItems, mapManager,
  });

  const addOverworldItemToInventory = (rawItemId: string) => OverworldTrainerSightAndTourController.addOverworldItemToInventory(getTrainerSightContext(), rawItemId);
  const getApricornCount = (apricornId: string) => OverworldTrainerSightAndTourController.getApricornCount(getTrainerSightContext(), apricornId);
  const deductApricorn = (apricornId: string, qty: number) => OverworldTrainerSightAndTourController.deductApricorn(getTrainerSightContext(), apricornId, qty);
  const launchStadiumChallenge = (challengerId: string, cupId: string) => OverworldTrainerSightAndTourController.launchStadiumChallenge(challengerId, cupId, getTrainerSightContext());
  const runTrainerSightSequence = (trainer: GridEntity) => OverworldTrainerSightAndTourController.runTrainerSightSequence(trainer, getCutsceneContext());
  const completeSlowpokeWellProtonVictory = () => OverworldTrainerSightAndTourController.completeSlowpokeWellProtonVictory(getTrainerSightContext());
  const runGuideGentWalkingTour = (guide: GridEntity) => OverworldTrainerSightAndTourController.runGuideGentWalkingTour(guide, getCutsceneContext());

  const bagUI = new BagAndMartUI(
    'modal-container', inventory, playerParty,
    () => { saveCurrentGame(); },
    () => { OverworldTickerCoordinator.triggerItemfinderScan(getTickerContext()); },
    (steps: number, itemName: string) => {
      mapManager.setRepelSteps(steps);
      if (overworldHUD) overworldHUD.showToast(`🛡️ ${itemName} active! Wild encounters warded off for ${steps} steps.`);
    }
  );

  const partyUI = new PartyManagementUI('modal-container', playerParty, () => { saveCurrentGame(); });
  const missionLogUI = new MissionLogUI('modal-container', missionManager);
  itemfinderHUD = new ItemfinderHUD('overworld-hud-container');
  const namingModalUI = new NamingModalUI('overworld-hud-container');
  bugContestHUD = new BugContestHUDWidget('overworld-hud-container');

  setBattleSpeed = (speed: SpeedMultiplier): SpeedMultiplier => {
    gameClock.battleSpeed = speed;
    gameOptions.battleSpeedMultiplier = speed;
    if (battleRenderer) battleRenderer.setSpeedMultiplier(speed);
    if (battleHUD) battleHUD.setSpeedMultiplier(speed);
    void saveCurrentGame();
    return speed;
  };

  cycleBattleSpeed = (): SpeedMultiplier => {
    const nextSpeed: SpeedMultiplier = gameClock.battleSpeed === 1 ? 2 : gameClock.battleSpeed === 2 ? 3 : 1;
    return setBattleSpeed(nextSpeed);
  };

  setTextSpeed = (speed: GameOptions['textSpeed']): GameOptions['textSpeed'] => {
    gameOptions.textSpeed = speed;
    if (overworldHUD) overworldHUD.setTextSpeed(speed);
    if (battleHUD) battleHUD.setTextSpeed(speed);
    void saveCurrentGame();
    return speed;
  };

  cycleTextSpeed = (): GameOptions['textSpeed'] => {
    const speeds: Array<GameOptions['textSpeed']> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
    const current = gameOptions.textSpeed ?? 'MID';
    const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
    return setTextSpeed(speeds[nextIdx]);
  };

  cyclePlayerSpeed = (): SpeedMultiplier => {
    const newSpeed = gameClock.cyclePlayerSpeed();
    gameOptions.playerSpeedDefault = newSpeed;
    bagUI.setSpeedMultiplier(newSpeed);
    partyUI.setSpeedMultiplier(newSpeed);
    modalRegistry.startMenuUI.setSpeedMultiplier(newSpeed);
    if (overworldHUD) overworldHUD.updateSpeedDisplay(newSpeed);
    eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
    void saveCurrentGame();
    return newSpeed;
  };

  modalRegistry = new OverworldModalRegistry({
    dayCareManager, kurtCraftingManager, bugContestManager, stadiumArenaManager, audioManager, gameClock, gameOptions,
    displayThemeManager, mapManager, missionManager, roamingManager, overworldItemManager, inventory,
    playerParty, storyFlags, visitedMaps, seenSpecies, playerName, initialMapId, getCaughtSpeciesSet,
    getPlayerName: () => playerName,
    getPlayTimeSeconds: () => playTimeSeconds, getOverworldHUD: () => overworldHUD,
    getPartyUI: () => partyUI, getBagUI: () => bagUI, getMissionLogUI: () => missionLogUI,
    getNamingModalUI: () => namingModalUI, saveCurrentGame, launchStadiumChallenge,
    cyclePlayerSpeed, cycleBattleSpeed, setBattleSpeed, cycleTextSpeed, setTextSpeed,
  });

  const { boxManagementUI, townMapUI, ruinsPuzzleModalUI, dayCareModalUI, deptStoreElevatorUI, radioTowerQuizUI, startMenuUI } = modalRegistry;
  const isAnyOverworldModalOpen = () => modalRegistry.isAnyModalOpen(() => gameState);

  bagUI.setSpeedMultiplier(gameClock.playerSpeed);
  partyUI.setSpeedMultiplier(gameClock.playerSpeed);
  startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

  overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => cyclePlayerSpeed(),
    onMuteToggle: () => {
      const m = audioManager.toggleMute();
      gameOptions.muted = m;
      void saveCurrentGame();
      return m;
    },
    onMenuToggle: () => {
      if (dayCareModalUI.isOpen()) { dayCareModalUI.close(); return; }
      if (ruinsPuzzleModalUI.isOpen()) { ruinsPuzzleModalUI.close(); return; }
      if (boxManagementUI.isOpen()) { boxManagementUI.close(); return; }
      if (missionLogUI.isOpen()) { missionLogUI.hide(); return; }
      if (partyUI.isOpen()) { partyUI.hide(); return; }
      if (bagUI.isOpen()) { bagUI.hide(); return; }
      startMenuUI.toggle();
    },
    onPartyOpen: () => { startMenuUI.closeAll(); bagUI.hide(); partyUI.open(); },
    onBagOpen: () => { startMenuUI.closeAll(); partyUI.hide(); bagUI.open('ITEMS'); },
    onMartOpen: () => { startMenuUI.closeAll(); partyUI.hide(); bagUI.openMart(); },
    onSaveGame: () => { saveCurrentGame(); },
    onInteract: () => { handleInteract(); },
    onRadarToggle: () => OverworldTickerCoordinator.toggleLiveItemfinderRadar(getTickerContext()),
    isModalOpen: isAnyOverworldModalOpen,
  });
  overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
  overworldHUD.setTouchControlStyle(gameOptions.touchControlStyle || 'DPAD');
  if (gameOptions.gamepadActive !== undefined) overworldHUD.setGamepadVisible(gameOptions.gamepadActive);
  overworldHUD.setTextSpeed(gameOptions.textSpeed ?? 'MID');
  overworldHUD.updateMuteDisplay(audioManager.isMuted());
  overworldHUD.updateRouteName(initialMap.name);
  overworldHUD.updatePokegear(roamingManager.getAllRoamers());
  overworldHUD.hide();

  missionManager.setCallbacks({
    onMissionUnlocked: (m) => overworldHUD.showMissionToast(m.title, m.summary, 'unlocked'),
    onMissionAdvanced: (m, s) => overworldHUD.showMissionToast(m.title, s.description, 'progress'),
    onMissionCompleted: (m) => { BattleAudio.playOverworldSound('KEY_ITEM'); overworldHUD.showMissionToast(m.title, 'All objectives completed!', 'completed'); },
  });

  window.updateLoaderProgress?.(40, 'Mounting overworld engine...');
  const canvasContainer = (document.getElementById('canvas-container') || document.getElementById('game-container') || document.body) as HTMLElement;
  overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer, {
    startPercent: 40, endPercent: 72, concurrency: 6,
    onProgress: (snap) => { window.updateLoaderProgress?.(snap.percent, snap.currentLabel); },
  });
  overworldRenderer.setPlayerGender(playerGender);

  mapManager.setNpcLifecycleCallbacks({
    onMapLoaded: (map) => { resetMapNpcsToOrigin(map.id); getActiveMapNpcs(map.id); },
    onMapEvicted: (mapId) => { activeNpcCache.invalidate(mapId); },
  });

  overworldRenderer.setNpcLookup((id) => getActiveMapNpcs(id));
  resetMapNpcsToOrigin(initialMap.id);

  await overworldRenderer.ensureMapTilesLoaded(initialMap, lookupMap, {
    startPercent: 72, endPercent: 95, concurrency: 8,
    onProgress: (snap) => { window.updateLoaderProgress?.(snap.percent, snap.currentLabel); },
  });
  applyMapStoryMutations(initialMap);
  overworldRenderer.renderMap(initialMap, lookupMap);
  syncMapOverworldItems(initialMap);

  adjacentMapPrefetcher = new AdjacentMapPrefetcher({
    mapManager,
    activeNpcCache,
    prepareMapNpcs: (id) => { resetMapNpcsToOrigin(id); return getActiveMapNpcs(id); },
    onWarmNpcSprites: (types) => overworldRenderer?.warmNpcSpriteTypes(types),
    onWarmMapTiles: (m) => (overworldRenderer ? overworldRenderer.ensureMapTilesLoaded(m, lookupMap) : undefined),
  });
  mapManager.setPrefetcher(adjacentMapPrefetcher);
  void adjacentMapPrefetcher.prefetchAroundMap(initialMap.id);

  window.updateLoaderProgress?.(97, 'Initializing battle engine...');
  battleRenderer = new BattleRenderer(overworldRenderer.app);
  battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
  battleHUD = new BattleHUD('battle-hud-container');
  battleHUD.setSpeedMultiplier(gameClock.battleSpeed);
  battleHUD.setTextSpeed(gameOptions.textSpeed ?? 'MID');
  window.updateLoaderProgress?.(100, 'Ready!');
  window.dismissLoader?.();

  const introSequenceUI = new IntroSequenceUI('modal-container', {
    onComplete: async ({ name, gender }) => {
      playerName = name;
      playerGender = gender;
      overworldRenderer.setPlayerGender(gender);
      const fresh = SaveManager.createFreshSaveData(name, gender);
      playTimeSeconds = 0;
      playerParty.length = 0;
      playerBox.length = 0;
      inventory.balls = fresh.inventory.balls;
      inventory.items = fresh.inventory.items || {};
      inventory.tms = [...fresh.inventory.tms];
      inventory.berries = {};
      inventory.keyItems = [];
      inventory.money = fresh.player.money;
      inventory.badges = [];
      defeatedTrainers.clear();
      storyFlags.clear();
      seenSpecies.clear();
      rivalName = 'SILVER';
      boxManager.getState().boxes.forEach((b) => b.pokemon.fill(null));
      boxManager.changeBox(0);
      playerBox.length = 0;
      overworldItemManager.setCollectedFlags([]);
      overworldItemManager.setFruitTreePicks({});
      Object.assign(npcsByMap, createNpcsByMap());
      filterInitialMapNpcs(npcsByMap, storyFlags);
      activeNpcCache.invalidateAll();
      roamingManager.sleepBeasts();
      missionManager.deserialize(new MissionManager().serialize());

      gameClock.playerSpeed = gameOptions.playerSpeedDefault;
      overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
      bagUI.setSpeedMultiplier(gameClock.playerSpeed);
      partyUI.setSpeedMultiplier(gameClock.playerSpeed);
      startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

      const startMap = mapManager.setCurrentMap('players_house_2f');
      player.x = 7; player.y = 1; player.targetX = 7; player.targetY = 1;
      player.renderX = 7; player.renderY = 1; player.direction = 'DOWN';
      player.isMoving = false; player.progress = 0;

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
    onUnlockAudio: async () => { await audioManager.unlockAudio(); },
    onContinue: async () => {
      titleScreenUI.hide();
      overworldRenderer.setPlayerGender(playerGender);
      gameState = 'OVERWORLD';
      overworldHUD.show();
      const activeMap = mapManager.getCurrentMap();
      if (activeMap) { overworldHUD.updateRouteName(activeMap.name); audioManager.playMapBgm(activeMap.id, 0.6); }
    },
    onNewGame: async () => { titleScreenUI.hide(); introSequenceUI.start(); },
    onOptionsChanged: (opts) => {
      Object.assign(gameOptions, opts);
      audioManager.setBgmVolume(opts.bgmVolume);
      audioManager.setSfxVolume(opts.soundVolume);
      gameClock.playerSpeed = opts.playerSpeedDefault;
      if (opts.battleSpeedMultiplier) setBattleSpeed(opts.battleSpeedMultiplier);
      if (opts.textSpeed) setTextSpeed(opts.textSpeed);
      if (opts.touchControlStyle) overworldHUD.setTouchControlStyle(opts.touchControlStyle);
      if (opts.crtScanlines !== undefined) displayThemeManager.setCrtScanlines(opts.crtScanlines);
      if (opts.gbcPalette) displayThemeManager.setPalette(opts.gbcPalette);
      if (opts.lowHpBeepEnabled !== undefined) BattleAudio.setLowHpBeepEnabled(opts.lowHpBeepEnabled);
      if (opts.chiptuneMode !== undefined) audioManager.setChiptuneMode(opts.chiptuneMode);
      overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
      bagUI.setSpeedMultiplier(gameClock.playerSpeed);
      partyUI.setSpeedMultiplier(gameClock.playerSpeed);
      startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);
      void saveCurrentGame();
    },
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !e.repeat && gameState === 'BATTLE') {
      battleHUD.triggerSpeedToggle();
      return;
    }
    if (gameState === 'OVERWORLD') {
      if (townMapUI.isOpen()) { townMapUI.handleKeyDown(e); return; }
      if (missionLogUI.isOpen()) { missionLogUI.handleKeyDown(e); return; }
      if (startMenuUI.isOpen()) { startMenuUI.handleKeyDown(e); return; }
      if (!isAnyOverworldModalOpen() && !overworldHUD.isDialogueOpen() && !isCutsceneLocked && !e.repeat) {
        if (startMenuUI.triggerShortcut(e.code, false)) e.preventDefault();
      }
    }
  });

  const getTickerContext = (): OverworldTickerContext & { dayCareManager: any; playerParty: any[]; seenSpecies: Set<string>; defeatedTrainers: Set<string>; overworldRenderer: any; } => ({
    getGameState: () => gameState,
    isCutsceneLocked: () => isCutsceneLocked,
    isDialogueOpen: () => overworldHUD.isDialogueOpen(),
    isMenuOpen: () => startMenuUI.isOpen(),
    isAnyModalOpen: isAnyOverworldModalOpen,
    player,
    mapManager,
    overworldItemManager,
    gameClock,
    storyFlags,
    visitedMaps,
    roamingManager,
    missionManager,
    itemfinderHUD,
    overworldHUD,
    audioManager,
    overworldRenderer,
    getActiveMapNpcs,
    populateWorldNpcs,
    handleMapTransition,
    executeWarpTransition,
    runTrainerSightSequence,
    triggerSlowpokeWellGruntIntercept,
    triggerBeastsAwakeningCutscene,
    triggerBurnedTowerRivalBattle,
    triggerCherrygroveRivalAmbush,
    triggerOlivineRivalConfrontation,
    triggerCianwoodSuicuneAndEusine,
    triggerRoute42Suicune,
    saveCurrentGame,
    triggerWildEncounter: async (wildPkmn, options) => triggerBattle(wildPkmn, options),
    addPlayTimeDelta: (dtSec) => { playTimeSeconds += dtSec; },
    isSurfEnabled: () => mapManager.isSurfEnabled(),
    openDeptElevatorModal: (currentMapId, onSelectFloor) => deptStoreElevatorUI.open({ currentMapId, onSelectFloor: (f) => onSelectFloor(f.mapId), onClose: () => {} }),
    dayCareManager,
    inventory,
    playerParty,
    seenSpecies,
    defeatedTrainers,
  });

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
    detectChosenStarterSpecies: () => detectChosenStarterSpecies() || null,
    openStarterChoiceModal: (speciesId, name, type, onConfirm, onCancel) => overworldHUD.openStarterChoiceModal(speciesId, name, type, onConfirm, onCancel),
    openDialogue: (pages, speaker, onComplete) => overworldHUD.openDialogue(pages, speaker, onComplete),
    showToast: (msg) => overworldHUD.showToast(msg),
    openPcStorage: () => boxManagementUI.open(playerParty, boxManager.getState(), { onSave: () => saveCurrentGame(), onClose: () => saveCurrentGame() }),
    openTownMap: (mapId, visited, roamers) => townMapUI.open(mapId, visited, roamers),
    openRuinsPuzzleModal: (callbacks) => ruinsPuzzleModalUI.open(callbacks),
    handleRuinsPuzzleSolve,
    openMart: (martId?: string) => bagUI.openMart(martId || mapManager.getCurrentMap()?.id),
    healPlayerParty: (playAnim) => healPlayerParty(playAnim),
    playHealingAnimation: (partyCount) => overworldHUD.playHealingAnimation(partyCount),
    playFieldRestAnimation: () => overworldHUD.playFieldRestAnimation(),
    playFlashEffect: () => overworldRenderer.playFlashEffect(),
    playCutSlashEffect: (x, y) => overworldRenderer.playCutSlashEffect(x, y),
    addOverworldItemToInventory,
    removeItemBall: (eventFlag) => overworldRenderer.removeItemBall(eventFlag),
    syncMapOverworldItems,
    refreshItemfinderRadar: (playSonar) => OverworldTickerCoordinator.refreshItemfinderRadar(playSonar, getTickerContext()),
    saveCurrentGame,
    renderMap: (map) => overworldRenderer.renderMap(map, lookupMap),
    setSurfEnabled: (enabled) => mapManager.setSurfEnabled(enabled),
    triggerBattle,
    isItemfinderActive: () => itemfinderHUD.isActive(),
    openDeptElevatorModal: (currentMapId, onSelectFloor) => deptStoreElevatorUI.open({ currentMapId, onSelectFloor: (f) => onSelectFloor(f.mapId), onClose: () => {} }),
    executeWarpTransition: (warp) => executeWarpTransition(warp),
  });

  const npcInteractionRouter = createDefaultNpcInteractionRouter();

  const getNpcInteractionContext = (): NpcInteractionContext => ({
    playerName,
    getRivalName: () => rivalName,
    setRivalName: (name: string) => { rivalName = name; },
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
    openMart: (martId?: string) => bagUI.openMart(martId || mapManager.getCurrentMap()?.id),
    openPcStorage: () => boxManagementUI.open(playerParty, boxManager.getState(), { onSave: () => saveCurrentGame(), onClose: () => saveCurrentGame() }),
    openTownMap: (mapId, visited, roamers) => townMapUI.open(mapId, visited, roamers),
    addOverworldItemToInventory,
    renderMap: (map) => overworldRenderer.renderMap(map, lookupMap),
    syncMapOverworldItems,
    setSurfEnabled: (enabled) => mapManager.setSurfEnabled(enabled),
    openDayCareModal: () => modalRegistry.openDayCareModal(),
    openNamingModal: (_title, defaultName, onConfirm) => {
      namingModalUI.open({ onConfirm }, defaultName);
    },
    openDeptElevatorModal: (currentMapId, onSelectFloor) => deptStoreElevatorUI.open({ currentMapId, onSelectFloor: (f) => onSelectFloor(f.mapId), onClose: () => {} }),
    openRadioTowerQuizModal: (callbacks) => {
      radioTowerQuizUI.open({
        onComplete: callbacks.onComplete,
        onClose: () => {},
      });
    },
    openKurtCraftingModal: (callbacks) =>
      modalRegistry.openKurtCraftingModal(getApricornCount, deductApricorn, callbacks),
    openKyleTradeModal: (callbacks) => modalRegistry.openKyleTradeModal(callbacks),
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
    getOppositeDirection: (dir) => OverworldTrainerSightAndTourController.getOppositeDirection(dir),
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

  const handleInteract = () => {
    if (gameState !== 'OVERWORLD' || isCutsceneLocked || player.isMoving || overworldHUD.isDialogueOpen()) return;
    const currentMap = mapManager.getCurrentMap();
    if (!currentMap) return;

    const { dx, dy } = GridPhysics.getDirectionDelta(player.direction);
    const facingX = player.x + dx;
    const facingY = player.y + dy;
    const acrossX = player.x + dx * 2;
    const acrossY = player.y + dy * 2;

    const visibleWorldNpcs = populateWorldNpcs(currentMap);
    for (let i = 0; i < visibleWorldNpcs.length; i++) {
      const targetNpc = visibleWorldNpcs[i];
      const npcWorldX = targetNpc.x + (targetNpc.worldOffsetX || 0);
      const npcWorldY = targetNpc.y + (targetNpc.worldOffsetY || 0);
      const isDirect = npcWorldX === facingX && npcWorldY === facingY;
      const isAcrossCounter = targetNpc.talkAcrossCounter === true && npcWorldX === acrossX && npcWorldY === acrossY;
      if (isDirect || isAcrossCounter) {
        npcInteractionRouter.dispatch(targetNpc, currentMap, getNpcInteractionContext());
        return;
      }
    }

    if (FieldObstacleDispatcher.handleFieldAndBgInteraction(getFieldObstacleContext(), currentMap, facingX, facingY)) {
      return;
    }
  };

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) overworldRenderer.app.ticker.stop();
      else overworldRenderer.app.ticker.start();
    });
  }

  overworldRenderer.app.ticker.add((ticker) => {
    OverworldTickerCoordinator.updateOverworldTick(ticker.deltaMS / 1000, getTickerContext());
  });

  const uiOverlay = document.getElementById('ui-overlay') || document.body;
  modalRegistry.mountReportButton({
    uiOverlay, mapManager, player, getGameState: () => gameState, inventory, playerParty,
  });

  window.syncGitHubIssues = syncGitHubIssues;
  console.log('⚡ Crystal Overdrive Vertical Slice 100% playable & booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
