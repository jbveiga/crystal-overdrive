/**
 * @fileoverview KantoAndLeagueInteractions domain module implementation.
 * @module world/interactions/KantoAndLeagueInteractions
 * @role KantoAndLeagueInteractions Component
 * @exports getKantoAndLeagueInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-170: Implementation | L171-341: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';

/**
 * KantoAndLeagueInteractions — Handlers for Late Johto (Pryce, Clair), Kanto Gym Leaders, Elite Four, Champion Lance, Red & Stadium Host.
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getKantoAndLeagueInteractions(): NpcInteractionRegistration[] {
  return [
    // 9. Blackthorn Gym: Clair
    {
      actions: ['CLAIR_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('dragon_elder_quiz_passed') || ctx.storyFlags.has('clair_conceded')) {
          ctx.openDialogue(
            ["CLAIR: You passed the DRAGON ELDER's test and earned the RISINGBADGE! Good luck at the POKéMON LEAGUE!"],
            targetNpc.speaker
          );
          return true;
        }
        if (ctx.storyFlags.has('clair_defeated')) {
          ctx.openDialogue(
            [
              "CLAIR: I won't acknowledge this loss yet!",
              "Go behind the GYM into the DRAGON'S DEN and pass the DRAGON ELDER's trial if you want the RISINGBADGE!",
            ],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          targetNpc.challengePages && targetNpc.challengePages.length > 0
            ? targetNpc.challengePages
            : ['CLAIR: I am the best dragon master! Not even you can defeat me!'],
          targetNpc.speaker,
          () => {
            const team = ctx.buildTrainerTeamInstances(targetNpc);
            if (team.length === 0) return;
            ctx.triggerBattle(team[0], {
              isTrainer: true,
              isGymLeader: true,
              trainerName: targetNpc.trainerName || 'Leader Clair',
              trainerTeam: team,
              onVictory: () => {
                ctx.defeatedTrainers.add('clair');
                ctx.storyFlags.add('clair_defeated');
                ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                ctx.openDialogue(
                  [
                    "CLAIR: I... I lost?! But... I won't acknowledge it!",
                    "I refuse to hand over the BADGE until you take the DRAGON USER's test!",
                    "Enter the DRAGON'S DEN behind the GYM and pass the DRAGON ELDER's trial!",
                  ],
                  targetNpc.speaker,
                  () => {
                    ctx.saveCurrentGame();
                    ctx.showToast("🐉 Defeated Leader Clair! Enter Dragon's Den for the Elder's trial!");
                  }
                );
              },
            });
          }
        );
        return true;
      },
    },

    // 10. Kanto Gym Leaders (Brock, Misty, Surge, Erika, Janine, Sabrina, Blaine, Blue)
    {
      actions: [
        'BROCK_EVENT',
        'MISTY_EVENT',
        'SURGE_EVENT',
        'ERIKA_EVENT',
        'JANINE_EVENT',
        'SABRINA_EVENT',
        'BLAINE_EVENT',
        'BLUE_EVENT',
      ],
      handler: (targetNpc, _map, ctx) => {
        const kantoLeaderConfigs: Record<
          string,
          { flag: string; badge: string; tm: string; toast: string; dialogue: string; fallbackChallenge: string }
        > = {
          BROCK_EVENT: {
            flag: 'brock_defeated',
            badge: 'boulder',
            tm: 'TM34',
            toast: '🪨 Received BOULDER BADGE & TM34 from Leader Brock!',
            dialogue: 'BROCK: My rock-hard willpower was shaken! Take the BOULDERBADGE and TM34 ROLLOUT!',
            fallbackChallenge: 'BROCK: I am Brock, the Pewter Gym Leader! My rock Pokémon are solid defense!',
          },
          MISTY_EVENT: {
            flag: 'misty_defeated',
            badge: 'cascade',
            tm: 'TM03',
            toast: '💧 Received CASCADE BADGE & TM03 from Leader Misty!',
            dialogue: 'MISTY: You really are an exceptional trainer! Take the CASCADEBADGE and TM03 WATER PULSE!',
            fallbackChallenge: 'MISTY: I am Misty, the world-famous water Pokémon master!',
          },
          SURGE_EVENT: {
            flag: 'surge_defeated',
            badge: 'thunder',
            tm: 'TM25',
            toast: '⚡ Received THUNDER BADGE & TM25 from Leader Lt. Surge!',
            dialogue: 'LT. SURGE: Ten-hut! You zapped right through my defenses! Take the THUNDERBADGE and TM25 THUNDER!',
            fallbackChallenge: 'LT. SURGE: Hey kid, what do you think you are doing? Electric Pokémon will shock you!',
          },
          ERIKA_EVENT: {
            flag: 'erika_defeated',
            badge: 'rainbow',
            tm: 'TM19',
            toast: '🌸 Received RAINBOW BADGE & TM19 from Leader Erika!',
            dialogue: 'ERIKA: Oh, what a splendid battle. You deserve this RAINBOWBADGE and TM19 GIGA DRAIN.',
            fallbackChallenge: "ERIKA: Hello... Lovely weather, isn't it? I only study grass-type Pokémon.",
          },
          JANINE_EVENT: {
            flag: 'janine_defeated',
            badge: 'soul',
            tm: 'TM06',
            toast: '🥷 Received SOUL BADGE & TM06 from Leader Janine!',
            dialogue: 'JANINE: Fooled by my poison techniques? No, you saw right through them! Take the SOULBADGE and TM06 TOXIC!',
            fallbackChallenge: 'JANINE: Fufufu! I am the poison ninja master Janine! Try to hit what you cannot see!',
          },
          SABRINA_EVENT: {
            flag: 'sabrina_defeated',
            badge: 'marsh',
            tm: 'TM29',
            toast: '🔮 Received MARSH BADGE & TM29 from Leader Sabrina!',
            dialogue: 'SABRINA: I foresaw your victory... Take the MARSHBADGE and TM29 PSYCHIC.',
            fallbackChallenge: 'SABRINA: I knew you would challenge me. Psychic power cannot be overcome so easily.',
          },
          BLAINE_EVENT: {
            flag: 'blaine_defeated',
            badge: 'volcano',
            tm: 'TM38',
            toast: '🌋 Received VOLCANO BADGE & TM38 from Leader Blaine!',
            dialogue: 'BLAINE: Hah! My fiery spirit was extinguished! Take the VOLCANOBADGE and TM38 FIRE BLAST!',
            fallbackChallenge: 'BLAINE: Hah! I am Blaine, the red-hot quiz master of Cinnabar!',
          },
          BLUE_EVENT: {
            flag: 'blue_defeated',
            badge: 'earth',
            tm: 'TM26',
            toast: '🌍 Received EARTH BADGE & TM26 from Leader Blue!',
            dialogue: 'BLUE: Unbelievable... You really are something else! Take the EARTHBADGE and TM26 EARTHQUAKE!',
            fallbackChallenge: 'BLUE: Yo! You finally made it to the Viridian Gym. Show me what Johto trainers are made of!',
          },
        };

        const leaderConfig = kantoLeaderConfigs[targetNpc.action || ''];
        if (leaderConfig && !ctx.storyFlags.has(leaderConfig.flag)) {
          ctx.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0
              ? targetNpc.challengePages
              : [leaderConfig.fallbackChallenge],
            targetNpc.speaker,
            () => {
              const team = ctx.buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              ctx.triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Gym Leader',
                trainerTeam: team,
                onVictory: () => {
                  ctx.defeatedTrainers.add(targetNpc.trainerId || leaderConfig.flag);
                  ctx.storyFlags.add(leaderConfig.flag);
                  if (!ctx.inventory.badges.includes(leaderConfig.badge)) ctx.inventory.badges.push(leaderConfig.badge);
                  if (!ctx.inventory.tms.includes(leaderConfig.tm)) ctx.inventory.tms.push(leaderConfig.tm);
                  ctx.audioManager.playSfx?.('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  ctx.openDialogue(
                    [leaderConfig.dialogue],
                    targetNpc.speaker,
                    () => {
                      ctx.saveCurrentGame();
                      ctx.showToast(leaderConfig.toast);
                    }
                  );
                },
              });
            }
          );
          return true;
        }
        return false;
      },
    },

    // 11. Elite Four, Champion Lance & Red
    {
      actions: [
        'E4_EVENT',
        'CHAMPION_LANCE_EVENT',
        'E4_WILL_EVENT',
        'E4_KOGA_EVENT',
        'E4_BRUNO_EVENT',
        'E4_KAREN_EVENT',
        'CHAMPION_EVENT',
        'RED_EVENT',
      ],
      handler: (targetNpc, _map, ctx) => {
        if (!ctx.storyFlags.has(`${targetNpc.trainerId}_defeated`)) {
          ctx.openDialogue(
            targetNpc.challengePages && targetNpc.challengePages.length > 0 ? targetNpc.challengePages : ['Prepare yourself!'],
            targetNpc.speaker,
            () => {
              const team = ctx.buildTrainerTeamInstances(targetNpc);
              if (team.length === 0) return;
              ctx.triggerBattle(team[0], {
                isTrainer: true,
                isGymLeader: true,
                trainerName: targetNpc.trainerName || 'Elite Trainer',
                trainerTeam: team,
                onVictory: () => {
                  ctx.defeatedTrainers.add(targetNpc.trainerId || 'e4');
                  ctx.storyFlags.add(`${targetNpc.trainerId}_defeated`);
                  if (targetNpc.trainerId === 'karen') {
                    ctx.storyFlags.add('karen_defeated');
                  }
                  ctx.audioManager.playSfx?.('sfx_badge_get');
                  BattleAudio.playOverworldSound('KEY_ITEM');
                  const champion = targetNpc.trainerId === 'lance';
                  if (champion) {
                    ctx.storyFlags.add('lance_defeated');
                    ctx.storyFlags.add('champion_lance_defeated');
                    ctx.storyFlags.add('champion_defeated');
                    ctx.addOverworldItemToInventory('ss-ticket');
                    ctx.missionManager.checkStoryFlags(ctx.storyFlags);
                    ctx.missionManager.completeMission('M12');
                  }
                  ctx.openDialogue(
                    [
                      champion
                        ? 'LANCE: ...It is over. You and your Pokémon possess unbreakable spirit and mutual trust! Welcome to the HALL OF FAME! You are the new POKéMON LEAGUE CHAMPION! Please accept this S.S. AQUA TICKET for your travels to Kanto!'
                        : `${targetNpc.speaker}: You have defeated me! Proceed to the next chamber!`,
                    ],
                    targetNpc.speaker,
                    () => {
                      ctx.saveCurrentGame();
                      ctx.showToast(
                        champion
                          ? '👑 INDUCTED INTO THE HALL OF FAME! YOU ARE THE LEAGUE CHAMPION!'
                          : `⭐ Defeated ${targetNpc.trainerName || targetNpc.speaker}!`
                      );
                    }
                  );
                },
              });
            }
          );
          return true;
        }
        return false;
      },
    },

    // 12. Stadium Host Interaction
    {
      actions: ['STADIUM_HOST_EVENT'],
      handler: (targetNpc, _map, ctx) => {
        ctx.openDialogue(
          [
            'STADIUM HOST: Welcome to the POKéMON STADIUM Arena!',
            'Here trainers engage in standard and double battles under special rules.',
          ],
          targetNpc.speaker,
          () => {
            if (targetNpc.trainerId) {
              ctx.launchStadiumChallenge(targetNpc.trainerId, 'prime_cup');
            }
          }
        );
        return true;
      },
    },
  ];
}
