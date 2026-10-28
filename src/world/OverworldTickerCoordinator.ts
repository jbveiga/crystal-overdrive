/**
 * @fileoverview Main overworld frame ticker coordinator managing player physics, wild encounters, and trainer sight.
 * @module world/OverworldTickerCoordinator
 * @role Overworld Frame Loop Coordinator
 * @exports OverworldTickerCoordinator
 * @layer world
 * @sections L1-7: Micro-Header & Types | L8-281: Core Implementation | L282-562: Public Interface & Exports
 */

import type { GridEntity } from './GridPhysics';
import type { Direction } from '../types/game';
import { GridPhysics } from './GridPhysics';
import { MapManager } from './MapManager';
import { BattleAudio } from '../audio/BattleAudio';
import { PokemonFactory } from '../battle/PokemonFactory';
import { ItemfinderRadar } from '../world/ItemfinderRadar';
import { isEcruteakGymSafeTile, ECRUTEAK_GYM_RESPAWN } from './ecruteakGymMaze';
import type { OverworldTickerContext } from '../types/gameContext';

export class OverworldTickerCoordinator {
  private static lastBumpSoundTime = 0;
  private static npcMoveTimer = 0;
  private static directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  private static npcObstaclesScratch: GridEntity[] = [];
  private static emptyNpcs: GridEntity[] = [];

  public static handlePlayerBump(): void {
    const now = performance.now();
    if (now - this.lastBumpSoundTime > 260) {
      this.lastBumpSoundTime = now;
      BattleAudio.playOverworldSound('BUMP');
    }
  }

  public static isTileWalkableForPlayer(
    x: number,
    y: number,
    mapManager: MapManager,
    overworldItemManager: any,
    storyFlags: Set<string>
  ): boolean {
    if (!mapManager.isWalkable(x, y)) return false;
    const activeMap = mapManager.getCurrentMap();
    if (activeMap && overworldItemManager.isSolidObstacle(activeMap.id, x, y, storyFlags)) {
      return false;
    }
    return true;
  }

  public static isTileWalkableForActiveMapNpc(
    x: number,
    y: number,
    mapManager: MapManager,
    overworldItemManager: any,
    storyFlags: Set<string>
  ): boolean {
    if (!mapManager.isWalkableInBounds(x, y)) return false;
    const activeMap = mapManager.getCurrentMap();
    if (activeMap && overworldItemManager.isSolidObstacle(activeMap.id, x, y, storyFlags)) {
      return false;
    }
    return true;
  }

  public static refreshItemfinderRadar(
    playSonar: boolean,
    ctx: {
      itemfinderHUD: any;
      mapManager: MapManager;
      overworldItemManager: any;
      storyFlags: Set<string>;
      player: GridEntity;
    }
  ): void {
    const { itemfinderHUD, mapManager, overworldItemManager, storyFlags, player } = ctx;
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
  }

  public static toggleLiveItemfinderRadar(ctx: {
    getGameState: () => string;
    isCutsceneLocked: () => boolean;
    overworldHUD: any;
    itemfinderHUD: any;
    mapManager: MapManager;
    overworldItemManager: any;
    storyFlags: Set<string>;
    player: GridEntity;
  }): boolean {
    const {
      getGameState,
      isCutsceneLocked,
      overworldHUD,
      itemfinderHUD,
    } = ctx;

    if (getGameState() !== 'OVERWORLD' || isCutsceneLocked() || overworldHUD.isDialogueOpen()) {
      return itemfinderHUD.isActive();
    }
    const active = itemfinderHUD.toggle();
    overworldHUD.updateRadarDisplay(active);
    if (active) {
      this.refreshItemfinderRadar(true, ctx);
      const ping = itemfinderHUD.getLastPing();
      if (!ping?.hasItemInRange) {
        BattleAudio.playItemfinderSonar(null, false);
      }
    } else {
      BattleAudio.playMenuSound('CANCEL');
    }
    return active;
  }

  public static triggerItemfinderScan(ctx: {
    getGameState: () => string;
    isCutsceneLocked: () => boolean;
    overworldHUD: any;
    itemfinderHUD: any;
    mapManager: MapManager;
    overworldItemManager: any;
    storyFlags: Set<string>;
    player: GridEntity;
  }): void {
    const {
      getGameState,
      isCutsceneLocked,
      overworldHUD,
      itemfinderHUD,
      mapManager,
      overworldItemManager,
      storyFlags,
      player,
    } = ctx;

    if (getGameState() !== 'OVERWORLD' || isCutsceneLocked() || overworldHUD.isDialogueOpen()) return;
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
  }

