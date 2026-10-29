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
import { ModernHMHandler } from '../ModernHMHandler';
import { OverworldItemManager } from '../OverworldItemManager';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { handleLugiaShrineOrBoss } from './WhirlIslandsInteractions';
import { handleFastShipCabinRest } from './FastShipAndVermilionInteractions';
import { handleVermilionGymTrashCan } from './VermilionGymInteractions';

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
    if (map.id === 'ilex_forest' || (currentTile && currentTile.startsWith('in_forest_'))) {
      return 'in_forest_05_05_05_05';
    }
    if (map.tileMap) {
      const neighbors = [{ x: tileX, y: tileY + 1 }, { x: tileX, y: tileY - 1 }, { x: tileX - 1, y: tileY }, { x: tileX + 1, y: tileY }];
      for (const n of neighbors) {
        if (n.x >= 0 && n.x < map.width && n.y >= 0 && n.y < map.height) {
          const idx = n.y * map.width + n.x;
          if (map.collisionGrid[idx] === 0 && map.tileMap[idx] && !map.tileMap[idx].includes('tree') && !map.tileMap[idx].includes('cut')) {
            return map.tileMap[idx];
          }
        }
      }
    }
    if (map.id.startsWith('route_') || map.id.startsWith('kt_')) {
      return 'kt_0b_0b_0b_0b';
    }
    if (map.id.includes('azalea') || map.id.startsWith('jt_m_')) {
      return 'jt_m_07_07_07_07_az';
    }
    return 'jt_07_07_07_07';
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
      currentMap.id.startsWith('goldenrod_dept_store_') &&
      currentMap.id !== 'goldenrod_dept_store_roof' &&
      (facingX === 2 || facingX === 3) &&
      facingY === 0 &&
      ctx.openDeptElevatorModal
    ) {
      ctx.openDeptElevatorModal(currentMap.id, (targetMapId) => {
        if (targetMapId !== currentMap.id) {
          void ctx.executeWarpTransition?.({
            x: ctx.player.x,
            y: ctx.player.y,
            targetMapId,
            targetX: targetMapId === 'goldenrod_dept_store_roof' ? 13 : 2,
            targetY: targetMapId === 'goldenrod_dept_store_roof' ? 2 : 1,
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

      // Dark Cave Entrance on Route 31 (HM05 Flash Field Technique)
      if (currentMap.id === 'route_31' && facingX === 34 && facingY === 5) {
        const flashCheck = ModernHMHandler.checkFlash(ctx.inventory, ctx.storyFlags, ctx.playerParty);
        if (flashCheck.canUse) {
          const userPkmn = flashCheck.userPokemon;
          const userName = userPkmn ? userPkmn.nickname : ctx.playerName;
          ctx.playFlashEffect();
          BattleAudio.playOverworldSound('KEY_ITEM');
          const firstClear = !ctx.storyFlags.has('dark_cave_cleared');
          ctx.storyFlags.add('dark_cave_cleared');
          ctx.missionManager.checkStoryFlags(ctx.storyFlags);
          ctx.missionManager.completeMission('S06');
          const pages = [
            `Pitch-black darkness ahead… ${userName} used FLASH to illuminate DARK CAVE!`,
            firstClear
              ? 'Deep inside the illuminated cavern, you discovered TM13 SNORE and startled a rare DUNSPARCE!'
              : 'A wild DUNSPARCE emerged from the illuminated cavern depths!',
          ];
          if (firstClear && !ctx.inventory.tms.includes('TM13')) {
            ctx.inventory.tms.push('TM13');
          }
          ctx.openDialogue(pages, '⛰️ DARK CAVE (FLASH)', () => {
            ctx.saveCurrentGame();
            if (firstClear) {
              ctx.showToast('✨ Illuminated Dark Cave & found TM13 SNORE!');
            }
            const wildDunsparce = PokemonFactory.create('dunsparce', 6);
            ctx.triggerBattle(wildDunsparce, { isTrainer: false });
          });
        } else {
          ctx.openDialogue(
            [
              'DARK CAVE — Pitch-black cavern ahead.',
              flashCheck.missingReason || 'A blinding FLASH of light is required to navigate safely.',
            ],
            '⛰️ DARK CAVE'
          );
        }
        return true;
      }

      // Ruins of Alph Kabuto Chamber Altar & Inscription Interaction
      if (currentMap.id === 'ruins_of_alph_kabuto_chamber') {
        if (facingX === 3 && facingY === 2) {
          if (ctx.storyFlags.has('unown_awakened_kabuto')) {
            ctx.openDialogue(['A completed stone panel of KABUTO.'], '🧩 KABUTO PUZZLE');
          } else {
            ctx.openDialogue(
              [
                "It's an ancient stone puzzle depicting a prehistoric POKéMON.",
                'Attempt to assemble the sliding panels?',
              ],
              '🧩 KABUTO PUZZLE',
              () => {
                ctx.openRuinsPuzzleModal({
                  onSolve: (puzzleId) => {
                    ctx.handleRuinsPuzzleSolve(puzzleId);
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
            [
              'A POKéMON that hid on the sea floor.',
              'Eyes on its back scanned the area.',
            ],
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
        ctx.openDeptElevatorModal(curMap?.id || 'goldenrod_dept_store_1f', (targetMapId) => {
          if (targetMapId === curMap?.id) {
            ctx.openDialogue(['You are already on this floor!'], bgEvent.speaker);
            return;
          }
          ctx.executeWarpTransition?.({
            x: ctx.player.x, y: ctx.player.y, targetMapId, targetX: 2, targetY: 1, direction: 'DOWN',
          });
        });
        return true;
      }

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
        } else if (bgEvent.action === 'FAST_SHIP_CABIN_REST') {
          handleFastShipCabinRest(bgEvent as any, currentMap, ctx as any);
        } else if (bgEvent.action?.startsWith('VERMILION_GYM_TRASH_CAN_')) {
          const canIdx = parseInt(bgEvent.action.replace('VERMILION_GYM_TRASH_CAN_', ''), 10);
          handleVermilionGymTrashCan(canIdx, ctx as any);
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

    // 2b. Check Overworld Visible Item Balls (Sprint 12 — Facing Adjacent Interaction)
    const itemBall = ctx.overworldItemManager.checkItemBall(
      currentMap.id,
      facingX,
      facingY,
      ctx.storyFlags
    );
    if (itemBall) {
      ctx.addOverworldItemToInventory(itemBall.itemId);
      ctx.overworldItemManager.collectItem(itemBall.eventFlag);
      ctx.storyFlags.add(itemBall.eventFlag);
      ctx.removeItemBall(itemBall.eventFlag);
      BattleAudio.playOverworldSound('KEY_ITEM');
      const itemName = OverworldItemManager.formatItemName(itemBall.itemId);
      const pocket = OverworldItemManager.resolveItemPocket(itemBall.itemId);
      ctx.openDialogue(
        [
          `${ctx.playerName} found ${itemName}!`,
          `${ctx.playerName} put the ${itemName} in the ${pocket} POCKET.`,
        ],
        '🔴 ITEM BALL',
        () => {
          ctx.saveCurrentGame();
          ctx.showToast(`🔴 Found ${itemName}!`);
        }
      );
      return true;
    }

    // 2c. Check Overworld Hidden Items (Sprint 12)
    const hiddenItem = ctx.overworldItemManager.checkHiddenItemInteraction(
      currentMap.id,
      facingX,
      facingY,
      ctx.player.x,
      ctx.player.y
    );
    if (hiddenItem) {
      ctx.addOverworldItemToInventory(hiddenItem.itemId);
      ctx.overworldItemManager.collectItem(hiddenItem.eventFlag);
      ctx.storyFlags.add(hiddenItem.eventFlag);
      if (hiddenItem.itemId === 'machine_part') {
        ctx.storyFlags.add('machine_part_found');
      }
      if (ctx.isItemfinderActive()) {
        ctx.refreshItemfinderRadar(false);
      }
      BattleAudio.playOverworldSound('KEY_ITEM');
      const itemName = OverworldItemManager.formatItemName(hiddenItem.itemId);
      const pocket = OverworldItemManager.resolveItemPocket(hiddenItem.itemId);
      ctx.openDialogue(
        [
          `${ctx.playerName} found ${itemName}!`,
          `${ctx.playerName} put the ${itemName} in the ${pocket} POCKET.`,
        ],
        '✨ HIDDEN ITEM',
        () => {
          ctx.saveCurrentGame();
          ctx.showToast(`✨ Found hidden ${itemName}!`);
        }
      );
      return true;
    }

    // 2d. Check Overworld Fruit Trees (Sprint 12 — Facing Adjacent Interaction)
    const fruitTree = ctx.overworldItemManager.checkFruitTree(currentMap.id, facingX, facingY);
    if (fruitTree) {
      if (ctx.overworldItemManager.isFruitTreePickedToday(fruitTree.treeId)) {
        ctx.openDialogue(
          ["It's a fruit-bearing tree, but there are no berries left today."],
          '🌳 FRUIT TREE'
        );
      } else {
        ctx.addOverworldItemToInventory(fruitTree.berryId);
        ctx.overworldItemManager.pickFruitTree(fruitTree.treeId);
        ctx.syncMapOverworldItems(currentMap);
        BattleAudio.playOverworldSound('KEY_ITEM');
        const berryName = OverworldItemManager.formatItemName(fruitTree.berryId);
        ctx.openDialogue(
          [
            `Hey! It's a fruit-bearing tree! It has ${berryName}!`,
            `${ctx.playerName} picked the ${berryName}!`,
          ],
          '🌳 FRUIT TREE',
          () => {
            ctx.saveCurrentGame();
            ctx.showToast(`🍒 Picked ${berryName}!`);
          }
        );
      }
      return true;
    }

    // 3. Check Cuttable Trees (HM01 Cut interaction)
    if (
      facingX >= 0 &&
      facingX < currentMap.width &&
      facingY >= 0 &&
      facingY < currentMap.height &&
      currentMap.tileMap
    ) {
      const tileIdx = facingY * currentMap.width + facingX;
      const facingTileName = currentMap.tileMap[tileIdx] || '';
      const isIlexCutTree =
        currentMap.id === 'ilex_forest' && facingX === 8 && facingY === 25;
      const isCutTree =
        isIlexCutTree ||
        (currentMap.collisionGrid[tileIdx] === 1 &&
          (facingTileName === 'tree_short_0' ||
            facingTileName.includes('13_15_45_1d') ||
            facingTileName.includes('2d_2e_3d_3e') ||
            facingTileName.includes('28_39_38_3a') ||
            facingTileName.includes('cut_tree') ||
            facingTileName.includes('cuttable')));

      if (isCutTree) {
        const cutCheck = ModernHMHandler.checkCut(
          ctx.inventory,
          ctx.storyFlags,
          ctx.playerParty
        );

        if (
          cutCheck.canUse ||
          (cutCheck.hasBadge && cutCheck.hasHM && cutCheck.compatiblePokemon)
        ) {
          const cutter =
            cutCheck.userPokemon ||
            cutCheck.compatiblePokemon ||
            ctx.playerParty.find((p) => !p.isEgg) ||
            ctx.playerParty[0];
          const cutterName = cutter ? cutter.nickname : ctx.playerName;
          BattleAudio.playOverworldSound('RUSTLE');
          ctx.playCutSlashEffect(facingX, facingY);
          ctx.openDialogue(
            [
              'This tree looks like it can be CUT down!',
              `${cutterName} hacked away with CUT!`,
            ],
            '🌳 CUTTABLE TREE',
            () => {
              currentMap.collisionGrid[tileIdx] = 0;
              const replacementTile = FieldObstacleDispatcher.resolveCutReplacementTile(
                currentMap,
                facingX,
                facingY,
                facingTileName
              );
              currentMap.tileMap![tileIdx] = replacementTile;
              if (currentMap.id === 'ilex_forest') {
                currentMap.collisionGrid[25 * currentMap.width + 8] = 0;
                if (currentMap.tileMap) {
                  currentMap.tileMap[25 * currentMap.width + 8] = 'in_forest_05_05_05_05';
                }
                ctx.storyFlags.add('ilex_tree_cut');
                ctx.storyFlags.add('cut_used_in_ilex');
                ctx.missionManager.checkStoryFlags(ctx.storyFlags);
              }
              if (currentMap.id === 'vermilion_city' && facingX === 10 && facingY === 20) {
                currentMap.collisionGrid[20 * currentMap.width + 10] = 0;
                ctx.storyFlags.add('vermilion_cut_tree_cleared');
              }
              ctx.renderMap(currentMap);
              ctx.syncMapOverworldItems(currentMap);
              ctx.saveCurrentGame();
              ctx.showToast('🌳 The tree was cut down!');
            }
          );
        } else {
          ctx.openDialogue(
            [
              'This tree looks like it can be CUT down!',
              cutCheck.missingReason ||
                'Obtain HM01 CUT and the HIVE BADGE to clear this obstacle.',
            ],
            '🌳 CUTTABLE TREE'
          );
        }
        return true;
      }

      // 3b. Check Ocean Whirlpools (HM06 Whirlpool interaction)
      const isRoute41Whirlpool =
        currentMap.id === 'route_41' &&
        ((facingX === 12 && facingY === 17) ||
          (facingX === 36 && facingY === 19) ||
          (facingX === 12 && facingY === 37) ||
          (facingX === 36 && facingY === 45));

      const isWhirlpool =
        facingTileName.includes('whirlpool') ||
        facingTileName.includes('46_47_56_57') ||
        (isRoute41Whirlpool &&
          !ctx.storyFlags.has(`whirlpool_cleared_${facingX}_${facingY}`));

      if (isWhirlpool) {
        const wpCheck = ModernHMHandler.canUseWhirlpool(
          ctx.playerParty,
          ctx.inventory,
          ctx.storyFlags
        );

        if (wpCheck.canUse) {
          const user =
            wpCheck.userPokemon ||
            wpCheck.compatiblePokemon ||
            ctx.playerParty.find((p) => !p.isEgg) ||
            ctx.playerParty[0];
          const userName = user
            ? user.nickname || user.speciesId.toUpperCase()
            : ctx.playerName;
          BattleAudio.playOverworldSound('RUSTLE');
          ctx.openDialogue(
            [
              'A swirling whirlpool blocks the path!',
              `${userName} used WHIRLPOOL to calm the churning waters!`,
            ],
            '🌀 WHIRLPOOL',
            () => {
              currentMap.collisionGrid[tileIdx] = 0;
              ctx.storyFlags.add(`whirlpool_cleared_${facingX}_${facingY}`);
              ctx.renderMap(currentMap);
              ctx.saveCurrentGame();
              ctx.showToast('🌀 The whirlpool subsided!');
            }
          );
        } else {
          ctx.openDialogue(
            [
              'A vicious whirlpool is spinning violently!',
              wpCheck.missingReason ||
                'You need HM06 WHIRLPOOL and the GLACIER BADGE from Mahogany Gym to cross.',
            ],
            '🌀 WHIRLPOOL'
          );
        }
        return true;
      }

      // 4. Check Water Tile Surfing Interaction (Classic Mode or Manual Prompt)
      if (currentMap.collisionGrid[tileIdx] === 3) {
        const surfCheck = ModernHMHandler.checkSurf(
          ctx.inventory,
          ctx.storyFlags,
          ctx.playerParty
        );
        if (surfCheck.canUse) {
          const surfer =
            surfCheck.userPokemon || ctx.playerParty.find((p) => !p.isEgg) || ctx.playerParty[0];
          const surferName = surfer ? surfer.nickname : ctx.playerName;
          ctx.openDialogue(
            ['The water is dyed a deep blue...', `${surferName} used SURF!`],
            '🌊 WATER',
            () => {
              ctx.setSurfEnabled(true);
              ctx.saveCurrentGame();
              ctx.showToast(`🌊 Surfing on the water with ${surferName}!`);
            }
          );
        } else {
          ctx.openDialogue(
            [
              'The water is dyed a deep blue...',
              surfCheck.missingReason ||
                'You need HM03 SURF and the FOG BADGE to surf on water!',
            ],
            '🌊 WATER'
          );
        }
        return true;
      }
    }

    return false;
  }
}
