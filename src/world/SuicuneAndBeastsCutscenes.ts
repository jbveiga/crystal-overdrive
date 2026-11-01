/**
 * @fileoverview SuicuneAndBeastsCutscenes domain module implementation.
 * @module world/SuicuneAndBeastsCutscenes
 * @role Legendary Beasts awakening and Suicune/Eusine encounter cutscenes
 * @exports SuicuneAndBeastsCutscenes
 * @layer world
 * @sections L1-115: Burned Tower Beasts Awakening | L116-205: Cianwood & Route 42 Suicune
 */

import { BattleAudio } from '../audio/BattleAudio';
import { PokemonFactory } from '../battle/PokemonFactory';
import { eventBus } from '../core/EventBus';
import { makeNpc } from './npcs/npcShared';
import type { StoryCutsceneContext } from './StoryCutscenes';

export class SuicuneAndBeastsCutscenes {
  /**
   * Legendary Beasts Awakening Cutscene (Burned Tower B1F)
   */
  public static triggerBeastsAwakeningCutscene(ctx: StoryCutsceneContext): void {
    if (ctx.storyFlags.has('beasts_awakened')) return;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.player.direction = 'UP';
    BattleAudio.playOverworldSound('KEY_ITEM');

    ctx.overworldHUD.openDialogue(
      [
        '⚡ Three legendary beasts stand frozen like statues atop ancient stone pedestals…',
        'As you step forward, their stony skin shatters with radiant celestial energy!',
      ],
      '⚡ LEGENDARY BEASTS',
      () => {
        BattleAudio.playCry('raikou');
        BattleAudio.playOverworldSound('HOP');
        const b1fNpcs = ctx.npcsByMap['burned_tower_b1f'] || [];
        const raikou = b1fNpcs.find((n) => n.id === 'burned_raikou');
        if (raikou) {
          raikou.direction = 'LEFT';
          raikou.x = 6;
          raikou.y = 8;
          raikou.renderX = 6;
          raikou.renderY = 8;
          raikou.gridX = 6;
          raikou.gridY = 8;
          raikou.targetX = 6;
          raikou.targetY = 8;
          // Multi-step visual leap animation while preserving synchronous t=0 and t=400 checkpoints
          setTimeout(() => {
            raikou.isMoving = true;
            raikou.isJumping = true;
            raikou.progress = 0.4;
            raikou.renderX = 7;
            raikou.renderY = 5;
          }, 60);
          setTimeout(() => {
            raikou.direction = 'DOWN';
            raikou.progress = 0.75;
            raikou.renderX = 6;
            raikou.renderY = 7;
          }, 160);
          setTimeout(() => {
            raikou.renderX = 6;
            raikou.renderY = 8;
            raikou.isMoving = false;
            raikou.isJumping = false;
            raikou.progress = 0;
          }, 280);
        }

        setTimeout(() => {
          BattleAudio.playCry('entei');
          BattleAudio.playOverworldSound('HOP');
          const entei = (ctx.npcsByMap['burned_tower_b1f'] || []).find((n) => n.id === 'burned_entei');
          if (entei) {
            entei.direction = 'RIGHT';
            entei.x = 14;
            entei.y = 8;
            entei.renderX = 14;
            entei.renderY = 8;
            entei.gridX = 14;
            entei.gridY = 8;
            entei.targetX = 14;
            entei.targetY = 8;
            setTimeout(() => {
              entei.isMoving = true;
              entei.isJumping = true;
              entei.progress = 0.4;
              entei.renderX = 13;
              entei.renderY = 5;
            }, 80);
            setTimeout(() => {
              entei.direction = 'DOWN';
              entei.progress = 0.75;
              entei.renderX = 14;
              entei.renderY = 7;
            }, 180);
            setTimeout(() => {
              entei.renderX = 14;
              entei.renderY = 8;
              entei.isMoving = false;
              entei.isJumping = false;
              entei.progress = 0;
            }, 280);
          }
        }, 350);

        setTimeout(() => {
          BattleAudio.playCry('suicune');
          BattleAudio.playOverworldSound('HOP');
          const suicune = (ctx.npcsByMap['burned_tower_b1f'] || []).find((n) => n.id === 'beasts');
          if (suicune) {
            suicune.x = 10;
            suicune.y = 4;
            suicune.renderX = 10;
            suicune.renderY = 4;
            suicune.gridX = 10;
            suicune.gridY = 4;
            suicune.targetX = 10;
            suicune.targetY = 4;
            suicune.direction = 'DOWN';
            setTimeout(() => {
              suicune.isMoving = true;
              suicune.progress = 0.5;
              suicune.renderY = 3.5;
            }, 120);
            setTimeout(() => {
              suicune.renderY = 4;
              suicune.isMoving = false;
              suicune.progress = 0;
            }, 260);
          }
        }, 700);

        setTimeout(() => {
          ctx.overworldHUD.openDialogue(
            [
              'RAIKOU and ENTEI roar fiercely and leap into the cavern shafts, scattering across the Johto skies!',
              'SUICUNE slowly steps down from its pedestal… It locks its crystal-clear gaze directly into your eyes.',
            ],
            '⚡ MYTHICAL AWAKENING',
            () => {
              const suicune = (ctx.npcsByMap['burned_tower_b1f'] || []).find((n) => n.id === 'beasts');
              if (suicune) {
                BattleAudio.playOverworldSound('HOP');
                suicune.x = 10;
                suicune.y = 8;
                suicune.renderX = 10;
                suicune.renderY = 8;
                suicune.gridX = 10;
                suicune.gridY = 8;
                suicune.targetX = 10;
                suicune.targetY = 8;
                suicune.direction = 'DOWN';
                setTimeout(() => {
                  suicune.isMoving = true;
                  suicune.isJumping = true;
                  suicune.progress = 0.4;
                  suicune.renderY = 6;
                }, 40);
                setTimeout(() => {
                  suicune.progress = 0.8;
                  suicune.renderY = 7.5;
                }, 100);
                setTimeout(() => {
                  suicune.renderY = 8;
                  suicune.isMoving = false;
                  suicune.isJumping = false;
                  suicune.progress = 0;
                }, 170);
              }
              BattleAudio.playOverworldSound('RUSTLE');

              // Spawn Eusine rushing down the ladder and stepping up toward the player
              if (ctx.npcsByMap['burned_tower_b1f']) {
                const eusineTargetY = Math.min(10, (ctx.player.y || 6) + 1);
                const eusineB1f = makeNpc(
                  'eusine_b1f_cutscene',
                  10,
                  eusineTargetY + 1,
                  'UP',
                  'eusine',
                  '🎩 EUSINE',
                  []
                );
                ctx.npcsByMap['burned_tower_b1f'] = ctx.npcsByMap['burned_tower_b1f'].filter(
                  (n) => n.id !== 'eusine_b1f_cutscene'
                );
                ctx.npcsByMap['burned_tower_b1f'].push(eusineB1f);
                setTimeout(() => {
                  eusineB1f.isMoving = true;
                  eusineB1f.progress = 0.5;
                  eusineB1f.renderY = eusineTargetY + 0.5;
                }, 180);
                setTimeout(() => {
                  eusineB1f.y = eusineTargetY;
                  eusineB1f.gridY = eusineTargetY;
                  eusineB1f.targetY = eusineTargetY;
                  eusineB1f.renderY = eusineTargetY;
                  eusineB1f.isMoving = false;
                  eusineB1f.progress = 0;
                }, 320);
              }

              setTimeout(() => {
                ctx.overworldHUD.openDialogue(
                  [
                    'With a swift, graceful leap across the subterranean pool, SUICUNE vanishes into the mist!',
                    '🎩 EUSINE rushes down the ladder: "Did you see that?! That was SUICUNE! It acknowledged you before it departed!"',
                    'EUSINE: "I have dedicated my life to pursuing SUICUNE. I will find it across Johto!"',
                    'LEADER MORTY has returned to the ECRUTEAK GYM to await your challenge.',
                  ],
                  '⚡ MYTHICAL AWAKENING',
                  () => {
                    ctx.storyFlags.add('beasts_awakened');
                    ctx.storyFlags.add('EVENT_RELEASED_THE_BEASTS');
                    ctx.storyFlags.add('burned_tower_beasts_awakened');
                    ctx.missionManager?.checkStoryFlags(ctx.storyFlags);

                    if (ctx.npcsByMap['burned_tower_b1f']) {
                      ctx.npcsByMap['burned_tower_b1f'] = ctx.npcsByMap['burned_tower_b1f'].filter(
                        (n) =>
                          n.id !== 'beasts' &&
                          n.id !== 'burned_raikou' &&
                          n.id !== 'burned_entei' &&
                          n.id !== 'eusine_b1f_cutscene'
                      );
                    }
                    if (ctx.npcsByMap['burned_tower_1f']) {
                      ctx.npcsByMap['burned_tower_1f'] = ctx.npcsByMap['burned_tower_1f'].filter(
                        (n) => n.id !== 'morty_burned' && n.id !== 'eusine' && n.id !== 'silver_burned'
                      );
                    }

                    ctx.roamingManager.awakenBeasts();
                    eventBus.emit('roamer:updated', { roamers: ctx.roamingManager.getAllRoamers() });
                    ctx.overworldHUD.updatePokegear(ctx.roamingManager.getAllRoamers());
                    ctx.setCutsceneLocked(false);
                    void ctx.saveCurrentGame();
                    ctx.overworldHUD.showToast('⚡ Raikou & Entei are now roaming Johto! Ecruteak Gym is open!');
                  }
                );
              }, 400);
            }
          );
        }, 1100);
      }
    );
  }

