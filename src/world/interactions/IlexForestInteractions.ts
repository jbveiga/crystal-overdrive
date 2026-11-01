/**
 * @fileoverview IlexForestInteractions domain module implementation.
 * @module world/interactions/IlexForestInteractions
 * @role IlexForestInteractions Component
 * @exports getIlexForestInteractions
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-135: Implementation | L136-270: Handlers & Exports
 */

import type { NpcInteractionRegistration } from '../../types/gameContext';
import type { Direction } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import { BattleAudio } from '../../audio/BattleAudio';

export const FARFETCHD_WAYPOINTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 15, y: 23 },
  { x: 20, y: 24 },
  { x: 29, y: 24 },
  { x: 22, y: 31 },
  { x: 15, y: 29 },
];

export const FARFETCHD_PATH_SEGMENTS: ReadonlyArray<ReadonlyArray<{ x: number; y: number; dir: Direction }>> = [
  // Leg 0: (15, 23) -> (20, 24)
  [
    { x: 16, y: 23, dir: 'RIGHT' },
    { x: 17, y: 23, dir: 'RIGHT' },
    { x: 18, y: 23, dir: 'RIGHT' },
    { x: 19, y: 23, dir: 'RIGHT' },
    { x: 20, y: 23, dir: 'RIGHT' },
    { x: 20, y: 24, dir: 'DOWN' },
  ],
  // Leg 1: (20, 24) -> (29, 24)
  [
    { x: 21, y: 24, dir: 'RIGHT' },
    { x: 22, y: 24, dir: 'RIGHT' },
    { x: 23, y: 24, dir: 'RIGHT' },
    { x: 24, y: 24, dir: 'RIGHT' },
    { x: 25, y: 24, dir: 'RIGHT' },
    { x: 26, y: 24, dir: 'RIGHT' },
    { x: 27, y: 24, dir: 'RIGHT' },
    { x: 28, y: 24, dir: 'RIGHT' },
    { x: 29, y: 24, dir: 'RIGHT' },
  ],
  // Leg 2: (29, 24) -> (22, 31)
  [
    { x: 29, y: 25, dir: 'DOWN' },
    { x: 29, y: 26, dir: 'DOWN' },
    { x: 29, y: 27, dir: 'DOWN' },
    { x: 29, y: 28, dir: 'DOWN' },
    { x: 29, y: 29, dir: 'DOWN' },
    { x: 29, y: 30, dir: 'DOWN' },
    { x: 29, y: 31, dir: 'DOWN' },
    { x: 28, y: 31, dir: 'LEFT' },
    { x: 27, y: 31, dir: 'LEFT' },
    { x: 26, y: 31, dir: 'LEFT' },
    { x: 25, y: 31, dir: 'LEFT' },
    { x: 24, y: 31, dir: 'LEFT' },
    { x: 23, y: 31, dir: 'LEFT' },
    { x: 22, y: 31, dir: 'LEFT' },
  ],
  // Leg 3: (22, 31) -> (15, 29)
  [
    { x: 22, y: 30, dir: 'UP' },
    { x: 22, y: 29, dir: 'UP' },
    { x: 21, y: 29, dir: 'LEFT' },
    { x: 20, y: 29, dir: 'LEFT' },
    { x: 19, y: 29, dir: 'LEFT' },
    { x: 18, y: 29, dir: 'LEFT' },
    { x: 17, y: 29, dir: 'LEFT' },
    { x: 16, y: 29, dir: 'LEFT' },
    { x: 15, y: 29, dir: 'LEFT' },
  ],
];

