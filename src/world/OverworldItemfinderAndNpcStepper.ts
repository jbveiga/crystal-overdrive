/**
 * @fileoverview OverworldItemfinderAndNpcStepper — Itemfinder radar sweeps, step-triggered Rocket/Mahogany events, and NPC wandering step helpers.
 * @module world/OverworldItemfinderAndNpcStepper
 * @role Overworld Step & NPC Wander Helper
 * @exports OverworldItemfinderAndNpcStepper
 * @layer world
 * @sections L1-20: Micro-Header & Imports | L21-155: Itemfinder & Walkability | L156-345: Step Events & NPC Wandering
 */

import type { GridEntity } from './GridPhysics';
import type { Direction } from '../types/game';
import { GridPhysics } from './GridPhysics';
import { MapManager } from './MapManager';
import { BattleAudio } from '../audio/BattleAudio';
import { PokemonFactory } from '../battle/PokemonFactory';
import { ItemfinderRadar } from './ItemfinderRadar';
import type { OverworldTickerContext } from '../types/gameContext';

export class OverworldItemfinderAndNpcStepper {
  private static directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  public static isTileWalkableForPlayer(
    x: number, y: number, mapManager: MapManager, overworldItemManager: any, storyFlags: Set<string>
  ): boolean {
    if (!mapManager.isWalkable(x, y)) return false;
    const activeMap = mapManager.getCurrentMap();
    if (activeMap && overworldItemManager.isSolidObstacle(activeMap.id, x, y, storyFlags)) {
      return false;
    }
    return true;
  }

  public static isTileWalkableForActiveMapNpc(
    x: number, y: number, mapManager: MapManager, overworldItemManager: any, storyFlags: Set<string>
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
    ctx: { itemfinderHUD: any; mapManager: MapManager; overworldItemManager: any; storyFlags: Set<string>; player: GridEntity }
  ): void {
    const { itemfinderHUD, mapManager, overworldItemManager, storyFlags, player } = ctx;
    if (!itemfinderHUD.isActive()) return;
    const currentMap = mapManager.getCurrentMap();
    if (!currentMap) return;
    const hiddenItems = overworldItemManager.getHiddenItemsForMap(currentMap.id, storyFlags);
    const ping = ItemfinderRadar.scan(player.x, player.y, player.direction, hiddenItems, storyFlags);
    itemfinderHUD.update(ping);
    if (playSonar && ping.hasItemInRange) {
      BattleAudio.playItemfinderSonar(ping.distance, ping.isFacingDirectly);
    }
  }