  /**
   * Cianwood City Suicune Beach Sighting & Mysticalman Eusine Battle
   */
  public static triggerCianwoodSuicuneAndEusine(ctx: StoryCutsceneContext): void {
    if (ctx.storyFlags.has('EVENT_FOUGHT_EUSINE')) return;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;

    BattleAudio.playOverworldSound('KEY_ITEM');
    BattleAudio.playCry('suicune');

    ctx.overworldHUD.openDialogue(
      [
        '🌊 A brilliant azure silhouette leaps gracefully across the breaking waves!',
        'SUICUNE pauses atop the water, turns its majestic crystal crest toward you, and vanishes into the northern sea mist!',
      ],
      '🌊 SUICUNE',
      () => {
        ctx.storyFlags.add('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY');
        ctx.audioManager.playBattleBgm('trainer');

        ctx.overworldHUD.openDialogue(
          [
            "EUSINE: Yo, " + (ctx.playerName || 'trainer') + ". Wasn't that SUICUNE just now?",
            'I only caught a quick glimpse, but I thought I saw SUICUNE running on the waves.',
            "SUICUNE is beautiful and grand. And it races through towns and roads at simply awesome speeds. It's wonderful…",
            "I want to see SUICUNE up close… I've decided.",
            "I'll battle you as a trainer to earn SUICUNE's respect! Come on, " +
              (ctx.playerName || 'trainer') +
              ". Let's battle now!",
          ],
          '🎩 MYSTICALMAN EUSINE',
          () => {
            const eusineTeam = [
              PokemonFactory.create('drowzee', 23, ['dreameater', 'hypnosis', 'disable', 'confusion']),
              PokemonFactory.create('haunter', 23, ['lick', 'hypnosis', 'meanlook', 'curse']),
              PokemonFactory.create('electrode', 25, ['screech', 'sonicboom', 'thunder', 'rollout']),
            ];

            ctx.triggerBattle(eusineTeam[0], {
              isTrainer: true,
              trainerName: 'Mysticalman Eusine',
              trainerTeam: eusineTeam,
              onVictory: () => {
                ctx.storyFlags.add('EVENT_FOUGHT_EUSINE');
                ctx.defeatedTrainers.add('eusine_cianwood');
                ctx.overworldHUD.openDialogue(
                  [
                    "EUSINE: You're amazing, " +
                      (ctx.playerName || 'trainer') +
                      '! No wonder POKéMON gravitate to you. I get it now.',
                    "I'm going to keep searching for SUICUNE. I'm sure we'll see each other again. See you around!",
                  ],
                  '🎩 MYSTICALMAN EUSINE',
                  () => {
                    ctx.setCutsceneLocked(false);
                    ctx.audioManager.restoreOverworldBgm();
                    void ctx.saveCurrentGame();
                    ctx.overworldHUD.showToast('🌊 Eusine acknowledged your strength and set off after Suicune!');
                  }
                );
              },
            });
          }
        );
      }
    );
  }

  public static triggerRoute42Suicune(ctx: StoryCutsceneContext): void {
    if (ctx.storyFlags.has('EVENT_SAW_SUICUNE_ON_ROUTE_42')) return;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    BattleAudio.playOverworldSound('KEY_ITEM');
    BattleAudio.playCry('suicune');

    ctx.overworldHUD.openDialogue(
      [
        '💎 A brilliant azure silhouette dashes past the mountain trees at lightning speed!',
        'SUICUNE bounds effortlessly across the water and leaps over the high mountain cliffs, disappearing to the east!',
      ],
      '💎 SUICUNE',
      () => {
        ctx.storyFlags.add('EVENT_SAW_SUICUNE_ON_ROUTE_42');
        ctx.setCutsceneLocked(false);
        void ctx.saveCurrentGame();
        ctx.overworldHUD.showToast?.('💎 Suicune dashed across Route 42 towards the east!');
      }
    );
  }
}
