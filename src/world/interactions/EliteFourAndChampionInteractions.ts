/**
 * @fileoverview Indigo Plateau Grand Lobby, Elite Four Gauntlet & Champion Lance Climax domain interactions.
 * @module world/interactions/EliteFourAndChampionInteractions
 * @role Elite Four & Champion Domain Interaction Handler
 * @exports EliteFourAndChampionInteractions, handleIndigoTeleportGramps, handleIndigoLeagueGuard, handleEliteFourBattle, handleHallOfFameEvent, handleEliteFourStep, getEliteFourAndChampionInteractions
 * @sections
 * 1. Types & Dialogue Constants
 * 2. Lobby Handlers (Teleport Abra Gramps & League Guard)
 * 3. Elite Four & Champion Battle Handlers
 * 4. Hall of Fame Induction Handler
 * 5. Sequential Chamber Door Step Interceptor
 * 6. Interaction Registration Factory
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */

import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type { NpcInteractionHandler, NpcInteractionRegistration } from '../../types/gameContext';
import type { NpcInteractionContext } from '../../types/worldContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { checkHasAllJohtoBadges } from './VictoryRoadGateInteractions';

// ============================================================================
// 1. Types & Dialogue Constants
// ============================================================================

export const WILL_CHALLENGE_DIALOGUE: string[] = [
  'WILL: Welcome to the POKéMON LEAGUE!',
  'I am WILL, master of psychic power!',
  'I have trained all over the world to hone my psychic powers.',
  'Even if you defeated all 8 GYM LEADERS, you cannot break through my mind!',
  "Let's begin!",
];

export const WILL_DEFEAT_DIALOGUE: string[] = [
  'WILL: …I cannot believe it.',
  'Even with my foresight, I could not envision my defeat.',
  'Go forth, challenger! The door to the next room is open!',
];

export const WILL_POST_DEFEAT_DIALOGUE: string[] = [
  'WILL: You have demonstrated true insight and mental fortitude. Go on to the next room.',
];

export const KOGA_CHALLENGE_DIALOGUE: string[] = [
  'KOGA: Fwahahaha! A mere child reached me?!',
  'I am KOGA of the ELITE FOUR!',
  'I have mastered ancient ninja techniques and toxic poisons!',
  'Feel the creeping dread of darkness and despair!',
];

export const KOGA_DEFEAT_DIALOGUE: string[] = [
  'KOGA: Ah! I have been outmaneuvered!',
  'A true ninja bows to superior tactics and heart.',
  'Advance to the next chamber!',
];

export const KOGA_POST_DEFEAT_DIALOGUE: string[] = [
  'KOGA: Fwahaha! Your resilience against our toxins was extraordinary. The door to BRUNO is open.',
];

export const BRUNO_CHALLENGE_DIALOGUE: string[] = [
  'BRUNO: I am BRUNO of the ELITE FOUR!',
  'Through rigorous training, humans and POKéMON become one!',
  'We have lived and trained together in the deepest mountains!',
  'Feel our iron fists of pure power!',
];

export const BRUNO_DEFEAT_DIALOGUE: string[] = [
  'BRUNO: Having lost, I have no regrets!',
  'We gave it everything we had!',
  "Pass through to KAREN's room!",
];

export const BRUNO_POST_DEFEAT_DIALOGUE: string[] = [
  'BRUNO: You have shown true spirit and discipline. Face KAREN with the same resolve!',
];

export const KAREN_CHALLENGE_DIALOGUE: string[] = [
  'KAREN: I am KAREN of the ELITE FOUR.',
  'Strong POKéMON. Weak POKéMON. That is only the selfish perception of people.',
  'Truly skilled trainers should try to win with their favorites.',
  "Let me show you what a real bond can achieve!",
];

export const KAREN_DEFEAT_DIALOGUE: string[] = [
  'KAREN: Strong POKéMON. Weak POKéMON.',
  'You understand what it takes to bring out the greatness in your partners.',
  'The CHAMPION is waiting for you in the final room.',
];

