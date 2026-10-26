import type { Direction, MapData, WarpEvent } from '../types/game';
import type { GridEntity } from './GridPhysics';
import { MapManager } from './MapManager';
import { OverworldItemManager } from './OverworldItemManager';
import { applyMapNpcStoryMutations } from './npcData';
import { BattleAudio } from '../audio/BattleAudio';
import type { OverworldTransitionContext } from '../types/gameContext';

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
      if (map.tileMap) {
        map.tileMap[25 * map.width + 8] = 'in_forest_05_05_05_05';
      }
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

      // Prefetch newly connected neighbor maps in the background and maintain resident LRU cap
      void this.ensureMapAndNeighborsLoaded(ctx, nextMapId).then((loadedMap) => {
        if (loadedMap) {
          mapManager.evictDistantMaps(nextMapId, 16);
          activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(nextMapId));
          overworldRenderer.evictDistantTileTextures(loadedMap, lookupMap);
        }
      });

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

    if (warp.targetMapId === 'azalea_gym' && !storyFlags.has('slowpoke_well_cleared')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
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
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          "ROCKET GRUNT: Beat it, kid! SLOWPOKE WELL is off-limits today! We're busy collecting... er, doing maintenance!",
        ],
        '⚡ ROCKET GRUNT'
      );
      return;
    }

    if (
      warp.targetMapId === 'ruins_of_alph_inner_chamber' &&
      !storyFlags.has('unown_awakened_kabuto')
    ) {
      // The stone floor has not collapsed into a trapdoor hole yet
      return;
    }

    if (warp.targetMapId === 'ecruteak_gym' && !storyFlags.has('beasts_awakened')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          'The GYM door is firmly locked!',
          'A note on the door reads: "LEADER MORTY is currently investigating ancient phenomena at the BURNED TOWER."',
        ],
        '🔒 ECRUTEAK GYM'
      );
      return;
    }

    if (
      warp.targetMapId === 'burned_tower_b1f' &&
      !storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')
    ) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        [
          "SILVER: Hey, hold it right there! You're not going down that hole before me!",
        ],
        '❓ RIVAL SILVER'
      );
      return;
    }

    if (
      currentM.id === 'azalea_town' &&
      warp.targetMapId === 'ilex_forest' &&
      !storyFlags.has('azalea_rival_defeated')
    ) {
      player.isMoving = false;
      player.progress = 0;
      if (!storyFlags.has('slowpoke_well_cleared') && !storyFlags.has('bugsy_defeated')) {
        setCutsceneLocked(false);
        BattleAudio.playMenuSound('CANCEL');
        overworldHUD.openDialogue(
          [
            'TEAM ROCKET is causing a commotion in AZALEA TOWN!',
            'Visit KURT in his house and help clear SLOWPOKE WELL before venturing into ILEX FOREST!',
          ],
          '🌲 ILEX FOREST GATE'
        );
        return;
      }
      triggerAzaleaRivalAmbush();
      return;
    }

    // Elite Four Chambers & Tin Tower Progression Gating
    if (warp.targetMapId === 'wills_room' && (inventory.badges.length < 8 && !storyFlags.has('clair_defeated'))) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['GUARD: You cannot challenge the ELITE FOUR until you have conquered all 8 JOHTO GYMS and earned their BADGES!'],
        '👮 LEAGUE GUARD'
      );
      return;
    }

    if (warp.targetMapId === 'kogas_room' && !storyFlags.has('will_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR WILL to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'brunos_room' && !storyFlags.has('koga_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR KOGA to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'karens_room' && !storyFlags.has('bruno_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the next chamber remains firmly shut! Defeat ELITE FOUR BRUNO to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'lances_room' && !storyFlags.has('karen_defeated')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['The door to the CHAMPION\'S chamber remains firmly shut! Defeat ELITE FOUR KAREN to proceed!'],
        '🔒 CHAMBER DOOR'
      );
      return;
    }

    if (warp.targetMapId === 'tin_tower_1f' && !storyFlags.has('has_clear_bell') && !storyFlags.has('radio_tower_liberated')) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['WISE SAGE: Tin Tower is forbidden to all unless they bear the sacred CLEAR BELL!'],
        '🏮 WISE SAGE'
      );
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
        missionManager.registerMapEntry(targetMap.id, storyFlags);
        this.resetMapNpcsToOrigin(ctx, targetMap.id);
        if (targetMap.id.endsWith('_poke_center')) {
          setLastVisitedPokecenter({
            mapId: targetMap.id,
            x: transitionConfig.landingX,
            y: Math.max(2, transitionConfig.landingY - 1),
          });
        }
        player.direction = transitionConfig.landingFacing;
        player.x = transitionConfig.landingX;
        player.y = transitionConfig.landingY;
        player.targetX = transitionConfig.landingX;
        player.targetY = transitionConfig.landingY;
        player.renderX = transitionConfig.landingX;
        player.renderY = transitionConfig.landingY;

        // Strictly await 100% texture hydration while transition veil is 100% black (BUGFIX-ASYNC-TILE-TEXTURE-FADE-SYNC-01)
        await overworldRenderer.ensureMapTilesLoaded(targetMap, lookupMap);
        this.applyMapStoryMutations(ctx, targetMap);
        overworldRenderer.renderMap(targetMap, lookupMap);
        overworldRenderer.evictDistantTileTextures(targetMap, lookupMap);
        mapManager.evictDistantMaps(targetMap.id, 16);
        activeNpcCache.evictMapsNotIn(mapManager.getProtectedMapIds(targetMap.id));
        this.syncMapOverworldItems(ctx, targetMap);
        overworldHUD.updateRouteName(targetMap.name);
        audioManager.playMapBgm(targetMap.id, 0.8);
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
        }
      });
  }

  public static handleRuinsPuzzleSolve(
    ctx: OverworldTransitionContext,
    _puzzleId: string
  ): void {
    const { storyFlags, overworldHUD, triggerCanvasEarthquake } = ctx;

    storyFlags.add('unown_awakened_kabuto');
    storyFlags.add('EVENT_SOLVED_KABUTO_PUZZLE');
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
