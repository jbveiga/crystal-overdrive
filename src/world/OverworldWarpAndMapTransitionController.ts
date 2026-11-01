/**
 * @fileoverview Coordinates map transitions, door/cave warps, veil fading, and reciprocal landing positioning.
 * @module world/OverworldWarpAndMapTransitionController
 * @role Overworld Warp & Transition Controller
 * @exports OverworldWarpAndMapTransitionController
 * @layer world
 * @sections L1-7: Micro-Header & Types | L8-328: Core Implementation | L329-656: Public Interface & Exports
 */

import type { Direction, MapData, WarpEvent } from '../types/game';
import type { GridEntity } from './GridPhysics';
import { MapManager } from './MapManager';
import { OverworldItemManager } from './OverworldItemManager';
import { applyMapNpcStoryMutations } from './npcData';
import { BattleAudio } from '../audio/BattleAudio';
import { checkHasAllJohtoBadges } from './interactions/VictoryRoadGateInteractions';
import { evaluateFastShipWarp } from './interactions/FastShipAndVermilionInteractions';
import type { OverworldTransitionContext } from '../types/gameContext';
import { evaluateWarpProgressionGuards } from './OverworldWarpProgressionGuards';
import { TwoPointWarpLinkRegistry } from './map/TwoPointWarpLinkRegistry';
import { resolveCurrentLandmark } from './map/townMapResolvers';

export class OverworldWarpAndMapTransitionController {
  private static worldNpcsScratch: GridEntity[] = [];

  public static async ensureMapAndNeighborsLoaded(
    ctx: OverworldTransitionContext,
    targetId: string
  ): Promise<MapData | undefined> {
    return ctx.mapManager.ensureZoneAndConnectionsLoaded(targetId);
  }

  public static resetMapNpcsToOrigin(
    ctx: OverworldTransitionContext,
    mapId: string
  ): void {
    if (ctx.npcsByMap[mapId]) {
      ctx.npcsByMap[mapId] = applyMapNpcStoryMutations(
        mapId,
        ctx.npcsByMap[mapId],
        ctx.storyFlags,
        ctx.defeatedTrainers
      );
    }
    ctx.activeNpcCache.invalidate(mapId);
  }

  public static applyMapStoryMutations(ctx: OverworldTransitionContext, map: MapData | null): void {
    if (!map) return;
    if (map.id === 'ilex_forest' && ctx.storyFlags.has('ilex_tree_cut')) {
      map.collisionGrid[25 * map.width + 8] = 0;
      if (map.tileMap) map.tileMap[25 * map.width + 8] = 'in_forest_05_05_05_05';
    }
    if (map.id === 'team_rocket_base_b3f' && ctx.storyFlags.has('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE')) {
      map.collisionGrid[9 * map.width + 10] = 0; map.collisionGrid[9 * map.width + 11] = 0;
    }
    if (map.id === 'team_rocket_base_b2f' && ctx.storyFlags.has('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER')) {
      map.collisionGrid[12 * map.width + 14] = 0; map.collisionGrid[12 * map.width + 15] = 0;
    }
    if (map.id === 'route_41') {
      const whirlpoolCoords = [[12, 17], [36, 19], [12, 37], [36, 45]];
      for (const [wx, wy] of whirlpoolCoords) {
        map.collisionGrid[wy * map.width + wx] = ctx.storyFlags.has(`whirlpool_cleared_${wx}_${wy}`) ? 3 : 1;
      }
    }
    if (map.id === 'vermilion_gym') {
      const open = ctx.storyFlags.has('vermilion_gym_barrier_open') || ctx.storyFlags.has('surge_defeated');
      map.collisionGrid[4 * map.width + 4] = open ? 0 : 1; map.collisionGrid[4 * map.width + 5] = open ? 0 : 1;
    } else if (map.id === 'vermilion_city') {
      map.collisionGrid[20 * map.width + 10] = ctx.storyFlags.has('vermilion_cut_tree_cleared') ? 0 : 1;
    } else if (map.id === 'celadon_city') {
      map.collisionGrid[31 * map.width + 10] = ctx.storyFlags.has('celadon_cut_tree_cleared') ? 0 : 1;
    }
  }

  public static syncMapOverworldItems(
    ctx: OverworldTransitionContext,
    map: MapData | null
  ): void {
    if (!map) return;
    this.applyMapStoryMutations(ctx, map);
    const itemBalls = [...ctx.overworldItemManager.getActiveItemBalls(map.id)];
    if (map.id === 'elms_lab') {
      itemBalls.push(
        ...OverworldItemManager.getStarterBallsForLab(
          ctx.storyFlags,
          ctx.detectChosenStarterSpecies()
        )
      );
    }
    ctx.overworldRenderer.renderOverworldItems?.(
      itemBalls,
      ctx.overworldItemManager.getFruitTreesForMap(map.id),
      new Set(ctx.overworldItemManager.getHarvestedTreeIds())
    );
  }