function animateFarfetchdSegment(
  targetNpc: GridEntity,
  startCoord: { x: number; y: number },
  steps: ReadonlyArray<{ x: number; y: number; dir: Direction }>,
  finalWp: { x: number; y: number }
): void {
  // Update logical coordinates immediately so pathfinding/collision & tests see the destination,
  // then animate visual renderX/renderY & walking frames tile-by-tile along the forest path.
  targetNpc.x = finalWp.x;
  targetNpc.y = finalWp.y;
  targetNpc.gridX = finalWp.x;
  targetNpc.gridY = finalWp.y;
  targetNpc.targetX = finalWp.x;
  targetNpc.targetY = finalWp.y;
  targetNpc.originX = finalWp.x;
  targetNpc.originY = finalWp.y;
  targetNpc.renderX = finalWp.x;
  targetNpc.renderY = finalWp.y;

  if (!steps || steps.length === 0) return;

  let prevX = startCoord.x;
  let prevY = startCoord.y;
  targetNpc.renderX = prevX;
  targetNpc.renderY = prevY;
  targetNpc.isMoving = true;
  targetNpc.progress = 0.25;
  targetNpc.direction = steps[0].dir;

  steps.forEach((step, idx) => {
    const fromX = prevX;
    const fromY = prevY;
    prevX = step.x;
    prevY = step.y;

    // Halfway sub-step for smooth 2-frame walking cycle
    setTimeout(() => {
      targetNpc.direction = step.dir;
      targetNpc.isMoving = true;
      targetNpc.progress = 0.35;
      targetNpc.renderX = fromX + (step.x - fromX) * 0.5;
      targetNpc.renderY = fromY + (step.y - fromY) * 0.5;
    }, idx * 90 + 30);

    // Tile arrival sub-step
    setTimeout(() => {
      targetNpc.direction = step.dir;
      targetNpc.renderX = step.x;
      targetNpc.renderY = step.y;
      if (idx === steps.length - 1) {
        targetNpc.isMoving = false;
        targetNpc.progress = 0;
        targetNpc.direction = 'DOWN';
      } else {
        targetNpc.isMoving = true;
        targetNpc.progress = 0.75;
      }
    }, (idx + 1) * 90);
  });
}

