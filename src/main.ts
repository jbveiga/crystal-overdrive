import { GameClock } from './core/GameClock';
import { eventBus } from './core/EventBus';
import { MapManager } from './world/MapManager';
import { GridPhysics, type GridEntity } from './world/GridPhysics';
import { OverworldRenderer } from './render/OverworldRenderer';
import { OverworldHUD } from './ui/OverworldHUD';
import { BattleRenderer } from './render/BattleRenderer';
import { BattleHUD } from './ui/BattleHUD';
import { BattleStateMachine } from './battle/BattleStateMachine';
import { PokemonFactory } from './battle/PokemonFactory';
import { RoamingManager } from './world/RoamingManager';
import { SaveManager, type SaveData } from './core/SaveManager';
import { BagAndMartUI, type BagInventory } from './ui/BagAndMartUI';
import type { MapData, Direction, PokeballId, PokemonInstance } from './types/game';
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
  let gameState: 'OVERWORLD' | 'BATTLE' = 'OVERWORLD';

  // 2. Load or Initialize Game State
  const existingSave = await saveManager.loadGame();

  let playerParty: PokemonInstance[] = [];
  let playerBox: PokemonInstance[] = [];
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
    tms: ['TM54', 'TM73', 'TM99'],
    money: 3000,
    badges: [],
  };
  const defeatedTrainers: Set<string> = new Set();

  let initialMapId = 'new_bark_town';
  let initialPlayerX = 13;
  let initialPlayerY = 6;
  let initialPlayerDir: Direction = 'DOWN';

  if (existingSave) {
    console.log('📦 Restoring save state from IndexedDB...');
    playerParty = existingSave.party;
    playerBox = existingSave.box || [];
    inventory.balls = existingSave.inventory.balls;
    inventory.tms = existingSave.inventory.tms;
    inventory.money = existingSave.player.money;
    inventory.badges = existingSave.player.badges;
    existingSave.defeatedTrainers.forEach((t) => defeatedTrainers.add(t));

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
    'elms_lab',
    'players_house_1f',
    'players_neighbors_house',
    'elms_house',
    'cherrygrove_mart',
    'cherrygrove_poke_center',
    'guide_gents_house',
    'cherrygrove_gym_speech_house',
    'cherrygrove_evolution_speech_house',
  ];

  const loadedMaps: MapData[] = await Promise.all(
    mapIds.map(async (id) => {
      const res = await fetch(`/assets/data/maps/${id}.json`);
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
      player: {
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
        tms: inventory.tms,
      },
      roamers: roamingManager.getAllRoamers(),
      defeatedTrainers: Array.from(defeatedTrainers),
    };
    await saveManager.saveGame(saveData);
    console.log('💾 Game state successfully saved to IndexedDB.');
  };

  // 5. Initialize HUDs & Renderers
  const bagUI = new BagAndMartUI('modal-container', inventory, playerParty, () => {
    saveCurrentGame();
  });

  let handleInteract = () => {};

  const overworldHUD = new OverworldHUD('overworld-hud-container', {
    onSpeedCycle: () => {
      const newSpeed = gameClock.cyclePlayerSpeed();
      eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
      return newSpeed;
    },
    onBagOpen: () => {
      bagUI.open('TMS');
    },
    onMartOpen: () => {
      bagUI.openMart();
    },
    onSaveGame: () => {
      saveCurrentGame();
    },
    onInteract: () => {
      handleInteract();
    },
    onToggleBurnedTower: () => {
      if (roamingManager.areBeastsAwakened()) {
        roamingManager.sleepBeasts();
        overworldHUD.hideRoamerAlert();
        overworldHUD.showToast('💤 Raikou, Entei & Suicune returned to slumber in Ecruteak\'s Burned Tower.');
      } else {
        roamingManager.awakenBeasts();
        overworldHUD.showToast('🔥 Burned Tower Awakening! Raikou, Entei & Suicune bolted across Johto!');
        const currentId = mapManager.getCurrentMap()?.id;
        if (currentId) {
          const roamerHere = roamingManager.getActiveRoamerOnRoute(currentId);
          if (roamerHere) {
            overworldHUD.showRoamerAlert(roamerHere.speciesId, currentId);
          }
        }
      }
      overworldHUD.updatePokegear(roamingManager.getAllRoamers());
      saveCurrentGame();
    },
  });
  overworldHUD.updateSpeedDisplay(gameClock.playerSpeed);
  overworldHUD.updateRouteName(initialMap.name);
  overworldHUD.updatePokegear(roamingManager.getAllRoamers());

  const overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer);
  const lookupMap = (id: string) => mapManager.getMap(id);
  overworldRenderer.renderMap(initialMap, lookupMap);

  const battleRenderer = new BattleRenderer(overworldRenderer.app);
  const battleHUD = new BattleHUD('battle-hud-container');

  // Support Shift key to cycle Battle Speed while in Battle mode
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Shift' && !e.repeat && gameState === 'BATTLE') {
      battleHUD.triggerSpeedToggle();
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
    opts: { wanders?: boolean; talkAcrossCounter?: boolean; action?: GridEntity['action'] } = {}
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
  });

  const npcsByMap: Record<string, GridEntity[]> = {
    new_bark_town: [
      makeNpc(
        'nbt_teacher',
        6,
        8,
        'DOWN',
        'girl',
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
        'fat_man',
        '🎣 FISHER',
        ['Yo, GOLD!', 'I hear PROF. ELM discovered some new POKéMON.'],
        { wanders: true }
      ),
      makeNpc('nbt_rival', 3, 2, 'RIGHT', 'boy', '❓ RIVAL ???', [
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
        { action: 'TRAINER_JOEY' }
      ),
      makeNpc(
        'r29_teacher',
        15,
        11,
        'RIGHT',
        'girl',
        '👩‍🏫 TEACHER',
        [
          "See those ledges? It's scary to jump off them.",
          'But you can go to NEW BARK without walking through the grass.',
        ],
        { wanders: true }
      ),
      makeNpc('r29_fisher', 25, 3, 'UP', 'fat_man', '🎣 FISHER', [
        'I wanted to take a break, so I saved to record my progress.',
      ]),
    ],
    cherrygrove_city: [
      makeNpc('cg_guide_gent', 32, 6, 'DOWN', 'fat_man', '👴 GUIDE GENT', [
        "You're a rookie trainer, aren't you? I can tell!",
        "That's OK! Everyone is a rookie at some point!",
        'POKéGEAR becomes more useful as you add CARDS. I wish you luck on your journey!',
      ]),
      makeNpc(
        'cg_teacher',
        27,
        12,
        'LEFT',
        'girl',
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
          'I battled the trainers on the road.',
          "My POKéMON lost. They're a mess! I must take them to a POKéMON CENTER.",
        ],
        { wanders: true }
      ),
      makeNpc('cg_fisher', 7, 12, 'RIGHT', 'fat_man', '🎣 MYSTIC WATER GUY', [
        "A POKéMON I caught had an item. I think it's MYSTIC WATER.",
        'Back to fishing for me, then.',
      ]),
    ],
    elms_lab: [
      makeNpc(
        'elm_npc',
        5,
        2,
        'DOWN',
        'fat_man',
        '🔬 PROF. ELM',
        [
          "Hi, GOLD! I've been researching unusual POKéMON evolutions here in NEW BARK TOWN.",
          "MR. POKéMON beyond CHERRYGROVE CITY sent word of a rare discovery, and legends speak of three Legendary Beasts slumbering in ECRUTEAK's BURNED TOWER.",
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
        'girl',
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
      makeNpc('elms_wife', 1, 5, 'RIGHT', 'girl', "👩 PROF. ELM'S WIFE", [
        "Hi, GOLD! My husband's always so busy—I hope he's OK.",
        "When he's caught up in his POKéMON research, he even forgets to eat.",
      ]),
      makeNpc('elms_son', 5, 4, 'UP', 'boy', "👦 PROF. ELM'S SON", [
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
      targetY += conn.offset;
      overworldRenderer.renderMap(nextMap, lookupMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning East
    else if (entity.x >= current.width && current.connections.EAST) {
      const conn = current.connections.EAST;
      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = 0;
      targetY += conn.offset;
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

    // Reset temporary trapping flag at the start of a new encounter while keeping persistent HP/Status
    opponentPokemon.isTrapped = false;

    const leadPokemon = playerParty[0];
    if (leadPokemon.currentHp <= 0) {
      healPlayerParty();
    }
    const battleSM = new BattleStateMachine(leadPokemon, opponentPokemon, options.isRoamer);

    battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
    battleHUD.updateSpeedDisplay(gameClock.battleSpeed);

    await battleRenderer.startBattle(leadPokemon, opponentPokemon);

    if (options.isTrainer) {
      await battleHUD.showMessage(`${options.trainerName} would like to battle!`);
      await battleHUD.showMessage(`${options.trainerName} sent out ${opponentPokemon.nickname}!`);
    } else if (options.isRoamer) {
      await battleHUD.showMessage(`⚡ Legendary Beast ${opponentPokemon.nickname} appeared!`);
    }

    battleHUD.initBattle(
      leadPokemon,
      opponentPokemon,
      {
        onMoveSelected: async (moveId: string) => {
          const result = battleSM.executeRound({ type: 'FIGHT', moveId });

          for (const ev of result.events) {
            if (ev.type === 'MESSAGE') {
              await battleHUD.showMessage(ev.text);
            } else if (ev.type === 'ATTACK') {
              await battleRenderer.animateAttack(ev.attackerId === leadPokemon.uid);
            } else if (ev.type === 'DAMAGE') {
              await battleRenderer.animateDamage(ev.targetId === leadPokemon.uid);
              const maxHp = ev.targetId === leadPokemon.uid ? leadPokemon.stats.hp : opponentPokemon.stats.hp;
              battleHUD.updateHp(ev.targetId === leadPokemon.uid, ev.remainingHp, maxHp);
            } else if (ev.type === 'STATUS') {
              battleHUD.updateStatusBadges();
            } else if (ev.type === 'FAINT') {
              await battleRenderer.animateFaint(ev.targetId === leadPokemon.uid);
            }
          }

          if (result.isBattleOver) {
            if (result.winner === 'PLAYER') {
              if (options.isRoamer) {
                roamingManager.markDefeated(opponentPokemon.speciesId);
                overworldHUD.hideRoamerAlert();
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
            overworldHUD.show();
            saveCurrentGame();
          } else {
            battleHUD.showActionMenu();
          }
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
          let ballGraphic: Graphics | null = null;

          for (const ev of result.events) {
            if (ev.type === 'MESSAGE') {
              await battleHUD.showMessage(ev.text);
            } else if (ev.type === 'THROW_BALL') {
              ballGraphic = await battleRenderer.animateThrowBall();
            } else if (ev.type === 'SHAKE' && ballGraphic) {
              await battleRenderer.animateShake(ballGraphic, ev.shakes, ev.caught);
            } else if (ev.type === 'ATTACK') {
              await battleRenderer.animateAttack(false);
            } else if (ev.type === 'DAMAGE') {
              await battleRenderer.animateDamage(true);
              battleHUD.updateHp(true, ev.remainingHp, leadPokemon.stats.hp);
            } else if (ev.type === 'FAINT') {
              await battleRenderer.animateFaint(true);
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
            }
            if (options.isRoamer) {
              eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
            }
            await battleHUD.showMessage('Battle concluded! Returning to overworld...');
            battleRenderer.endBattle();
            battleHUD.hide();
            gameState = 'OVERWORLD';
            overworldHUD.show();
            saveCurrentGame();
          } else {
            battleHUD.showActionMenu();
          }
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
          overworldHUD.show();
        },
        onSpeedToggle: () => {
          const nextSpeed = gameClock.cycleBattleSpeed();
          battleRenderer.setSpeedMultiplier(nextSpeed);
          return nextSpeed;
        },
      },
      inventory.balls
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

  handleInteract = () => {
    if (gameState !== 'OVERWORLD' || player.isMoving || overworldHUD.isDialogueOpen()) return;
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

        if (targetNpc.pages && targetNpc.pages.length > 0) {
          overworldHUD.openDialogue(targetNpc.pages, targetNpc.speaker, () => {
            if (targetNpc.action === 'HEAL_AND_SAVE') {
              healPlayerParty();
              saveCurrentGame();
              overworldHUD.showToast('💖 Your party was restored to full HP & PP and game saved!');
            } else if (targetNpc.action === 'OPEN_MART') {
              bagUI.openMart();
            } else if (targetNpc.action === 'TRAINER_JOEY' && !defeatedTrainers.has('youngster_joey')) {
              defeatedTrainers.add('youngster_joey');
              const joeyRattata = PokemonFactory.create('rattata', 4, ['tackle', 'tailwhip', 'quickattack']);
              triggerBattle(joeyRattata, {
                isTrainer: true,
                trainerName: 'Youngster Joey',
              });
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
    const currentMap = mapManager.getCurrentMap();

    if (gameState === 'OVERWORLD') {
      // Active NPCs on this map (Zero per-frame array allocations)
      const activeNpcs = currentMap ? npcsByMap[currentMap.id] || emptyNpcs : emptyNpcs;

      const heldDir = overworldHUD.getHeldDirection();
      GridPhysics.updateEntity(
        player,
        dtPlayer,
        heldDir,
        mapManager.isWalkable,
        mapManager.getTileType,
        (_entity, coord, tileType) => {
          handleMapTransition(player);

          // Check Building Door Warps (Poké Center, Poké Mart, Elm's Lab, Houses)
          const warp = mapManager.checkWarp(coord);
          if (warp) {
            const targetMap = mapManager.setCurrentMap(warp.targetMapId);
            const isEnteringIndoor = Object.keys(targetMap.connections || {}).length === 0;
            player.isMoving = false;
            player.progress = 0;
            player.direction = isEnteringIndoor ? 'UP' : 'DOWN';
            player.x = warp.targetX;
            player.y = warp.targetY;
            player.targetX = warp.targetX;
            player.targetY = warp.targetY;
            player.renderX = warp.targetX;
            player.renderY = warp.targetY;

            overworldRenderer.renderMap(targetMap, lookupMap);
            overworldHUD.updateRouteName(targetMap.name);
            return;
          }

          // Route 29: Line of sight check for Youngster Joey (x: 28, y: 7..8)
          if (
            currentMap?.id === 'route_29' &&
            !defeatedTrainers.has('youngster_joey') &&
            player.x === 28 &&
            (player.y === 7 || player.y === 8)
          ) {
            defeatedTrainers.add('youngster_joey');
            overworldHUD.openDialogue(
              [
                'YOUNGSTER JOEY: I just lost, so I\'m trying to find more POKéMON!',
                'Wait! You look weak! Come on, let\'s battle!',
              ],
              '👦 YOUNGSTER JOEY',
              () => {
                const joeyRattata = PokemonFactory.create('rattata', 4, ['tackle', 'tailwhip', 'quickattack']);
                triggerBattle(joeyRattata, {
                  isTrainer: true,
                  trainerName: 'Youngster Joey',
                });
              }
            );
            return;
          }

          // Wild Encounter Check in Tall Grass (tile type 2)
          if (tileType === 2) {
            const roamer = currentMap ? roamingManager.getActiveRoamerOnRoute(currentMap.id) : undefined;
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
        activeNpcs
      );

      // Update NPCs with dtWorld (strictly 1.0x world speed), colliding with player and staying in bounds
      if (!overworldHUD.isDialogueOpen()) {
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

        // Also update wandering NPCs on connected West/East neighbor maps at 1.0x world time
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