  public static populateWorldNpcs(
    ctx: OverworldTransitionContext,
    map: MapData | null
  ): GridEntity[] {
    const scratch = this.worldNpcsScratch;
    scratch.length = 0;
    if (!map) return scratch;

    const currentList = ctx.getActiveMapNpcs(map.id);
    for (let i = 0; i < currentList.length; i++) {
      const n = currentList[i];
      n.worldOffsetX = 0;
      n.worldOffsetY = 0;
      scratch.push(n);
    }

    if (map.connections.WEST) {
      const conn = map.connections.WEST;
      const westMap = ctx.mapManager.getMap(conn.mapId);
      if (westMap) {
        const westList = ctx.getActiveMapNpcs(westMap.id);
        for (let i = 0; i < westList.length; i++) {
          const n = westList[i];
          n.worldOffsetX = -westMap.width;
          n.worldOffsetY = conn.offset;
          scratch.push(n);
        }
      }
    }

    if (map.connections.EAST) {
      const conn = map.connections.EAST;
      const eastMap = ctx.mapManager.getMap(conn.mapId);
      if (eastMap) {
        const eastList = ctx.getActiveMapNpcs(eastMap.id);
        for (let i = 0; i < eastList.length; i++) {
          const n = eastList[i];
          n.worldOffsetX = map.width;
          n.worldOffsetY = conn.offset;
          scratch.push(n);
        }
      }
    }

    if (map.connections.NORTH) {
      const conn = map.connections.NORTH;
      const northMap = ctx.mapManager.getMap(conn.mapId);
      if (northMap) {
        const northList = ctx.getActiveMapNpcs(northMap.id);
        for (let i = 0; i < northList.length; i++) {
          const n = northList[i];
          n.worldOffsetX = conn.offset;
          n.worldOffsetY = -northMap.height;
          scratch.push(n);
        }
      }
    }

    if (map.connections.SOUTH) {
      const conn = map.connections.SOUTH;
      const southMap = ctx.mapManager.getMap(conn.mapId);
      if (southMap) {
        const southList = ctx.getActiveMapNpcs(southMap.id);
        for (let i = 0; i < southList.length; i++) {
          const n = southList[i];
          n.worldOffsetX = conn.offset;
          n.worldOffsetY = map.height;
          scratch.push(n);
        }
      }
    }

    return scratch;
  }

