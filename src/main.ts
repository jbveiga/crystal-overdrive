import { GameClock } from './core/GameClock';
import { eventBus } from './core/EventBus';
import { MapManager } from './world/MapManager';
import { GridPhysics, type GridEntity } from './world/GridPhysics';
import { OverworldRenderer } from './render/OverworldRenderer';
import { OverworldHUD } from './ui/OverworldHUD';
import type { MapData, Direction } from './types/game';

async function bootstrap() {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) {
    throw new Error('Canvas container #canvas-container not found');
  }

  // 1. Initialize Core Systems
  const gameClock = new GameClock();
  const mapManager = new MapManager();

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

  // 3. Initialize HUD & UI
  const hud = new OverworldHUD('ui-overlay', () => {
    const newSpeed = gameClock.cyclePlayerSpeed();
    eventBus.emit('player:speedChanged', { playerSpeed: newSpeed });
    return newSpeed;
  });
  hud.updateRouteName(initialMap.name);

  // 4. Initialize PixiJS Renderer
  const renderer = new OverworldRenderer();
  await renderer.init(canvasContainer);
  renderer.renderMap(initialMap);

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

  // Wandering NPC in New Bark Town moving strictly at 1.0x world speed
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

  // Handle map border transition helper
  const handleMapTransition = (entity: GridEntity) => {
    const current = mapManager.getCurrentMap();
    if (!current) return;

    // Transitioning West
    if (entity.x < 0 && current.connections.WEST) {
      const conn = current.connections.WEST;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      renderer.renderMap(nextMap);
      hud.updateRouteName(nextMap.name);
      entity.x = nextMap.width - 1;
      entity.targetX = entity.x;
      entity.renderX = entity.x;
      entity.y += conn.offset;
      entity.targetY = entity.y;
      entity.renderY = entity.y;
    }
    // Transitioning East
    else if (entity.x >= current.width && current.connections.EAST) {
      const conn = current.connections.EAST;
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      renderer.renderMap(nextMap);
      hud.updateRouteName(nextMap.name);
      entity.x = 0;
      entity.targetX = 0;
      entity.renderX = 0;
      entity.y += conn.offset;
      entity.targetY = entity.y;
      entity.renderY = entity.y;
    }
  };

  // 6. Game Loop (Decoupled GameClock Ticker)
  renderer.app.ticker.add((ticker) => {
    const rawDeltaSec = ticker.deltaMS / 1000;
    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);

    // Update Player with dtPlayer (scales at 1x, 2x, 3x)
    const heldDir = hud.getHeldDirection();
    GridPhysics.updateEntity(
      player,
      dtPlayer,
      heldDir,
      mapManager.isWalkable,
      mapManager.getTileType,
      (_entity, _coord, tileType) => {
        // Check for border transition
        handleMapTransition(player);

        // Check for wild encounters in tall grass
        if (tileType === 2) {
          const encounter = mapManager.rollWildEncounter(tileType);
          if (encounter) {
            console.log(`[Wild Encounter] A wild ${encounter.speciesId} (Lv. ${encounter.level}) appeared!`);
            eventBus.emit('wild:encounter', {
              speciesId: encounter.speciesId,
              level: encounter.level,
            });
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

    // Render smooth interpolation
    renderer.update(player, [npc]);
  });

  console.log('⚡ Crystal Overdrive Phase 1 successfully booted!');
}

window.addEventListener('DOMContentLoaded', bootstrap);
