import { GameClock } from './core/GameClock';
import { eventBus } from './core/EventBus';
import { MapManager } from './world/MapManager';
import { GridPhysics, type GridEntity } from './world/GridPhysics';
import { OverworldRenderer } from './render/OverworldRenderer';
import { OverworldHUD } from './ui/OverworldHUD';
import { BattleRenderer } from './render/BattleRenderer';
import { BattleHUD } from './ui/BattleHUD';
import { BattleStateMachine, type BattleTurnResult } from './battle/BattleStateMachine';
import { PokemonFactory } from './battle/PokemonFactory';
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
import type {
  MapData,
  Direction,
  PokeballId,
  PokemonInstance,
  PokemonStorageState,
  PlayerGender,
  GameOptions,
  SpeedMultiplier,
  ExpShareMode,
} from './types/game';
import type { Graphics } from 'pixi.js';
import { createNpcsByMap, DAY_SIBLINGS } from './world/npcData';
export { npcsByMap, createNpcsByMap, DAY_SIBLINGS } from './world/npcData';

declare global {
  interface Window {
    updateLoaderProgress?: (pct: number, label: string) => void;
    dismissLoader?: () => void;
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
    balls: {
      'quick-ball': 5,
      'fast-ball': 5,
      'net-ball': 5,
      'ultra-ball': 10,
      'great-ball': 15,
      'poke-ball': 30,
      'master-ball': 1,
    },
    items: {
      potion: 5,
      'super-potion': 2,
      antidote: 3,
      'parlyz-heal': 2,
      awakening: 2,
      revive: 1,
    },
    berries: {},
    tms: ['TM54', 'TM73', 'TM99'],
    money: 3000,
    badges: [],
    keyItems: [],
  };
  const defeatedTrainers: Set<string> = new Set();
  const storyFlags: Set<string> = new Set();
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
    missionManager.checkStoryFlags(storyFlags);

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

    // Only awaken Legendary Beasts if player has reached the Ecruteak Burned Tower story milestone (4+ Badges)
    if (inventory.badges.length >= 4) {
      roamingManager.awakenBeasts();
    } else {
      roamingManager.sleepBeasts();
    }
  } else {
    // Default empty party for fresh adventure (Starter partner chosen at Elm's Lab - Ticket 6.1)
    playerParty = [];
  }

  // 3. Fetch and Register Outdoor & Indoor Maps (New Bark -> Cherrygrove -> Route 30/31 -> Violet City)
  const mapIds = [
    'new_bark_town',
    'route_29',
    'cherrygrove_city',
    'route_30',
    'route_31',
    'elms_lab',
    'players_house_1f',
    'players_house_2f',
    'players_neighbors_house',
    'elms_house',
    'cherrygrove_mart',
    'cherrygrove_poke_center',
    'guide_gents_house',
    'cherrygrove_gym_speech_house',
    'cherrygrove_evolution_speech_house',
    'mr_pokemons_house',
    'route_30_berry_house',
    'route_31_violet_gate',
    'violet_city',
    'violet_mart',
    'violet_poke_center',
    'earls_pokemon_academy',
    'violet_kyles_house',
    'violet_nickname_speech_house',
    'sprout_tower_1f',
    'sprout_tower_2f',
    'sprout_tower_3f',
    'violet_gym',
    'route_32',
    'route_32_poke_center',
    'route_32_ruins_of_alph_gate',
    'ruins_of_alph_outside',
    'ruins_of_alph_research_center',
    'ruins_of_alph_kabuto_chamber',
    'ruins_of_alph_inner_chamber',
    'union_cave_1f',
    'union_cave_b1f',
    'union_cave_b2f',
    'route_33',
    'azalea_town',
    'azalea_poke_center',
    'azalea_mart',
    'azalea_gym',
    'kurts_house',
    'charcoal_kiln',
    'slowpoke_well_b1f',
    'slowpoke_well_b2f',
    'ilex_forest',
    'route_34_ilex_forest_gate',
    'route_34',
    'day_care',
    'goldenrod_city',
    'goldenrod_gym',
    'goldenrod_poke_center',
    'goldenrod_bike_shop',
    'goldenrod_game_corner',
    'goldenrod_flower_shop',
    'goldenrod_name_rater',
    'goldenrod_bill_house',
    'goldenrod_magnet_train_station',
    'goldenrod_underground',
    'goldenrod_dept_store_1f',
    'goldenrod_dept_store_2f',
    'goldenrod_dept_store_3f',
    'goldenrod_dept_store_4f',
    'goldenrod_dept_store_5f',
    'goldenrod_dept_store_6f',
    'goldenrod_dept_store_roof',
    'radio_tower_1f',
    'radio_tower_2f',
    'radio_tower_3f',
    'radio_tower_4f',
    'radio_tower_5f',
    'route_35',
    'route_35_national_park_gate',
    'national_park',
    'route_36_national_park_gate',
    'route_36',
    'route_36_ruins_of_alph_gate',
    'route_37',
    'ecruteak_city',
    'ecruteak_poke_center',
    'ecruteak_mart',
    'ecruteak_gym',
    'dance_theater',
    'ecruteak_itemfinder_house',
    'burned_tower_1f',
    'burned_tower_b1f',
    'tin_tower_1f',
    // Phase 10: Western Johto
    'route_38',
    'route_38_ecruteak_gate',
    'route_39',
    'route_39_barn',
    'route_39_farmhouse',
    'olivine_city',
    'olivine_poke_center',
    'olivine_mart',
    'olivine_gym',
    'olivine_cafe',
    'olivine_tims_house',
    'olivine_good_rod_house',
    'olivine_lighthouse_1f',
    'olivine_lighthouse_2f',
    'olivine_lighthouse_3f',
    'olivine_lighthouse_4f',
    'olivine_lighthouse_5f',
    'olivine_lighthouse_6f',
    'route_40',
    'route_41',
    'cianwood_city',
    'cianwood_poke_center',
    'cianwood_gym',
    'cianwood_pharmacy',
    'cianwood_photo_studio',
    'cianwood_lugia_speech_house',
    'whirl_island_ne',
    'whirl_island_se',
    'whirl_island_sw',
    'whirl_island_nw',
    'whirl_island_b1f',
    'whirl_island_b2f',
    'whirl_island_lugia_chamber',
    // Phase 11: Mahogany, Lake of Rage & Blackthorn
    'route_42',
    'route_42_ecruteak_gate',
    'mount_mortar_1f_outside',
    'mount_mortar_1f_inside',
    'mount_mortar_2f_inside',
    'mount_mortar_b1f',
    'mahogany_town',
    'mahogany_mart',
    'mahogany_gym',
    'mahogany_poke_center',
    'mahogany_red_gyarados_speech_house',
    'team_rocket_base_b1f',
    'team_rocket_base_b2f',
    'team_rocket_base_b3f',
    'route_43',
    'route_43_mahogany_gate',
    'route_43_gate',
    'lake_of_rage',
    'lake_of_rage_hidden_power_house',
    'lake_of_rage_magikarp_house',
    'route_44',
    'ice_path_1f',
    'ice_path_b1f',
    'ice_path_b2f_mahogany_side',
    'ice_path_b2f_blackthorn_side',
    'ice_path_b3f',
    'blackthorn_city',
    'blackthorn_gym_1f',
    'blackthorn_gym_2f',
    'blackthorn_dragon_speech_house',
    'blackthorn_emys_house',
    'blackthorn_mart',
    'blackthorn_poke_center',
    'move_deleters_house',
    'dragons_den_1f',
    'dragons_den_b1f',
    'dragon_shrine',
    'route_45',
    'route_46',
    // Phase 12: Johto endgame
    'route_27',
    'route_27_sandstorm_house',
    'route_26',
    'route_26_heal_house',
    'tohjo_falls',
    'victory_road_gate',
    'victory_road',
    'route_22',
    'route_23',
    'indigo_plateau_poke_center',
    'wills_room',
    'kogas_room',
    'brunos_room',
    'karens_room',
    'lances_room',
    'hall_of_fame',
    'route_28',
    'route_28_steel_wing_house',
    'silver_cave_outside',
    'silver_cave_poke_center',
    'silver_cave_room_1',
    'silver_cave_room_2',
    'silver_cave_room_3',
    'silver_cave_item_rooms',
    // Phase 13: Western & Central Kanto
    'pallet_town',
    'reds_house_1f',
    'reds_house_2f',
    'blues_house',
    'oaks_lab',
    'route_1',
    'viridian_city',
    'viridian_gym',
    'viridian_poke_center',
    'viridian_mart',
    'viridian_nickname_house',
    'trainer_house_1f',
    'trainer_house_b1f',
    'route_2',
    'route_2_gate',
    'route_2_nugget_house',
    'pewter_city',
    'pewter_gym',
    'pewter_poke_center',
    'pewter_mart',
    'pewter_nidoran_house',
    'pewter_snooze_house',
    'route_3',
    'mount_moon',
    'mount_moon_square',
    'mount_moon_gift_shop',
    'route_4',
    'cerulean_city',
    'cerulean_gym',
    'cerulean_poke_center',
    'cerulean_mart',
    'cerulean_police_station',
    'cerulean_trade_house',
    'cerulean_badge_house',
    'route_24',
    'route_25',
    'bills_house',
    // Phase 14: Central & Eastern Kanto
    'route_5',
    'route_5_underground_entrance',
    'route_5_saffron_gate',
    'route_5_cleanse_tag_house',
    'underground_path',
    'route_6',
    'route_6_underground_entrance',
    'route_6_saffron_gate',
    'vermilion_city',
    'vermilion_gym',
    'vermilion_poke_center',
    'vermilion_mart',
    'vermilion_fishing_house',
    'vermilion_magnet_train_house',
    'vermilion_digletts_house',
    'vermilion_port_passage',
    'vermilion_port',
    'fast_ship_1f',
    'fast_ship_cabins_nnw_nne_ne',
    'fast_ship_cabins_sw_ssw_nw',
    'fast_ship_cabins_se_sse_captains_cabin',
    'fast_ship_b1f',
    'olivine_port_passage',
    'olivine_port',
    'route_11',
    'digletts_cave',
    'route_9',
    'route_10_north',
    'route_10_south',
    'route_10_poke_center',
    'rock_tunnel_1f',
    'rock_tunnel_b1f',
    'lavender_town',
    'lavender_poke_center',
    'lavender_mart',
    'lavender_speech_house',
    'lavender_name_rater',
    'soul_house',
    'route_8',
    'route_8_saffron_gate',
    'route_7',
    'route_7_saffron_gate',
    'celadon_city',
    'celadon_gym',
    'celadon_poke_center',
    'celadon_dept_store_1f',
    'celadon_dept_store_2f',
    'celadon_dept_store_3f',
    'celadon_dept_store_4f',
    'celadon_dept_store_5f',
    'celadon_dept_store_6f',
    'celadon_dept_store_elevator',
    'celadon_mansion_1f',
    'celadon_mansion_2f',
    'celadon_mansion_3f',
    'celadon_mansion_roof',
    'celadon_mansion_roof_house',
    'celadon_game_corner',
    'celadon_game_corner_prize_room',
    'celadon_cafe',
    // Phase 15: Southern Kanto, Saffron & Sea Routes
    'saffron_city',
    'saffron_gym',
    'fighting_dojo',
    'silph_co_1f',
    'mr_psychics_house',
    'saffron_magnet_train_station',
    'saffron_poke_center',
    'saffron_mart',
    'copycats_house_1f',
    'copycats_house_2f',
    'route_16',
    'route_16_gate',
    'route_16_fuchsia_speech_house',
    'route_17',
    'route_17_route_18_gate',
    'route_18',
    'fuchsia_city',
    'fuchsia_gym',
    'fuchsia_poke_center',
    'fuchsia_mart',
    'safari_zone_main_office',
    'safari_zone_wardens_home',
    'route_19_fuchsia_gate',
    'route_15_fuchsia_gate',
    'route_12',
    'route_12_super_rod_house',
    'route_13',
    'route_14',
    'route_15',
    'route_19',
    'route_20',
    'seafoam_gym',
    'cinnabar_island',
    'cinnabar_poke_center',
    'route_21',
  ];

  window.updateLoaderProgress?.(20, 'Loading Johto & Kanto maps...');
  let loadedMaps: MapData[] = [];
  try {
    const bundleRes = await fetch('./assets/data/world_maps.json');
    if (bundleRes.ok) {
      loadedMaps = await bundleRes.json();
    } else {
      throw new Error(`HTTP ${bundleRes.status}`);
    }
  } catch {
    loadedMaps = await Promise.all(
      mapIds.map(async (id) => {
        const res = await fetch(`./assets/data/maps/${id}.json`);
        return res.json();
      })
    );
  }

  for (const m of loadedMaps) {
    mapManager.registerMap(m);
  }

  let initialMap = mapManager.setCurrentMap(initialMapId);
  if (!mapManager.isWalkable(initialPlayerX, initialPlayerY)) {
    initialMapId = 'new_bark_town';
    initialMap = mapManager.setCurrentMap(initialMapId);
    initialPlayerX = 13;
    initialPlayerY = 6;
  }

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
    };
    await saveManager.saveGame(saveData);
    console.log('💾 Game state successfully saved to IndexedDB.');
  };

  const addOverworldItemToInventory = (rawItemId: string) => {
    const norm = rawItemId.toLowerCase().replace(/_/g, '-');
    const pocket = OverworldItemManager.resolveItemPocket(rawItemId);
    if (pocket === 'TMS') {
      const code = rawItemId.toUpperCase().split('_')[0];
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
  };

  let triggerItemfinderScan = () => {};

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
    }
  );

  const partyUI = new PartyManagementUI('modal-container', playerParty, () => {
    saveCurrentGame();
  });

  const missionLogUI = new MissionLogUI('modal-container', missionManager);
  const itemfinderHUD = new ItemfinderHUD('overworld-hud-container');
  const namingModalUI = new NamingModalUI('overworld-hud-container');
  const boxManagementUI = new BoxManagementUI('modal-container');

  let handleInteract = () => {};
  let toggleLiveItemfinderRadar = (): boolean => false;

  const getCaughtSpeciesSet = () =>
    new Set([...playerParty.map((p) => p.speciesId), ...boxManager.flatten().map((p) => p.speciesId)]);

  let overworldHUD: OverworldHUD;

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
      isGamepadActive: () => overworldHUD?.isGamepadActive() ?? false,
      getTouchControlStyle: () => overworldHUD?.getTouchControlStyle() ?? gameOptions.touchControlStyle ?? 'DPAD',
      getExpShareMode: () => gameOptions.expShare ?? 'CAPPED',
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
        overworldHUD.openPokegear();
      },
      onOpenMissions: () => {
        partyUI.hide();
        bagUI.hide();
        missionManager.checkStoryFlags(storyFlags);
        missionLogUI.open();
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
    namingModalUI.isOpen();

  overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => {
      return cyclePlayerSpeed();
    },
    onMuteToggle: () => {
      return audioManager.toggleMute();
    },
    onMenuToggle: () => {
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

  window.updateLoaderProgress?.(70, 'Mounting overworld engine...');
  const overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer);
  overworldRenderer.setPlayerGender(playerGender);
  const lookupMap = (id: string) => mapManager.getMap(id);

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

  const syncMapOverworldItems = (map: MapData | null) => {
    if (!map) return;
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

  await overworldRenderer.ensureMapTilesLoaded(initialMap);
  overworldRenderer.renderMap(initialMap, lookupMap);
  syncMapOverworldItems(initialMap);

  const battleRenderer = new BattleRenderer(overworldRenderer.app);
  battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
  const battleHUD = new BattleHUD('battle-hud-container');
  battleHUD.setSpeedMultiplier(gameClock.battleSpeed);
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
      npcsByMap.route_36 = freshNpcs.route_36;
      npcsByMap.elms_lab = freshNpcs.elms_lab;
      npcsByMap.azalea_town = freshNpcs.azalea_town;
      npcsByMap.slowpoke_well_b1f = freshNpcs.slowpoke_well_b1f;
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
        gameClock.battleSpeed = updatedOptions.battleSpeedMultiplier;
        battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
        battleHUD.setSpeedMultiplier(gameClock.battleSpeed);
      }
      if (updatedOptions.touchControlStyle) {
        overworldHUD.setTouchControlStyle(updatedOptions.touchControlStyle);
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
  if ((storyFlags.has('HAS_MYSTERY_EGG') || storyFlags.has('HAS_POKEDEX')) && npcsByMap.mr_pokemons_house) {
    npcsByMap.mr_pokemons_house = npcsByMap.mr_pokemons_house.filter((n) => n.id !== 'prof_oak_npc');
  }
  if ((!storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') || storyFlags.has('EVENT_RIVAL_NAMED')) && npcsByMap.elms_lab) {
    npcsByMap.elms_lab = npcsByMap.elms_lab.filter((n) => n.id !== 'lab_police_officer');
  }
  if ((storyFlags.has('EVENT_KURT_LEFT_FOR_WELL') || storyFlags.has('slowpoke_well_cleared')) && npcsByMap.azalea_town) {
    npcsByMap.azalea_town = npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_well_grunt');
  }
  if (storyFlags.has('slowpoke_well_cleared')) {
    if (npcsByMap.azalea_town) {
      npcsByMap.azalea_town = npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_gym_grunt');
    }
    if (npcsByMap.slowpoke_well_b1f) {
      npcsByMap.slowpoke_well_b1f = npcsByMap.slowpoke_well_b1f.filter(
        (n) => !n.id.startsWith('rocket_grunt') && n.id !== 'executive_proton'
      );
    }
  }

  const emptyNpcs: GridEntity[] = [];
  const npcObstaclesScratch: GridEntity[] = [];
  const worldNpcsScratch: GridEntity[] = [];

  const populateWorldNpcs = (map: MapData | null): GridEntity[] => {
    worldNpcsScratch.length = 0;
    if (!map) return worldNpcsScratch;

    const currentList = npcsByMap[map.id];
    if (currentList) {
      for (let i = 0; i < currentList.length; i++) {
        const n = currentList[i];
        n.worldOffsetX = 0;
        n.worldOffsetY = 0;
        worldNpcsScratch.push(n);
      }
    }

    if (map.connections.WEST) {
      const conn = map.connections.WEST;
      const westMap = mapManager.getMap(conn.mapId);
      const westList = westMap ? npcsByMap[westMap.id] : undefined;
      if (westMap && westList) {
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
      const eastList = eastMap ? npcsByMap[eastMap.id] : undefined;
      if (eastMap && eastList) {
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
      const northList = northMap ? npcsByMap[northMap.id] : undefined;
      if (northMap && northList) {
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
      const southList = southMap ? npcsByMap[southMap.id] : undefined;
      if (southMap && southList) {
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
      overworldRenderer.renderMap(nextMap, lookupMap);
      syncMapOverworldItems(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }

    if (nextMapId) {
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

      // Autosave on route transition
      saveCurrentGame();
    }
  };

  // 7. Start Battle (Wild or Trainer, including Multi-Pokémon Trainer Teams)
  const triggerBattle = async (
    initialOpponentPokemon: PokemonInstance,
    options: {
      isRoamer?: boolean;
      isTrainer?: boolean;
      isGymLeader?: boolean;
      trainerName?: string;
      trainerTeam?: PokemonInstance[];
      onVictory?: () => Promise<void> | void;
      onBattleEnd?: (result: BattleTurnResult) => Promise<void> | void;
    } = {}
  ) => {
    let opponentPokemon = initialOpponentPokemon;
    const remainingTrainerParty: PokemonInstance[] =
      options.trainerTeam && options.trainerTeam.length > 1
        ? options.trainerTeam.slice(1)
        : [];

    gameState = 'BATTLE';
    overworldHUD.hide();
    itemfinderHUD.suspend();
    player.isMoving = false;
    player.progress = 0;
    audioManager.playBattleBgm(
      options.isGymLeader ? 'gym_leader' : options.isTrainer ? 'trainer' : 'wild'
    );

    // Record species as SEEN in Pokédex
    seenSpecies.add(opponentPokemon.speciesId);

    // Reset temporary trapping flag at the start of a new encounter while keeping persistent HP/Status
    if (playerParty.length === 0) return;
    opponentPokemon.isTrapped = false;

    let activePlayerPokemon =
      playerParty.find((p) => !p.isEgg && p.currentHp > 0) ||
      playerParty.find((p) => !p.isEgg) ||
      playerParty[0];
    if (activePlayerPokemon.currentHp <= 0) {
      healPlayerParty();
      activePlayerPokemon = playerParty.find((p) => !p.isEgg) || playerParty[0];
    }
    let battleSM = new BattleStateMachine(activePlayerPokemon, opponentPokemon, options.isRoamer);

    battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
    battleHUD.updateSpeedDisplay(gameClock.battleSpeed);

    const caughtSpeciesIds = new Set<string>([
      ...playerParty.map((p) => p.speciesId),
      ...playerBox.map((p) => p.speciesId),
    ]);

    await battleRenderer.startBattle(activePlayerPokemon, opponentPokemon);

    if (options.isTrainer) {
      await battleHUD.showMessage(`${options.trainerName} would like to battle!`);
      await battleHUD.showMessage(`${options.trainerName} sent out ${opponentPokemon.nickname}!`);
    } else if (options.isRoamer) {
      await battleHUD.showMessage(`⚡ Legendary Beast ${opponentPokemon.nickname} appeared!`);
    } else {
      await battleHUD.showMessage(`Wild ${opponentPokemon.nickname} appeared!`);
    }

    const bindBattleHudForActiveFoe = () => {
      battleHUD.initBattle(
        activePlayerPokemon,
        opponentPokemon,
        {
          onMoveSelected: async (moveId: string) => {
            const result = battleSM.executeRound({ type: 'FIGHT', moveId });
            await playTurnEventsAndFinishCheck(result);
          },
          onPokemonSelected: async (targetPokemon: PokemonInstance) => {
            const result = battleSM.executeRound({ type: 'SWITCH', switchPokemon: targetPokemon });
            await playTurnEventsAndFinishCheck(result);
          },
          onBagSelected: async (ballId: PokeballId) => {
            if (options.isTrainer) {
              await battleHUD.showMessage("The trainer blocked the ball! Don't be a thief!");
              battleHUD.showActionMenu();
              return;
            }

            if (inventory.balls[ballId] && inventory.balls[ballId]! > 0) {
              inventory.balls[ballId]!--;
            }

            const result = battleSM.executeRound({ type: 'BAG', ballId });
            await playTurnEventsAndFinishCheck(result);
          },
          onRunSelected: async () => {
            if (options.isTrainer) {
              await battleHUD.showMessage("No! There's no running from a Trainer battle!");
              battleHUD.showActionMenu();
              return;
            }
            const runResult = battleSM.executeRound({ type: 'RUN' });
            if (options.isRoamer) {
              eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
            }
            await battleHUD.showMessage('Got away safely!');
            battleRenderer.endBattle();
            battleHUD.hide();
            gameState = 'OVERWORLD';
            audioManager.restoreOverworldBgm(0.6);
            overworldHUD.show();
            itemfinderHUD.resume();
            if (options.onBattleEnd) {
              await options.onBattleEnd(runResult);
            }
          },
          onSpeedToggle: () => {
            const nextSpeed = gameClock.cycleBattleSpeed();
            gameOptions.battleSpeedMultiplier = nextSpeed;
            battleRenderer.setSpeedMultiplier(nextSpeed);
            return nextSpeed;
          },
        },
        inventory.balls,
        playerParty,
        caughtSpeciesIds
      );
    };

    const playTurnEventsAndFinishCheck = async (result: BattleTurnResult) => {
      let ballGraphic: Graphics | null = null;

      for (const ev of result.events) {
        if (ev.type === 'MESSAGE') {
          await battleHUD.showMessage(ev.text);
        } else if (ev.type === 'SWITCH') {
          activePlayerPokemon = ev.newPokemon;
          await battleRenderer.animateSwitchPlayerPokemon(activePlayerPokemon);
          battleHUD.setActivePlayerPokemon(activePlayerPokemon);
          battleHUD.slideInHealthCard(true);
        } else if (ev.type === 'THROW_BALL') {
          ballGraphic = await battleRenderer.animateThrowBall(ev.ballId);
        } else if (ev.type === 'SHAKE' && ballGraphic) {
          await battleRenderer.animateShake(ballGraphic, ev.shakes, ev.caught);
        } else if (ev.type === 'ATTACK') {
          await battleRenderer.animateAttack(
            ev.attackerId === activePlayerPokemon.uid,
            ev.moveType,
            ev.moveCategory
          );
        } else if (ev.type === 'DAMAGE') {
          const isPlayerTarget = ev.targetId === activePlayerPokemon.uid;
          await battleRenderer.animateDamage(isPlayerTarget, ev.effectiveness, ev.isCritical);
          const maxHp = isPlayerTarget ? activePlayerPokemon.stats.hp : opponentPokemon.stats.hp;
          battleHUD.updateHp(isPlayerTarget, ev.remainingHp, maxHp);
        } else if (ev.type === 'RESIDUAL_DAMAGE') {
          const isPlayerTarget = ev.targetId === activePlayerPokemon.uid;
          await battleRenderer.animateDamage(isPlayerTarget, 1, false);
          const maxHp = isPlayerTarget ? activePlayerPokemon.stats.hp : opponentPokemon.stats.hp;
          battleHUD.updateHp(isPlayerTarget, ev.remainingHp, maxHp);
        } else if (ev.type === 'STAT_CHANGE') {
          const isPlayerTarget = ev.targetId === activePlayerPokemon.uid;
          await battleRenderer.animateStatChange(isPlayerTarget, ev.stages > 0);
          battleHUD.updateStatusBadges();
        } else if (ev.type === 'STATUS') {
          battleHUD.updateStatusBadges();
        } else if (ev.type === 'FAINT') {
          const isPlayerTarget = ev.targetId === activePlayerPokemon.uid;
          BattleAudio.playCry(isPlayerTarget ? activePlayerPokemon.speciesId : opponentPokemon.speciesId, true);
          await battleRenderer.animateFaint(isPlayerTarget);
        }
      }

      if (result.isBattleOver) {
        if (result.caught) {
          if (options.isRoamer) {
            roamingManager.markCaught(opponentPokemon.speciesId);
            overworldHUD.hideRoamerAlert();
          }
          if (playerParty.length < 6) {
            playerParty.push(opponentPokemon);
          } else {
            const depositRes = boxManager.deposit(opponentPokemon);
            playerBox = boxManager.flatten();
            const targetBox = boxManager.getBox(depositRes.boxIndex);
            const boxName = targetBox ? targetBox.name : `BOX ${depositRes.boxIndex + 1}`;
            BattleAudio.playOverworldSound('FANFARE');
            await battleHUD.showMessage("Bill's PC was accessed.");
            await battleHUD.showMessage(
              `${opponentPokemon.nickname || opponentPokemon.speciesId.toUpperCase()} was transferred to ${boxName}!`
            );
            if (depositRes.rolledOver) {
              await battleHUD.showMessage(
                `The previous box was full! Automatically stored in ${boxName}!`
              );
            }
            saveCurrentGame();
          }
        } else if (result.winner === 'PLAYER') {
          if (options.isRoamer) {
            roamingManager.markDefeated(opponentPokemon.speciesId);
            overworldHUD.hideRoamerAlert();
          }

          // Award EXP & Check Level-Up across party via Unbound-Style Exp. Share (OFF | ALL | CAPPED)
          const expGained = PokemonFactory.calculateExpGain(opponentPokemon, Boolean(options.isTrainer));
          const expShareMode: ExpShareMode = gameOptions.expShare || 'CAPPED';
          const expAwards = PokemonFactory.distributePartyExp(
            playerParty,
            activePlayerPokemon,
            expGained,
            expShareMode,
            inventory.badges.length
          );

          for (const award of expAwards) {
            const member = award.pokemon;
            if (award.isActiveBattler) {
              if (award.isCapped) {
                await battleHUD.showMessage(
                  `🧢 ${member.nickname} is at the level cap (Lv. ${award.levelCap})! Received 1 EXP.`
                );
              } else {
                await battleHUD.showMessage(`${member.nickname} gained ${award.expAwarded} EXP. Points!`);
              }
              battleHUD.updateExp(activePlayerPokemon);
              battleHUD.updateHp(true, activePlayerPokemon.currentHp, activePlayerPokemon.stats.hp);
            } else {
              if (award.isCapped) {
                await battleHUD.showMessage(
                  `🧢 ${member.nickname} is at the level cap (Lv. ${award.levelCap})! Received 1 EXP.`
                );
              } else {
                await battleHUD.showMessage(
                  `✨ ${member.nickname} gained ${award.expAwarded} EXP. Points via Exp. Share!`
                );
              }
            }

            if (award.leveledUp) {
              BattleAudio.playBallEvent('LEVEL_UP');
              await battleHUD.showMessage(
                `🎉 ${member.nickname} grew to Lv. ${award.newLevel}!`
              );

              // Level-Up Learnset Move Learning (Ticket 6.4)
              const learnableMoveIds = await PokemonFactory.getLearnableMovesAtLevel(
                member.speciesId,
                award.newLevel
              );

              for (const newMoveId of learnableMoveIds) {
                const alreadyKnown = member.moves.some((m) => m.moveId === newMoveId);
                if (alreadyKnown) continue;

                const newMoveData = PokemonFactory.getMoveData(newMoveId);

                if (member.moves.length < 4) {
                  // Auto-learn if fewer than 4 moves
                  member.moves.push({
                    moveId: newMoveData.id,
                    currentPp: newMoveData.pp,
                    maxPp: newMoveData.pp,
                  });
                  BattleAudio.playBallEvent('LEVEL_UP');
                  await battleHUD.showMessage(
                    `✨ ${member.nickname} learned ${newMoveData.name}!`
                  );
                } else {
                  // Prompt to forget an existing move or decline
                  const chosenIdx = await battleHUD.promptMoveForget(member, newMoveData);
                  if (chosenIdx !== null && chosenIdx >= 0 && chosenIdx < 4) {
                    const forgottenMove = member.moves[chosenIdx];
                    const forgottenData = PokemonFactory.getMoveData(forgottenMove.moveId);
                    member.moves[chosenIdx] = {
                      moveId: newMoveData.id,
                      currentPp: newMoveData.pp,
                      maxPp: newMoveData.pp,
                    };
                    BattleAudio.playBallEvent('LEVEL_UP');
                    await battleHUD.showMessage(
                      `1, 2, and... Poof! ${member.nickname} forgot ${forgottenData.name} and learned ${newMoveData.name}!`
                    );
                  } else {
                    await battleHUD.showMessage(
                      `${member.nickname} did not learn ${newMoveData.name}.`
                    );
                  }
                }
              }
            }
          }

          // Multi-Pokémon Trainer Team continuation (Ticket 5.5)
          if (options.isTrainer && remainingTrainerParty.length > 0) {
            opponentPokemon = remainingTrainerParty.shift()!;
            opponentPokemon.isTrapped = false;
            seenSpecies.add(opponentPokemon.speciesId);
            battleSM = new BattleStateMachine(activePlayerPokemon, opponentPokemon, false);
            await battleHUD.showMessage(`${options.trainerName} sent out ${opponentPokemon.nickname}!`);
            await battleRenderer.animateSendOutNextPokemon(false, opponentPokemon);
            bindBattleHudForActiveFoe();
            battleHUD.slideInHealthCard(false);
            return;
          }

          if (options.isTrainer) {
            inventory.money += 200;
            await battleHUD.showMessage(`You defeated ${options.trainerName}!`);
            await battleHUD.showMessage(`You got $200 for winning!`);
          }
        } else if (result.winner === 'ENEMY') {
          const remainingConscious = playerParty.filter((p) => !p.isEgg && p.currentHp > 0);
          if (remainingConscious.length > 0) {
            await battleHUD.showMessage(
              `${activePlayerPokemon.nickname} fainted! Choose another POKéMON to send in!`
            );
            battleHUD.showPartyMenu({
              forcedSwitch: true,
              onSelected: async (nextPokemon: PokemonInstance) => {
                activePlayerPokemon = nextPokemon;
                battleSM.playerPokemon = nextPokemon;
                battleSM.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();
                battleSM.isBattleOver = false;
                await battleHUD.showMessage(`Go! ${activePlayerPokemon.nickname}!`);
                await battleRenderer.animateSendOutNextPokemon(true, activePlayerPokemon);
                bindBattleHudForActiveFoe();
                battleHUD.slideInHealthCard(true);
              },
            });
            return;
          }

          // Whiteout / Blackout sequence (all party Pokémon fainted)
          const fine = Math.min(inventory.money, Math.max(20, Math.floor(inventory.money * 0.1)));
          inventory.money = Math.max(0, inventory.money - fine);
          await battleHUD.showMessage(`${playerName} is out of usable POKéMON!`);
          if (fine > 0) {
            await battleHUD.showMessage(`${playerName} paid $${fine} as the prize money…`);
          }
          await battleHUD.showMessage(
            `${playerName} blacked out and rushed to the POKéMON CENTER!`
          );

          if (options.isRoamer) {
            eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
          }

          battleRenderer.endBattle();
          battleHUD.hide();
          gameState = 'OVERWORLD';

          const respawnMapId = mapManager.getMap(lastVisitedPokecenter.mapId)
            ? lastVisitedPokecenter.mapId
            : 'new_bark_town';
          const respawnMap = mapManager.setCurrentMap(respawnMapId);
          player.x = lastVisitedPokecenter.x;
          player.y = lastVisitedPokecenter.y;
          player.targetX = lastVisitedPokecenter.x;
          player.targetY = lastVisitedPokecenter.y;
          player.renderX = lastVisitedPokecenter.x;
          player.renderY = lastVisitedPokecenter.y;
          player.direction = 'DOWN';
          player.isMoving = false;
          player.progress = 0;

          overworldRenderer.renderMap(respawnMap, lookupMap);
          syncMapOverworldItems(respawnMap);
          overworldHUD.updateRouteName(respawnMap.name);
          audioManager.playMapBgm(respawnMap.id, 0.8);
          overworldHUD.show();
          itemfinderHUD.resume();

          healPlayerParty(false);
          saveCurrentGame();
          if (respawnMap.id.endsWith('_poke_center')) {
            overworldHUD.playHealingAnimation(playerParty.length, () => {
              overworldHUD.showToast('💖 Your party was restored to full HP & PP at the Pokémon Center!');
            });
          } else {
            overworldHUD.playFieldRestAnimation(() => {
              overworldHUD.showToast('💖 Your party was restored to full HP & PP at home!');
            });
          }
          return;
        }
        if (options.isRoamer) {
          eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
        }
        await battleHUD.showMessage('Battle concluded! Returning to overworld...');
        battleRenderer.endBattle();
        battleHUD.hide();
        gameState = 'OVERWORLD';
        audioManager.restoreOverworldBgm(0.6);
        overworldHUD.show();
        itemfinderHUD.resume();
        saveCurrentGame();

        if (options.onBattleEnd) {
          await options.onBattleEnd(result);
        }
        if (result.winner === 'PLAYER' && options.onVictory) {
          await options.onVictory();
        }
      } else {
        battleHUD.showActionMenu();
      }
    };

    bindBattleHudForActiveFoe();
  };

  const buildTrainerTeamInstances = (trainer: GridEntity): PokemonInstance[] => {
    if (trainer.trainerTeam && trainer.trainerTeam.length > 0) {
      return trainer.trainerTeam.map((spec) =>
        PokemonFactory.create(spec.speciesId, spec.level, spec.moves)
      );
    }
    if (trainer.trainerPokemon) {
      return [
        PokemonFactory.create(
          trainer.trainerPokemon.speciesId,
          trainer.trainerPokemon.level,
          trainer.trainerPokemon.moves
        ),
      ];
    }
    return [];
  };

  const getOppositeDirection = (dir: Direction): Direction => {
    switch (dir) {
      case 'UP':
        return 'DOWN';
      case 'DOWN':
        return 'UP';
      case 'LEFT':
        return 'RIGHT';
      case 'RIGHT':
        return 'LEFT';
    }
  };

  let isCutsceneLocked = false;

  /**
   * Executes an authentic Gen 2 Line-of-Sight Trainer Encounter:
   * 1. Locks player input & pops bouncy `[!]` balloon above trainer's head
   * 2. Walks trainer tile-by-tile up to 1 tile away from the player
   * 3. Turns player toward trainer, displays challenge dialogue, and starts Trainer Battle
   */
  const runTrainerSightSequence = async (trainer: GridEntity) => {
    if (!trainer.trainerId || !trainer.trainerPokemon) return;
    isCutsceneLocked = true;
    defeatedTrainers.add(trainer.trainerId);
    player.isMoving = false;
    player.progress = 0;

    BattleAudio.playOverworldSound('EXCLAMATION');
    await overworldRenderer.showExclamationBubble(trainer, Math.round(520 / gameClock.playerSpeed));

    // Walk trainer up to 1 tile away from player
    const delta = GridPhysics.getDirectionDelta(trainer.direction);
    const stepsToWalk = Math.max(
      0,
      Math.abs(player.x - trainer.x) + Math.abs(player.y - trainer.y) - 1
    );

    for (let s = 0; s < stepsToWalk; s++) {
      const startX = trainer.x;
      const startY = trainer.y;
      const nextX = startX + delta.dx;
      const nextY = startY + delta.dy;
      trainer.targetX = nextX;
      trainer.targetY = nextY;
      trainer.isMoving = true;
      trainer.progress = 0;

      const stepMs = (GridPhysics.BASE_TRAVERSAL_TIME * 1000) / gameClock.playerSpeed;
      await new Promise<void>((resolve) => {
        const t0 = performance.now();
        const animateStep = (now: number) => {
          const p = Math.min(1, (now - t0) / stepMs);
          trainer.progress = p;
          trainer.renderX = startX + (nextX - startX) * p;
          trainer.renderY = startY + (nextY - startY) * p;
          if (p < 1) {
            requestAnimationFrame(animateStep);
          } else {
            trainer.x = nextX;
            trainer.y = nextY;
            trainer.renderX = nextX;
            trainer.renderY = nextY;
            trainer.isMoving = false;
            trainer.progress = 0;
            resolve();
          }
        };
        requestAnimationFrame(animateStep);
      });
    }

    player.direction = getOppositeDirection(trainer.direction);
    const dialoguePages =
      trainer.challengePages && trainer.challengePages.length > 0
        ? trainer.challengePages
        : trainer.pages || ['Let us battle!'];

    overworldHUD.openDialogue(dialoguePages, trainer.speaker, () => {
      isCutsceneLocked = false;
      const team = buildTrainerTeamInstances(trainer);
      if (team.length === 0) return;
      triggerBattle(team[0], {
        isTrainer: true,
        trainerName: trainer.trainerName || trainer.speaker || 'Trainer',
        trainerTeam: team,
      });
    });
  };

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
        // Turn NPC toward player if not mid-step
        if (!targetNpc.isMoving) {
          targetNpc.direction = getOppositeDirection(player.direction);
        }

        // Special scripted quest inside Mr. Pokémon's House (Mystery Egg + Prof. Oak's Pokédex)
        if (targetNpc.action === 'MR_POKEMON_EVENT' || targetNpc.id === 'mr_pokemon_npc') {
          if (!storyFlags.has('HAS_MYSTERY_EGG')) {
            storyFlags.add('HAS_MYSTERY_EGG');
            storyFlags.add('HAS_POKEDEX');
            if (!inventory.keyItems) inventory.keyItems = [];
            if (!inventory.keyItems.includes('MYSTERY EGG')) inventory.keyItems.push('MYSTERY EGG');
            if (!inventory.keyItems.includes('POKéDEX')) inventory.keyItems.push('POKéDEX');
            healPlayerParty();
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                `MR. POKéMON: Hello, hello! You must be ${playerName}, sent by PROF. ELM!`,
                `This is the rare egg I asked PROF. ELM to examine—${playerName} received the MYSTERY EGG!`,
                `PROF. OAK: Aha! So you are ${playerName}! Your ${playerParty[0]?.nickname || 'POKéMON'} seems very attached to you!`,
                'PROF. OAK: You look like a dependable trainer! Take this latest-model POKéDEX!',
                'PROF. OAK: I am off to GOLDENROD CITY for my radio show. Good luck on your journey!',
                '🎩 MR. POKéMON also restored your party to full health before your journey back!',
              ],
              '🎩 MR. POKéMON & 🎓 PROF. OAK',
              () => {
                if (npcsByMap.mr_pokemons_house) {
                  npcsByMap.mr_pokemons_house = npcsByMap.mr_pokemons_house.filter(
                    (n) => n.id !== 'prof_oak_npc'
                  );
                }
                if (npcsByMap.new_bark_town) {
                  npcsByMap.new_bark_town = npcsByMap.new_bark_town.filter((n) => n.id !== 'nbt_rival');
                }
                saveCurrentGame();
                overworldHUD.showToast('🥚 Received MYSTERY EGG & 📕 POKéDEX! (Check START MENU -> POKéDEX)');
              }
            );
            return;
          }

          if (!storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
            overworldHUD.openDialogue(
              [
                "MR. POKéMON: I'm depending on you!",
                'Please deliver that rare EGG to PROF. ELM safely!',
              ],
              targetNpc.speaker,
              () => {
                healPlayerParty(false);
                saveCurrentGame();
                overworldHUD.playFieldRestAnimation();
              }
            );
            return;
          }

          overworldHUD.openDialogue(
            ['MR. POKéMON: Life is wonderful! Always new discoveries to be made!'],
            targetNpc.speaker,
            () => {
              healPlayerParty(false);
              saveCurrentGame();
              overworldHUD.playFieldRestAnimation();
            }
          );
          return;
        }

        // Route 30 Berry House gift
        if (targetNpc.action === 'BERRY_MAN_EVENT' && !storyFlags.has('RECEIVED_ROUTE30_BERRY_POTION')) {
          storyFlags.add('RECEIVED_ROUTE30_BERRY_POTION');
          if (!inventory.items) inventory.items = {};
          inventory.items.potion = (inventory.items.potion || 0) + 1;
          BattleAudio.playOverworldSound('KEY_ITEM');
          overworldHUD.openDialogue(targetNpc.pages || [], targetNpc.speaker, () => {
            saveCurrentGame();
            overworldHUD.showToast('🧪 Received POTION from the Route 30 Berry House!');
          });
          return;
        }

        // Universal Day Sibling item gift handler (Monica, Tuscany, Wesley, Arthur, Frieda, Santos, Sunny)
        if (targetNpc.action === 'DAY_SIBLING_EVENT') {
          const sibling =
            DAY_SIBLINGS[targetNpc.id] ||
            Object.values(DAY_SIBLINGS).find(
              (s) =>
                s.name.toLowerCase().includes(targetNpc.id.toLowerCase()) ||
                targetNpc.id.toLowerCase().includes(s.id.toLowerCase())
            );

          if (sibling) {
            if (storyFlags.has(sibling.flag)) {
              overworldHUD.openDialogue(sibling.alreadyGivenPages, targetNpc.speaker);
              return;
            }

            storyFlags.add(sibling.flag);
            if (!inventory.items) inventory.items = {};
            inventory.items[sibling.itemId] = (inventory.items[sibling.itemId] || 0) + 1;
            BattleAudio.playOverworldSound('FANFARE');
            overworldHUD.openDialogue(sibling.giftPages, targetNpc.speaker, () => {
              saveCurrentGame();
              overworldHUD.showToast(`🎁 Received ${sibling.itemName} from ${sibling.name}!`);
            });
            return;
          }
        }

        // Sprout Tower 3F Boss: Elder Li (Ticket 5.2)
        if (targetNpc.action === 'ELDER_LI_EVENT' && !storyFlags.has('sprout_tower_cleared')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'ELDER LI: So, you have come seeking enlightenment with your POKéMON. As the ELDER of SPROUT TOWER, I shall test the bond between you and your partners!',
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              trainerName: targetNpc.trainerName || 'Elder Li',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('elder_li');
                storyFlags.add('sprout_tower_cleared');
                if (!inventory.tms.includes('HM05')) inventory.tms.push('HM05');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    'ELDER LI: Ah, splendid! You truly possess the heart of a true trainer! As proof of your mastery, take this HIDDEN MACHINE: HM05 FLASH!',
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('⚡ Defeated Elder Li & received HM05 FLASH!');
                  }
                );
              },
            });
          });
          return;
        }

        // Violet Gym Leader Boss: Falkner (Ticket 5.3)
        if (targetNpc.action === 'FALKNER_EVENT' && !storyFlags.has('falkner_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  "FALKNER: I'm FALKNER, the VIOLET CITY POKéMON GYM leader! People say you can clip flying-type wings with a jolt of electricity… I won't allow such insults to bird POKéMON! I'll show you the real power of the magnificent bird POKéMON!",
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Falkner',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('falkner');
                storyFlags.add('falkner_defeated');
                if (!inventory.badges.includes('zephyr')) inventory.badges.push('zephyr');
                if (!inventory.tms.includes('TM31')) inventory.tms.push('TM31');
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    "FALKNER: …Darn! My dad's cherished bird POKéMON… All right. Take this. It's the official POKéMON LEAGUE ZEPHYRBADGE!",
                    "FALKNER: Here—take this too. It's TM31 MUD-SLAP! By using a TM, a POKéMON will instantly learn a new move. Think before you act—a TM can be used only once!",
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🦅 Received ZEPHYR BADGE & TM31 MUD-SLAP from Leader Falkner!');
                  }
                );
              },
            });
          });
          return;
        }

        // Azalea Gym Leader Boss: Bugsy
        if (targetNpc.action === 'BUGSY_EVENT' && !storyFlags.has('bugsy_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  "BUGSY: I'm BUGSY! I never lose when it comes to bug POKéMON. My research is going to make me an authority on bug POKéMON! Let me demonstrate what I've learned from my studies!",
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Bugsy',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('bugsy');
                storyFlags.add('bugsy_defeated');
                storyFlags.add('CAN_USE_CUT');
                if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
                if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
                missionManager.checkStoryFlags(storyFlags);
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    "BUGSY: Whoa, amazing! You're an expert on POKéMON! My research isn't complete yet, but you're definitely strong. Take the official POKéMON LEAGUE HIVEBADGE!",
                    "BUGSY: Do you know the benefits of the HIVEBADGE? If you have it, POKéMON up to Lv. 30 will obey you, even traded ones. POKéMON that know CUT will also be able to use it outside of battle. Here, take this too—it's TM49 FURY CUTTER!",
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🐞 Received HIVE BADGE & TM49 FURY CUTTER from Leader Bugsy!');
                  }
                );
              },
            });
          });
          return;
        }

        // Goldenrod Gym Leader Boss: Whitney
        if (targetNpc.action === 'WHITNEY_EVENT' && !storyFlags.has('whitney_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  "WHITNEY: Hi! I'm WHITNEY! Everyone was into POKéMON, so I got into it too! POKéMON are super cute! You think you can beat mine? Don't cry if you lose!",
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Whitney',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('whitney');
                storyFlags.add('whitney_defeated');
                if (!inventory.badges.includes('plain')) inventory.badges.push('plain');
                if (!inventory.tms.includes('TM45')) inventory.tms.push('TM45');
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    "WHITNEY: …Sniff… …Waaaaah! What a meanie! I lost! You're horrible!",
                    "WHITNEY: …Sniff… …Sigh… It's okay. You won fair and square. Take the PLAINBADGE!",
                    "WHITNEY: The PLAINBADGE boosts your POKéMON's SPEED stat! It also lets your POKéMON use STRENGTH outside of battle. Oh, and take this too—it's TM45 ATTRACT!",
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🎀 Received PLAIN BADGE & TM45 ATTRACT from Leader Whitney!');
                  }
                );
              },
            });
          });
          return;
        }

        // Ecruteak Gym Leader Boss: Morty
        if (targetNpc.action === 'MORTY_EVENT' && !storyFlags.has('morty_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  "MORTY: Where is the legendary rainbow bird? I have meditated with ghost POKéMON in solitude waiting for its arrival. I see a shadow of greatness within you… Let us test your spirit!",
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Morty',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('morty');
                storyFlags.add('morty_defeated');
                if (!inventory.badges.includes('fog')) inventory.badges.push('fog');
                if (!inventory.tms.includes('TM30')) inventory.tms.push('TM30');
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    "MORTY: I see… I was not the chosen one. Your bond with your POKéMON has guided you beyond my spectral realm. Take the official POKéMON LEAGUE FOGBADGE!",
                    "MORTY: By holding the FOGBADGE, POKéMON up to Lv. 50 will obey your every command. Your POKéMON will also be able to use SURF to cross open waters! Take this TM30 SHADOW BALL as well!",
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('👻 Received FOG BADGE & TM30 SHADOW BALL from Leader Morty!');
                  }
                );
              },
            });
          });
          return;
        }

        // Cianwood Pharmacy: SecretPotion Event
        if (targetNpc.action === 'PHARMACY_SECRET_POTION_EVENT') {
          if (storyFlags.has('has_secret_potion')) {
            overworldHUD.openDialogue(
              ['PHARMACIST: My SECRETPOTION is potent! It will cure any illness, guaranteed.'],
              targetNpc.speaker
            );
          } else {
            storyFlags.add('has_secret_potion');
            if (!inventory.keyItems) inventory.keyItems = [];
            if (!inventory.keyItems.includes('SecretPotion')) inventory.keyItems.push('SecretPotion');
            audioManager.playSfx('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                'PHARMACIST: Ah, you came all the way from OLIVINE? The lighthouse POKéMON is sick?',
                'Take this! It is our ancient SECRETPOTION! It was brewed with 500 years of herbal knowledge.',
                `${playerName} received the SECRETPOTION!`,
              ],
              targetNpc.speaker,
              () => {
                saveCurrentGame();
                overworldHUD.showToast('💊 Received SECRETPOTION from Cianwood Pharmacist!');
              }
            );
          }
          return;
        }

        // Olivine Lighthouse 6F: Amphy & Jasmine Healing Event
        if (targetNpc.action === 'AMPHY_EVENT') {
          if (storyFlags.has('amphy_cured')) {
            overworldHUD.openDialogue(
              [
                'AMPHAROS: Palu! Palulu! (Amphy is radiating brilliant light, glowing happily!)',
                'JASMINE: Amphy is all better now! I am heading back to OLIVINE GYM. Let us battle there!',
              ],
              targetNpc.speaker
            );
          } else if (storyFlags.has('has_secret_potion')) {
            storyFlags.add('amphy_cured');
            audioManager.playSfx('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                `${playerName} handed over the SECRETPOTION to JASMINE!`,
                'JASMINE carefully gave the medicine to AMPHY…',
                'AMPHAROS swallowed it eagerly… Suddenly, its tail began to glow brightly!',
                'AMPHAROS: Palu! Paluluuu!',
                `JASMINE: Oh, thank goodness! Amphy's fever has broken! Thank you so much, ${playerName}!`,
                'I will return to the GYM in OLIVINE CITY right away. Please come challenge me there for a real GYM battle!',
              ],
              targetNpc.speaker,
              () => {
                saveCurrentGame();
                overworldHUD.showToast('✨ Amphy recovered! Leader Jasmine returned to Olivine Gym!');
              }
            );
          } else {
            overworldHUD.openDialogue(
              [
                'JASMINE: …Amphy used to shine so brightly to guide ships across the dark sea…',
                "It's so weak and feverish… I won't leave its side until it gets better.",
                'I heard there is a pharmacy in CIANWOOD CITY across the sea that carries miracle medicine…',
                'AMPHAROS: …Palu… (It looks pale and feverish…)',
              ],
              targetNpc.speaker
            );
          }
          return;
        }

        // Olivine Gym Leader Boss: Jasmine
        if (targetNpc.action === 'JASMINE_EVENT' && !storyFlags.has('jasmine_defeated')) {
          if (!storyFlags.has('amphy_cured')) {
            overworldHUD.openDialogue(
              [
                "JASMINE: …I'm sorry. I must care for Amphy at the LIGHTHOUSE. Please meet me there…",
              ],
              targetNpc.speaker
            );
            return;
          }
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'JASMINE: …Thank you for your help at the LIGHTHOUSE. But this is different. As a GYM LEADER, I will use my full power. POKéMON of steel… Clad in diamond-hard scales! Steelix, let us begin!',
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Jasmine',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('jasmine');
                storyFlags.add('jasmine_defeated');
                if (!inventory.badges.includes('mineral')) inventory.badges.push('mineral');
                if (!inventory.tms.includes('TM23')) inventory.tms.push('TM23');
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    'JASMINE: …You are truly strong. In accordance with LEAGUE rules, I confer upon you the MINERALBADGE!',
                    'The MINERALBADGE raises the DEFENSE of all your POKéMON and allows them to navigate waterfalls. Take this TM23 IRON TAIL as well!',
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🔩 Received MINERAL BADGE & TM23 IRON TAIL from Leader Jasmine!');
                  }
                );
              },
            });
          });
          return;
        }

        // Pryce Gym Leader Boss
        if (targetNpc.action === 'PRYCE_EVENT' && !storyFlags.has('pryce_defeated')) {
          overworldHUD.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0 ? targetNpc.challengePages : ['PRYCE: In my 60 years of training, I have seen it all. Let me show you the power of ice!'],
            targetNpc.speaker,
            () => {
              const team = buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Leader Pryce',
                trainerTeam: team,
                onVictory: () => {
                  defeatedTrainers.add('pryce');
                  storyFlags.add('pryce_defeated');
                  if (!inventory.badges.includes('glacier')) inventory.badges.push('glacier');
                  if (!inventory.tms.includes('TM16')) inventory.tms.push('TM16');
                  audioManager.playSfx('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  overworldHUD.openDialogue(
                    ['PRYCE: Your strong bond is clear. Take the GLACIERBADGE and TM16 ICY WIND!'],
                    targetNpc.speaker,
                    () => {
                      saveCurrentGame();
                      overworldHUD.showToast('❄️ Received GLACIER BADGE & TM16 from Leader Pryce!');
                    }
                  );
                },
              });
            }
          );
          return;
        }

        // Clair Gym Leader Boss
        if (targetNpc.action === 'CLAIR_EVENT' && !storyFlags.has('clair_defeated')) {
          overworldHUD.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0 ? targetNpc.challengePages : ['CLAIR: I am the best dragon master! Not even you can defeat me!'],
            targetNpc.speaker,
            () => {
              const team = buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Leader Clair',
                trainerTeam: team,
                onVictory: () => {
                  defeatedTrainers.add('clair');
                  storyFlags.add('clair_defeated');
                  if (!inventory.badges.includes('rising')) inventory.badges.push('rising');
                  if (!inventory.tms.includes('TM24')) inventory.tms.push('TM24');
                  audioManager.playSfx('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  overworldHUD.openDialogue(
                    ['CLAIR: I lost?! Fine, take the RISINGBADGE and TM24 DRAGONBREATH!'],
                    targetNpc.speaker,
                    () => {
                      saveCurrentGame();
                      overworldHUD.showToast('🐉 Received RISING BADGE & TM24 from Leader Clair!');
                    }
                  );
                },
              });
            }
          );
          return;
        }

        // Kanto Gym Leaders (Brock, Misty, Surge, Erika, Janine, Sabrina, Blaine, Blue)
        const kantoLeaderConfigs: Record<
          string,
          { flag: string; badge: string; tm: string; toast: string; dialogue: string; fallbackChallenge: string }
        > = {
          BROCK_EVENT: {
            flag: 'brock_defeated',
            badge: 'boulder',
            tm: 'TM34',
            toast: '🪨 Received BOULDER BADGE & TM34 from Leader Brock!',
            dialogue: 'BROCK: My rock-hard willpower was shaken! Take the BOULDERBADGE and TM34 ROLLOUT!',
            fallbackChallenge: 'BROCK: I am Brock, the Pewter Gym Leader! My rock Pokémon are solid defense!',
          },
          MISTY_EVENT: {
            flag: 'misty_defeated',
            badge: 'cascade',
            tm: 'TM03',
            toast: '💧 Received CASCADE BADGE & TM03 from Leader Misty!',
            dialogue: 'MISTY: You really are an exceptional trainer! Take the CASCADEBADGE and TM03 WATER PULSE!',
            fallbackChallenge: 'MISTY: I am Misty, the world-famous water Pokémon master!',
          },
          SURGE_EVENT: {
            flag: 'surge_defeated',
            badge: 'thunder',
            tm: 'TM25',
            toast: '⚡ Received THUNDER BADGE & TM25 from Leader Lt. Surge!',
            dialogue: 'LT. SURGE: Ten-hut! You zapped right through my defenses! Take the THUNDERBADGE and TM25 THUNDER!',
            fallbackChallenge: 'LT. SURGE: Hey kid, what do you think you are doing? Electric Pokémon will shock you!',
          },
          ERIKA_EVENT: {
            flag: 'erika_defeated',
            badge: 'rainbow',
            tm: 'TM19',
            toast: '🌸 Received RAINBOW BADGE & TM19 from Leader Erika!',
            dialogue: 'ERIKA: Oh, what a splendid battle. You deserve this RAINBOWBADGE and TM19 GIGA DRAIN.',
            fallbackChallenge: "ERIKA: Hello... Lovely weather, isn't it? I only study grass-type Pokémon.",
          },
          JANINE_EVENT: {
            flag: 'janine_defeated',
            badge: 'soul',
            tm: 'TM06',
            toast: '🥷 Received SOUL BADGE & TM06 from Leader Janine!',
            dialogue: 'JANINE: Fooled by my poison techniques? No, you saw right through them! Take the SOULBADGE and TM06 TOXIC!',
            fallbackChallenge: 'JANINE: Fufufu! I am the poison ninja master Janine! Try to hit what you cannot see!',
          },
          SABRINA_EVENT: {
            flag: 'sabrina_defeated',
            badge: 'marsh',
            tm: 'TM29',
            toast: '🔮 Received MARSH BADGE & TM29 from Leader Sabrina!',
            dialogue: 'SABRINA: I foresaw your victory... Take the MARSHBADGE and TM29 PSYCHIC.',
            fallbackChallenge: 'SABRINA: I knew you would challenge me. Psychic power cannot be overcome so easily.',
          },
          BLAINE_EVENT: {
            flag: 'blaine_defeated',
            badge: 'volcano',
            tm: 'TM38',
            toast: '🌋 Received VOLCANO BADGE & TM38 from Leader Blaine!',
            dialogue: 'BLAINE: Hah! My fiery spirit was extinguished! Take the VOLCANOBADGE and TM38 FIRE BLAST!',
            fallbackChallenge: 'BLAINE: Hah! I am Blaine, the red-hot quiz master of Cinnabar!',
          },
          BLUE_EVENT: {
            flag: 'blue_defeated',
            badge: 'earth',
            tm: 'TM26',
            toast: '🌍 Received EARTH BADGE & TM26 from Leader Blue!',
            dialogue: 'BLUE: Unbelievable... You really are something else! Take the EARTHBADGE and TM26 EARTHQUAKE!',
            fallbackChallenge: 'BLUE: Yo! You finally made it to the Viridian Gym. Show me what Johto trainers are made of!',
          },
        };

        const leaderConfig = kantoLeaderConfigs[targetNpc.action || ''];
        if (leaderConfig && !storyFlags.has(leaderConfig.flag)) {
          overworldHUD.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [leaderConfig.fallbackChallenge],
            targetNpc.speaker,
            () => {
              const team = buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Gym Leader',
                trainerTeam: team,
                onVictory: () => {
                  defeatedTrainers.add(targetNpc.trainerId || leaderConfig.flag);
                  storyFlags.add(leaderConfig.flag);
                  if (!inventory.badges.includes(leaderConfig.badge)) inventory.badges.push(leaderConfig.badge);
                  if (!inventory.tms.includes(leaderConfig.tm)) inventory.tms.push(leaderConfig.tm);
                  audioManager.playSfx('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  overworldHUD.openDialogue(
                    [leaderConfig.dialogue],
                    targetNpc.speaker,
                    () => {
                      saveCurrentGame();
                      overworldHUD.showToast(leaderConfig.toast);
                    }
                  );
                },
              });
            }
          );
          return;
        }

        // Elite Four, Champion Lance & Red
        if (targetNpc.action === 'E4_EVENT' && !storyFlags.has(`${targetNpc.trainerId}_defeated`)) {
          overworldHUD.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0 ? targetNpc.challengePages : ['Prepare yourself!'],
            targetNpc.speaker,
            () => {
              const team = buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Elite Trainer',
                trainerTeam: team,
                onVictory: () => {
                  defeatedTrainers.add(targetNpc.trainerId || 'e4');
                  storyFlags.add(`${targetNpc.trainerId}_defeated`);
                  audioManager.playSfx('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  const champion = targetNpc.trainerId === 'lance';
                  if (champion) storyFlags.add('champion_defeated');
                  overworldHUD.openDialogue(
                    [champion ? 'LANCE: ...It is over. You are the new POKéMON LEAGUE CHAMPION!' : `${targetNpc.speaker}: You have defeated me!`],
                    targetNpc.speaker,
                    () => {
                      saveCurrentGame();
                      overworldHUD.showToast(champion ? '🏆 You are the new CHAMPION!' : '⭐ Challenger victorious!');
                    }
                  );
                },
              });
            }
          );
          return;
        }

        // Cianwood Gym Leader Boss: Chuck
        if (targetNpc.action === 'CHUCK_EVENT' && !storyFlags.has('chuck_defeated')) {
          const introPages =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [
                  'CHUCK: WAHAHA! So you’ve come this far! We train day and night beneath the raging waterfalls of Cianwood! My roaring fists and my partners will shatter any defense! Prepare yourself!',
                ];
          overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Chuck',
              trainerTeam: team,
              onVictory: () => {
                defeatedTrainers.add('chuck');
                storyFlags.add('chuck_defeated');
                if (!inventory.badges.includes('storm')) inventory.badges.push('storm');
                if (!inventory.tms.includes('TM01')) inventory.tms.push('TM01');
                audioManager.playSfx('sfx_badge_get');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    'CHUCK: WAHAHA! I lost! You broke right through our defenses! Here is the STORMBADGE!',
                    'The STORMBADGE allows your POKéMON to use FLY outside battle, and all POKéMON up to Lv. 70 will obey you! Also take this TM01 DYNAMICPUNCH!',
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🥊 Received STORM BADGE & TM01 DYNAMICPUNCH from Leader Chuck!');
                  }
                );
              },
            });
          });
          return;
        }

        // Post-Gym Togepi Mystery Egg Delivery by Prof. Elm's Aide (Ticket 5.4)
        if (targetNpc.action === 'ELMS_AIDE_EVENT') {
          if (!storyFlags.has('falkner_defeated')) {
            overworldHUD.openDialogue(
              ["AIDE: I'm waiting for a promising young trainer on behalf of PROF. ELM."],
              targetNpc.speaker
            );
            return;
          }

          if (storyFlags.has('falkner_defeated') && !storyFlags.has('togepi_egg_received')) {
            if (playerParty.length >= 6) {
              overworldHUD.openDialogue(
                [
                  'AIDE: Oh, your party is full! Please make room in your party using the PC and come back!',
                ],
                targetNpc.speaker
              );
              return;
            }

            playerParty.push(PokemonFactory.createEgg('togepi', 256));
            storyFlags.add('togepi_egg_received');
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                `AIDE: ${playerName}! Long time, no see! PROF. ELM asked me to find you!`,
                `${playerName} received the MYSTERY EGG from PROF. ELM's AIDE!`,
              ],
              targetNpc.speaker,
              () => {
                saveCurrentGame();
                overworldHUD.showToast('🥚 Received the Togepi MYSTERY EGG from Prof. Elm\'s Aide!');
              }
            );
            return;
          }

          overworldHUD.openDialogue(
            ["AIDE: Take good care of that EGG! I'm sure something wonderful will hatch from it!"],
            targetNpc.speaker
          );
          return;
        }

        // Trainer NPC spoken to directly before being defeated
        if (
          targetNpc.action === 'TRAINER_BATTLE' &&
          targetNpc.trainerId &&
          !defeatedTrainers.has(targetNpc.trainerId) &&
          targetNpc.trainerPokemon
        ) {
          defeatedTrainers.add(targetNpc.trainerId);
          const pagesToUse =
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : targetNpc.pages || [];
          overworldHUD.openDialogue(pagesToUse, targetNpc.speaker, () => {
            const team = buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            triggerBattle(team[0], {
              isTrainer: true,
              trainerName: targetNpc.trainerName || targetNpc.speaker || 'Trainer',
              trainerTeam: team,
            });
          });
          return;
        }

        // Goldenrod Flower Shop: Squirtbottle Gift (Task 3)
        if (targetNpc.id === 'florist') {
          if (storyFlags.has('has_squirtbottle')) {
            overworldHUD.openDialogue(
              ['FLORIST: Did you try using that SQUIRTBOTTLE on the weird tree on ROUTE 36?'],
              targetNpc.speaker
            );
          } else {
            storyFlags.add('has_squirtbottle');
            if (!inventory.keyItems) inventory.keyItems = [];
            if (!inventory.keyItems.includes('SQUIRTBOTTLE')) inventory.keyItems.push('SQUIRTBOTTLE');
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                'Have you seen that weird, wiggling tree on ROUTE 36? Whenever anyone splashes water on it, it gets furious!',
                'Take this SQUIRTBOTTLE! Use it on that tree and see what happens!',
                `${playerName} received the SQUIRTBOTTLE!`,
              ],
              targetNpc.speaker,
              () => {
                saveCurrentGame();
                overworldHUD.showToast('💧 Received SQUIRTBOTTLE from Goldenrod Flower Shop!');
              }
            );
          }
          return;
        }

        // Route 36 Sudowoodo Boss Encounter & Event (Task 3)
        if (targetNpc.action === 'SUDOWOODO_EVENT' || targetNpc.id === 'sudowoodo') {
          const wiggleTree = async () => {
            const origX = targetNpc.x;
            for (const offset of [-0.14, 0.14, -0.1, 0.1, 0]) {
              targetNpc.renderX = origX + offset;
              await new Promise((r) => setTimeout(r, 55));
            }
            targetNpc.renderX = origX;
          };

          if (!storyFlags.has('has_squirtbottle')) {
            BattleAudio.playOverworldSound('RUSTLE');
            wiggleTree();
            overworldHUD.openDialogue(
              ["It's a weird tree. It seems to wiggle when touched!"],
              '🌲 WEIRD TREE'
            );
            return;
          }

          BattleAudio.playOverworldSound('RUSTLE');
          wiggleTree();
          overworldHUD.openDialogue(
            [
              "It's a weird tree. Use SQUIRTBOTTLE?",
              `${playerName} sprinkled water with the SQUIRTBOTTLE!`,
              "The weird tree doesn't like the SQUIRTBOTTLE! The weird tree attacked!",
            ],
            '🌲 SUDOWOODO',
            () => {
              BattleAudio.playCry('sudowoodo');
              const sudowoodoPkmn = PokemonFactory.create('sudowoodo', 20, [
                'rockthrow',
                'lowkick',
                'mimic',
                'flail',
              ]);
              triggerBattle(sudowoodoPkmn, {
                onBattleEnd: () => {
                  storyFlags.add('sudowoodo_cleared');
                  if (npcsByMap.route_36) {
                    npcsByMap.route_36 = npcsByMap.route_36.filter((n) => n.id !== 'sudowoodo');
                  }
                  const mapNow = mapManager.getCurrentMap();
                  if (mapNow) {
                    overworldRenderer.renderMap(mapNow, lookupMap);
                    syncMapOverworldItems(mapNow);
                  }
                  saveCurrentGame();
                },
              });
            }
          );
          return;
        }

        // Peeking Rival outside Elm's Lab: shoves the player away from the window
        if (targetNpc.id === 'nbt_rival') {
          overworldHUD.openDialogue(
            [
              '<……>\nSo this is the famous ELM POKéMON LAB…',
              '…What are you staring at?',
              '*BUMP!* The boy shoved you away from the window!',
            ],
            '❓ RIVAL ???',
            () => {
              BattleAudio.playOverworldSound('BUMP');
              const backDir = getOppositeDirection(player.direction);
              const dx = backDir === 'LEFT' ? -1 : backDir === 'RIGHT' ? 1 : 0;
              const dy = backDir === 'UP' ? -1 : backDir === 'DOWN' ? 1 : 0;
              const nx = player.x + dx;
              const ny = player.y + dy;
              if (mapManager.isWalkable(nx, ny)) {
                const faceDir = player.direction;
                player.x = nx;
                player.y = ny;
                player.targetX = nx;
                player.targetY = ny;
                player.renderX = nx;
                player.renderY = ny;
                player.isMoving = false;
                player.progress = 0;
                player.direction = faceDir;
              }
            }
          );
          return;
        }

        // Police Officer Interrogation & Rival Naming in Elm's Lab (Ticket SPRINT-13-RIVAL-AND-AZALEA)
        if (targetNpc.action === 'POLICE_RIVAL_NAMING' || targetNpc.id === 'lab_police_officer') {
          overworldHUD.openDialogue(
            [
              'OFFICER: I heard a POKéMON was stolen here…',
              'Apparently, it was a young male with long, red hair…',
              'What? You battled a trainer like that? Did you happen to get his name?',
            ],
            '👮 POLICE OFFICER',
            () => {
              namingModalUI.open(
                {
                  onConfirm: (chosenName) => {
                    rivalName = chosenName;
                    storyFlags.add('EVENT_RIVAL_NAMED');
                    if (npcsByMap.elms_lab) {
                      npcsByMap.elms_lab = npcsByMap.elms_lab.filter((n) => n.id !== 'lab_police_officer');
                    }
                    overworldHUD.openDialogue(
                      [
                        `OFFICER: OK! So ${rivalName} was his name. Thanks for helping our investigation!`,
                        'The police officer tipped his hat and hurried out of the lab!',
                      ],
                      '👮 POLICE OFFICER',
                      () => {
                        saveCurrentGame();
                        overworldHUD.showToast(`👮 Suspect identified as ${rivalName}!`);
                      }
                    );
                  },
                },
                rivalName || 'SILVER'
              );
            }
          );
          return;
        }

        // Azalea Town: Kurt Briefing
        if (targetNpc.id === 'azalea_kurt') {
          storyFlags.add('EVENT_KURT_LEFT_FOR_WELL');
          if (npcsByMap.azalea_town) {
            npcsByMap.azalea_town = npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_well_grunt');
          }
          overworldHUD.openDialogue(
            [
              'KURT: Those dastardly TEAM ROCKET villains are chopping off SLOWPOKE tails in the well!',
              "I'm going in there to drive them off myself! Stay back, kid!",
              'Kurt grabbed his walking stick and stormed towards SLOWPOKE WELL!',
            ],
            targetNpc.speaker,
            () => {
              saveCurrentGame();
              overworldHUD.showToast('👴 Kurt rushed into Slowpoke Well!');
            }
          );
          return;
        }

        // Azalea Town: Kurt's House Post-Well Interaction
        if (targetNpc.id === 'kurt_house_kurt') {
          if (storyFlags.has('slowpoke_well_cleared')) {
            overworldHUD.openDialogue(
              [
                "KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You're a wonderful trainer!",
                "Bring me any APRICORNS you find on trees, and I'll gladly craft custom POKé BALLS for you free of charge!",
              ],
              targetNpc.speaker
            );
          } else {
            overworldHUD.openDialogue(
              [
                'KURT: TEAM ROCKET is cutting off SLOWPOKE tails in the well outside!',
                'We have to put a stop to their cruelty!',
              ],
              targetNpc.speaker
            );
          }
          return;
        }

        // Azalea Town: Grunt Blockades
        if (targetNpc.id === 'azalea_well_grunt') {
          overworldHUD.openDialogue(
            [
              "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
            ],
            targetNpc.speaker
          );
          return;
        }

        if (targetNpc.id === 'azalea_gym_grunt') {
          overworldHUD.openDialogue(
            [
              "ROCKET GRUNT: No one gets in the GYM! Buzz off, brat!",
            ],
            targetNpc.speaker
          );
          return;
        }

        // Slowpoke Well: Executive Proton Boss Battle (Ticket SPRINT-13-RIVAL-AND-AZALEA)
        if (targetNpc.action === 'PROTON_EVENT' || targetNpc.id === 'executive_proton') {
          if (!storyFlags.has('proton_defeated')) {
            const introPages = [
              "PROTON: What do you want? If you interrupt our work, don't expect any mercy! We're TEAM ROCKET, and we'll do anything for money!",
            ];
            overworldHUD.openDialogue(introPages, targetNpc.speaker, () => {
              const team = buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              triggerBattle(team[0], {
                isTrainer: true,
                trainerName: 'Executive Proton',
                trainerTeam: team,
                onVictory: () => {
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
                  overworldHUD.openDialogue(
                    [
                      "PROTON: You did OK today, but don't think you've stopped us!",
                      "TEAM ROCKET will never give up! Retreat!",
                      "The Rocket Grunts and Executive Proton scrambled out of the cavern!",
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
                        storyFlags.add('APRICORN_CRAFTING_UNLOCKED');
                        missionManager.checkStoryFlags(storyFlags);
                        BattleAudio.playOverworldSound('KEY_ITEM');
                        overworldHUD.openDialogue(
                          [
                            "KURT: You drove off TEAM ROCKET from SLOWPOKE WELL? You're a wonderful trainer!",
                            "Take this LURE BALL as a token of my gratitude!",
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
                },
              });
            });
            return;
          }
        }

        // Prof. Elm Lab Starter Dialogue & Errands (Ticket 6.1 & BUGFIX-NARRATIVE-01)
        if (targetNpc.id === 'elm_npc') {
          if (!storyFlags.has('starter_chosen')) {
            overworldHUD.openDialogue(
              [
                `PROF. ELM: Hi, ${playerName}! I've been waiting for you!`,
                'I want you to run an errand for me! MR. POKéMON beyond CHERRYGROVE CITY on ROUTE 30 sent word of a rare discovery.',
                "I'd like you to go examine it for me. Choose one of the POKéMON in the BALLS on that table to accompany you!",
              ],
              targetNpc.speaker
            );
            return;
          }

          if (storyFlags.has('HAS_MYSTERY_EGG') && !storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
            if (storyFlags.has('EVENT_RIVAL_CHERRYGROVE_DEFEATED') && !storyFlags.has('EVENT_RIVAL_NAMED')) {
              overworldHUD.openDialogue(
                [
                  `PROF. ELM: ${playerName}! Did the officer question you about the break-in?`,
                  'Please speak to the POLICE OFFICER first so we can help the investigation!',
                ],
                '🔬 PROF. ELM'
              );
              return;
            }

            storyFlags.add('EVENT_GAVE_MYSTERY_EGG_TO_ELM');
            if (inventory.keyItems) {
              inventory.keyItems = inventory.keyItems.filter((k) => k !== 'MYSTERY EGG');
            }
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                `PROF. ELM: ${playerName}! You're back!`,
                'And you brought the MYSTERY EGG!',
                "This... this is an incredible discovery! I'll examine it thoroughly at once!",
                `${playerName} handed the MYSTERY EGG to PROF. ELM!`,
                'PROF. ELM: Take on the JOHTO GYM CHALLENGE! Your first stop is the VIOLET CITY GYM!',
              ],
              '🔬 PROF. ELM',
              () => {
                inventory.balls['poke-ball'] = (inventory.balls['poke-ball'] || 0) + 5;
                missionManager.checkStoryFlags(storyFlags);
                overworldHUD.openDialogue(
                  [
                    `ELM'S AIDE: ${playerName}! Take these POKé BALLS for your journey!`,
                    'Wild POKéMON can be caught once you weaken them in battle!',
                  ],
                  "👨‍🔬 ELM'S AIDE",
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🎒 Received 5 POKé BALLS!');
                  }
                );
              }
            );
            return;
          }

          const postEggPages = storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')
            ? [
                `PROF. ELM: How is your POKéMON journey going, ${playerName}?`,
                'The GYM LEADER in VIOLET CITY is FALKNER, a master of BIRD POKéMON!',
                "Here—let me heal your team so you're ready!",
              ]
            : [
                `PROF. ELM: Hi, ${playerName}! How is your partner POKéMON doing?`,
                'MR. POKéMON lives a bit past CHERRYGROVE CITY on ROUTE 30. Take care on your way!',
                'Here—let me heal your POKéMON and record your research progress!',
              ];

          overworldHUD.openDialogue(postEggPages, '🔬 PROF. ELM', () => {
            healPlayerParty(false);
            saveCurrentGame();
            overworldHUD.playFieldRestAnimation();
          });
          return;
        }

        if (targetNpc.pages && targetNpc.pages.length > 0) {
          overworldHUD.openDialogue(targetNpc.pages, targetNpc.speaker, () => {
            if (targetNpc.action === 'HEAL_AND_SAVE') {
              if (currentMap.id.endsWith('_poke_center')) {
                lastVisitedPokecenter = { mapId: currentMap.id, x: 3, y: 3 };
                healPlayerParty(false);
                saveCurrentGame();
                overworldHUD.playHealingAnimation(playerParty.length);
              } else {
                healPlayerParty(false);
                saveCurrentGame();
                overworldHUD.playFieldRestAnimation();
              }
            } else if (targetNpc.action === 'OPEN_MART') {
              bagUI.openMart();
            }
          });
        }
        return;
      }
    }

    // 2. Check Street Signs & Interactive Background Objects (bgEvents)
    const bgEvent = mapManager.checkBgEvent(facingX, facingY);
    if (bgEvent && bgEvent.pages.length > 0) {
      // Starter Pokéball Selection in Elm's Lab (Ticket 6.1)
      if (
        bgEvent.action === 'STARTER_CYNDAQUIL' ||
        bgEvent.action === 'STARTER_TOTODILE' ||
        bgEvent.action === 'STARTER_CHIKORITA'
      ) {
        if (storyFlags.has('starter_chosen') || playerParty.length > 0) {
          const tableSpecies: 'cyndaquil' | 'totodile' | 'chikorita' =
            bgEvent.action === 'STARTER_CYNDAQUIL'
              ? 'cyndaquil'
              : bgEvent.action === 'STARTER_TOTODILE'
              ? 'totodile'
              : 'chikorita';
          const tableName = tableSpecies.toUpperCase();
          const chosenSpecies = detectChosenStarterSpecies();

          // A. The spot of the ball the player took
          if (chosenSpecies === tableSpecies) {
            overworldHUD.openDialogue(
              [`It's an empty spot. You already chose ${tableName}!`],
              bgEvent.speaker
            );
            return;
          }

          // B. The spot of the ball the Rival stole after Elm's emergency call
          const counterPickMap: Record<string, string> = {
            cyndaquil: 'totodile',
            totodile: 'chikorita',
            chikorita: 'cyndaquil',
          };
          const rivalStolen = chosenSpecies ? counterPickMap[chosenSpecies] : null;
          if (storyFlags.has('ELM_CALLED_ABOUT_THEFT') && rivalStolen === tableSpecies) {
            overworldHUD.openDialogue(['The POKé BALL was stolen from the table!'], bgEvent.speaker);
            return;
          }

          // C. A ball still sitting on the table
          const tableType =
            tableSpecies === 'cyndaquil' ? 'FIRE' : tableSpecies === 'totodile' ? 'WATER' : 'GRASS';
          overworldHUD.openDialogue(
            [`It's ${tableName}, a ${tableType} POKéMON!`, 'PROF. ELM: You already chose your partner!'],
            bgEvent.speaker
          );
          return;
        }

        const starterConfig: Record<
          string,
          { speciesId: 'cyndaquil' | 'totodile' | 'chikorita'; name: string; type: string }
        > = {
          STARTER_CYNDAQUIL: {
            speciesId: 'cyndaquil',
            name: 'CYNDAQUIL',
            type: 'FIRE',
          },
          STARTER_TOTODILE: {
            speciesId: 'totodile',
            name: 'TOTODILE',
            type: 'WATER',
          },
          STARTER_CHIKORITA: {
            speciesId: 'chikorita',
            name: 'CHIKORITA',
            type: 'GRASS',
          },
        };

        const chosen = starterConfig[bgEvent.action];
        if (chosen) {
          BattleAudio.playCry(chosen.speciesId);
          overworldHUD.openStarterChoiceModal(
            chosen.speciesId,
            chosen.name,
            chosen.type,
            () => {
              const starterPokemon = PokemonFactory.create(chosen.speciesId, 5);
              playerParty.push(starterPokemon);
              seenSpecies.add(chosen.speciesId);
              storyFlags.add('starter_chosen');
              storyFlags.add(`starter_${chosen.speciesId}`);
              overworldRenderer.removeItemBall(`${chosen.speciesId}_ball`);
              syncMapOverworldItems(currentMap);
              BattleAudio.playOverworldSound('KEY_ITEM');
              overworldHUD.openDialogue(
                [
                  `${playerName} received ${chosen.name} from PROF. ELM!`,
                  "PROF. ELM: Excellent choice! That POKéMON is really energetic! Now, please visit MR. POKéMON's house on ROUTE 30 to retrieve the MYSTERY EGG!",
                ],
                '🔬 PROF. ELM',
                () => {
                  saveCurrentGame();
                  overworldHUD.showToast(`✨ Received ${chosen.name} (Lv. 5)!`);
                }
              );
            },
            () => {
              BattleAudio.playMenuSound('CANCEL');
            }
          );
          return;
        }
      }

      // Bill's PC Storage Terminal Interaction
      if (
        bgEvent.action === 'OPEN_PC' ||
        bgEvent.speaker?.includes('PC') ||
        bgEvent.pages.some((p) => p.includes('PC'))
      ) {
        overworldHUD.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
          boxManagementUI.open(playerParty, boxManager.getState(), {
            onSave: () => saveCurrentGame(),
            onClose: () => saveCurrentGame(),
          });
        });
        return;
      }

      overworldHUD.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
        if (bgEvent.action === 'HEAL_AND_SAVE') {
          healPlayerParty(false);
          saveCurrentGame();
          if (currentMap.id.endsWith('_poke_center')) {
            overworldHUD.playHealingAnimation(playerParty.length);
          } else {
            overworldHUD.playFieldRestAnimation();
          }
        } else if (bgEvent.action === 'OPEN_MART') {
          bagUI.openMart();
        }
      });
      return;
    }

    // 2a-fallback. Universal Pokémon Center & Bedroom PC Terminal Fallback
    if (
      (currentMap.id.endsWith('_poke_center') && facingX === 9 && facingY === 1) ||
      (currentMap.id === 'players_house_2f' && facingX === 0 && facingY === 1)
    ) {
      overworldHUD.openDialogue(
        ["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'],
        "💻 BILL'S PC",
        () => {
          boxManagementUI.open(playerParty, boxManager.getState(), {
            onSave: () => saveCurrentGame(),
            onClose: () => saveCurrentGame(),
          });
        }
      );
      return;
    }

    // 2b. Check Overworld Visible Item Balls (Sprint 12 — Facing Adjacent Interaction)
    const itemBall = overworldItemManager.checkItemBall(currentMap.id, facingX, facingY, storyFlags);
    if (itemBall) {
      addOverworldItemToInventory(itemBall.itemId);
      overworldItemManager.collectItem(itemBall.eventFlag);
      storyFlags.add(itemBall.eventFlag);
      overworldRenderer.removeItemBall(itemBall.eventFlag);
      BattleAudio.playOverworldSound('KEY_ITEM');
      const itemName = OverworldItemManager.formatItemName(itemBall.itemId);
      const pocket = OverworldItemManager.resolveItemPocket(itemBall.itemId);
      overworldHUD.openDialogue(
        [
          `${playerName} found ${itemName}!`,
          `${playerName} put the ${itemName} in the ${pocket} POCKET.`,
        ],
        '🔴 ITEM BALL',
        () => {
          saveCurrentGame();
          overworldHUD.showToast(`🔴 Found ${itemName}!`);
        }
      );
      return;
    }

    // 2c. Check Overworld Hidden Items (Sprint 12)
    const hiddenItem = overworldItemManager.checkHiddenItemInteraction(
      currentMap.id,
      facingX,
      facingY,
      player.x,
      player.y
    );
    if (hiddenItem) {
      addOverworldItemToInventory(hiddenItem.itemId);
      overworldItemManager.collectItem(hiddenItem.eventFlag);
      storyFlags.add(hiddenItem.eventFlag);
      if (hiddenItem.itemId === 'machine_part') {
        storyFlags.add('machine_part_found');
      }
      if (itemfinderHUD.isActive()) {
        const remainingHidden = overworldItemManager.getHiddenItemsForMap(currentMap.id, storyFlags);
        const nextPing = ItemfinderRadar.scan(
          player.x,
          player.y,
          player.direction,
          remainingHidden,
          storyFlags
        );
        itemfinderHUD.update(nextPing);
      }
      BattleAudio.playOverworldSound('KEY_ITEM');
      const itemName = OverworldItemManager.formatItemName(hiddenItem.itemId);
      const pocket = OverworldItemManager.resolveItemPocket(hiddenItem.itemId);
      overworldHUD.openDialogue(
        [
          `${playerName} found ${itemName}!`,
          `${playerName} put the ${itemName} in the ${pocket} POCKET.`,
        ],
        '✨ HIDDEN ITEM',
        () => {
          saveCurrentGame();
          overworldHUD.showToast(`✨ Found hidden ${itemName}!`);
        }
      );
      return;
    }

    // 2d. Check Overworld Fruit Trees (Sprint 12 — Facing Adjacent Interaction)
    const fruitTree = overworldItemManager.checkFruitTree(currentMap.id, facingX, facingY);
    if (fruitTree) {
      if (overworldItemManager.isFruitTreePickedToday(fruitTree.treeId)) {
        overworldHUD.openDialogue(
          ["It's a fruit-bearing tree, but there are no berries left today."],
          '🌳 FRUIT TREE'
        );
      } else {
        addOverworldItemToInventory(fruitTree.berryId);
        overworldItemManager.pickFruitTree(fruitTree.treeId);
        syncMapOverworldItems(currentMap);
        BattleAudio.playOverworldSound('KEY_ITEM');
        const berryName = OverworldItemManager.formatItemName(fruitTree.berryId);
        overworldHUD.openDialogue(
          [
            `Hey! It's a fruit-bearing tree! It has ${berryName}!`,
            `${playerName} picked the ${berryName}!`,
          ],
          '🌳 FRUIT TREE',
          () => {
            saveCurrentGame();
            overworldHUD.showToast(`🍒 Picked ${berryName}!`);
          }
        );
      }
      return;
    }

    // 3. Check Cuttable Trees (HM01 Cut interaction - Task 2)
    if (
      facingX >= 0 &&
      facingX < currentMap.width &&
      facingY >= 0 &&
      facingY < currentMap.height &&
      currentMap.tileMap
    ) {
      const tileIdx = facingY * currentMap.width + facingX;
      const facingTileName = currentMap.tileMap[tileIdx] || '';
      const isCutTree =
        currentMap.collisionGrid[tileIdx] === 1 &&
        (facingTileName === 'tree_short_0' ||
          facingTileName.includes('13_15_45_1d') ||
          facingTileName.includes('2d_2e_3d_3e') ||
          facingTileName.includes('28_39_38_3a') ||
          facingTileName.includes('_5b') ||
          facingTileName.includes('_5f') ||
          facingTileName.includes('_64') ||
          facingTileName.includes('_65'));

      if (isCutTree) {
        const hasCutAndBadge =
          (inventory.tms.includes('HM01') ||
            storyFlags.has('has_hm01_cut') ||
            playerParty.some((p) => p.moves.some((m) => m.moveId === 'cut'))) &&
          inventory.badges.includes('hive');

        if (hasCutAndBadge) {
          const cutter = playerParty.find((p) => !p.isEgg) || playerParty[0];
          const cutterName = cutter ? cutter.nickname : playerName;
          BattleAudio.playOverworldSound('RUSTLE');
          overworldHUD.openDialogue(
            [
              'This tree looks like it can be CUT down!',
              `${cutterName} hacked away with CUT!`,
            ],
            '🌳 CUTTABLE TREE',
            () => {
              currentMap.collisionGrid[tileIdx] = 0;
              currentMap.tileMap![tileIdx] = 'jt_07_07_07_07';
              overworldRenderer.renderMap(currentMap, lookupMap);
              syncMapOverworldItems(currentMap);
            }
          );
        } else {
          overworldHUD.openDialogue(
            ['This tree looks like it can be CUT down with a special move!'],
            '🌳 CUTTABLE TREE'
          );
        }
      }
    }
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
    const neighborNpcs = neighborMap ? npcsByMap[neighborMap.id] : undefined;
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

  // Passerby Rival 1 Ambush Encounter (Cherrygrove East Exit)
  const triggerCherrygroveRivalAmbush = () => {
    isCutsceneLocked = true;
    player.isMoving = false;
    player.progress = 0;
    player.direction = 'RIGHT';

    let rivalSpeciesId: 'totodile' | 'chikorita' | 'cyndaquil' = 'totodile';
    let rivalMoves = ['scratch', 'leer'];
    if (storyFlags.has('starter_cyndaquil') || playerParty.some((p) => p.speciesId === 'cyndaquil')) {
      rivalSpeciesId = 'totodile';
      rivalMoves = ['scratch', 'leer'];
    } else if (storyFlags.has('starter_totodile') || playerParty.some((p) => p.speciesId === 'totodile')) {
      rivalSpeciesId = 'chikorita';
      rivalMoves = ['tackle', 'growl'];
    } else if (storyFlags.has('starter_chikorita') || playerParty.some((p) => p.speciesId === 'chikorita')) {
      rivalSpeciesId = 'cyndaquil';
      rivalMoves = ['tackle', 'leer'];
    }

    const rivalPokemon = PokemonFactory.create(rivalSpeciesId, 5, rivalMoves);
    audioManager.playBattleBgm('trainer');
    overworldHUD.openDialogue(
      [
        '❓ PASSERBY BOY: <……> <……> <……>',
        'You got a POKéMON at the LAB. What a waste. A wimp like you.',
        '<……> <……> <……>',
        "Don't you get what I'm saying?",
        "Well, I too, have a good POKéMON. I'll show you what I mean!",
      ],
      '❓ PASSERBY BOY',
      () => {
        triggerBattle(rivalPokemon, {
          isTrainer: true,
          trainerName: 'Passerby ???',
          trainerTeam: [rivalPokemon],
          onVictory: () => {
            overworldHUD.openDialogue(
              [
                '❓ PASSERBY BOY: Humph. Are you happy you won?',
                '<……> <……> <……>',
                "My name's ???. I'm going to be the world's greatest POKéMON trainer.",
                'Get out of my way!',
                `*BUMP!* The boy shoved past ${playerName} and bolted toward Route 29!`,
                'As the boy shoved past, a card slipped from his jacket pocket!',
                `${playerName} picked up the dropped TRAINER CARD!`,
                'The name printed on the card reads: SILVER!',
              ],
              '❓ PASSERBY BOY',
              () => {
                BattleAudio.playOverworldSound('BUMP');
                BattleAudio.playOverworldSound('KEY_ITEM');
                storyFlags.add('EVENT_RIVAL_CHERRYGROVE_DEFEATED');
                defeatedTrainers.add('rival_cherrygrove');
                isCutsceneLocked = false;
                const freshNpcs = createNpcsByMap();
                if (freshNpcs.elms_lab && npcsByMap.elms_lab) {
                  const officer = freshNpcs.elms_lab.find((n) => n.id === 'lab_police_officer');
                  if (officer && !npcsByMap.elms_lab.some((n) => n.id === 'lab_police_officer')) {
                    npcsByMap.elms_lab.push(officer);
                  }
                }
                saveCurrentGame();
                overworldHUD.showToast('Dropped TRAINER CARD acquired! Suspect: SILVER');
              }
            );
          },
        });
      }
    );
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

  // 8. Decoupled Main Ticker Loop
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
      // Active NPCs on this map (Zero per-frame array allocations)
      const activeNpcs = currentMap ? npcsByMap[currentMap.id] || emptyNpcs : emptyNpcs;

      const heldDir = isCutsceneLocked ? null : overworldHUD.getHeldDirection();
      GridPhysics.updateEntity(
        player,
        dtPlayer,
        heldDir,
        isTileWalkableForPlayer,
        mapManager.getTileType,
        (_entity, coord, tileType) => {
          handleMapTransition(player);

          // Check Building Door Warps (Poké Center, Poké Mart, Elm's Lab, Houses) with smooth fade & Safe Warp Interceptor
          const warp = mapManager.checkWarp(coord);
          if (warp) {
            const targetMapExists = mapManager.getMap(warp.targetMapId);
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

            const previousMapId = currentMap?.id;
            player.isMoving = false;
            player.progress = 0;
            isCutsceneLocked = true;
            BattleAudio.playOverworldSound('DOOR');

            overworldRenderer
              .playDoorwayFade(() => {
                const targetMap = mapManager.setCurrentMap(warp.targetMapId);
                if (targetMap.id.endsWith('_poke_center')) {
                  lastVisitedPokecenter = { mapId: targetMap.id, x: warp.targetX, y: Math.max(2, warp.targetY - 1) };
                }
                const isEnteringIndoor = Object.keys(targetMap.connections || {}).length === 0;
                player.direction =
                  warp.direction ?? (warp.targetY <= 1 ? 'DOWN' : isEnteringIndoor ? 'UP' : 'DOWN');
                player.x = warp.targetX;
                player.y = warp.targetY;
                player.targetX = warp.targetX;
                player.targetY = warp.targetY;
                player.renderX = warp.targetX;
                player.renderY = warp.targetY;

                overworldRenderer.renderMap(targetMap, lookupMap);
                syncMapOverworldItems(targetMap);
                overworldHUD.updateRouteName(targetMap.name);
                audioManager.playMapBgm(targetMap.id, 0.8);
              })
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

          // Tall Grass Rustle FX + Sound
          if (tileType === 2) {
            overworldRenderer.spawnGrassRustle(coord.x, coord.y);
            BattleAudio.playOverworldSound('RUSTLE');
          }

          // Live Unbound-Style Itemfinder Radar Step Sweep
          if (itemfinderHUD.isActive()) {
            refreshItemfinderRadar(true);
          }

          // Step-based Egg Hatching (Ticket 5.4)
          for (let i = 0; i < playerParty.length; i++) {
            const p = playerParty[i];
            if (p.isEgg && typeof p.eggSteps === 'number') {
              p.eggSteps--;
              if (p.eggSteps <= 0) {
                p.isEgg = false;
                p.eggSteps = 0;
                p.nickname = 'TOGEPI';
                p.moves = [
                  { moveId: 'metronome', currentPp: 10, maxPp: 10 },
                  { moveId: 'charm', currentPp: 20, maxPp: 20 },
                ];
                const hatchedTemplate = PokemonFactory.create(p.speciesId || 'togepi', 1, [
                  'metronome',
                  'charm',
                ]);
                p.baseStats = hatchedTemplate.baseStats;
                p.stats = hatchedTemplate.stats;
                p.currentHp = hatchedTemplate.stats.hp;
                seenSpecies.add(p.speciesId || 'togepi');
                player.isMoving = false;
                player.progress = 0;
                BattleAudio.playCry('togepi');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  ['Huh? The EGG hatched! ... A lively TOGEPI hatched from the EGG!'],
                  '🥚 MYSTERY EGG',
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('🐣 TOGEPI hatched from the Mystery Egg!');
                  }
                );
                return;
              }
            }
          }

          // Check Line-of-Sight Trainer Encounters on active map
          const latestMap = mapManager.getCurrentMap();
          const latestNpcs = latestMap ? npcsByMap[latestMap.id] || emptyNpcs : emptyNpcs;
          const spottedTrainer = GridPhysics.checkTrainerLineOfSight(
            player,
            latestNpcs,
            defeatedTrainers,
            mapManager.getTileType
          );
          if (spottedTrainer) {
            runTrainerSightSequence(spottedTrainer);
            return;
          }

          // Wild Encounter Check in Tall Grass (tile type 2)
          if (tileType === 2 && playerParty.length > 0) {
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
        },
        activeNpcs,
        () => {
          BattleAudio.playOverworldSound('HOP');
        },
        () => {
          handlePlayerBump();
        }
      );

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

  console.log('⚡ Crystal Overdrive Vertical Slice 100% playable & booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