export const KAREN_POST_DEFEAT_DIALOGUE: string[] = [
  'KAREN: Go meet the CHAMPION. You have the heart of a true master.',
];

export const LANCE_CHALLENGE_DIALOGUE: string[] = [
  'LANCE: I have been waiting for you, trainer.',
  'I knew that you, with your valor and bond, would reach me.',
  'There is no need for words now. As the POKéMON LEAGUE CHAMPION, I accept your challenge!',
  "Dragon-types are invincible! Let's begin!",
];

export const LANCE_DEFEAT_DIALOGUE: string[] = [
  "LANCE: …It's over.",
  "But it's an odd feeling. I'm not angry that I lost.",
  "In fact, I feel a sense of satisfaction.",
  "You've earned the right to call yourself the POKéMON LEAGUE CHAMPION!",
];

export const OAK_AND_MARY_DIALOGUE: string[] = [
  'PROF. OAK: Ah, congratulations! It has been quite a while since I last saw someone with such passion and bond with their POKéMON!',
  'MARY: Oh, wow! I wanted to interview you for POKéMON TALK, but LANCE is already taking you to the back!',
  'LANCE: Come with me. Beyond this door lies the HALL OF FAME where champions and their Pokémon are honored for eternity!',
];

export const HALL_OF_FAME_INDUCTION_DIALOGUE: string[] = [
  'LANCE: It has been a long time since I last brought anyone here.',
  'Here we record the names and party of those who triumphed over the ELITE FOUR and the CHAMPION.',
  'Their names and feats are preserved in the HALL OF FAME for all eternity!',
  'Please accept this S.S. TICKET for the luxury liner S.S. AQUA in Olivine City. A whole new journey in KANTO awaits you!',
];

// ============================================================================
// 2. Lobby Handlers (Teleport Abra Gramps & League Guard)
// ============================================================================

export const handleIndigoTeleportGramps: NpcInteractionHandler = (
  _targetNpc: GridEntity,
  _currentMap: MapData,
  ctx: NpcInteractionContext
) => {
  const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
  const showToast = ctx.showToast || (ctx as any).overworldHUD?.showToast?.bind((ctx as any).overworldHUD);

  openDialogue?.(
    [
      'GRAMPS: Ah! You are challenging the ELITE FOUR? Are you sure you are ready?',
      'If you need to train some more, my ABRA can TELEPORT you home to NEW BARK TOWN in an instant!',
    ],
    '👴 TELEPORT GRAMPS',
    () => {
      BattleAudio.playWarpSound('CAVE_WARP');
      ctx.executeWarpTransition?.({
        targetMapId: 'new_bark_town',
        targetX: 9,
        targetY: 6,
        x: 9,
        y: 6,
        direction: 'DOWN',
      });
      showToast?.('🔮 Abra teleported you safely back to New Bark Town!');
    }
  );
  return true;
};

export const handleIndigoLeagueGuard: NpcInteractionHandler = (
  _targetNpc: GridEntity,
  _currentMap: MapData,
  ctx: NpcInteractionContext
) => {
  const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
  const has8Badges = checkHasAllJohtoBadges(ctx.inventory?.badges, ctx.storyFlags);
  const hasDefeatedRival = ctx.storyFlags.has('victory_road_rival_defeated');

  if (!has8Badges || !hasDefeatedRival) {
    BattleAudio.playMenuSound('CANCEL');
    openDialogue?.(
      [
        'GUARD: You cannot challenge the ELITE FOUR until you have conquered all 8 JOHTO GYMS and proven your strength against RIVAL SILVER in VICTORY ROAD!',
      ],
      '👮 LEAGUE GUARD'
    );
    return true;
  }

  openDialogue?.(
    [
      'GUARD: You have earned all 8 JOHTO BADGES and conquered VICTORY ROAD.',
      'Beyond this door lie the chambers of the ELITE FOUR.',
      'Proceed with courage, trainer!',
    ],
    '👮 LEAGUE GUARD'
  );
  return true;
};