/**
 * IlexForestInteractions — Farfetch'd Herding Puzzle, Charcoal Master & Move Tutors
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export function getIlexForestInteractions(): NpcInteractionRegistration[] {
  return [
    // 1. Ilex Forest: Charcoal Apprentice
    {
      npcIds: ['forest_apprentice'],
      handler: (targetNpc, _map, ctx) => {
        if (
          (ctx.storyFlags.has('EVENT_HERDED_FARFETCHD') || ctx.storyFlags.has('forest_farfetchd_herded')) &&
          !ctx.storyFlags.has('has_hm01_cut')
        ) {
          ctx.storyFlags.add('has_hm01_cut');
          ctx.storyFlags.add('EVENT_GOT_HM01_CUT');
          if (!ctx.inventory.tms) ctx.inventory.tms = [];
          if (!ctx.inventory.tms.includes('HM01')) ctx.inventory.tms.push('HM01');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.openDialogue(
            [
              "APPRENTICE: Thank you so much for bringing FARFETCH'D back!",
              'Here is HM01 CUT from my boss as your reward!',
              `${ctx.playerName} received HM01 CUT!`,
            ],
            targetNpc.speaker,
            () => {
              ctx.saveCurrentGame();
              ctx.showToast('🪓 Received HM01 CUT!');
            }
          );
          return true;
        }
        if (ctx.storyFlags.has('has_hm01_cut') || ctx.storyFlags.has('EVENT_GOT_HM01_CUT')) {
          ctx.openDialogue(
            ["APPRENTICE: Thanks to you, FARFETCH'D is safe and we have HM01 CUT ready to clear the forest path!"],
            targetNpc.speaker
          );
          return true;
        }
        return false;
      },
    },

    // 2. Farfetch'd Herding Puzzle (Animated Tile-by-Tile Running)
    {
      actions: ['FARFETCHD_HERD_EVENT'],
      npcIds: ['forest_farfetchd'],
      handler: (targetNpc, _map, ctx) => {
        const grantCutReward = () => {
          ctx.storyFlags.add('EVENT_HERDED_FARFETCHD');
          ctx.storyFlags.add('forest_farfetchd_herded');
          ctx.storyFlags.add('has_hm01_cut');
          ctx.storyFlags.add('EVENT_GOT_HM01_CUT');
          if (!ctx.inventory.tms) ctx.inventory.tms = [];
          if (!ctx.inventory.tms.includes('HM01')) ctx.inventory.tms.push('HM01');
          BattleAudio.playOverworldSound('KEY_ITEM');
          ctx.saveCurrentGame();
          ctx.showToast("🦆 FARFETCH'D returned! 🪓 Received HM01 CUT from the Charcoal Master!");
        };

        if (ctx.storyFlags.has('EVENT_HERDED_FARFETCHD')) {
          if (!ctx.storyFlags.has('has_hm01_cut')) {
            grantCutReward();
          }
          ctx.openDialogue(
            ["FARFETCH'D: Quaaack! It is resting happily beside the apprentice and Charcoal Master."],
            targetNpc.speaker
          );
          return true;
        }

        const startCoord = { x: targetNpc.x, y: targetNpc.y };
        let currentWpIdx = FARFETCHD_WAYPOINTS.findIndex(
          (wp) => wp.x === targetNpc.x && wp.y === targetNpc.y
        );
        if (currentWpIdx === -1) currentWpIdx = 0;
        const nextWpIdx = currentWpIdx + 1;

        if (nextWpIdx >= FARFETCHD_WAYPOINTS.length) {
          BattleAudio.playCry('farfetchd');
          ctx.openDialogue(
            [
              "FARFETCH'D: Quaaack!",
              "FARFETCH'D ran safely back to the Charcoal Apprentice!",
              "CHARCOAL MASTER: Ah! You rounded up my naughty FARFETCH'D! Take this HM01 CUT as my sincere thanks!",
              `${ctx.playerName} received HM01 CUT!`,
            ],
            targetNpc.speaker,
            () => {
              grantCutReward();
            }
          );
          return true;
        }

        const nextWp = FARFETCHD_WAYPOINTS[nextWpIdx];
        const pathSteps = FARFETCHD_PATH_SEGMENTS[currentWpIdx] || [{ x: nextWp.x, y: nextWp.y, dir: 'DOWN' as Direction }];
        animateFarfetchdSegment(targetNpc, startCoord, pathSteps, nextWp);

        BattleAudio.playCry('farfetchd');
        BattleAudio.playOverworldSound('RUSTLE');

        if (nextWpIdx === FARFETCHD_WAYPOINTS.length - 1) {
          ctx.openDialogue(
            [
              "FARFETCH'D: Quaaack!",
              "FARFETCH'D was steered all the way back to the Charcoal Apprentice and Charcoal Master!",
              "CHARCOAL MASTER: Ah! You're the young trainer who rounded up my FARFETCH'D! Without it, our business was in big trouble.",
              'Here, take HM01 CUT as my sincere thanks! With the HIVE BADGE, you can chop down small prickly trees blocking your path!',
              `${ctx.playerName} received HM01 CUT!`,
            ],
            targetNpc.speaker,
            () => {
              grantCutReward();
            }
          );
        } else {
          ctx.openDialogue(
            [
              "FARFETCH'D: Quaaack!",
              "FARFETCH'D scurried along the forest path!",
            ],
            targetNpc.speaker
          );
        }
        return true;
      },
    },

    // 3. Charcoal Master HM01 Cut Grant
    {
      actions: ['CHARCOAL_MASTER_EVENT'],
      npcIds: ['cut_master'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_hm01_cut') || ctx.storyFlags.has('EVENT_GOT_HM01_CUT')) {
          ctx.openDialogue(
            [
              'CHARCOAL MASTER: The wood from ILEX FOREST makes the highest quality charcoal in all of JOHTO!',
              'With HM01 CUT, you can chop down small thorny trees blocking paths throughout the region.',
            ],
            targetNpc.speaker
          );
          return true;
        }
        if (ctx.storyFlags.has('EVENT_HERDED_FARFETCHD') || ctx.storyFlags.has('forest_farfetchd_herded')) {
          ctx.openDialogue(
            [
              "CHARCOAL MASTER: Ah! You're the young trainer who rounded up my naughty FARFETCH'D!",
              'That bird cuts charcoal wood for our kiln! Without it, our business was in big trouble.',
              'Here, take this HM as my sincere thanks!',
              `${ctx.playerName} received HM01 CUT!`,
              'Teach it to a POKéMON, and with the HIVE BADGE you can cut down prickly trees!',
            ],
            targetNpc.speaker,
            () => {
              ctx.storyFlags.add('has_hm01_cut');
              ctx.storyFlags.add('EVENT_GOT_HM01_CUT');
              if (!ctx.inventory.tms) ctx.inventory.tms = [];
              if (!ctx.inventory.tms.includes('HM01')) ctx.inventory.tms.push('HM01');
              BattleAudio.playOverworldSound('KEY_ITEM');
              ctx.saveCurrentGame();
              ctx.showToast('🪓 Received HM01 CUT from the Charcoal Master!');
            }
          );
          return true;
        }
        ctx.openDialogue(
          [
            "CHARCOAL MASTER: Oh no... Our FARFETCH'D ran off into the deep woods!",
            "Without that bird, we can't collect any charcoal wood for our kiln!",
          ],
          targetNpc.speaker
        );
        return true;
      },
    },

    // 4. Headbutt Move Tutor
    {
      actions: ['HEADBUTT_TUTOR_EVENT'],
      npcIds: ['headbutt_tutor'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_tm02_headbutt')) {
          ctx.openDialogue(
            ['HEADBUTT GUY: Rattle trees with HEADBUTT! Sometimes rare sleeping POKéMON fall right out on you!'],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            "HEADBUTT GUY: What am I doing? I'm shaking trees using HEADBUTT! It's so much fun!",
            'Here, kid, take this TM and try it on trees yourself!',
            `${ctx.playerName} received TM02 HEADBUTT!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.storyFlags.add('has_tm02_headbutt');
            if (!ctx.inventory.tms) ctx.inventory.tms = [];
            if (!ctx.inventory.tms.includes('TM02')) ctx.inventory.tms.push('TM02');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.saveCurrentGame();
            ctx.showToast('🥊 Received TM02 HEADBUTT from the Headbutt Guy!');
          }
        );
        return true;
      },
    },

    // 5. Sweet Scent Gate Teacher
    {
      actions: ['SWEET_SCENT_TEACHER_EVENT'],
      npcIds: ['gate_teacher'],
      handler: (targetNpc, _map, ctx) => {
        if (ctx.storyFlags.has('has_tm12_sweet_scent')) {
          ctx.openDialogue(
            ["TEACHER: It's SWEET SCENT. Use it wherever POKéMON appear, and wild POKéMON will be enticed by the fragrance!"],
            targetNpc.speaker
          );
          return true;
        }
        ctx.openDialogue(
          [
            "TEACHER: Oh, honey. You're making a POKéDEX? That must be tough trying to find rare POKéMON in the tall grass!",
            'Take this TM! It will help you draw wild POKéMON right out of hiding!',
            `${ctx.playerName} received TM12 SWEET SCENT!`,
          ],
          targetNpc.speaker,
          () => {
            ctx.storyFlags.add('has_tm12_sweet_scent');
            if (!ctx.inventory.tms) ctx.inventory.tms = [];
            if (!ctx.inventory.tms.includes('TM12')) ctx.inventory.tms.push('TM12');
            if (!ctx.inventory.tms.includes('TM12_SWEET_SCENT')) ctx.inventory.tms.push('TM12_SWEET_SCENT');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.saveCurrentGame();
            ctx.showToast('🌸 Received TM12 SWEET SCENT!');
          }
        );
        return true;
      },
    },
  ];
}
