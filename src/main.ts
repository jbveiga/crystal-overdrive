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
import type { MapData, Direction, PokeballId } from './types/game';
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
  let gameState: 'OVERWORLD' | 'BATTLE' = 'OVERWORLD';

  // 2. Fetch and Register Vertical Slice Maps
  const [newBarkTownRes, route29Res, cherrygroveRes] = await Promise.all([
    fetch('/assets/data/maps/new_bark_town.json'),
    fetch('/assets/data/maps/route_29.json'),
    fetch('/assets/data/maps/cherrygrove_city.json'),
  ]);

  const newBarkTown: MapData = await newBarkTownRes.json();
  const route29: MapData = await route29Res.json();
  const cherrygrove: MapData = await cherrygroveRes.json();

  mapManager.registerMap(newBarkTown);
  mapManager.registerMap(route29);
  mapManager.registerMap(cherrygrove);

  const initialMap = mapManager.setCurrentMap('new_bark_town');

  // 3. Initialize HUDs & Renderers
  const overworldHUD = new OverworldHUD('ui-overlay', () => {
    const newSpeed = gameClock.cyclePlayerSpeed();
    eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
    return newSpeed;
  });
  overworldHUD.updateRouteName(initialMap.name);
  overworldHUD.updatePokegear(roamingManager.getAllRoamers());

  const overworldRenderer = new OverworldRenderer();
  await overworldRenderer.init(canvasContainer);
  overworldRenderer.renderMap(initialMap);

  const battleRenderer = new BattleRenderer(overworldRenderer.app);
  const battleHUD = new BattleHUD('ui-overlay');

  // 4. Initialize Player Party (Cyndaquil starter with authentic stats & moves)
  const playerStarter = PokemonFactory.create('cyndaquil', 5, ['tackle', 'leer', 'ember', 'smokescreen']);

  // 5. Initialize Entities
  const player: GridEntity = {
    id: 'player',
    x: 6,
    y: 6,
    targetX: 6,
    targetY: 6,
    renderX: 6,
    renderY: 6,
    direction: 'DOWN',
    isMoving: false,
    progress: 0,
    isPlayer: true,
  };

  const npc: GridEntity = {
    id: 'town_npc',
    x: 10,
    y: 5,
    targetX: 10,
    targetY: 5,
    renderX: 10,
    renderY: 5,
    direction: 'DOWN',
    isMoving: false,
    progress: 0,
    isPlayer: false,
  };

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
      overworldRenderer.renderMap(nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning East
    else if (entity.x >= current.width && current.connections.EAST) {
      const conn = current.connections.EAST;
      nextMapId = conn.mapId;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = 0;
      targetY += conn.offset;
      overworldRenderer.renderMap(nextMap);
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
    }
  };

  // 6. Start Battle Transition
  const triggerBattle = async (speciesId: string, level: number, isRoamer: boolean = false) => {
    gameState = 'BATTLE';
    player.isMoving = false;
    player.progress = 0;

    const wildPokemon = PokemonFactory.create(speciesId, level);
    const battleSM = new BattleStateMachine(playerStarter, wildPokemon, isRoamer);

    battleRenderer.setSpeedMultiplier(gameClock.battleSpeed);
    battleHUD.updateSpeedDisplay(gameClock.battleSpeed);

    await battleRenderer.startBattle(playerStarter, wildPokemon);

    battleHUD.initBattle(playerStarter, wildPokemon, {
      onMoveSelected: async (moveId: string) => {
        const result = battleSM.executeRound({ type: 'FIGHT', moveId });

        for (const ev of result.events) {
          if (ev.type === 'MESSAGE') {
            await battleHUD.showMessage(ev.text);
          } else if (ev.type === 'ATTACK') {
            await battleRenderer.animateAttack(ev.attackerId === playerStarter.uid);
          } else if (ev.type === 'DAMAGE') {
            await battleRenderer.animateDamage(ev.targetId === playerStarter.uid);
            const maxHp = ev.targetId === playerStarter.uid ? playerStarter.stats.hp : wildPokemon.stats.hp;
            battleHUD.updateHp(ev.targetId === playerStarter.uid, ev.remainingHp, maxHp);
          } else if (ev.type === 'FAINT') {
            await battleRenderer.animateFaint(ev.targetId === playerStarter.uid);
          }
        }

        if (result.isBattleOver) {
          if (result.winner === 'PLAYER' && isRoamer) {
            roamingManager.markDefeated(wildPokemon.speciesId);
            eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
            overworldHUD.hideRoamerAlert();
          }
          await battleHUD.showMessage('Battle concluded! Returning to overworld...');
          battleRenderer.endBattle();
          battleHUD.hide();
          gameState = 'OVERWORLD';
        } else {
          battleHUD.showActionMenu();
        }
      },
      onBagSelected: async (ballId: PokeballId) => {
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
            battleHUD.updateHp(true, ev.remainingHp, playerStarter.stats.hp);
          } else if (ev.type === 'FAINT') {
            await battleRenderer.animateFaint(true);
          }
        }

        if (result.isBattleOver) {
          if (result.caught && isRoamer) {
            roamingManager.markCaught(wildPokemon.speciesId);
            eventBus.emit('roamer:updated', { roamers: roamingManager.getAllRoamers() });
            overworldHUD.hideRoamerAlert();
          }
          await battleHUD.showMessage('Battle concluded! Returning to overworld...');
          battleRenderer.endBattle();
          battleHUD.hide();
          gameState = 'OVERWORLD';
        } else {
          battleHUD.showActionMenu();
        }
      },
      onRunSelected: async () => {
        battleSM.executeRound({ type: 'RUN' });
        await battleHUD.showMessage('Got away safely!');
        battleRenderer.endBattle();
        battleHUD.hide();
        gameState = 'OVERWORLD';
      },
      onSpeedToggle: () => {
        const nextSpeed = gameClock.cycleBattleSpeed();
        battleRenderer.setSpeedMultiplier(nextSpeed);
        return nextSpeed;
      },
    });
  };

  // 7. Decoupled Main Ticker Loop
  overworldRenderer.app.ticker.add((ticker) => {
    const rawDeltaSec = ticker.deltaMS / 1000;
    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);

    if (gameState === 'OVERWORLD') {
      // Update Player with dtPlayer (1x / 2x / 3x)
      const heldDir = overworldHUD.getHeldDirection();
      GridPhysics.updateEntity(
        player,
        dtPlayer,
        heldDir,
        mapManager.isWalkable,
        mapManager.getTileType,
        (_entity, _coord, tileType) => {
          handleMapTransition(player);

          // Wild Encounter Check in Tall Grass (tile type 2)
          if (tileType === 2) {
            const currentMap = mapManager.getCurrentMap();
            const roamer = currentMap ? roamingManager.getActiveRoamerOnRoute(currentMap.id) : undefined;
            const encounter = mapManager.rollWildEncounter(tileType, roamer?.speciesId);

            if (encounter) {
              console.log(`[Wild Encounter] Wild ${encounter.speciesId} (Lv. ${encounter.level}) appeared!`);
              triggerBattle(encounter.speciesId, encounter.level, encounter.isRoamer);
            }
          }
        }
      );

      // Update NPC with dtWorld (strictly 1.0x world speed)
      npcMoveTimer += dtWorld;
      if (npcMoveTimer > 2.0 && !npc.isMoving) {
        npcMoveTimer = 0;
        npcHeldDir = Math.random() < 0.6 ? directions[Math.floor(Math.random() * 4)] : null;
      }

      GridPhysics.updateEntity(
        npc,
        dtWorld,
        npcHeldDir,
        mapManager.isWalkable,
        mapManager.getTileType
      );

      overworldRenderer.update(player, [npc]);
    }
  });

  console.log('⚡ Crystal Overdrive Phase 3 (Roaming Beasts, Catching & Pokégear) successfully booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