  public static toggleLiveItemfinderRadar(ctx: {
    getGameState: () => string; isCutsceneLocked: () => boolean; overworldHUD: any;
    itemfinderHUD: any; mapManager: MapManager; overworldItemManager: any; storyFlags: Set<string>; player: GridEntity;
  }): boolean {
    const { getGameState, isCutsceneLocked, overworldHUD, itemfinderHUD } = ctx;

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
        npcEntity, dtWorld, desiredDir, mapManager.isWalkableInNeighborBounds,
        mapManager.getTileType, undefined, neighborNpcs
      );
    }
    mapManager.setNeighborScratchMap(null);
  }

  public static handleRocketAndMahoganyStepEvents(
    coord: { x: number; y: number },
    currentMap: { id: string } | null,
    ctx: OverworldTickerContext
  ): boolean {
    const {
      player,
      storyFlags,
      overworldHUD,
      saveCurrentGame,
      defeatedTrainers,
      getActiveMapNpcs,
      triggerSlowpokeWellGruntIntercept,
    } = ctx as any;
          // Goldenrod Gym Whitney Cry Step Trigger
          if (
            currentMap?.id === 'goldenrod_gym' &&
            coord.x === 8 &&
            coord.y === 5 &&
            storyFlags.has('whitney_defeated') &&
            !storyFlags.has('whitney_calmed')
          ) {
            storyFlags.add('whitney_calmed');
            overworldHUD.openDialogue(
              [
                'LASS BRIDGET: Oh, no. You made WHITNEY cry.',
                "It's OK. She'll stop soon. She always cries when she loses.",
                'Go on back and talk to her now. She should be calmed down.',
              ],
              '👧 LASS BRIDGET',
              () => void saveCurrentGame()
            );
            return true;
          }

          // Underground Switch Room Rival Silver 4th Ambush
          if (
            currentMap?.id === 'goldenrod_underground_switch_room_entrances' &&
            coord.x === 19 &&
            (coord.y === 4 || coord.y === 5) &&
            !storyFlags.has('EVENT_RIVAL_GOLDENROD_UNDERGROUND')
          ) {
            storyFlags.add('EVENT_RIVAL_GOLDENROD_UNDERGROUND');
            defeatedTrainers.add('rival_underground_4');
            BattleAudio.playOverworldSound('KEY_ITEM');
            overworldHUD.openDialogue(
              [
                'SILVER: Hold it right there!',
                "You again?! You're trying to bust TEAM ROCKET all by yourself?",
                "Don't make me laugh! You're nowhere near tough enough. I'll prove it to you right now!",
                "...Humph! You got lucky again. But don't think you're better than me!",
                "I'll wipe out TEAM ROCKET myself! Just stay out of my way!",
              ],
              '🔴 RIVAL SILVER',
              () => void saveCurrentGame()
            );
            return true;
          }

          // Radio Tower 3F Card Key Shutter
          if (
            currentMap?.id === 'radio_tower_3f' &&
            coord.x === 0 &&
            coord.y === 7 &&
            !storyFlags.has('EVENT_USED_CARD_KEY')
          ) {
            const hasCardKey =
              storyFlags.has('card_key_obtained') ||
              storyFlags.has('has_card_key') ||
              Boolean((ctx as any).inventory?.keyItems?.some((k: string) => k.toLowerCase().includes('card')));
            if (hasCardKey) {
              storyFlags.add('EVENT_USED_CARD_KEY');
              currentMap.collisionGrid[7 * currentMap.width + 0] = 0;
              BattleAudio.playOverworldSound('KEY_ITEM');
              overworldHUD.openDialogue(
                ['Inserted the CARD KEY!', 'The 3F security shutter opened!'],
                '💳 CARD KEY SHUTTER',
                () => void saveCurrentGame()
              );
            } else {
              overworldHUD.openDialogue(
                ['A heavy security shutter blocks the way. A CARD KEY is required to open it.'],
                '💳 CARD KEY SHUTTER'
              );
            }
            return true;
          }

          // Mahogany Town Route 44 East Blocker
          if (
            currentMap?.id === 'mahogany_town' &&
            coord.x === 19 &&
            (coord.y === 8 || coord.y === 9) &&
            !storyFlags.has('rocket_base_generator_cleared') &&
            !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
          ) {
            player.x = 18;
            player.targetX = 18;
            player.renderX = 18;
            player.direction = 'LEFT';
            player.isMoving = false;
            overworldHUD.openDialogue(
              [
                'Hiya, kid! I see you are new in MAHOGANY TOWN.',
                'Since you are new, you should try a yummy RAGECANDYBAR!',
                'Right now, it can be yours for just ¥300! Want one?',
              ],
              '🍬 RAGECANDYBAR SALESMAN',
              () => void saveCurrentGame()
            );
            return true;
          }

          // Route 43 Gate Rocket Extortion
          if (
            currentMap?.id === 'route_43_gate' &&
            coord.y === 4 &&
            !storyFlags.has('rocket_base_generator_cleared') &&
            !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
          ) {
            const currentMoney = (ctx as any).inventory?.money ?? 1000;
            const fee = Math.min(1000, currentMoney);
            if ((ctx as any).inventory) {
              (ctx as any).inventory.money = Math.max(0, currentMoney - 1000);
            }
            overworldHUD.openDialogue(
              [
                'TEAM ROCKET: Hold it right there! This is a toll gate!',
                'Pay the toll fee of ¥1000!',
                fee >= 1000
                  ? 'Hehehe, thank you for your generous contribution to TEAM ROCKET!'
                  : 'You are broke? Well, hand over everything you have got!',
              ],
              '⚡ TEAM ROCKET',
              () => void saveCurrentGame()
            );
            return true;
          }

          // Team Rocket Hideout B1F Persian Surveillance Cameras
          if (
            currentMap?.id === 'team_rocket_base_b1f' &&
            !storyFlags.has('EVENT_SECURITY_CAMERA_DISABLED') &&
            !storyFlags.has('rocket_base_generator_cleared') &&
            !storyFlags.has('EVENT_CLEARED_ROCKET_HIDEOUT')
          ) {
            const isStatueCamera =
              (coord.x === 19 && (coord.y === 2 || coord.y === 3)) ||
              (coord.x === 4 && (coord.y === 7 || coord.y === 8)) ||
              (coord.x === 19 && (coord.y === 6 || coord.y === 7)) ||
              (coord.x === 4 && (coord.y === 11 || coord.y === 12)) ||
              (coord.x === 27 && coord.y === 13);
            if (isStatueCamera) {
              (ctx as any).audioManager?.playSfx?.('sfx_alarm');
              overworldHUD.openDialogue(
                [
                  'A secret surveillance camera is embedded in the PERSIAN statue!',
                  'The alarm blares loudly!',
                  'ROCKET GRUNT: Intruder detected! You are not getting past me!',
                ],
                '🚨 SECURITY CAMERA',
                () => {
                  const grunt = [
                    PokemonFactory.create('drowzee', 20, ['pound', 'hypnosis']),
                    PokemonFactory.create('zubat', 20, ['leechlife', 'bite']),
                  ];
                  (ctx as any).triggerBattle?.(grunt[0], {
                    isTrainer: true,
                    trainerName: 'Rocket Grunt',
                    trainerTeam: grunt,
                    onBattleEnd: () => void saveCurrentGame(),
                  });
                }
              );
              return true;
            }
          }

          // Team Rocket Hideout B3F Rival Silver Ambush
          if (
            currentMap?.id === 'team_rocket_base_b3f' &&
            coord.y === 2 &&
            (coord.x === 8 || coord.x === 9 || coord.x === 10) &&
            !storyFlags.has('EVENT_RIVAL_TEAM_ROCKET_BASE')
          ) {
            storyFlags.add('EVENT_RIVAL_TEAM_ROCKET_BASE');
            overworldHUD.openDialogue(
              [
                'SILVER: ...Tell me something.',
                'Is it true that TEAM ROCKET has returned? What a pathetic bunch of weaklings.',
                'Some guy in a black cape with a dragon lectured me earlier about love and trust with Pokémon.',
                'Hmph! Love? Trust? As if that ever won a battle! Absolute power is all that matters!',
                'Out of my way!',
              ],
              '🔴 RIVAL SILVER',
              () => void saveCurrentGame()
            );
            return true;
          }
    return false;
  }
}
