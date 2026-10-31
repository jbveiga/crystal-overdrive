import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MapManager } from '../../src/world/MapManager';
import { OverworldTickerCoordinator } from '../../src/world/OverworldTickerCoordinator';
import { OverworldItemManager } from '../../src/world/OverworldItemManager';
import type { GridEntity, MapData } from '../../src/types/game';

describe('Issue #51 — union_cave_1f (17, 3) cave entrance walk-in vs exit threshold', () => {
  const uc1fPath = path.resolve(__dirname, '../../public/assets/data/maps/union_cave_1f.json');
  const uc1fData: MapData = JSON.parse(fs.readFileSync(uc1fPath, 'utf8'));

  function createHarness(heldDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null) {
    const mapManager = new MapManager();
    (mapManager as any).maps.set('union_cave_1f', uc1fData);
    mapManager.setCurrentMap('union_cave_1f');

    const player: GridEntity = {
      id: 'player',
      x: 17,
      y: 3,
      gridX: 17,
      gridY: 3,
      targetX: 17,
      targetY: 3,
      renderX: 17,
      renderY: 3,
      direction: 'DOWN',
      isMoving: false,
      progress: 0,
      speed: 4,
      turnDelayTimer: 0,
    };

    const executeWarpTransition = vi.fn().mockResolvedValue(undefined);
    const ctx: any = {
      gameClock: {
        tick: (dt: number) => ({ dtWorld: dt, dtPlayer: dt }),
        getTimeOfDay: () => 'DAY',
      },
      getGameState: () => 'OVERWORLD',
      isCutsceneLocked: () => false,
      mapManager,
      overworldRenderer: {
        updateAmbientLighting: vi.fn(),
        spawnGrassRustle: vi.fn(),
        update: vi.fn(),
      },
      overworldHUD: {
        consumePendingTouchTurnDirection: () => null,
        setPlayerDirection: vi.fn(),
        getHeldDirection: () => heldDir,
        isDialogueOpen: () => false,
        openDialogue: vi.fn(),
        showToast: vi.fn(),
      },
      player,
      getActiveMapNpcs: () => [],
      populateWorldNpcs: () => [],
      handleMapTransition: vi.fn(),
      executeWarpTransition,
      runTrainerSightSequence: vi.fn(),
      triggerSlowpokeWellGruntIntercept: vi.fn(),
      triggerBeastsAwakeningCutscene: vi.fn(),
      triggerBurnedTowerRivalBattle: vi.fn(),
      triggerCherrygroveRivalAmbush: vi.fn(),
      triggerAzaleaRivalAmbush: vi.fn(),
      saveCurrentGame: vi.fn(),
      triggerWildEncounter: vi.fn(),
      addPlayTimeDelta: vi.fn(),
      overworldItemManager: new OverworldItemManager(),
      storyFlags: new Set<string>(),
      itemfinderHUD: { isActive: () => false },
      dayCareManager: { step: () => ({ eggReadyJustNow: false }) },
      playerParty: [],
      seenSpecies: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      roamingManager: { getActiveRoamerOnRoute: () => undefined },
      inventory: { money: 3000, badges: ['zephyr'] },
    };

    return { player, executeWarpTransition, ctx };
  }

  it('does NOT teleport player back to route_32 when pressing LEFT at union_cave_1f (17, 3) and allows walking into (16, 3)', () => {
    const { player, executeWarpTransition, ctx } = createHarness('LEFT');

    // Tick 1: turns in place from DOWN to LEFT
    OverworldTickerCoordinator.updateOverworldTick(0.016, ctx);
    expect(executeWarpTransition).not.toHaveBeenCalled();
    expect(player.direction).toBe('LEFT');

    // Tick 2: advances past turn delay and begins walking LEFT onto (16, 3)
    OverworldTickerCoordinator.updateOverworldTick(0.1, ctx);
    OverworldTickerCoordinator.updateOverworldTick(0.05, ctx);
    expect(executeWarpTransition).not.toHaveBeenCalled();
    expect(player.targetX).toBe(16);
    expect(player.targetY).toBe(3);
  });

  it('does NOT teleport player back to route_32 when pressing UP at union_cave_1f (17, 3) and allows walking into (17, 2)', () => {
    const { player, executeWarpTransition, ctx } = createHarness('UP');

    OverworldTickerCoordinator.updateOverworldTick(0.016, ctx);
    expect(executeWarpTransition).not.toHaveBeenCalled();
    expect(player.direction).toBe('UP');

    OverworldTickerCoordinator.updateOverworldTick(0.1, ctx);
    OverworldTickerCoordinator.updateOverworldTick(0.05, ctx);
    expect(executeWarpTransition).not.toHaveBeenCalled();
    expect(player.targetX).toBe(17);
    expect(player.targetY).toBe(2);
  });

  it('does NOT teleport player back to route_32 when pressing RIGHT into the east cave wall at (17, 3)', () => {
    const { executeWarpTransition, ctx } = createHarness('RIGHT');

    OverworldTickerCoordinator.updateOverworldTick(0.016, ctx);
    OverworldTickerCoordinator.updateOverworldTick(0.1, ctx);
    expect(executeWarpTransition).not.toHaveBeenCalled();
  });

  it('DOES teleport player back to route_32 when pressing DOWN into the south cave exit archway at (17, 3)', () => {
    const { executeWarpTransition, ctx } = createHarness('DOWN');

    OverworldTickerCoordinator.updateOverworldTick(0.016, ctx);
    expect(executeWarpTransition).toHaveBeenCalledTimes(1);
    expect(executeWarpTransition.mock.calls[0][0].targetMapId).toBe('route_32');
  });
});
