/**
 * @fileoverview OverworldWarpProgressionGuards — Story flag, gym lock, badge checkpoint, Elite Four, and Fast Ship door warp guards.
 * @module world/OverworldWarpProgressionGuards
 * @role Overworld Door & Warp Progression Gate Evaluator
 * @exports evaluateWarpProgressionGuards
 * @layer world
 * @sections L1-20: Micro-Header & Imports | L21-265: Progression Gate Evaluation
 */

import { BattleAudio } from '../audio/BattleAudio';
import { checkHasAllJohtoBadges } from './interactions/VictoryRoadGateInteractions';
import { evaluateFastShipWarp } from './interactions/FastShipAndVermilionInteractions';
import type { MapData, WarpEvent } from '../types/game';
import type { OverworldTransitionContext } from '../types/gameContext';

export function evaluateWarpProgressionGuards(
  ctx: OverworldTransitionContext,
  currentM: MapData,
  warp: WarpEvent
): boolean {
  const {
    storyFlags,
    player,
    setCutsceneLocked,
    overworldHUD,
    inventory,
    triggerAzaleaRivalAmbush,
  } = ctx;

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
      return true;
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
      return true;
    }

    if (
      currentM.id.endsWith('_chamber') &&
      warp.targetMapId === 'ruins_of_alph_inner_chamber' &&
      !storyFlags.has('unown_awakened_kabuto') &&
      !storyFlags.has('unown_awakened_omanyte') &&
      !storyFlags.has('unown_awakened_aerodactyl') &&
      !storyFlags.has('unown_awakened_ho_oh') &&
      !storyFlags.has('EVENT_MADE_UNOWN_APPEAR_IN_RUINS')
    ) {
      // The stone floor has not collapsed into a trapdoor hole yet
      return true;
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
      return true;
    }

    if (
      warp.targetMapId === 'burned_tower_b1f' &&
      !storyFlags.has('EVENT_BEAT_BURNED_TOWER_SILVER')
    ) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      const rName = ((ctx as any).getRivalName?.() || 'SILVER').toUpperCase();
      overworldHUD.openDialogue([`${rName}: Hey, hold it right there! You're not going down that hole before me!`], `❓ RIVAL ${rName}`);
      return true;
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
        return true;
      }
      triggerAzaleaRivalAmbush();
      return true;
    }

    // Victory Road Gate 8-Badge Security Checkpoint & Kanto / Mt. Silver Defensive Guards
    if (warp.targetMapId === 'victory_road') {
      const has8Badges = checkHasAllJohtoBadges(inventory.badges, storyFlags);
      if (!has8Badges) {
        player.isMoving = false;
        player.progress = 0;
        setCutsceneLocked(false);
        BattleAudio.playMenuSound('CANCEL');
        overworldHUD.openDialogue(
          [
            'OFFICER: Only trainers who have proven themselves may pass.',
            "You don't have all the GYM BADGES of JOHTO. I'm sorry, but I can't let you go through.",
          ],
          '👮 OFFICER'
        );
        return true;
      }
    }

    if (
      currentM.id === 'victory_road' &&
      warp.targetMapId === 'route_23' &&
      !storyFlags.has('victory_road_rival_defeated')
    ) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ["SILVER: Hold it! You're not getting past me to the LEAGUE!"],
        '🔴 RIVAL SILVER'
      );
      return true;
    }

    if (warp.targetMapId === 'route_28' && !storyFlags.has('champion_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['BLACK BELT: Hold on! This way leads to MT. SILVER.', 'Only a verified CHAMPION who has conquered both JOHTO and KANTO may pass!'],
        '🥋 BLACK BELT'
      );
      return true;
    }

    if (warp.targetMapId === 'route_22' && !storyFlags.has('champion_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(
        ['BLACK BELT: Off to the POKéMON LEAGUE, are you?', 'The route to VIRIDIAN CITY is closed to incoming challengers. Proceed through VICTORY ROAD!'],
        '🥋 BLACK BELT'
      );
      return true;
    }

    // Elite Four Chambers, Hall of Fame & Tin Tower Progression Gating
    const e4Rooms = ['wills_room', 'kogas_room', 'brunos_room', 'karens_room', 'lances_room'];
    if (e4Rooms.includes(currentM.id) && (warp.targetMapId === 'indigo_plateau_poke_center' || (e4Rooms.includes(warp.targetMapId) && e4Rooms.indexOf(warp.targetMapId) < e4Rooms.indexOf(currentM.id)))) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(['The door is sealed shut! You cannot turn back until the trial is complete!'], '🔒 SEALED DOOR');
      return true;
    }

    if (warp.targetMapId === 'wills_room' && (!checkHasAllJohtoBadges(inventory.badges, storyFlags) || !storyFlags.has('victory_road_rival_defeated'))) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(['GUARD: You cannot challenge the ELITE FOUR until you have conquered all 8 JOHTO GYMS and proven your strength against RIVAL SILVER in VICTORY ROAD!'], '👮 LEAGUE GUARD');
      return true;
    }

    if (warp.targetMapId === 'kogas_room' && !storyFlags.has('will_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false); BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(['The door ahead is firmly sealed! You must defeat ELITE FOUR WILL first!'], '🔒 CHAMBER DOOR');
      return true;
    }

    if (warp.targetMapId === 'brunos_room' && !storyFlags.has('koga_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false); BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(['The door ahead is firmly sealed! You must defeat ELITE FOUR KOGA first!'], '🔒 CHAMBER DOOR');
      return true;
    }

    if (warp.targetMapId === 'karens_room' && !storyFlags.has('bruno_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false); BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(['The door ahead is firmly sealed! You must defeat ELITE FOUR BRUNO first!'], '🔒 CHAMBER DOOR');
      return true;
    }

    if (warp.targetMapId === 'lances_room' && !storyFlags.has('karen_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false); BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(["The door ahead is firmly sealed! You must defeat ELITE FOUR KAREN first!"], '🔒 CHAMBER DOOR');
      return true;
    }

    if (warp.targetMapId === 'hall_of_fame' && !storyFlags.has('champion_defeated')) {
      player.isMoving = false; player.progress = 0; setCutsceneLocked(false); BattleAudio.playMenuSound('CANCEL');
      overworldHUD.openDialogue(["The door ahead is firmly sealed! You must defeat the CHAMPION first!"], '🔒 CHAMBER DOOR');
      return true;
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
      return true;
    }

    const fastShipGate = evaluateFastShipWarp(currentM.id, warp, storyFlags, inventory);
    if (fastShipGate.blocked) {
      player.isMoving = false;
      player.progress = 0;
      setCutsceneLocked(false);
      BattleAudio.playMenuSound('CANCEL');
      if (fastShipGate.blockedMessages) {
        overworldHUD.openDialogue(fastShipGate.blockedMessages, fastShipGate.blockedSpeaker);
      }
      return true;
    }

  return false;
}
