/**
 * @fileoverview FieldObstacleDispatcher domain module implementation.
 * @module world/interactions/FieldObstacleDispatcher
 * @role FieldObstacleDispatcher Component
 * @exports FieldObstacleDispatcher
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-283: Implementation | L284-567: Handlers & Exports
 */

import type { MapData } from '../../types/game';
import type { FieldObstacleContext } from '../../types/gameContext';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { handleLugiaShrineOrBoss } from './WhirlIslandsInteractions';
import { handleFastShipCabinRest } from './FastShipAndVermilionInteractions';
import { handleVermilionGymTrashCan } from './VermilionGymInteractions';
import { handleCeladonCafeTrashCan, handleCeladonGymGuideAndStatues } from './CeladonAndGymErikaInteractions';
import { handleCeruleanGymMachinePart, handleCeruleanGymGuideAndStatues } from './CeruleanPowerPlantAndMistyInteractions';
import { handleFuchsiaGymGuideAndStatues } from './CyclingRoadAndFuchsiaJanineInteractions';
import {
  resolveCutReplacementTile,
  handleOverworldItemsAndHMObstacles,
} from './FieldCutRockAndWaterDispatcher';

export class FieldObstacleDispatcher {
  /**
   * Helper to resolve the correct walkable ground tile beneath a cut tree.
   */
  public static resolveCutReplacementTile(
    map: MapData,
    tileX: number,
    tileY: number,
    currentTile?: string
  ): string {
    return resolveCutReplacementTile(map, tileX, tileY, currentTile);
  }

