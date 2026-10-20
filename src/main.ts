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
import type { MapData, Direction, PokeballId, PokemonInstance, PlayerGender, GameOptions } from './types/game';
import type { Graphics } from 'pixi.js';

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
  };
  const defeatedTrainers: Set<string> = new Set();
  const storyFlags: Set<string> = new Set();
  const seenSpecies: Set<string> = new Set(['cyndaquil']);

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
    // Default starter
    playerParty = [PokemonFactory.create('cyndaquil', 5, ['tackle', 'leer', 'ember', 'smokescreen'])];
  }

  // 3. Fetch and Register Vertical Slice Outdoor & Indoor Maps
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
    }
  );

  bagUI.setSpeedMultiplier(gameClock.playerSpeed);
  partyUI.setSpeedMultiplier(gameClock.playerSpeed);
  startMenuUI.setSpeedMultiplier(gameClock.playerSpeed);

  const isAnyOverworldModalOpen = () =>
    gameState === 'TITLE' || startMenuUI.isOpen() || partyUI.isOpen() || bagUI.isOpen();

  const overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => {
      const newSpeed = gameClock.cyclePlayerSpeed();
      bagUI.setSpeedMultiplier(newSpeed);
      partyUI.setSpeedMultiplier(newSpeed);
      startMenuUI.setSpeedMultiplier(newSpeed);
      eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
      return newSpeed;
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
  const lookupMap = (id: string) => mapManager.getMap(id);
  overworldRenderer.renderMap(initialMap, lookupMap);

  const battleRenderer = new BattleRenderer(overworldRenderer.app);
  const battleHUD = new BattleHUD('battle-hud-container');

  // 5b. Mount Title Screen UI (Ticket 4.2)
  const titleScreenUI = new TitleScreenUI('modal-container', initialSavePreview, gameOptions, {
    onUnlockAudio: async () => {
      await audioManager.unlockAudio();
    },
    onContinue: async () => {
      titleScreenUI.hide();
      gameState = 'OVERWORLD';
      overworldHUD.show();
      const activeMap = mapManager.getCurrentMap();
      if (activeMap) {
        overworldHUD.updateRouteName(activeMap.name);
        audioManager.playMapBgm(activeMap.id, 0.6);
      }
    },
    onNewGame: async () => {
      await saveManager.deleteSave();
      titleScreenUI.hide();

      // Reset fresh adventure state
      playerName = 'GOLD';
      playerGender = 'BOY';
      playTimeSeconds = 0;
      playerParty.length = 0;
      playerParty.push(
        PokemonFactory.create('cyndaquil', 5, ['tackle', 'leer', 'ember', 'smokescreen'])
      );
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
      seenSpecies.add('cyndaquil');
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
      gameState = 'OVERWORLD';
      overworldHUD.show();
      audioManager.playMapBgm(startMap.id, 0.6);
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

  // Helper to heal the player's party to full HP, PP, and clear status
  const healPlayerParty = () => {
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
        7,
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
        12,
        'DOWN',
        'boy',
        '📬 KENYA DELIVERER',
        [
          'I found a good POKéMON in DARK CAVE.',
          "I'm going to raise it to take on FALKNER at VIOLET GYM!",
        ],
        { wanders: true }
      ),
      makeNpc('r31_gate_officer_north', 4, 6, 'RIGHT', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Halt there, young trainer!',
        'Beyond here lies VIOLET CITY, but the gate is temporarily closed while officials prepare for the upcoming festival.',
        'Please explore ROUTE 30 and ROUTE 31 for now until the way ahead is cleared!',
      ]),
      makeNpc('r31_gate_officer_south', 4, 7, 'RIGHT', 'teacher', '👮 GATE OFFICER', [
        'OFFICER: Halt there, young trainer!',
        'Beyond here lies VIOLET CITY, but the gate is temporarily closed while officials prepare for the upcoming festival.',
        'Please explore ROUTE 30 and ROUTE 31 for now until the way ahead is cleared!',
      ]),
    ],
    mr_pokemons_house: [
      makeNpc(
        'mr_pokemon_npc',
        3,
        5,
        'RIGHT',
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
        6,
        5,
        'UP',
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

  // 7. Start Battle (Wild or Trainer)
  const triggerBattle = async (
    opponentPokemon: PokemonInstance,
    options: { isRoamer?: boolean; isTrainer?: boolean; trainerName?: string } = {}
  ) => {
    gameState = 'BATTLE';
    overworldHUD.hide();
    player.isMoving = false;
    player.progress = 0;
    audioManager.playBattleBgm(options.isTrainer ? 'trainer' : 'wild');

    // Record species as SEEN in Pokédex
    seenSpecies.add(opponentPokemon.speciesId);

    // Reset temporary trapping flag at the start of a new encounter while keeping persistent HP/Status
    opponentPokemon.isTrapped = false;

    let activePlayerPokemon = playerParty.find((p) => p.currentHp > 0) || playerParty[0];
    if (activePlayerPokemon.currentHp <= 0) {
      healPlayerParty();
      activePlayerPokemon = playerParty[0];
    }
    const battleSM = new BattleStateMachine(activePlayerPokemon, opponentPokemon, options.isRoamer);

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

    const playTurnEventsAndFinishCheck = async (result: BattleTurnResult) => {
      let ballGraphic: Graphics | null = null;

      for (const ev of result.events) {
        if (ev.type === 'MESSAGE') {
          await battleHUD.showMessage(ev.text);
        } else if (ev.type === 'SWITCH') {
          activePlayerPokemon = ev.newPokemon;
          await battleRenderer.animateSwitchPlayerPokemon(activePlayerPokemon);
          battleHUD.setActivePlayerPokemon(activePlayerPokemon);
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
      } else {
        battleHUD.showActionMenu();
      }
    };

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

          // Decrement ball count
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
      const foe = PokemonFactory.create(
        trainer.trainerPokemon!.speciesId,
        trainer.trainerPokemon!.level,
        trainer.trainerPokemon!.moves
      );
      triggerBattle(foe, {
        isTrainer: true,
        trainerName: trainer.trainerName || trainer.speaker || 'Trainer',
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
              'MR. POKéMON: Hello, hello! You must be GOLD, sent by PROF. ELM!',
              'This is the rare egg I asked PROF. ELM to examine—GOLD received the MYSTERY EGG!',
              'PROF. OAK: Aha! So you are GOLD! Your CYNDAQUIL seems very attached to you!',
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
            const foe = PokemonFactory.create(
              targetNpc.trainerPokemon!.speciesId,
              targetNpc.trainerPokemon!.level,
              targetNpc.trainerPokemon!.moves
            );
            triggerBattle(foe, {
              isTrainer: true,
              trainerName: targetNpc.trainerName || targetNpc.speaker || 'Trainer',
            });
          });
          return;
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

  // 8. Decoupled Main Ticker Loop
  overworldRenderer.app.ticker.add((ticker) => {
    const rawDeltaSec = ticker.deltaMS / 1000;
    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);
    if (gameState !== 'TITLE') {
      playTimeSeconds += dtWorld;
    }
    const currentMap = mapManager.getCurrentMap();

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
          if (tileType === 2) {
            const roamer = latestMap ? roamingManager.getActiveRoamerOnRoute(latestMap.id) : undefined;
            const encounter = mapManager.rollWildEncounter(tileType, roamer?.speciesId);

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
