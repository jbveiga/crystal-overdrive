/**
 * @fileoverview Route36AndNationalParkInteractions domain module implementation.
 * Handles Route 36 Sudowoodo Boss Encounter, Rock Smash Guy TM08, National Park Quick Claw Teacher,
 * and National Park Bug-Catching Contest Officer.
 * @module world/interactions/Route36AndNationalParkInteractions
 * @role Route36AndNationalParkInteractions Component
 * @exports getRoute36AndNationalParkInteractions
 * @layer world
 * @sections L1-16: Micro-Header & Imports | L17-130: Sudowoodo & Rock Smash TM08 | L131-246: Quick Claw & Bug-Catching Contest
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import { BattleAudio } from '../../audio/BattleAudio';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { isContestDay } from '../BugContestManager';

export function getRoute36AndNationalParkInteractions(): NpcInteractionRegistration[] {
  return [
    // 10. Route 36: Sudowoodo Boss Encounter
    {
      actions: ['SUDOWOODO_EVENT'],
      npcIds: ['sudowoodo'],
      handler: (targetNpc, _map, ctx) => {
        const wiggleTree = async () => {
          const origX = targetNpc.x;
          for (const offset of [-0.14, 0.14, -0.1, 0.1, 0]) {
            targetNpc.renderX = origX + offset;
            await new Promise((r) => setTimeout(r, 55));
          }
          targetNpc.renderX = origX;
        };

        const hasSquirtbottle =
          ctx.storyFlags.has('has_squirtbottle') ||
          ctx.storyFlags.has('HAS_SQUIRTBOTTLE') ||
          ctx.storyFlags.has('EVENT_GOT_SQUIRTBOTTLE') ||
          Boolean(ctx.inventory.keyItems?.some((k) => k.toLowerCase() === 'squirtbottle'));

        if (!hasSquirtbottle) {
          BattleAudio.playOverworldSound('RUSTLE');
          wiggleTree();
          ctx.openDialogue(["It's a weird tree. It seems to wiggle when touched!"], '🌲 WEIRD TREE');
          return true;
        }

        BattleAudio.playOverworldSound('RUSTLE');
        wiggleTree();
        ctx.openDialogue(
          [
            "It's a weird tree. Use SQUIRTBOTTLE?",
            `${ctx.playerName} sprinkled water with the SQUIRTBOTTLE!`,
            'Sudowoodo hated the water! It attacked!',
          ],
          '🌲 SUDOWOODO',
          () => {
            BattleAudio.playCry('sudowoodo');
            const sudowoodoPkmn = PokemonFactory.create('sudowoodo', 20, [
              'rockthrow',
              'flail',
              'lowkick',
              'mimic',
            ]);
            ctx.triggerBattle(sudowoodoPkmn, {
              onBattleEnd: () => {
                ctx.storyFlags.add('sudowoodo_cleared');
                ctx.storyFlags.add('EVENT_FOUGHT_SUDOWOODO');
                if (ctx.npcsByMap.route_36) {
                  ctx.npcsByMap.route_36 = ctx.npcsByMap.route_36.filter((n) => n.id !== 'sudowoodo');
                }
                const mapNow = ctx.mapManager.getCurrentMap();
                if (mapNow) {
                  ctx.renderMap?.(mapNow);
                  ctx.syncMapOverworldItems?.(mapNow);
                }
                ctx.saveCurrentGame();
              },
            });
          }
        );
        return true;
      },
    },

    // 11. Route 36: Rock Smash Guy TM08 Event
    {
      actions: ['ROCK_SMASH_GUY_EVENT'],
      npcIds: ['hard_rock_guy'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_TM08_ROCK_SMASH')) {
          ctx.openDialogue(
            [
              'That happens to be ROCK SMASH.',
              'You can shatter rocks with just a single well-aimed smack.',
              "If any rocks are in your way, just smash 'em up!",
            ],
            '🥊 ROCK SMASH GUY'
          );
          return true;
        }

        if (ctx.storyFlags.has('EVENT_FOUGHT_SUDOWOODO') || ctx.storyFlags.has('sudowoodo_cleared')) {
          ctx.openDialogue(
            ['Did you clear that wretched tree?', "I'm impressed! I want you to have this."],
            '🥊 ROCK SMASH GUY',
            () => {
              BattleAudio.playOverworldSound('FANFARE');
              ctx.addOverworldItemToInventory('TM08');
              ctx.storyFlags.add('EVENT_GOT_TM08_ROCK_SMASH');
              ctx.saveCurrentGame();
              ctx.showToast('Received TM08 (ROCK SMASH)!');
              ctx.openDialogue(
                [
                  'That happens to be ROCK SMASH.',
                  'You can shatter rocks with just a single well-aimed smack.',
                  "If any rocks are in your way, just smash 'em up!",
                ],
                '🥊 ROCK SMASH GUY'
              );
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Wa-hey!',
            'I was going to snap that tree with my straight-arm punch.',
            "But I couldn't! I'm a failure!",
          ],
          '🥊 ROCK SMASH GUY'
        );
        return true;
      },
    },

    // 12. National Park: Quick Claw Teacher Event
    {
      actions: ['QUICK_CLAW_EVENT'],
      npcIds: ['quick_claw_teacher'],
      handler: (_targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('EVENT_GOT_QUICK_CLAW')) {
          ctx.openDialogue(
            ['Let a POKéMON hold that QUICK CLAW.', 'Sometimes it will strike first during battle.'],
            '👩‍🏫 TEACHER'
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Pay attention, please!',
            '…Oops, I have to quit thinking like a teacher all the time.',
            'You must be a POKéMON trainer.',
            "Since you're working so hard, I want you to have this.",
          ],
          '👩‍🏫 TEACHER',
          () => {
            BattleAudio.playOverworldSound('FANFARE');
            ctx.addOverworldItemToInventory('quick_claw');
            ctx.storyFlags.add('EVENT_GOT_QUICK_CLAW');
            ctx.saveCurrentGame();
            ctx.showToast('Received QUICK CLAW!');
            ctx.openDialogue(
              ['Let a POKéMON hold that QUICK CLAW.', 'Sometimes it will strike first during battle.'],
              '👩‍🏫 TEACHER'
            );
          }
        );
        return true;
      },
    },

    // 13. National Park Gates: Bug-Catching Contest Officer
    {
      actions: ['BUG_CONTEST_OFFICER_EVENT'],
      npcIds: ['park_gate_officer'],
      handler: (_targetNpc, _map, ctx) => {
        const dayIndex = ctx.gameClock.getDayOfWeek();
        const isContestActiveToday = isContestDay(dayIndex);

        if (!isContestActiveToday) {
          ctx.openDialogue(
            [
              'The Bug-Catching Contest is held on Tuesday, Thursday and Saturday.',
              'Not only do you earn a prize just for participating, you also get to keep the bug POKéMON you catch!',
            ],
            '👮 PARK OFFICER'
          );
          return true;
        }

        if (ctx.bugContestManager.state.isActive) {
          ctx.openDialogue(
            [
              "You're currently participating in the Bug-Catching Contest!",
              'Would you like to conclude your contest and tally your score now?',
            ],
            '👮 PARK OFFICER',
            () => {
              const result = ctx.bugContestManager.endContest(ctx.playerName);
              ctx.destroyBugContestHUD?.();
              BattleAudio.playOverworldSound('FANFARE');
              ctx.addOverworldItemToInventory(result.prizeItem);
              ctx.storyFlags.add('EVENT_BUG_CATCHING_CONTEST_COMPLETED');
              if (result.rank === 1) {
                ctx.storyFlags.add('EVENT_BUG_CATCHING_CONTEST_1ST_PRIZE');
              }
              ctx.saveCurrentGame();
              ctx.showToast(
                result.isNewPersonalBest
                  ? `🏆 New Personal Best (${result.score} pts)! Prize: ${result.prizeName}!`
                  : `Received Prize: ${result.prizeName}!`
              );
              ctx.openDialogue(
                [
                  `CONTEST RESULTS: You placed Rank ${result.rank}!`,
                  `Evaluated Grade: ${result.grade} with ${result.score} Points!${
                    result.isNewPersonalBest ? ' (NEW PERSONAL RECORD!)' : ''
                  }`,
                  `Here is your prize: ${result.prizeName}! View the Top 5 standings anytime in START MENU → CONTESTS!`,
                ],
                '🎤 CONTEST JUDGE'
              );
            }
          );
          return true;
        }

        ctx.openDialogue(
          [
            'Today is the Bug-Catching Contest!',
            'You get 20 Park Balls and 20 minutes to catch the strongest bug POKéMON in the park!',
            'Here are your 20 Park Balls! Good luck!',
          ],
          '👮 PARK OFFICER',
          () => {
            ctx.bugContestManager.startContest();
            ctx.mountBugContestHUD?.(20, 1200);
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.showToast('Bug-Catching Contest Started! (20 Park Balls)');
          }
        );
        return true;
      },
    },
    {
      actions: ['ROUTE_36_SUICUNE_EVENT'],
      npcIds: ['route_36_suicune'],
      handler: (targetNpc, _map, ctx) => {
        if (typeof (ctx as any).triggerRoute36Suicune === 'function') {
          (ctx as any).triggerRoute36Suicune();
          return true;
        }
        BattleAudio.playCry('suicune');
        ctx.storyFlags.add('EVENT_SAW_SUICUNE_ON_ROUTE_36');
        ctx.openDialogue(
          [
            'SUICUNE: Gurr-oooh!',
            'SUICUNE locks eyes with you, leaps over the trees, and dashes away across Johto!',
          ],
          targetNpc.speaker || '💎 SUICUNE',
          () => {
            ctx.showToast?.('💎 Spotted Suicune on Route 36!');
            if (_map) ctx.renderMap?.(_map);
          }
        );
        return true;
      },
    },
  ];
}