  /**
   * Handles street signs, interactive background events (bgEvents), item balls, hidden items,
   * fruit trees, cuttable trees (HM01 CUT), and water surfing (HM03 SURF).
   * Extracted from src/main.ts to maintain pure domain isolation and agent readability.
   *
   * @returns true if an interaction was executed, false otherwise.
   */
  public static handleFieldAndBgInteraction(
    ctx: FieldObstacleContext,
    currentMap: MapData,
    facingX: number,
    facingY: number
  ): boolean {
    // Dept Store Elevator Interaction Trigger
    if (
      ((currentMap.id.startsWith('goldenrod_dept_store_') &&
        currentMap.id !== 'goldenrod_dept_store_roof' &&
        (facingX === 2 || facingX === 3) &&
        facingY === 0) ||
        (currentMap.id === 'goldenrod_underground_warehouse' &&
          (facingX === 16 || facingX === 17) &&
          facingY === 0)) &&
      ctx.openDeptElevatorModal
    ) {
      ctx.openDeptElevatorModal(currentMap.id, (targetMapId) => {
        if (targetMapId !== currentMap.id) {
          void ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 13
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 17
                  : 2,
            targetY:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 2
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 2
                  : 1,
            direction: 'DOWN',
          });
        }
      });
      return true;
    }

    // 2. Check Street Signs & Interactive Background Objects (bgEvents)
    const bgEvent = ctx.mapManager.checkBgEvent(facingX, facingY);
    if (bgEvent && bgEvent.pages.length > 0) {
      // Starter Pokéball Selection in Elm's Lab (Ticket 6.1)
      if (
        bgEvent.action === 'STARTER_CYNDAQUIL' ||
        bgEvent.action === 'STARTER_TOTODILE' ||
        bgEvent.action === 'STARTER_CHIKORITA'
      ) {
        if (ctx.storyFlags.has('starter_chosen') || ctx.playerParty.length > 0) {
          const tableSpecies: 'cyndaquil' | 'totodile' | 'chikorita' =
            bgEvent.action === 'STARTER_CYNDAQUIL' ? 'cyndaquil' : bgEvent.action === 'STARTER_TOTODILE' ? 'totodile' : 'chikorita';
          const tableName = tableSpecies.toUpperCase();
          const chosenSpecies = ctx.detectChosenStarterSpecies();

          // A. The spot of the ball the player took
          if (chosenSpecies === tableSpecies) {
            ctx.openDialogue([`It's an empty spot. You already chose ${tableName}!`], bgEvent.speaker);
            return true;
          }

          // B. The spot of the ball the Rival stole after Elm's emergency call
          const counterPickMap: Record<string, string> = { cyndaquil: 'totodile', totodile: 'chikorita', chikorita: 'cyndaquil' };
          const rivalStolen = chosenSpecies ? counterPickMap[chosenSpecies] : null;
          if (ctx.storyFlags.has('ELM_CALLED_ABOUT_THEFT') && rivalStolen === tableSpecies) {
            ctx.openDialogue(['The POKé BALL was stolen from the table!'], bgEvent.speaker);
            return true;
          }

          // C. A ball still sitting on the table
          const tableType = tableSpecies === 'cyndaquil' ? 'FIRE' : tableSpecies === 'totodile' ? 'WATER' : 'GRASS';
          ctx.openDialogue([`It's ${tableName}, a ${tableType} POKéMON!`, 'PROF. ELM: You already chose your partner!'], bgEvent.speaker);
          return true;
        }

        const starterConfig: Record<string, { speciesId: 'cyndaquil' | 'totodile' | 'chikorita'; name: string; type: string }> = {
          STARTER_CYNDAQUIL: { speciesId: 'cyndaquil', name: 'CYNDAQUIL', type: 'FIRE' },
          STARTER_TOTODILE: { speciesId: 'totodile', name: 'TOTODILE', type: 'WATER' },
          STARTER_CHIKORITA: { speciesId: 'chikorita', name: 'CHIKORITA', type: 'GRASS' },
        };

        const chosen = starterConfig[bgEvent.action];
        if (chosen) {
          BattleAudio.playCry(chosen.speciesId);
          ctx.openStarterChoiceModal(
            chosen.speciesId,
            chosen.name,
            chosen.type,
            () => {
              const starterPokemon = PokemonFactory.create(chosen.speciesId, 5);
              ctx.playerParty.push(starterPokemon);
              ctx.storyFlags.add('starter_chosen');
              ctx.storyFlags.add(`starter_${chosen.speciesId}`);
              ctx.missionManager.reconcileStarterState(ctx.playerParty, ctx.storyFlags);
              ctx.removeItemBall(`${chosen.speciesId}_ball`);
              ctx.syncMapOverworldItems(currentMap);
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.openDialogue(
                [
                  `${ctx.playerName} received ${chosen.name} from PROF. ELM!`,
                  "PROF. ELM: Excellent choice! That POKéMON is really energetic! Now, please visit MR. POKéMON's house on ROUTE 30 to retrieve the MYSTERY EGG!",
                ],
                '🔬 PROF. ELM',
                () => {
                  ctx.saveCurrentGame();
                  ctx.showToast(`✨ Received ${chosen.name} (Lv. 5)!`);
                }
              );
            },
            () => {
              BattleAudio.playMenuSound('CANCEL');
            }
          );
          return true;
        }
      }

      // Bill's PC Storage Terminal Interaction
      if (
        bgEvent.action === 'OPEN_PC' ||
        bgEvent.speaker?.includes('PC') ||
        bgEvent.pages.some((p) => p.includes('PC'))
      ) {
        ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
          ctx.openPcStorage();
        });
        return true;
      }

      // Town Map Wall Poster Interaction
      if (
        bgEvent.action === 'POKECENTER_MAP' ||
        bgEvent.action === 'OPEN_MAP' ||
        bgEvent.pages.some((p) => p.toUpperCase().includes('TOWN MAP')) ||
        bgEvent.speaker?.toUpperCase().includes('TOWN MAP')
      ) {
        ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
          ctx.openTownMap(currentMap.id, ctx.visitedMaps, ctx.roamingManager.getActiveRoamers());
        });
        return true;
      }

      // Gym Statues Dynamic Winning Trainers Inspection
      if (
        bgEvent.speaker?.includes('STATUE') ||
        (bgEvent.pages && bgEvent.pages.some((p) => p.includes('GYM STATUE') || p.includes('POKéMON GYM')))
      ) {
        const gymLeaders: Record<string, { city: string; leader: string; flag: string }> = {
          violet_gym: { city: 'VIOLET CITY', leader: 'FALKNER', flag: 'falkner_defeated' },
          azalea_gym: { city: 'AZALEA TOWN', leader: 'BUGSY', flag: 'bugsy_defeated' },
          ecruteak_gym: { city: 'ECRUTEAK CITY', leader: 'MORTY', flag: 'morty_defeated' },
          mahogany_gym: { city: 'MAHOGANY TOWN', leader: 'PRYCE', flag: 'pryce_defeated' },
          vermilion_gym: { city: 'VERMILION CITY', leader: 'LT. SURGE', flag: 'surge_defeated' },
        };
        const gym = gymLeaders[currentMap.id] || (bgEvent.action === 'MAHOGANY_GYM_STATUE' ? gymLeaders.mahogany_gym : undefined);
        if (gym) {
          const winner = ctx.storyFlags.has(gym.flag) ? `WINNING TRAINERS: SILVER, ${ctx.playerName}` : 'WINNING TRAINERS: SILVER';
          ctx.openDialogue([`${gym.city} POKéMON GYM`, `LEADER: ${gym.leader}`, winner], bgEvent.speaker);
          return true;
        }
      }


      // Ruins of Alph Chambers Altar & Inscription Interaction (Kabuto, Omanyte, Aerodactyl, Ho-Oh)
      const ruinsChamberMap = {
        'ruins_of_alph_kabuto_chamber': {
          puzzleId: 'kabuto',
          name: 'KABUTO',
          flag: 'unown_awakened_kabuto',
          inscription: [
            'A POKéMON that hid on the sea floor.',
            'Eyes on its back scanned the area.',
          ],
        },
        ruins_of_alph_omanyte_chamber: {
          puzzleId: 'omanyte',
          name: 'OMANYTE',
          flag: 'unown_awakened_omanyte',
          inscription: [
            'A prehistoric POKéMON that swam by twisting its 10 tentacles.',
            'It lived in ancient seas long ago.',
          ],
        },
        ruins_of_alph_aerodactyl_chamber: {
          puzzleId: 'aerodactyl',
          name: 'AERODACTYL',
          flag: 'unown_awakened_aerodactyl',
          inscription: [
            'A ferocious prehistoric POKéMON that soared through the skies.',
            'It attacked with saw-like teeth.',
          ],
        },
        ruins_of_alph_ho_oh_chamber: {
          puzzleId: 'ho_oh',
          name: 'HO-OH',
          flag: 'unown_awakened_ho_oh',
          inscription: [
            'A legendary rainbow POKéMON said to fly continuously on magnificent wings.',
            'It reveals itself only to pure-hearted trainers.',
          ],
        },
      } as const;

      if (currentMap.id in ruinsChamberMap) {
        const chamber = ruinsChamberMap[currentMap.id as keyof typeof ruinsChamberMap];
        if (facingX === 3 && facingY === 2) {
          if (ctx.storyFlags.has(chamber.flag)) {
            ctx.openDialogue([`A completed stone panel of ${chamber.name}.`], `🧩 ${chamber.name} PUZZLE`);
          } else {
            ctx.openDialogue(
              [
                `It's an ancient stone puzzle depicting ${chamber.name}.`,
                'Attempt to assemble the sliding panels?',
              ],
              `🧩 ${chamber.name} PUZZLE`,
              () => {
                ctx.openRuinsPuzzleModal({
                  onSolve: (puzzleId) => {
                    ctx.handleRuinsPuzzleSolve(puzzleId || chamber.puzzleId);
                  },
                  onClose: () => {},
                });
              }
            );
          }
          return true;
        }

        if (facingX === 4 && facingY === 2) {
          ctx.openDialogue(
            [...chamber.inscription],
            '📜 ANCIENT INSCRIPTION'
          );
          return true;
        }
      }

      // Vending Machine bgEvent (Issue #32)
      if (bgEvent.action === 'VENDING_MACHINE' || bgEvent.speaker?.includes('VENDING MACHINE')) {
        ctx.openDialogue(
          bgEvent.pages.length > 0 ? bgEvent.pages : ['VENDING MACHINE: Clang! Refreshing drinks in stock!'],
          bgEvent.speaker || '🥤 VENDING MACHINE',
          () => ctx.openMart('goldenrod_dept_store_6f')
        );
        return true;
      }

      // Dept Store Elevator Panel bgEvent (Issue #29 & #33)
      if (bgEvent.action === 'DEPT_ELEVATOR_PANEL' || bgEvent.action === 'DEPT_ELEVATOR') {
        const curMap = ctx.mapManager.getCurrentMap();
        ctx.openDeptElevatorModal?.(curMap?.id || 'goldenrod_dept_store_1f', (targetMapId) => {
          if (targetMapId === curMap?.id) {
            ctx.openDialogue(['You are already on this floor!'], bgEvent.speaker);
            return;
          }
          ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 13
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 17
                  : 2,
            targetY:
              targetMapId === 'goldenrod_dept_store_roof'
                ? 2
                : targetMapId === 'goldenrod_underground_warehouse'
                  ? 2
                  : 1,
            direction: 'DOWN',
          });
        });
        return true;
      }

      // Goldenrod Underground Switch Room Switches
      if (
        currentMap.id === 'goldenrod_underground_switch_room_entrances' &&
        (bgEvent.speaker?.toUpperCase().includes('SWITCH') || bgEvent.action?.toUpperCase().includes('SWITCH'))
      ) {
        let flagName = 'SWITCH_1_ON';
        let label = 'SWITCH 1';
        if (facingX === 10 || bgEvent.speaker?.includes('2')) {
          flagName = 'SWITCH_2_ON';
          label = 'SWITCH 2';
        } else if (facingX === 2 || bgEvent.speaker?.includes('3')) {
          flagName = 'SWITCH_3_ON';
          label = 'SWITCH 3';
        } else if (facingX === 20 || bgEvent.speaker?.toUpperCase().includes('EMERGENCY')) {
          flagName = 'SWITCH_EMERGENCY_ON';
          label = 'EMERGENCY SWITCH';
        }

        const toggleSwitch = () => {
          const wasOn = ctx.storyFlags.has(flagName);
          if (wasOn) {
            ctx.storyFlags.delete(flagName);
          } else {
            ctx.storyFlags.add(flagName);
          }
          BattleAudio.playMenuSound('CONFIRM');
          const stateText = wasOn ? 'Turned it OFF.' : 'Turned it ON.';
          ctx.openDialogue(
            [`Click! ${stateText}`],
            bgEvent.speaker || `🔌 ${label}`,
            () => {
              ctx.saveCurrentGame();
            }
          );
        };

        if (ctx.openChoiceDialogue) {
          const isCurrentlyOn = ctx.storyFlags.has(flagName);
          ctx.openChoiceDialogue(
            [`It's labeled ${label} (currently ${isCurrentlyOn ? 'ON' : 'OFF'}). Press it?`],
            bgEvent.speaker || `🔌 ${label}`,
            (choice) => {
              if (choice === 'YES') {
                toggleSwitch();
              } else {
                ctx.openDialogue(['Left the switch alone.'], bgEvent.speaker || `🔌 ${label}`);
              }
            }
          );
        } else {
          toggleSwitch();
        }
        return true;
      }

      if (bgEvent.action === 'FAST_SHIP_CABIN_REST') { handleFastShipCabinRest(bgEvent as any, currentMap, ctx as any); return true; }
      if (bgEvent.action?.startsWith('VERMILION_GYM_TRASH_CAN_')) { handleVermilionGymTrashCan(parseInt(bgEvent.action.replace('VERMILION_GYM_TRASH_CAN_', ''), 10), ctx as any); return true; }
      if (bgEvent.action === 'CELADON_CAFE_TRASH') { handleCeladonCafeTrashCan(ctx as any); return true; }
      if (bgEvent.action === 'CELADON_GYM_STATUE') { handleCeladonGymGuideAndStatues({ id: 'celadon_gym_statue', x: facingX, y: facingY, action: 'CELADON_GYM_STATUE' } as any, ctx as any); return true; }
      if (bgEvent.action === 'CERULEAN_GYM_MACHINE_PART') { handleCeruleanGymMachinePart(ctx as any, facingX, facingY); return true; }
      if (bgEvent.action === 'CERULEAN_GYM_STATUE') { handleCeruleanGymGuideAndStatues({ id: 'cerulean_gym_statue', x: facingX, y: facingY, action: 'CERULEAN_GYM_STATUE' } as any, ctx as any); return true; }
      if (bgEvent.action === 'FUCHSIA_GYM_STATUE') { handleFuchsiaGymGuideAndStatues({ id: 'fuchsia_gym_statue', x: facingX, y: facingY, action: 'FUCHSIA_GYM_STATUE' } as any, ctx as any); return true; }

      ctx.openDialogue(bgEvent.pages, bgEvent.speaker, () => {
        if (
          currentMap.id === 'earls_pokemon_academy' &&
          bgEvent.speaker.includes('BLACKBOARD') &&
          !ctx.storyFlags.has('earls_academy_graduated')
        ) {
          ctx.storyFlags.add('earls_academy_graduated');
          ctx.inventory.items['parlyz-heal'] = (ctx.inventory.items['parlyz-heal'] || 0) + 1;
          ctx.inventory.items['antidote'] = (ctx.inventory.items['antidote'] || 0) + 1;
          ctx.inventory.items['awakening'] = (ctx.inventory.items['awakening'] || 0) + 1;
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          BattleAudio.playOverworldSound('FANFARE');
          ctx.showToast('🎓 Blackboard studied! Received Status Cure Kit!');
          ctx.saveCurrentGame();
        } else if (bgEvent.action === 'HEAL_AND_SAVE') {
          ctx.healPlayerParty(false);
          ctx.saveCurrentGame();
          if (currentMap.id.endsWith('_poke_center')) {
            ctx.playHealingAnimation(ctx.playerParty.length);
          } else {
            ctx.playFieldRestAnimation();
          }
        } else if (bgEvent.action === 'OPEN_MART') {
          ctx.openMart(currentMap.id);
        } else if (bgEvent.action === 'ROCKET_BASE_SECURITY_SWITCH') {
          if (!ctx.storyFlags.has('EVENT_SECURITY_CAMERA_DISABLED')) {
            ctx.storyFlags.add('EVENT_SECURITY_CAMERA_DISABLED');
            ctx.storyFlags.add('security_cameras_disabled');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.showToast('🚨 Surveillance cameras deactivated!');
            ctx.saveCurrentGame();
          }
        } else if (bgEvent.action === 'ROCKET_BASE_OFFICE_DOOR') {
          const hasP1 = ctx.storyFlags.has('EVENT_LEARNED_SLOWPOKETAIL');
          const hasP2 =
            ctx.storyFlags.has('EVENT_LEARNED_RATICATETAIL') ||
            ctx.storyFlags.has('EVENT_LEARNED_RATICATE_TAIL');
          if (hasP1 && hasP2) {
            ctx.storyFlags.add('EVENT_OPENED_DOOR_TO_GIOVANNIS_OFFICE');
            currentMap.collisionGrid[9 * currentMap.width + 10] = 0;
            currentMap.collisionGrid[9 * currentMap.width + 11] = 0;
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              ['The passwords matched!', "The door to GIOVANNI'S office clicked open!"],
              bgEvent.speaker,
              () => {
                ctx.saveCurrentGame();
                ctx.renderMap?.(currentMap);
              }
            );
          }
        } else if (bgEvent.action === 'ROCKET_BASE_TRANSMITTER_DOOR') {
          const hasVoice = ctx.storyFlags.has('EVENT_LEARNED_HAIL_GIOVANNI');
          if (hasVoice) {
            ctx.storyFlags.add('EVENT_OPENED_DOOR_TO_ROCKET_HIDEOUT_TRANSMITTER');
            currentMap.collisionGrid[12 * currentMap.width + 14] = 0;
            currentMap.collisionGrid[12 * currentMap.width + 15] = 0;
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.openDialogue(
              ['Spoke the secret voice password: "Hail GIOVANNI"!', 'The master blast door slid open!'],
              bgEvent.speaker,
              () => {
                ctx.saveCurrentGame();
                ctx.renderMap?.(currentMap);
              }
            );
          }
        } else if (bgEvent.action === 'LUGIA_SHRINE_EVENT' || bgEvent.speaker?.includes('LUGIA')) {
          handleLugiaShrineOrBoss(
            { id: 'lugia_shrine', x: facingX, y: facingY } as any,
            currentMap,
            ctx as any
          );
        }
      });
      return true;
    }

    // 2a-fallback. Universal Pokémon Center & Bedroom PC Terminal Fallback
    if (
      (currentMap.id.endsWith('_poke_center') && facingX === 9 && facingY === 1) ||
      (currentMap.id === 'players_house_2f' && facingX === 0 && facingY === 1)
    ) {
      ctx.openDialogue(
        ["Accessed BILL'S PC!", 'POKéMON Storage System is online and synced.'],
        "💻 BILL'S PC",
        () => {
          ctx.openPcStorage();
        }
      );
      return true;
    }

    if (currentMap.id === 'cerulean_gym' && ((facingX === 4 && facingY === 8) || (facingX === 3 && facingY === 8))) {
      return handleCeruleanGymMachinePart(ctx as any, facingX, facingY);
    }

    if (currentMap.id === 'ruins_of_alph_outside' && facingX === 16 && facingY === 8) {
      ctx.openDialogue(['MYSTERY STONE PANEL CHAMBER'], '🪧 MYSTERY CHAMBER');
      return true;
    }

    return handleOverworldItemsAndHMObstacles(ctx, currentMap, facingX, facingY);
  }
}