// ============================================================================
// 3. Elite Four & Champion Battle Handlers
// ============================================================================

export function createEliteFourMemberHandler(
  memberId: 'will' | 'koga' | 'bruno' | 'karen' | 'lance',
  flag: string,
  trainerId: string,
  challengeDialogue: string[],
  defeatDialogue: string[],
  postDefeatDialogue: string[],
  toastMsg: string
): NpcInteractionHandler {
  return (targetNpc: GridEntity, currentMap: MapData, ctx: NpcInteractionContext) => {
    const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
    const showToast = ctx.showToast || (ctx as any).overworldHUD?.showToast?.bind((ctx as any).overworldHUD);
    const speaker = targetNpc.speaker || 'ELITE FOUR';

    if (ctx.storyFlags.has(flag)) {
      openDialogue?.(postDefeatDialogue, speaker);
      return true;
    }

    openDialogue?.(challengeDialogue, speaker, () => {
      const team = ctx.buildTrainerTeamInstances ? ctx.buildTrainerTeamInstances(targetNpc) : [];
      if (team.length === 0) return;

      ctx.audioManager?.playBattleBgm?.('gym_leader');
      ctx.triggerBattle(team[0], {
        isTrainer: true,
        isGymLeader: true,
        trainerName: targetNpc.trainerName || speaker,
        trainerTeam: team,
        onVictory: () => {
          ctx.storyFlags.add(flag);
          ctx.defeatedTrainers.add(trainerId);

          if (memberId === 'lance') {
            ctx.storyFlags.add('lance_defeated');
            ctx.storyFlags.add('champion_lance_defeated');
            ctx.storyFlags.add('champion_defeated');
            ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
            ctx.missionManager?.completeMission?.('M12');
          }

          BattleAudio.playOverworldSound('KEY_ITEM');

          if (memberId === 'lance') {
            openDialogue?.([...defeatDialogue, ...OAK_AND_MARY_DIALOGUE], speaker, () => {
              showToast?.(toastMsg);
              ctx.saveCurrentGame?.();
              if (currentMap) ctx.renderMap?.(currentMap);
            });
          } else {
            openDialogue?.(defeatDialogue, speaker, () => {
              showToast?.(toastMsg);
              ctx.saveCurrentGame?.();
              if (currentMap) ctx.renderMap?.(currentMap);
            });
          }
        },
      });
    });
    return true;
  };
}

export const handleWillBattle = createEliteFourMemberHandler(
  'will',
  'will_defeated',
  'will',
  WILL_CHALLENGE_DIALOGUE,
  WILL_DEFEAT_DIALOGUE,
  WILL_POST_DEFEAT_DIALOGUE,
  '⭐ Defeated Elite Four Will! Door to Koga is open!'
);

export const handleKogaBattle = createEliteFourMemberHandler(
  'koga',
  'koga_defeated',
  'koga',
  KOGA_CHALLENGE_DIALOGUE,
  KOGA_DEFEAT_DIALOGUE,
  KOGA_POST_DEFEAT_DIALOGUE,
  '⭐ Defeated Elite Four Koga! Door to Bruno is open!'
);

export const handleBrunoBattle = createEliteFourMemberHandler(
  'bruno',
  'bruno_defeated',
  'bruno',
  BRUNO_CHALLENGE_DIALOGUE,
  BRUNO_DEFEAT_DIALOGUE,
  BRUNO_POST_DEFEAT_DIALOGUE,
  '⭐ Defeated Elite Four Bruno! Door to Karen is open!'
);

export const handleKarenBattle = createEliteFourMemberHandler(
  'karen',
  'karen_defeated',
  'karen',
  KAREN_CHALLENGE_DIALOGUE,
  KAREN_DEFEAT_DIALOGUE,
  KAREN_POST_DEFEAT_DIALOGUE,
  '⭐ Defeated Elite Four Karen! Door to Champion Lance is open!'
);