  public static stepNeighborNpcs(
    neighborMapId: string | undefined,
    triggerNewWanderStep: boolean,
    dtWorld: number,
    mapManager: MapManager,
    getActiveMapNpcs: (id: string) => GridEntity[]
  ): void {
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
          ? this.directions[Math.floor(Math.random() * 4)]
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
  }

  public static updateOverworldTick(
    rawDeltaSec: number,
    ctx: OverworldTickerContext & {
      dayCareManager: any;
      playerParty: any[];
      seenSpecies: Set<string>;
      defeatedTrainers: Set<string>;
      overworldRenderer: any;
    }
  ): void {
    const {
      getGameState,
      isCutsceneLocked,
      player,
      mapManager,
      gameClock,
      overworldRenderer,
      overworldHUD,
      getActiveMapNpcs,
      populateWorldNpcs,
      handleMapTransition,
      executeWarpTransition,
      runTrainerSightSequence,
      triggerSlowpokeWellGruntIntercept,
      triggerBeastsAwakeningCutscene,
      triggerBurnedTowerRivalBattle,
      triggerCherrygroveRivalAmbush,
      triggerAzaleaRivalAmbush,
      triggerOlivineRivalConfrontation,
      triggerCianwoodSuicuneAndEusine,
      triggerRoute42Suicune,
      saveCurrentGame,
      triggerWildEncounter,
      addPlayTimeDelta,
      overworldItemManager,
      storyFlags,
      itemfinderHUD,
      dayCareManager,
      playerParty,
      seenSpecies,
      defeatedTrainers,
      roamingManager,
    } = ctx as any;

    const { dtWorld, dtPlayer } = gameClock.tick(rawDeltaSec);
    if (getGameState() !== 'TITLE') {
      addPlayTimeDelta(dtWorld);
    }
    const currentMap = mapManager.getCurrentMap();
    const isOutdoor = mapManager.isCurrentMapOutdoor();
    const currentTimeOfDay = gameClock.getTimeOfDay();
    overworldRenderer.updateAmbientLighting(currentTimeOfDay, isOutdoor);

    if (getGameState() === 'OVERWORLD') {
      // Active NPCs on this map retrieved via memoized cache (zero per-frame array allocation)
      const activeNpcs = currentMap ? getActiveMapNpcs(currentMap.id) : this.emptyNpcs;
      const heldDir = isCutsceneLocked() ? null : overworldHUD.getHeldDirection();

      GridPhysics.updateEntity(
        player,
        dtPlayer,
        heldDir,
        (x, y) => this.isTileWalkableForPlayer(x, y, mapManager, overworldItemManager, storyFlags),
        mapManager.getTileType,
        (_entity, coord, tileType) => {
          handleMapTransition(player);

          // Check Building Door Warps with smooth fade & Safe Warp Interceptor
          const warp = mapManager.checkWarp(coord);
          if (warp) {
            const reqDir = currentMap ? MapManager.getRequiredWarpDirection(warp, currentMap) : null;
            if (reqDir && player.direction !== reqDir) {
              return;
            }

            void executeWarpTransition(warp);
            return;
          }

          // Goldenrod Dept. Store Elevator Step Trigger
          if (
            currentMap?.id.startsWith('goldenrod_dept_store_') &&
            currentMap.id !== 'goldenrod_dept_store_roof' &&
            coord.x === 2 &&
            coord.y === 0
          ) {
            ctx.openDeptElevatorModal?.(currentMap.id, (targetMapId) => {
              if (targetMapId !== currentMap.id) {
                void executeWarpTransition({
                  x: player.x,
                  y: player.y,
                  targetMapId,
                  targetX: targetMapId === 'goldenrod_dept_store_roof' ? 13 : 2,
                  targetY: targetMapId === 'goldenrod_dept_store_roof' ? 2 : 1,
                  direction: 'DOWN',
                });
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

          // Olivine City Rival Confrontation
          if (
            currentMap?.id === 'olivine_city' &&
            coord.x === 13 &&
            (coord.y === 12 || coord.y === 13) &&
            !storyFlags.has('EVENT_RIVAL_OLIVINE_CITY') &&
            triggerOlivineRivalConfrontation
          ) {
            triggerOlivineRivalConfrontation();
            return;
          }

          // Cianwood City Suicune & Eusine Encounter
          if (
            currentMap?.id === 'cianwood_city' &&
            coord.x === 11 &&
            coord.y === 16 &&
            !storyFlags.has('EVENT_FOUGHT_EUSINE') &&
            triggerCianwoodSuicuneAndEusine
          ) {
            triggerCianwoodSuicuneAndEusine();
            return;
          }

          // Route 42 Suicune Sprint
          if (
            currentMap?.id === 'route_42' &&
            coord.x === 24 &&
            coord.y === 14 &&
            !storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_42') &&
            triggerRoute42Suicune
          ) {
            triggerRoute42Suicune();
            return;
          }

          // Slowpoke Well B1F: First Team Rocket Grunt Intercept
          if (
            currentMap?.id === 'slowpoke_well_b1f' &&
            (coord.x === 14 || coord.x === 15) &&
            coord.y <= 10 &&
            !defeatedTrainers.has('rocket_grunt_1') &&
            !storyFlags.has('slowpoke_well_cleared')
          ) {
            const wellNpcs = getActiveMapNpcs('slowpoke_well_b1f');
            const grunt1 = wellNpcs.find((n: GridEntity) => n.id === 'rocket_grunt_1');
            if (grunt1) {
              void triggerSlowpokeWellGruntIntercept(grunt1);
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

          // Live Itemfinder Radar Step Sweep
          if (itemfinderHUD.isActive()) {
            this.refreshItemfinderRadar(true, {
              itemfinderHUD,
              mapManager,
              overworldItemManager,
              storyFlags,
              player,
            });
          }

          // Advance Day-Care growth & egg checks
          dayCareManager.onStepTaken();

          // Step-based Egg Hatching
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
                p.moves = movesToSet.map((m: string) => {
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
          const latestNpcs = latestMap ? getActiveMapNpcs(latestMap.id) : this.emptyNpcs;
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
              void runTrainerSightSequence(spottedTrainer);
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
                const wildPkmn =
                  encounter.isRoamer && roamer
                    ? roamer.pokemon
                    : PokemonFactory.create(encounter.speciesId, encounter.level);
                void triggerWildEncounter(wildPkmn, { isRoamer: encounter.isRoamer });
              }
            }
          }
        },
        activeNpcs,
        () => {
          BattleAudio.playOverworldSound('HOP');
        },
        () => {
          this.handlePlayerBump();
        }
      );

      // Directional Doorway Threshold
      if (!player.isMoving && !isCutsceneLocked() && heldDir && currentMap) {
        const currentTileWarp = mapManager.checkWarp({ x: player.x, y: player.y });
        if (currentTileWarp) {
          const reqDir = MapManager.getRequiredWarpDirection(currentTileWarp, currentMap);
          if (!reqDir || heldDir === reqDir) {
            void executeWarpTransition(currentTileWarp);
          }
        }
      }

      // Update NPCs with dtWorld (strictly 1.0x world speed)
      if (!overworldHUD.isDialogueOpen() && !isCutsceneLocked()) {
        this.npcMoveTimer += dtWorld;
        const triggerNewWanderStep = this.npcMoveTimer > 1.8;
        if (triggerNewWanderStep) {
          this.npcMoveTimer = 0;
        }

        // Populate shared obstacle scratch array with player + all active NPCs (zero allocation)
        this.npcObstaclesScratch.length = 0;
        this.npcObstaclesScratch.push(player);
        for (let i = 0; i < activeNpcs.length; i++) {
          this.npcObstaclesScratch.push(activeNpcs[i]);
        }

        for (let i = 0; i < activeNpcs.length; i++) {
          const npcEntity = activeNpcs[i];
          if (!npcEntity.wanders) continue;

          const desiredDir =
            triggerNewWanderStep && !npcEntity.isMoving && Math.random() < 0.55
              ? this.directions[Math.floor(Math.random() * 4)]
              : null;

          GridPhysics.updateEntity(
            npcEntity,
            dtWorld,
            desiredDir,
            (x, y) => this.isTileWalkableForActiveMapNpc(x, y, mapManager, overworldItemManager, storyFlags),
            mapManager.getTileType,
            undefined,
            this.npcObstaclesScratch
          );
        }

        // Update wandering NPCs on connected neighbor maps
        this.stepNeighborNpcs(currentMap?.connections.WEST?.mapId, triggerNewWanderStep, dtWorld, mapManager, getActiveMapNpcs);
        this.stepNeighborNpcs(currentMap?.connections.EAST?.mapId, triggerNewWanderStep, dtWorld, mapManager, getActiveMapNpcs);
        this.stepNeighborNpcs(currentMap?.connections.NORTH?.mapId, triggerNewWanderStep, dtWorld, mapManager, getActiveMapNpcs);
        this.stepNeighborNpcs(currentMap?.connections.SOUTH?.mapId, triggerNewWanderStep, dtWorld, mapManager, getActiveMapNpcs);
      }

      // Render active & connected map NPCs after any border/warp transitions
      const mapAfterMove = mapManager.getCurrentMap();
      const npcsToRender = populateWorldNpcs(mapAfterMove);
      overworldRenderer.update(player, npcsToRender, dtWorld);
    }
  }
}
