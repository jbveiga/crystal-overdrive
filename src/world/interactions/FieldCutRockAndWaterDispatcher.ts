/**
 * @fileoverview FieldCutRockAndWaterDispatcher domain module implementation.
 * Handles overworld item balls, hidden items, fruit trees, HM01 Cut trees, HM06 Whirlpools,
 * and HM03 Surf water tile prompts.
 * @module world/interactions/FieldCutRockAndWaterDispatcher
 * @role FieldCutRockAndWaterDispatcher Component
 * @exports resolveCutReplacementTile, handleOverworldItemsAndHMObstacles
 * @layer world
 * @sections L1-55: Micro-Header & Cut Tile Resolution | L56-160: Item Balls, Hidden Items & Fruit Trees | L161-318: Cut, Whirlpool & Surf
 */

import type { MapData } from '../../types/game';
import type { FieldObstacleContext } from '../../types/gameContext';
import { ModernHMHandler } from '../ModernHMHandler';
import { OverworldItemManager } from '../OverworldItemManager';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * Helper to resolve the correct walkable ground tile beneath a cut tree.
 */
export function resolveCutReplacementTile(
  map: MapData,
  tileX: number,
  tileY: number,
  currentTile?: string
): string {
  if (map.id === 'ilex_forest' || (currentTile && currentTile.startsWith('in_forest_'))) {
    return 'in_forest_05_05_05_05';
  }
  if (map.tileMap) {
    const neighbors = [
      { x: tileX, y: tileY + 1 },
      { x: tileX, y: tileY - 1 },
      { x: tileX - 1, y: tileY },
      { x: tileX + 1, y: tileY },
    ];
    for (const n of neighbors) {
      if (n.x >= 0 && n.x < map.width && n.y >= 0 && n.y < map.height) {
        const idx = n.y * map.width + n.x;
        if (
          map.collisionGrid[idx] === 0 &&
          map.tileMap[idx] &&
          !map.tileMap[idx].includes('tree') &&
          !map.tileMap[idx].includes('cut')
        ) {
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
 * Handles visible item balls, hidden items, berry trees, cuttable trees, whirlpools, and water surfing.
 */
export function handleOverworldItemsAndHMObstacles(
  ctx: FieldObstacleContext,
  currentMap: MapData,
  facingX: number,
  facingY: number
): boolean {
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
        !facingTileName.startsWith('in_house_') &&
        !facingTileName.startsWith('in_tower_') &&
        (facingTileName === 'tree_short_0' ||
          facingTileName.includes('13_15_45_1d') ||
          facingTileName === 'kt_2d_2e_3d_3e' ||
          facingTileName === 'jt_2d_2e_3d_3e' ||
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
            const replacementTile = resolveCutReplacementTile(
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
            if (currentMap.id === 'celadon_city' && facingX === 10 && facingY === 31) {
              currentMap.collisionGrid[31 * currentMap.width + 10] = 0;
              ctx.storyFlags.add('celadon_cut_tree_cleared');
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
      const isAutoHm = (ctx as any).getAutoHm ? (ctx as any).getAutoHm() : (ctx as any).autoHm ?? false;
      const wpCheck = ModernHMHandler.canUseWhirlpool(
        ctx.playerParty,
        ctx.inventory,
        ctx.storyFlags,
        isAutoHm
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
            currentMap.collisionGrid[tileIdx] = 3;
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