export const handleLanceBattle = createEliteFourMemberHandler(
  'lance',
  'champion_defeated',
  'lance',
  LANCE_CHALLENGE_DIALOGUE,
  LANCE_DEFEAT_DIALOGUE,
  [
    'LANCE: You are the new POKéMON LEAGUE CHAMPION! Proceed to the HALL OF FAME to enshrine your partners!',
  ],
  '👑 Defeated Champion Lance! Way to Hall of Fame is open!'
);

// ============================================================================
// 4. Hall of Fame Induction Handler
// ============================================================================

export const handleHallOfFameEvent: NpcInteractionHandler = (
  _targetNpc: GridEntity,
  currentMap: MapData,
  ctx: NpcInteractionContext
) => {
  const openDialogue = ctx.openDialogue || (ctx as any).overworldHUD?.openDialogue?.bind((ctx as any).overworldHUD);
  const showToast = ctx.showToast || (ctx as any).overworldHUD?.showToast?.bind((ctx as any).overworldHUD);

  if (ctx.storyFlags.has('hall_of_fame_inducted')) {
    openDialogue?.(
      [
        'LANCE: Welcome back, CHAMPION! Your name and the feats of your team shine forever in the records of the HALL OF FAME!',
      ],
      '👑 CHAMPION LANCE'
    );
    return true;
  }

  openDialogue?.(HALL_OF_FAME_INDUCTION_DIALOGUE, '👑 CHAMPION LANCE', () => {
    // Record party into save state
    (ctx as any).hallOfFameRecord = (ctx.playerParty || []).map((p) => ({
      speciesId: p.speciesId,
      level: p.level,
      nickname: p.nickname || p.speciesId.toUpperCase(),
    }));

    if (!ctx.inventory.keyItems) ctx.inventory.keyItems = [];
    if (!ctx.inventory.keyItems.includes('ss-ticket')) {
      ctx.inventory.keyItems.push('ss-ticket');
    }
    ctx.storyFlags.add('has_ss_ticket');
    ctx.storyFlags.add('hall_of_fame_inducted');

    ctx.missionManager?.checkStoryFlags?.(ctx.storyFlags);
    ctx.missionManager?.completeMission?.('M12');

    BattleAudio.playOverworldSound('KEY_ITEM');
    showToast?.('🏆 INDUCTED INTO THE HALL OF FAME! Received S.S. TICKET!');
    ctx.saveCurrentGame?.();
    if (currentMap) ctx.renderMap?.(currentMap);
  });

  return true;
};

// ============================================================================
// 5. Sequential Chamber Door Step Interceptor
// ============================================================================

