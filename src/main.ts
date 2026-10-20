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
import type { MapData, Direction, PokeballId, PokemonInstance, PlayerGender, GameOptions, SpeedMultiplier } from './types/game';
import type { Graphics } from 'pixi.js';
export { npcsByMap, createNpcsByMap } from './world/npcData';

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
  let gameState: 'TITLE' | 'OVERWORLD' | 'BATTLE' = 'TITLE';

  // 2. Load or Initialize Game State
  const existingSave = await saveManager.loadGame();
  const initialSavePreview = await saveManager.getSavePreview();

  let playerParty: PokemonInstance[] = [];
  let playerBox: PokemonInstance[] = [];
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
  let gameOptions: GameOptions = SaveManager.getDefaultOptions();

  if (existingSave) {
    console.log('📦 Restoring save state from IndexedDB...');
    playerName = existingSave.player.name || 'GOLD';
    playerGender = existingSave.player.gender || 'BOY';
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
    inventory.tms = existingSave.inventory.tms;
    inventory.money = existingSave.player.money;
    inventory.badges = existingSave.player.badges;
    existingSave.defeatedTrainers.forEach((t) => defeatedTrainers.add(t));
    existingSave.storyFlags?.forEach((f) => storyFlags.add(f));
    existingSave.seenSpecies?.forEach((s) => seenSpecies.add(s));
    playerParty.forEach((p) => seenSpecies.add(p.speciesId));
    playerBox.forEach((p) => seenSpecies.add(p.speciesId));

    initialMapId = existingSave.player.mapId;
    initialPlayerX = existingSave.player.x;
    initialPlayerY = existingSave.player.y;
    initialPlayerDir = existingSave.player.direction;

    gameClock.playerSpeed = existingSave.player.speedMultiplier;

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

  const loadedMaps: MapData[] = await Promise.all(
    mapIds.map(async (id) => {
      const res = await fetch(`./assets/data/maps/${id}.json`);
      return res.json();
    })
  );

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
        badges: inventory.badges,
        money: inventory.money,
      },
      party: playerParty,
      box: playerBox,
      inventory: {
        balls: inventory.balls,
        items: inventory.items,
        tms: inventory.tms,
      },
      roamers: roamingManager.getAllRoamers(),
      defeatedTrainers: Array.from(defeatedTrainers),
      storyFlags: Array.from(storyFlags),
      seenSpecies: Array.from(seenSpecies),
      options: gameOptions,
    };
    await saveManager.saveGame(saveData);
    console.log('💾 Game state successfully saved to IndexedDB.');
  };

  // 5. Initialize HUDs, Party Management, Start Menu & Renderers
  const bagUI = new BagAndMartUI('modal-container', inventory, playerParty, () => {
    saveCurrentGame();
  });

  const partyUI = new PartyManagementUI('modal-container', playerParty, () => {
    saveCurrentGame();
  });

  let handleInteract = () => {};

  const getCaughtSpeciesSet = () =>
    new Set([...playerParty.map((p) => p.speciesId), ...playerBox.map((p) => p.speciesId)]);

  let overworldHUD: OverworldHUD;

  const cyclePlayerSpeed = (): SpeedMultiplier => {
    const newSpeed = gameClock.cyclePlayerSpeed();
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
        if (storyFlags.has('HAS_MYSTERY_EGG')) items.push('🥚 MYSTERY EGG');
        if (storyFlags.has('HAS_POKEDEX')) items.push('📕 POKéDEX');
        return items;
      },
      getPlayTimeSeconds: () => playTimeSeconds,
      getMapName: () => mapManager.getCurrentMap()?.name || 'New Bark Town',
      isMuted: () => audioManager.isMuted(),
      getSpeedMultiplier: () => gameClock.playerSpeed,
      isGamepadActive: () => overworldHUD?.isGamepadActive() ?? false,
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
        overworldHUD.openPokegear();
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
    }
  );

  bagUI.setSpeedMultiplier(gameClock.playerSpeed);
  partyUI.setSpeedMultiplier(gameClock.playerSpeed);
  startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

  const isAnyOverworldModalOpen = () =>
    gameState === 'TITLE' || startMenuUI.isOpen() || partyUI.isOpen() || bagUI.isOpen();

  overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => {
      return cyclePlayerSpeed();
    },
    onMuteToggle: () => {
      return audioManager.toggleMute();
    },
    onMenuToggle: () => {
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
    isModalOpen: isAnyOverworldModalOpen,
  });
  overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
  overworldHUD.updateMuteDisplay(audioManager.isMuted());
  overworldHUD.updateRouteName(initialMap.name);
  overworldHUD.updatePokegear(roamingManager.getAllRoamers());
  overworldHUD.hide();

  const overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer);
  overworldRenderer.setPlayerGender(playerGender);
  const lookupMap = (id: string) => mapManager.getMap(id);
  overworldRenderer.renderMap(initialMap, lookupMap);

  const battleRenderer = new BattleRenderer(overworldRenderer.app);
  const battleHUD = new BattleHUD('battle-hud-container');

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
      inventory.money = 3000;
      inventory.badges = [];
      defeatedTrainers.clear();
      storyFlags.clear();
      seenSpecies.clear();
      roamingManager.sleepBeasts();

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
      overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
      bagUI.setSpeedMultiplier(gameClock.playerSpeed);
      partyUI.setSpeedMultiplier(gameClock.playerSpeed);
      startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);
    },
  });

  // Support Shift key to cycle Battle Speed while in Battle mode, and Start Menu keyboard navigation in Overworld
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !e.repeat && gameState === 'BATTLE') {
      battleHUD.triggerSpeedToggle();
      return;
    }
    if (gameState === 'OVERWORLD' && startMenuUI.isOpen()) {
      startMenuUI.handleKeyDown(e);
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

  const makeNpc = (
    id: string,
    x: number,
    y: number,
    direction: Direction,
    spriteType: GridEntity['spriteType'],
    speaker: string,
    pages: string[],
    opts: {
      wanders?: boolean;
      talkAcrossCounter?: boolean;
      action?: GridEntity['action'];
      trainerId?: string;
      trainerName?: string;
      visionRange?: number;
      challengePages?: string[];
      trainerPokemon?: GridEntity['trainerPokemon'];
      trainerTeam?: GridEntity['trainerTeam'];
    } = {}
  ): GridEntity => ({
    id,
    x,
    y,
    targetX: x,
    targetY: y,
    renderX: x,
    renderY: y,
    direction,
    isMoving: false,
    progress: 0,
    isPlayer: false,
    spriteType,
    speaker,
    pages,
    wanders: opts.wanders ?? false,
    talkAcrossCounter: opts.talkAcrossCounter ?? false,
    action: opts.action,
    trainerId: opts.trainerId,
    trainerName: opts.trainerName,
    visionRange: opts.visionRange,
    challengePages: opts.challengePages,
    trainerPokemon: opts.trainerPokemon,
    trainerTeam: opts.trainerTeam,
  });

  const npcsByMap: Record<string, GridEntity[]> = {
    new_bark_town: [
      makeNpc(
        'nbt_teacher',
        6,
        8,
        'DOWN',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Wow, your POKéGEAR is impressive! Did your mom get it for you?',
          'Oh! Your POKéMON is adorable! I wish I had one!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'nbt_fisher',
        12,
        9,
        'DOWN',
        'fisherman',
        '🎣 FISHER',
        ['Yo, GOLD!', 'I hear PROF. ELM discovered some new POKéMON.'],
        { wanders: true }
      ),
      makeNpc('nbt_rival', 3, 2, 'RIGHT', 'silver', '❓ RIVAL ???', [
        '<……>\nSo this is the famous ELM POKéMON LAB…',
        '…What are you staring at?',
      ]),
    ],
    route_29: [
      makeNpc('r29_dude', 50, 12, 'DOWN', 'boy', '🧢 CATCHING DUDE', [
        "POKéMON hide in the grass. Who knows when they'll pop out…",
        'If you weaken them first, POKéMON are much easier to catch!',
      ]),
      makeNpc(
        'youngster_joey',
        28,
        6,
        'DOWN',
        'boy',
        '👦 YOUNGSTER JOEY',
        [
          'Yo! My RATTATA is in the top percentage of all RATTATA!',
          'If your POKéMON are weak and not ready for battle, keep out of the grass!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_joey',
          trainerName: 'Youngster Joey',
          visionRange: 3,
          challengePages: [
            "YOUNGSTER JOEY: I just lost, so I'm trying to find more POKéMON!",
            "Wait! You look weak! Come on, let's battle!",
          ],
          trainerPokemon: {
            speciesId: 'rattata',
            level: 4,
            moves: ['tackle', 'tailwhip', 'quickattack'],
          },
        }
      ),
      makeNpc(
        'r29_teacher',
        15,
        11,
        'RIGHT',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          "See those ledges? It's scary to jump off them.",
          'But you can go to NEW BARK without walking through the grass.',
        ],
        { wanders: true }
      ),
      makeNpc('r29_fisher', 25, 3, 'UP', 'fisherman', '🎣 FISHER', [
        'I wanted to take a break, so I saved to record my progress.',
      ]),
      makeNpc('r29_gate_officer', 27, 1, 'DOWN', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Hold on, rookie!',
        'The mountain path leading up to ROUTE 46 is steep and rugged.',
        "You can't climb up those jagged cliff ledges, and the mountain Pokémon up there are fierce!",
        'Get some more training under your belt before heading into the northern ridges!',
      ]),
    ],
    cherrygrove_city: [
      makeNpc('cg_guide_gent', 32, 6, 'DOWN', 'fat_man', '👴 GUIDE GENT', [
        "You're a rookie trainer, aren't you? I can tell!",
        "That's OK! Everyone is a rookie at some point!",
        'POKéGEAR becomes more useful as you add CARDS. Head NORTH up ROUTE 30 to visit MR. POKéMON!',
      ]),
      makeNpc(
        'cg_teacher',
        27,
        12,
        'LEFT',
        'teacher',
        '👩‍🏫 TEACHER',
        [
          'Did you talk to the old man by the POKéMON CENTER?',
          "When you're with POKéMON, going anywhere is fun.",
        ],
        { wanders: true }
      ),
      makeNpc(
        'cg_youngster',
        23,
        7,
        'RIGHT',
        'boy',
        '👦 YOUNGSTER',
        [
          'MR. POKéMON\'s house is still farther up ahead on ROUTE 30.',
          "Be careful—trainers on ROUTE 30 will challenge you if you cross their line of sight!",
        ],
        { wanders: true }
      ),
      makeNpc('cg_fisher', 7, 12, 'RIGHT', 'fisherman', '🎣 MYSTIC WATER GUY', [
        "A POKéMON I caught had an item. I think it's MYSTIC WATER.",
        'Back to fishing for me, then.',
      ]),
    ],
    route_30: [
      makeNpc(
        'youngster_mikey',
        4,
        26,
        'RIGHT',
        'boy',
        '👦 YOUNGSTER MIKEY',
        [
          "Becoming a good trainer is really tough.",
          "I'm going to battle other people to get better.",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'youngster_mikey',
          trainerName: 'Youngster Mikey',
          visionRange: 3,
          challengePages: [
            "YOUNGSTER MIKEY: You're a POKéMON trainer, right?",
            'Then you have to battle!',
          ],
          trainerPokemon: {
            speciesId: 'hoot-hoot',
            level: 4,
            moves: ['tackle', 'growl', 'peck', 'hypnosis'],
          },
        }
      ),
      makeNpc(
        'bug_catcher_don',
        2,
        18,
        'RIGHT',
        'bug_catcher',
        '🐞 BUG CATCHER DON',
        [
          'I ran out of POKé BALLS while I was catching bugs.',
          'You should buy extra at CHERRYGROVE MART!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_don',
          trainerName: 'Bug Catcher Don',
          visionRange: 3,
          challengePages: [
            'BUG CATCHER DON: Instead of a bug POKéMON, I found a trainer!',
          ],
          trainerPokemon: {
            speciesId: 'caterpie',
            level: 3,
            moves: ['tackle', 'stringshot'],
          },
        }
      ),
      makeNpc(
        'r30_cooltrainer',
        11,
        40,
        'UP',
        'girl',
        '🧢 COOLTRAINER',
        [
          'MR. POKéMON\'s house is straight ahead on the right fork!',
          'The left path leads north to ROUTE 31 and VIOLET CITY.',
        ],
        { wanders: true }
      ),
    ],
    route_31: [
      makeNpc(
        'bug_catcher_wade',
        21,
        8,
        'LEFT',
        'bug_catcher',
        '🐞 BUG CATCHER WADE',
        [
          'You can catch POKéMON even if you already have six with you.',
          "They're automatically transferred to your BOX!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bug_catcher_wade',
          trainerName: 'Bug Catcher Wade',
          visionRange: 4,
          challengePages: [
            'BUG CATCHER WADE: I caught a bunch of POKéMON. Let me battle with you!',
          ],
          trainerPokemon: {
            speciesId: 'weedle',
            level: 4,
            moves: ['poisonsting', 'stringshot', 'tackle'],
          },
        }
      ),
      makeNpc('r31_sleepy_man', 17, 7, 'DOWN', 'fat_man', '😴 SLEEPY MAN', [
        '… Hnuurg… Huh?',
        'I walked too far today looking for POKéMON in DARK CAVE.',
        'My feet hurt and I\'m sleepy… Zzz…',
      ]),
      makeNpc(
        'r31_mail_guy',
        28,
        9,
        'DOWN',
        'boy',
        '📬 KENYA DELIVERER',
        [
          'I found a good POKéMON in DARK CAVE.',
          "I'm going to raise it to take on FALKNER at VIOLET GYM!",
        ],
        { wanders: true }
      ),
    ],
    route_31_violet_gate: [
      makeNpc('r31_gate_officer', 5, 2, 'DOWN', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Hi there! Did you visit SPROUT TOWER?',
        'VIOLET CITY is just ahead to the west. Good luck at the GYM!',
      ]),
    ],
    mr_pokemons_house: [
      makeNpc(
        'mr_pokemon_npc',
        3,
        3,
        'DOWN',
        'fat_man',
        '🎩 MR. POKéMON',
        [
          'Hello, hello! You must be GOLD, sent by PROF. ELM!',
          'This is the rare egg I asked PROF. ELM to examine—the MYSTERY EGG!',
          'I know a couple who run a POKéMON DAY-CARE. They gave me that EGG.',
        ],
        { action: 'MR_POKEMON_EVENT' }
      ),
      makeNpc(
        'prof_oak_npc',
        5,
        3,
        'DOWN',
        'fat_man',
        '🎓 PROF. OAK',
        [
          'Aha! So you are GOLD! I am OAK, a POKéMON researcher.',
          'I was just visiting my old friend MR. POKéMON.',
          'Your CYNDQUIL seems very attached to you! Here, take this latest-model POKéDEX!',
        ],
        { action: 'MR_POKEMON_EVENT' }
      ),
    ],
    route_30_berry_house: [
      makeNpc(
        'berry_man_npc',
        2,
        3,
        'DOWN',
        'fat_man',
        '🍎 BERRY HOUSE MAN',
        [
          'You know, POKéMON eat BERRIES.',
          'Well, my POKéMON got healthier by eating a BERRY! Here, share this POTION for the road!',
        ],
        { action: 'BERRY_MAN_EVENT' }
      ),
    ],
    elms_lab: [
      makeNpc(
        'elm_npc',
        5,
        2,
        'DOWN',
        'prof_elm',
        '🔬 PROF. ELM',
        [
          "Hi, GOLD! I've been researching unusual POKéMON evolutions here in NEW BARK TOWN.",
          "MR. POKéMON beyond CHERRYGROVE CITY on ROUTE 30 sent word of a rare discovery, and legends speak of three Legendary Beasts slumbering in ECRUTEAK's BURNED TOWER.",
          'Here—let me heal your POKéMON and record your research progress!',
        ],
        { action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('elm_aide', 2, 9, 'UP', 'boy', '🥼 LAB AIDE', [
        'There was a loud noise outside…',
        'To add to your POKéDEX, you have to catch POKéMON. Throw POKé BALLS at wild POKéMON to get them!',
      ]),
    ],
    players_house_1f: [
      makeNpc(
        'mom_npc',
        7,
        4,
        'LEFT',
        'mom',
        '🏠 MOM',
        [
          'Oh, GOLD…! Your POKéMON GEAR is back from the repair shop.',
          'Rest up for a moment, sweetheart! Your POKéMON are looking fit and energized!',
        ],
        { action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('neighbor_visit_npc', 4, 4, 'RIGHT', 'kris', '🏡 NEIGHBOR', [
        'Good day! PROF. ELM discovered that PIKACHU is an evolved POKéMON.',
        "My daughter is adamant about becoming PROF. ELM's assistant. She really loves POKéMON!",
      ]),
    ],
    players_neighbors_house: [
      makeNpc('neighbor_daughter', 2, 3, 'RIGHT', 'kris', "👧 NEIGHBOR'S DAUGHTER", [
        "PIKACHU is an evolved POKéMON. I was amazed by PROF. ELM's findings.",
        "He's so famous for his research on POKéMON evolution… I wish I could be a researcher like him…",
      ]),
    ],
    elms_house: [
      makeNpc('elms_wife', 1, 5, 'RIGHT', 'teacher', "👩 PROF. ELM'S WIFE", [
        "Hi, GOLD! My husband's always so busy—I hope he's OK.",
        "When he's caught up in his POKéMON research, he even forgets to eat.",
      ]),
      makeNpc('elms_son', 5, 4, 'UP', 'bug_catcher', "👦 PROF. ELM'S SON", [
        "When I grow up, I'm going to help my dad!",
        "I'm going to be a great POKéMON professor!",
      ]),
    ],
    cherrygrove_poke_center: [
      makeNpc(
        'nurse_joy',
        3,
        1,
        'DOWN',
        'girl',
        '👩‍⚕️ NURSE JOY',
        [
          'Welcome to our POKéMON CENTER!',
          'We can heal your POKéMON to perfect health in no time at all.',
          'Your fighting party has been restored to full HP & PP. We hope to see you again!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc('pc_fisher', 2, 3, 'UP', 'fat_man', '🎣 FISHER', [
        "It's great. I can store any number of POKéMON, and it's all free.",
      ]),
      makeNpc('pc_gentleman', 8, 6, 'UP', 'fat_man', '🎩 GENTLEMAN', [
        'That PC in the corner is free for any trainer to use.',
      ]),
      makeNpc('pc_teacher', 1, 6, 'RIGHT', 'girl', '👩‍🏫 TEACHER', [
        'The COMMUNICATION CENTER upstairs was just built.',
        'I traded POKéMON there already!',
      ]),
    ],
    cherrygrove_mart: [
      makeNpc(
        'mart_clerk',
        1,
        3,
        'RIGHT',
        'fat_man',
        '🏪 MART CLERK',
        ['Welcome to CHERRYGROVE POKé MART! How may I serve you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
      makeNpc(
        'mart_cooltrainer',
        7,
        6,
        'LEFT',
        'boy',
        '🧢 COOLTRAINER',
        ['POKé BALLS are in stock! Now I can catch POKéMON!'],
        { wanders: true }
      ),
      makeNpc('mart_youngster', 2, 5, 'DOWN', 'boy', '👦 YOUNGSTER', [
        'When I was walking in the grass, a bug POKéMON poisoned my POKéMON!',
        'You should always keep an ANTIDOTE with you.',
      ]),
    ],
    guide_gents_house: [
      makeNpc('house_guide_gent', 2, 3, 'RIGHT', 'fat_man', '👴 GUIDE GENT', [
        'When I was a wee lad, I was a hot-shot trainer!',
        "Here's a word of advice: Catch lots of POKéMON! Treat them all with kindness!",
      ]),
    ],
    cherrygrove_gym_speech_house: [
      makeNpc('gym_speech_npc', 2, 3, 'RIGHT', 'boy', '👦 TRAINER', [
        "You're trying to see how good you are as a POKéMON trainer?",
        'You better visit the POKéMON GYMS all over JOHTO and collect BADGES!',
      ]),
    ],
    cherrygrove_evolution_speech_house: [
      makeNpc('evo_speech_npc', 3, 5, 'LEFT', 'girl', '👧 LASS', [
        'POKéMON gain experience in battle and change their form.',
        'Their appearance changes, and sometimes even their type!',
      ]),
    ],
    sprout_tower_1f: [
      makeNpc(
        'sage_chow',
        14,
        7,
        'DOWN',
        'sage',
        '🙏 SAGE CHOW',
        [
          'We stand guard in this tower.',
          'Here, we express our gratitude to honor all POKéMON.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_chow',
          trainerName: 'Sage Chow',
          visionRange: 3,
          challengePages: [
            'SAGE CHOW: We stand guard in this tower! Here, we express our gratitude to honor all POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
    ],
    sprout_tower_2f: [
      makeNpc(
        'sage_nico',
        12,
        12,
        'RIGHT',
        'sage',
        '🙏 SAGE NICO',
        [
          'However hard we battle, the TOWER will stand strong.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_nico',
          trainerName: 'Sage Nico',
          visionRange: 3,
          challengePages: [
            'SAGE NICO: However hard we battle, the TOWER will stand strong!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
      makeNpc(
        'sage_edmond',
        9,
        4,
        'LEFT',
        'sage',
        '🙏 SAGE EDMOND',
        [
          '…Sway like leaves in the wind…',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_edmond',
          trainerName: 'Sage Edmond',
          visionRange: 3,
          challengePages: [
            'SAGE EDMOND: …Sway like leaves in the wind… Let us battle!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 3,
            moves: ['vinewhip'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
            { speciesId: 'bellsprout', level: 3, moves: ['vinewhip'] },
          ],
        }
      ),
    ],
    sprout_tower_3f: [
      makeNpc(
        'sage_jin',
        8,
        11,
        'RIGHT',
        'sage',
        '🙏 SAGE JIN',
        [
          'I train to find enlightenment in POKéMON!',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_jin',
          trainerName: 'Sage Jin',
          visionRange: 3,
          challengePages: [
            'SAGE JIN: I train to find enlightenment in POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 6,
            moves: ['vinewhip', 'growth'],
          },
        }
      ),
      makeNpc(
        'sage_neal',
        11,
        11,
        'LEFT',
        'sage',
        '🙏 SAGE NEAL',
        [
          'The ELDER\'s HM illuminates even the pitch-black darkness.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_neal',
          trainerName: 'Sage Neal',
          visionRange: 3,
          challengePages: [
            'SAGE NEAL: The ELDER\'s HM illuminates even the pitch-black darkness!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 6,
            moves: ['vinewhip', 'growth'],
          },
        }
      ),
      makeNpc(
        'sage_troy',
        6,
        3,
        'DOWN',
        'sage',
        '🙏 SAGE TROY',
        [
          'It is not far to the ELDER.',
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'sage_troy',
          trainerName: 'Sage Troy',
          visionRange: 3,
          challengePages: [
            'SAGE TROY: Let me see how much you trust your POKéMON!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 7,
            moves: ['vinewhip', 'growth'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'growth'] },
            { speciesId: 'hoot-hoot', level: 7, moves: ['tackle', 'growl', 'peck'] },
          ],
        }
      ),
      makeNpc(
        'elder_li',
        10,
        3,
        'DOWN',
        'elder_li',
        '🏮 ELDER LI',
        [
          'ELDER LI: You care deeply for your POKéMON. With TM70 / HM05 FLASH, even the darkest caves will shine bright.',
          'Go forth and challenge FALKNER at the VIOLET CITY GYM!',
        ],
        {
          action: 'ELDER_LI_EVENT',
          trainerId: 'elder_li',
          trainerName: 'Elder Li',
          challengePages: [
            'ELDER LI: So, you have come seeking enlightenment with your POKéMON. As the ELDER of SPROUT TOWER, I shall test the bond between you and your partners!',
          ],
          trainerPokemon: {
            speciesId: 'bellsprout',
            level: 7,
            moves: ['vinewhip', 'growth'],
          },
          trainerTeam: [
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'growth'] },
            { speciesId: 'bellsprout', level: 7, moves: ['vinewhip', 'wrap'] },
            { speciesId: 'hoot-hoot', level: 10, moves: ['tackle', 'hypnosis', 'peck'] },
          ],
        }
      ),
    ],
    violet_gym: [
      makeNpc(
        'gym_guide',
        7,
        13,
        'DOWN',
        'fat_man',
        '🕶️ GYM GUIDE',
        [
          "Yo! I'm no trainer, but I can give some advice! Believe me! If you believe, a championship dream can come true. You believe? Then listen.",
          'The grass-type is weak against the flying-type. Keep this in mind.',
        ]
      ),
      makeNpc(
        'bird_keeper_abe',
        2,
        10,
        'RIGHT',
        'bird_keeper',
        '🦅 BIRD KEEPER ABE',
        [
          "This can't be true!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bird_keeper_abe',
          trainerName: 'Bird Keeper Abe',
          visionRange: 3,
          challengePages: [
            'BIRD KEEPER ABE: Let me see if you are good enough to face FALKNER!',
          ],
          trainerPokemon: {
            speciesId: 'spearow',
            level: 9,
            moves: ['peck', 'growl', 'leer'],
          },
          trainerTeam: [
            { speciesId: 'spearow', level: 9, moves: ['peck', 'growl', 'leer'] },
          ],
        }
      ),
      makeNpc(
        'bird_keeper_rod',
        7,
        6,
        'LEFT',
        'bird_keeper',
        '🦅 BIRD KEEPER ROD',
        [
          "FALKNER's skills are for real! Don't get cocky just because you beat me!",
        ],
        {
          action: 'TRAINER_BATTLE',
          trainerId: 'bird_keeper_rod',
          trainerName: 'Bird Keeper Rod',
          visionRange: 3,
          challengePages: [
            'BIRD KEEPER ROD: The keyword is guts! Those here are training night and day to become bird POKéMON masters. Come on!',
          ],
          trainerPokemon: {
            speciesId: 'pidgey',
            level: 7,
            moves: ['tackle', 'sandattack'],
          },
          trainerTeam: [
            { speciesId: 'pidgey', level: 7, moves: ['tackle', 'sandattack'] },
            { speciesId: 'pidgey', level: 7, moves: ['tackle', 'sandattack'] },
          ],
        }
      ),
      makeNpc(
        'falkner',
        5,
        1,
        'DOWN',
        'falkner',
        '🦅 LEADER FALKNER',
        [
          "FALKNER: …Darn! My dad's cherished bird POKéMON… All right. Take this. It's the official POKéMON LEAGUE ZEPHYRBADGE!",
          'There are POKéMON GYMS in cities and towns ahead. You should test your skills at these GYMS. I\'m going to train harder to become the greatest bird master!',
        ],
        {
          action: 'FALKNER_EVENT',
          trainerId: 'falkner',
          trainerName: 'Leader Falkner',
          challengePages: [
            "FALKNER: I'm FALKNER, the VIOLET CITY POKéMON GYM leader! People say you can clip flying-type wings with a jolt of electricity… I won't allow such insults to bird POKéMON! I'll show you the real power of the magnificent bird POKéMON!",
          ],
          trainerPokemon: {
            speciesId: 'pidgey',
            level: 9,
            moves: ['tackle', 'sandattack', 'mudslap'],
          },
          trainerTeam: [
            { speciesId: 'pidgey', level: 9, moves: ['tackle', 'sandattack', 'mudslap'] },
            { speciesId: 'pidgeotto', level: 13, moves: ['gust', 'tackle', 'mudslap', 'roost'] },
          ],
        }
      ),
    ],
    violet_poke_center: [
      makeNpc(
        'nurse_violet',
        3,
        1,
        'DOWN',
        'mom',
        '💖 NURSE JOY',
        [
          'Welcome to our POKéMON CENTER!',
          'We can heal your POKéMON back to perfect health in just a moment!',
        ],
        { talkAcrossCounter: true, action: 'HEAL_AND_SAVE' }
      ),
      makeNpc(
        'elms_aide',
        1,
        4,
        'RIGHT',
        'teacher',
        "🔬 PROF. ELM'S AIDE",
        [
          "AIDE: I'm waiting for a promising young trainer on behalf of PROF. ELM.",
        ],
        {
          action: 'ELMS_AIDE_EVENT',
        }
      ),
    ],
    violet_mart: [
      makeNpc(
        'mart_clerk_violet',
        1,
        3,
        'RIGHT',
        'boy',
        '🛒 MART CLERK',
        ['Welcome to the VIOLET CITY POKéMON MART! How may I serve you?'],
        { talkAcrossCounter: true, action: 'OPEN_MART' }
      ),
    ],
    violet_city: [
      makeNpc(
        'earl',
        28,
        18,
        'DOWN',
        'earl',
        '🎓 EARL DERVISH',
        [
          'Twirl! Twirl! Did you beat FALKNER at the GYM? Magnificent!',
          'I am EARL! I teach young trainers all about POKéMON at the POKéMON ACADEMY right behind me!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'violet_girl',
        14,
        20,
        'RIGHT',
        'girl',
        '👧 VIOLET LASS',
        [
          'Ghosts are rumored to appear in SPROUT TOWER at night.',
          'Wait—you already climbed to the top and defeated ELDER LI?! Amazing!',
        ],
        { wanders: true }
      ),
      makeNpc(
        'violet_bird_trainer',
        26,
        25,
        'LEFT',
        'bird_keeper',
        '🦅 BIRD FAN',
        [
          'Hey, are you a POKéMON trainer? PIDGEY and SPEAROW are both Flying-types, but SPEAROW has a much fiercer Attack stat!',
        ]
      ),
    ],
    earls_pokemon_academy: [
      makeNpc(
        'earl_teacher',
        4,
        3,
        'UP',
        'earl',
        '🎓 PROFESSOR EARL',
        [
          "Twirl! Welcome to EARL'S POKéMON ACADEMY!",
          "In battle, a move matching your POKéMON's own type deals 1.5x damage! That's Same-Type Attack Bonus!",
        ]
      ),
      makeNpc(
        'academy_boy',
        3,
        5,
        'UP',
        'boy',
        '👦 STUDENT',
        [
          "I'm taking notes from the blackboard! PARALYSIS cuts a POKéMON's Speed in half and may prevent it from moving!",
        ]
      ),
      makeNpc(
        'academy_girl',
        5,
        5,
        'UP',
        'girl',
        '👧 STUDENT',
        [
          "Electric- and Rock-type moves are super effective against Flying-types like FALKNER's bird POKéMON!",
        ]
      ),
    ],
    violet_kyles_house: [
      makeNpc(
        'kyle',
        2,
        4,
        'RIGHT',
        'boy',
        '👦 KYLE',
        [
          'A POKéMON you get in a trade grows quickly, even if it can be willful if you lack GYM BADGES!',
          'I love BELLSPROUT and POLIWAG!',
        ]
      ),
      makeNpc(
        'kyle_mom',
        5,
        4,
        'LEFT',
        'mom',
        "👩 KYLE'S MOM",
        [
          'Do you collect different kinds of POKéMON? My son KYLE is always looking to trade with other trainers!',
        ]
      ),
    ],
    violet_nickname_speech_house: [
      makeNpc(
        'nickname_teacher',
        2,
        4,
        'RIGHT',
        'teacher',
        '👩 NICKNAME FAN',
        [
          'She gives her POKéMON nicknames like STRAWBERRY! Giving a POKéMON a thoughtful nickname makes your bond even stronger!',
        ]
      ),
    ],
  };

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
    } = {}
  ) => {
    let opponentPokemon = initialOpponentPokemon;
    const remainingTrainerParty: PokemonInstance[] =
      options.trainerTeam && options.trainerTeam.length > 1
        ? options.trainerTeam.slice(1)
        : [];

    gameState = 'BATTLE';
    overworldHUD.hide();
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
            battleSM.executeRound({ type: 'RUN' });
            if (options.isRoamer) {
              eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
            }
            await battleHUD.showMessage('Got away safely!');
            battleRenderer.endBattle();
            battleHUD.hide();
            gameState = 'OVERWORLD';
            audioManager.restoreOverworldBgm(0.6);
            overworldHUD.show();
          },
          onSpeedToggle: () => {
            const nextSpeed = gameClock.cycleBattleSpeed();
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
            playerBox.push(opponentPokemon);
          }
        } else if (result.winner === 'PLAYER') {
          if (options.isRoamer) {
            roamingManager.markDefeated(opponentPokemon.speciesId);
            overworldHUD.hideRoamerAlert();
          }

          // Award EXP & Check Level-Up
          const expGained = PokemonFactory.calculateExpGain(opponentPokemon, Boolean(options.isTrainer));
          await battleHUD.showMessage(`${activePlayerPokemon.nickname} gained ${expGained} EXP. Points!`);
          const levelResult = PokemonFactory.gainExp(activePlayerPokemon, expGained);
          battleHUD.updateExp(activePlayerPokemon);
          battleHUD.updateHp(true, activePlayerPokemon.currentHp, activePlayerPokemon.stats.hp);
          if (levelResult.leveledUp) {
            BattleAudio.playBallEvent('LEVEL_UP');
            await battleHUD.showMessage(
              `🎉 ${activePlayerPokemon.nickname} grew to Lv. ${levelResult.newLevel}!`
            );

            // Level-Up Learnset Move Learning (Ticket 6.4)
            const learnableMoveIds = await PokemonFactory.getLearnableMovesAtLevel(
              activePlayerPokemon.speciesId,
              levelResult.newLevel
            );

            for (const newMoveId of learnableMoveIds) {
              const alreadyKnown = activePlayerPokemon.moves.some((m) => m.moveId === newMoveId);
              if (alreadyKnown) continue;

              const newMoveData = PokemonFactory.getMoveData(newMoveId);

              if (activePlayerPokemon.moves.length < 4) {
                // Auto-learn if fewer than 4 moves
                activePlayerPokemon.moves.push({
                  moveId: newMoveData.id,
                  currentPp: newMoveData.pp,
                  maxPp: newMoveData.pp,
                });
                BattleAudio.playBallEvent('LEVEL_UP');
                await battleHUD.showMessage(
                  `✨ ${activePlayerPokemon.nickname} learned ${newMoveData.name}!`
                );
              } else {
                // Prompt to forget an existing move or decline
                const chosenIdx = await battleHUD.promptMoveForget(activePlayerPokemon, newMoveData);
                if (chosenIdx !== null && chosenIdx >= 0 && chosenIdx < 4) {
                  const forgottenMove = activePlayerPokemon.moves[chosenIdx];
                  const forgottenData = PokemonFactory.getMoveData(forgottenMove.moveId);
                  activePlayerPokemon.moves[chosenIdx] = {
                    moveId: newMoveData.id,
                    currentPp: newMoveData.pp,
                    maxPp: newMoveData.pp,
                  };
                  BattleAudio.playBallEvent('LEVEL_UP');
                  await battleHUD.showMessage(
                    `1, 2, and... Poof! ${activePlayerPokemon.nickname} forgot ${forgottenData.name} and learned ${newMoveData.name}!`
                  );
                } else {
                  await battleHUD.showMessage(
                    `${activePlayerPokemon.nickname} did not learn ${newMoveData.name}.`
                  );
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
        saveCurrentGame();

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
        if (targetNpc.action === 'MR_POKEMON_EVENT' && !storyFlags.has('HAS_MYSTERY_EGG')) {
          storyFlags.add('HAS_MYSTERY_EGG');
          storyFlags.add('HAS_POKEDEX');
          healPlayerParty();
          BattleAudio.playOverworldSound('KEY_ITEM');
          overworldHUD.openDialogue(
            [
              `MR. POKéMON: Hello, hello! You must be ${playerName}, sent by PROF. ELM!`,
              `This is the rare egg I asked PROF. ELM to examine—${playerName} received the MYSTERY EGG!`,
              `PROF. OAK: Aha! So you are ${playerName}! Your ${playerParty[0]?.nickname || 'POKéMON'} seems very attached to you!`,
              'PROF. OAK: You look like a dependable trainer! Take this latest-model POKéDEX!',
              '🎩 MR. POKéMON also restored your party to full health before your journey back!',
            ],
            '🎩 MR. POKéMON & 🎓 PROF. OAK',
            () => {
              saveCurrentGame();
              overworldHUD.showToast('🥚 Received MYSTERY EGG & 📕 POKéDEX! (Check START MENU -> POKéDEX)');
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
                if (!inventory.tms.includes('TM70')) inventory.tms.push('TM70');
                BattleAudio.playOverworldSound('KEY_ITEM');
                overworldHUD.openDialogue(
                  [
                    'ELDER LI: Ah, splendid! You truly possess the heart of a true trainer! As proof of your mastery, take this TECHNICAL MACHINE: TM70 FLASH!',
                  ],
                  targetNpc.speaker,
                  () => {
                    saveCurrentGame();
                    overworldHUD.showToast('⚡ Defeated Elder Li & received HM05 / TM70 FLASH!');
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
                if (!inventory.badges.includes('hive')) inventory.badges.push('hive');
                if (!inventory.tms.includes('TM49')) inventory.tms.push('TM49');
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

        // Prof. Elm Lab Starter Dialogue & Errands (Ticket 6.1)
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
          } else {
            overworldHUD.openDialogue(
              [
                `PROF. ELM: Hi, ${playerName}! How is your partner POKéMON doing?`,
                'MR. POKéMON lives a bit past CHERRYGROVE CITY on ROUTE 30. Take care on your way!',
                'Here—let me heal your POKéMON and record your research progress!',
              ],
              targetNpc.speaker,
              () => {
                healPlayerParty();
                saveCurrentGame();
                overworldHUD.showToast('💖 Your party was restored to full HP & PP and game saved!');
              }
            );
            return;
          }
        }

        if (targetNpc.pages && targetNpc.pages.length > 0) {
          overworldHUD.openDialogue(targetNpc.pages, targetNpc.speaker, () => {
            if (targetNpc.action === 'HEAL_AND_SAVE') {
              healPlayerParty();
              saveCurrentGame();
              overworldHUD.showToast('💖 Your party was restored to full HP & PP and game saved!');
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
          overworldHUD.openDialogue(["It's an empty POKé BALL."], bgEvent.speaker);
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

      overworldHUD.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
        if (bgEvent.action === 'HEAL_AND_SAVE') {
          healPlayerParty();
          saveCurrentGame();
          overworldHUD.showToast('💖 Your party was restored to full HP & PP and game saved!');
        } else if (bgEvent.action === 'OPEN_MART') {
          bagUI.openMart();
        }
      });
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
        mapManager.isWalkable,
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

            const previousMapId = currentMap?.id;
            player.isMoving = false;
            player.progress = 0;
            isCutsceneLocked = true;
            BattleAudio.playOverworldSound('DOOR');

            overworldRenderer
              .playDoorwayFade(() => {
                const targetMap = mapManager.setCurrentMap(warp.targetMapId);
                const isEnteringIndoor = Object.keys(targetMap.connections || {}).length === 0;
                player.direction = warp.targetY <= 1 ? 'DOWN' : isEnteringIndoor ? 'UP' : 'DOWN';
                player.x = warp.targetX;
                player.y = warp.targetY;
                player.targetX = warp.targetX;
                player.targetY = warp.targetY;
                player.renderX = warp.targetX;
                player.renderY = warp.targetY;

                overworldRenderer.renderMap(targetMap, lookupMap);
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

          // Tall Grass Rustle FX + Sound
          if (tileType === 2) {
            overworldRenderer.spawnGrassRustle(coord.x, coord.y);
            BattleAudio.playOverworldSound('RUSTLE');
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
            mapManager.isWalkableInBounds,
            mapManager.getTileType,
            undefined,
            npcObstaclesScratch
          );
        }

        // Also update wandering NPCs on connected West/East/North/South neighbor maps at 1.0x world time
        const updateNeighborMapNpcs = (neighborMapId: string | undefined) => {
          if (!neighborMapId) return;
          const neighborMap = mapManager.getMap(neighborMapId);
          const neighborNpcs = neighborMap ? npcsByMap[neighborMap.id] : undefined;
          if (!neighborMap || !neighborNpcs) return;

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
              (x, y) => mapManager.isWalkableInMapBounds(neighborMap, x, y),
              mapManager.getTileType,
              undefined,
              neighborNpcs
            );
          }
        };

        updateNeighborMapNpcs(currentMap?.connections.WEST?.mapId);
        updateNeighborMapNpcs(currentMap?.connections.EAST?.mapId);
        updateNeighborMapNpcs(currentMap?.connections.NORTH?.mapId);
        updateNeighborMapNpcs(currentMap?.connections.SOUTH?.mapId);
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
