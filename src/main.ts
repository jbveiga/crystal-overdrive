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

  // Town NPC (Authentic NewBarkTown.asm coordinate: 6, 8)
  const npc: GridEntity = {
    id: 'town_npc',
    x: 6,
    y: 8,
    targetX: 6,
    targetY: 8,
    renderX: 6,
    renderY: 8,
    direction: 'DOWN',
    isMoving: false,
    progress: 0,
    isPlayer: false,
  };

  // Route 29 Trainer: Youngster Joey (standing on main path at 28, 6)
  const joeyNpc: GridEntity = {
    id: 'youngster_joey',
    x: 28,
    y: 6,
    targetX: 28,
    targetY: 6,
    renderX: 28,
    renderY: 6,
    direction: 'DOWN',
    isMoving: false,
    progress: 0,
    isPlayer: false,
  };

  // Pre-allocated NPC & obstacle arrays for zero-allocation 60Hz ticker loop
  const townNpcs: GridEntity[] = [npc];
  const route29Npcs: GridEntity[] = [joeyNpc];
  const emptyNpcs: GridEntity[] = [];
  const playerObstacles: GridEntity[] = [player];

  let npcMoveTimer = 0;
  let npcHeldDir: Direction | null = null;
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

  // 8. Decoupled Main Ticker Loop
  overworldRenderer.app.ticker.add((ticker) => {
    const rawDeltaSec = ticker.deltaMS / 1000;
    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);
    const currentMap = mapManager.getCurrentMap();

    if (gameState === 'OVERWORLD') {
      // Update Player with dtPlayer (1x / 2x / 3x)
      // Active NPCs on this map (Zero per-frame array allocations)
      const activeNpcs =
        currentMap?.id === 'route_29'
          ? route29Npcs
          : currentMap?.id === 'new_bark_town'
            ? townNpcs
            : emptyNpcs;

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

            if (isEnteringIndoor) {
              if (warp.targetMapId === 'cherrygrove_mart') {
                overworldHUD.showToast('🏪 Welcome to Cherrygrove Poké Mart! Browse badge-gated Pokéballs.');
                bagUI.openMart();
              } else if (warp.targetMapId === 'cherrygrove_poke_center') {
                healPlayerParty();
                saveCurrentGame();
                overworldHUD.showToast('💖 Cherrygrove Pokémon Center: Your party was restored to full HP & PP!');
              } else if (warp.targetMapId === 'elms_lab') {
                healPlayerParty();
                overworldHUD.showToast('🔬 Prof. Elm: "Raikou, Entei & Suicune are roaming Johto! Use your Pokégear!"');
              } else if (warp.targetMapId === 'players_house_1f') {
                healPlayerParty();
                saveCurrentGame();
                overworldHUD.showToast('🏠 Mom: "Rest up, sweetheart! Your Pokémon are looking fit and energized!"');
              } else if (warp.targetMapId === 'guide_gents_house') {
                overworldHUD.showToast('🗺️ Guide Gent: "Check your Pokégear Map to track the Legendary Beasts!"');
              } else {
                overworldHUD.showToast('🏡 Neighbor: "Tip: Teach TM54 False Swipe & TM99 Mean Look from your Bag!"');
              }
            }
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
            const joeyRattata = PokemonFactory.create('rattata', 4, ['tackle', 'tailwhip', 'quickattack']);
            triggerBattle(joeyRattata, {
              isTrainer: true,
              trainerName: 'Youngster Joey',
            });
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
      npcMoveTimer += dtWorld;
      if (npcMoveTimer > 2.0 && !npc.isMoving) {
        npcMoveTimer = 0;
        npcHeldDir = Math.random() < 0.6 ? directions[Math.floor(Math.random() * 4)] : null;
      }

      if (currentMap?.id === 'new_bark_town') {
        GridPhysics.updateEntity(
          npc,
          dtWorld,
          npcHeldDir,
          mapManager.isWalkableInBounds,
          mapManager.getTileType,
          undefined,
          playerObstacles
        );
      }

      // Render active map after any border transitions during this tick
      const mapAfterMove = mapManager.getCurrentMap();
      const npcsToRender =
        mapAfterMove?.id === 'route_29'
          ? route29Npcs
          : mapAfterMove?.id === 'new_bark_town'
            ? townNpcs
            : emptyNpcs;
      overworldRenderer.update(player, npcsToRender, dtWorld);
    }
  });

  console.log('⚡ Crystal Overdrive Vertical Slice 100% playable & booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