export function handleEliteFourStep(
  coord: { x: number; y: number },
  currentMap: MapData,
  ctx: any
): boolean {
  if (!currentMap) return false;
  const mapId = currentMap.id;
  const openDialogue = ctx.openDialogue || ctx.overworldHUD?.openDialogue?.bind(ctx.overworldHUD);
  const storyFlags: Set<string> = ctx.storyFlags || new Set();

  const haltPlayer = (msg: string, speaker: string = '🔒 SEALED DOOR') => {
    if (ctx.player) {
      ctx.player.isMoving = false;
      ctx.player.progress = 0;
    }
    ctx.setCutsceneLocked?.(false);
    BattleAudio.playMenuSound('CANCEL');
    openDialogue?.([msg], speaker);
    return true;
  };

  // 1. Wills Room
  if (mapId === 'wills_room') {
    if (coord.y === 17 && coord.x === 5) {
      return haltPlayer('The door is sealed shut! You cannot turn back until the trial is complete!');
    }
    if (coord.y === 2 && (coord.x === 4 || coord.x === 5) && !storyFlags.has('will_defeated')) {
      return haltPlayer('The door ahead is firmly sealed! You must defeat the ELITE FOUR member first!');
    }
  }

  // 2. Kogas Room
  if (mapId === 'kogas_room') {
    if (coord.y === 17 && (coord.x === 4 || coord.x === 5)) {
      return haltPlayer('The door is sealed shut! You cannot turn back until the trial is complete!');
    }
    if (coord.y === 2 && (coord.x === 4 || coord.x === 5) && !storyFlags.has('koga_defeated')) {
      return haltPlayer('The door ahead is firmly sealed! You must defeat the ELITE FOUR member first!');
    }
  }

  // 3. Brunos Room
  if (mapId === 'brunos_room') {
    if (coord.y === 17 && (coord.x === 4 || coord.x === 5)) {
      return haltPlayer('The door is sealed shut! You cannot turn back until the trial is complete!');
    }
    if (coord.y === 2 && (coord.x === 4 || coord.x === 5) && !storyFlags.has('bruno_defeated')) {
      return haltPlayer('The door ahead is firmly sealed! You must defeat the ELITE FOUR member first!');
    }
  }

  // 4. Karens Room
  if (mapId === 'karens_room') {
    if (coord.y === 17 && (coord.x === 4 || coord.x === 5)) {
      return haltPlayer('The door is sealed shut! You cannot turn back until the trial is complete!');
    }
    if (coord.y === 2 && (coord.x === 4 || coord.x === 5) && !storyFlags.has('karen_defeated')) {
      return haltPlayer('The door ahead is firmly sealed! You must defeat the ELITE FOUR member first!');
    }
  }

  // 5. Lances Room
  if (mapId === 'lances_room') {
    if (coord.y === 23 && (coord.x === 4 || coord.x === 5)) {
      return haltPlayer('The door is sealed shut! You cannot turn back until the trial is complete!');
    }
    if (coord.y === 1 && (coord.x === 4 || coord.x === 5) && !storyFlags.has('champion_defeated')) {
      return haltPlayer('The door ahead is firmly sealed! You must defeat the CHAMPION first!');
    }
  }

  // 6. Hall of Fame Auto-Induction Altar Step
  if (mapId === 'hall_of_fame') {
    if ((coord.y === 2 || coord.y === 3) && (coord.x === 4 || coord.x === 5) && !storyFlags.has('hall_of_fame_inducted')) {
      if (ctx.player) {
        ctx.player.isMoving = false;
        ctx.player.progress = 0;
        ctx.player.direction = 'UP';
      }
      const lance = {
        id: 'hall_of_fame_lance',
        x: 4,
        y: 2,
        speaker: '👑 CHAMPION LANCE',
      } as GridEntity;
      handleHallOfFameEvent(lance, currentMap, ctx);
      return true;
    }
  }

  return false;
}

// ============================================================================
// 6. Interaction Registration Factory
// ============================================================================

export function getEliteFourAndChampionInteractions(): NpcInteractionRegistration[] {
  return [
    {
      actions: ['E4_WILL_EVENT'],
      npcIds: ['e4_will'],
      handler: handleWillBattle,
    },
    {
      actions: ['E4_KOGA_EVENT'],
      npcIds: ['e4_koga'],
      handler: handleKogaBattle,
    },
    {
      actions: ['E4_BRUNO_EVENT'],
      npcIds: ['e4_bruno'],
      handler: handleBrunoBattle,
    },
    {
      actions: ['E4_KAREN_EVENT'],
      npcIds: ['e4_karen'],
      handler: handleKarenBattle,
    },
    {
      actions: ['CHAMPION_LANCE_EVENT'],
      npcIds: ['champion_lance'],
      handler: handleLanceBattle,
    },
    {
      actions: ['INDIGO_TELEPORT_EVENT'],
      npcIds: ['indigo_teleport_guy'],
      handler: handleIndigoTeleportGramps,
    },
    {
      actions: ['INDIGO_LEAGUE_GUARD'],
      npcIds: ['indigo_league_guard'],
      handler: handleIndigoLeagueGuard,
    },
    {
      actions: ['HALL_OF_FAME_EVENT'],
      npcIds: ['hall_of_fame_lance'],
      handler: handleHallOfFameEvent,
    },
  ];
}