  public static handleMapTransition(
    ctx: OverworldTransitionContext,
    entity: GridEntity
  ): void {
    const {
      mapManager,
      playerParty,
      playerName,
      overworldHUD,
      lookupMap,
      overworldRenderer,
      visitedMaps,
      missionManager,
      storyFlags,
      roamingManager,
      eventBus,
      audioManager,
      activeNpcCache,
      saveCurrentGame,
      npcsByMap,
      defeatedTrainers,
      overworldItemManager,
      detectChosenStarterSpecies,
    } = ctx;

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
      ctx.adjacentMapPrefetcher?.recordTransitionLookup(conn.mapId);
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = nextMap.width - 1;
      targetY -= conn.offset;
      this.applyMapStoryMutations(ctx, nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      this.syncMapOverworldItems(ctx, nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning East
    else if (entity.x >= current.width && current.connections.EAST) {
      const conn = current.connections.EAST;
      nextMapId = conn.mapId;
      ctx.adjacentMapPrefetcher?.recordTransitionLookup(conn.mapId);
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX = 0;
      targetY -= conn.offset;
      this.applyMapStoryMutations(ctx, nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      this.syncMapOverworldItems(ctx, nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning North
    else if (entity.y < 0 && current.connections.NORTH) {
      const conn = current.connections.NORTH;
      nextMapId = conn.mapId;
      ctx.adjacentMapPrefetcher?.recordTransitionLookup(conn.mapId);
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX -= conn.offset;
      targetY = nextMap.height - 1;
      this.applyMapStoryMutations(ctx, nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      this.syncMapOverworldItems(ctx, nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }
    // Transitioning South
    else if (entity.y >= current.height && current.connections.SOUTH) {
      const conn = current.connections.SOUTH;
      nextMapId = conn.mapId;
      ctx.adjacentMapPrefetcher?.recordTransitionLookup(conn.mapId);
      const nextMap = mapManager.setCurrentMap(conn.mapId);
      targetX -= conn.offset;
      targetY = 0;
      this.applyMapStoryMutations(ctx, nextMap);
      overworldRenderer.renderMap(nextMap, lookupMap);
      this.syncMapOverworldItems(ctx, nextMap);
      overworldHUD.updateRouteName(nextMap.name);
    }

    if (nextMapId) {
      visitedMaps.add(nextMapId);
      const landmark = resolveCurrentLandmark(nextMapId);
      if (landmark) visitedMaps.add(landmark.id);
      missionManager.registerMapEntry(nextMapId, storyFlags);
      this.resetMapNpcsToOrigin(ctx, nextMapId);
      const nextMapObj = mapManager.getMap(nextMapId);
      if (nextMapObj) {
        overworldRenderer.evictDistantTileTextures(nextMapObj, lookupMap);
      }
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

      // Prefetch newly connected neighbor maps in the background and re-render if any neighbor was missing
      void this.ensureMapAndNeighborsLoaded(ctx, nextMapId).then(async (loadedMap) => {
        if (loadedMap) {
          mapManager.evictDistantMaps(nextMapId, 16);
          activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(nextMapId));
          overworldRenderer.evictDistantTileTextures(loadedMap, lookupMap);
          await overworldRenderer.ensureMapTilesLoaded(loadedMap, lookupMap);
          // If the player remains on this map, re-render to stitch newly resolved neighbors seamlessly
          if (mapManager.getCurrentMap()?.id === nextMapId) {
            overworldRenderer.renderMap(loadedMap, lookupMap);
          }
        }
      });
      void ctx.adjacentMapPrefetcher?.prefetchAroundMap(nextMapId);

      // Reset 4-step grace period on route transition
      mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);

      // Autosave on route transition
      saveCurrentGame();
    }
  }

  public static async executeWarpTransition(
    ctx: OverworldTransitionContext,
    warp: WarpEvent
  ): Promise<void> {
    const {
      mapManager,
      storyFlags,
      player,
      setCutsceneLocked,
      overworldHUD,
      inventory,
      triggerAzaleaRivalAmbush,
      visitedMaps,
      missionManager,
      npcsByMap,
      defeatedTrainers,
      activeNpcCache,
      lookupMap,
      overworldRenderer,
      audioManager,
      saveCurrentGame,
      setLastVisitedPokecenter,
    } = ctx;

    const currentM = mapManager.getCurrentMap();
    if (!currentM) return;

    ctx.adjacentMapPrefetcher?.recordTransitionLookup(warp.targetMapId);

    let targetMapExists = mapManager.getMap(warp.targetMapId);
    if (!targetMapExists) {
      targetMapExists = await this.ensureMapAndNeighborsLoaded(ctx, warp.targetMapId);
    }
    if (!targetMapExists) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
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

    if (evaluateWarpProgressionGuards(ctx, currentM, warp)) {
      return;
    }

    const previousMapId = currentM.id;
    const transitionConfig = mapManager.resolveWarpTransition(warp);

    player.isMoving = false;
    player.progress = 0;
    setCutsceneLocked(true);
    BattleAudio.playWarpSound(transitionConfig.soundCue);

    overworldRenderer
      .playDoorwayFade(async () => {
        await this.ensureMapAndNeighborsLoaded(ctx, transitionConfig.targetMapId);
        const targetMap = mapManager.setCurrentMap(transitionConfig.targetMapId);
        visitedMaps.add(targetMap.id);
        const landmark = resolveCurrentLandmark(targetMap.id);
        if (landmark) visitedMaps.add(landmark.id);
        missionManager.registerMapEntry(targetMap.id, storyFlags);
        this.resetMapNpcsToOrigin(ctx, targetMap.id);
        if (targetMap.id.endsWith('_poke_center')) {
          setLastVisitedPokecenter({
            mapId: targetMap.id,
            x: transitionConfig.landingX,
            y: Math.max(2, transitionConfig.landingY - 1),
          });
        }
        TwoPointWarpLinkRegistry.registerMapLinks(currentM);
        TwoPointWarpLinkRegistry.registerMapLinks(targetMap);
        TwoPointWarpLinkRegistry.applyTeleportPreservingPlayerState(player, transitionConfig);

        // Strictly await 100% texture hydration while transition veil is 100% black (BUGFIX-ASYNC-TILE-TEXTURE-FADE-SYNC-01)
        await overworldRenderer.ensureMapTilesLoaded(targetMap, lookupMap);
        this.applyMapStoryMutations(ctx, targetMap);
        overworldRenderer.renderMap(targetMap, lookupMap);
        overworldRenderer.evictDistantTileTextures(targetMap, lookupMap);
        mapManager.evictDistantMaps(targetMap.id, 16);
        activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(targetMap.id));
        this.syncMapOverworldItems(ctx, targetMap);
        overworldHUD.updateRouteName(targetMap.name);
        const roamerOnTarget = ctx.roamingManager?.getActiveRoamerOnRoute(targetMap.id);
        if (roamerOnTarget) overworldHUD.showRoamerAlert(roamerOnTarget.speciesId, targetMap.id);
        else overworldHUD.hideRoamerAlert();
        audioManager.playMapBgm(targetMap.id, 0.8);
        void ctx.adjacentMapPrefetcher?.prefetchAroundMap(targetMap.id);
      }, transitionConfig.fadeDurationMs)
      .then(() => {
        setCutsceneLocked(false);

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
        } else if (
          storyFlags.has('has_rising_badge') &&
          !storyFlags.has('ELM_CALLED_MASTER_BALL')
        ) {
          storyFlags.add('ELM_CALLED_MASTER_BALL');
          BattleAudio.playOverworldSound('PHONE_RING');
          overworldHUD.openDialogue(
            [
              '📻 *BEEP! BEEP! Your POKéGEAR is ringing!*',
              'PROF. ELM: Hello! GOLD? I heard from CLAIR in BLACKTHORN CITY!',
              'You conquered the DRAGON DEN and earned all 8 JOHTO BADGES!',
              'Please come see me at the LAB in NEW BARK TOWN. I have something special for you!',
            ],
            '📻 PROF. ELM (POKéGEAR)',
            () => {
              saveCurrentGame();
            }
          );
        }
      });
  }

  public static handleRuinsPuzzleSolve(
    ctx: OverworldTransitionContext,
    puzzleId: string
  ): void {
    const { storyFlags, overworldHUD, triggerCanvasEarthquake } = ctx;

    const normId = (puzzleId || 'kabuto').toLowerCase();
    storyFlags.add(`unown_awakened_${normId}`);
    storyFlags.add(`EVENT_SOLVED_${normId.toUpperCase()}_PUZZLE`);
    storyFlags.add('EVENT_MADE_UNOWN_APPEAR_IN_RUINS');

    // Trigger Screen shake tremor via delegate to preserve layer purity
    triggerCanvasEarthquake?.();
    BattleAudio.playWarpSound('CAVE_WARP');

    overworldHUD.openDialogue(
      [
        'The ancient stone tiles clicked perfectly into place!',
        'A rumbling tremor shakes the chamber!',
        'The stone floor collapsed beneath your feet!',
      ],
      '🏛️ RUINS OF ALPH',
      () => {
        void this.executeWarpTransition(
          ctx,
          {
            x: 4,
            y: 6,
            targetMapId: 'ruins_of_alph_inner_chamber',
            targetX: 10,
            targetY: 11,
          }
        );
      }
    );
  }

  public static async respawnAtLastPokecenter(
    ctx: OverworldTransitionContext,
    lastVisitedPokecenter: { mapId: string; x: number; y: number },
    audioManager: any,
    itemfinderHUD: any,
    healPlayerParty: (playAnim?: boolean) => void
  ): Promise<void> {
    const { mapManager, player, overworldRenderer, overworldHUD, playerParty, saveCurrentGame } = ctx;
    ctx.setCutsceneLocked(false);
    const lookupMap = (id: string) => mapManager.getMap(id);
    const respawnMapId = mapManager.getMap(lastVisitedPokecenter.mapId) ? lastVisitedPokecenter.mapId : 'new_bark_town';
    const respawnMap = mapManager.setCurrentMap(respawnMapId);
    player.x = player.targetX = player.renderX = lastVisitedPokecenter.x;
    player.y = player.targetY = player.renderY = lastVisitedPokecenter.y;
    player.direction = 'DOWN';
    player.isMoving = false;
    player.progress = 0;
    await overworldRenderer.ensureMapTilesLoaded(respawnMap, lookupMap);
    overworldRenderer.renderMap(respawnMap, lookupMap);
    OverworldWarpAndMapTransitionController.syncMapOverworldItems(ctx, respawnMap);
    overworldHUD.updateRouteName(respawnMap.name);
    audioManager.playMapBgm(respawnMap.id, 0.8);
    overworldHUD.show?.();
    itemfinderHUD.resume();
    healPlayerParty(false);
    await saveCurrentGame();
    if (respawnMap.id.endsWith('_poke_center')) {
      overworldHUD.playHealingAnimation?.(playerParty.length, () =>
        overworldHUD.showToast?.('💖 Your party was restored to full HP & PP at the Pokémon Center!')
      );
    } else {
      overworldHUD.playFieldRestAnimation?.(() =>
        overworldHUD.showToast?.('💖 Your party was restored to full HP & PP at home!')
      );
    }
  }
}
