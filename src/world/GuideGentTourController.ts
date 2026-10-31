/**
 * @fileoverview GuideGentTourController domain module implementation.
 * @module world/GuideGentTourController
 * @role Cherrygrove City Guide Gent scripted walking tour and party healing/starter detection
 * @exports GuideGentTourController
 * @layer world
 * @sections L1-165: Guide Gent Walking Tour | L166-210: Party Heal & Starter Detection
 */

import type { Direction, PokemonInstance } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { GridPhysics, type GridEntity } from './GridPhysics';
import { GUIDE_GENT_TOUR_LEGS } from './npcData';
import type { StoryCutsceneContext } from './StoryCutscenes';

export class GuideGentTourController {
  public static async runGuideGentWalkingTour(
    guide: GridEntity,
    cutsceneContext: StoryCutsceneContext
  ): Promise<void> {
    const ctx = cutsceneContext;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;

    if (ctx.player.x === 31 && ctx.player.y === 6) {
      ctx.player.x = 32;
      ctx.player.y = 7;
      ctx.player.direction = 'UP';
    }

    const walkLegSteps = async (steps: Direction[], isFinalDespawn: boolean = false) => {
      const stepMs = (GridPhysics.BASE_TRAVERSAL_TIME * 1000) / ctx.gameClock.playerSpeed;
      for (let s = 0; s < steps.length; s++) {
        const stepDir = steps[s];
        const prevGuideX = guide.x;
        const prevGuideY = guide.y;
        const prevGuideDir = guide.direction;

        const nextGuideX = guide.x + (stepDir === 'LEFT' ? -1 : stepDir === 'RIGHT' ? 1 : 0);
        const nextGuideY = guide.y + (stepDir === 'UP' ? -1 : stepDir === 'DOWN' ? 1 : 0);

        guide.direction = stepDir;
        guide.targetX = nextGuideX;
        guide.targetY = nextGuideY;
        guide.isMoving = true;
        guide.progress = 0;

        let playerTargetX = ctx.player.x;
        let playerTargetY = ctx.player.y;
        let playerStepDir = ctx.player.direction;

        if (!isFinalDespawn) {
          playerTargetX = prevGuideX;
          playerTargetY = prevGuideY;
          playerStepDir = prevGuideDir;
          ctx.player.direction = playerStepDir;
          ctx.player.targetX = playerTargetX;
          ctx.player.targetY = playerTargetY;
          ctx.player.isMoving = true;
          ctx.player.progress = 0;
        }

        const startGuideX = guide.x;
        const startGuideY = guide.y;
        const startPlayerX = ctx.player.x;
        const startPlayerY = ctx.player.y;

        await new Promise<void>((resolve) => {
          const t0 = performance.now();
          const animate = (now: number) => {
            const p = Math.min(1, (now - t0) / stepMs);
            guide.progress = p;
            guide.renderX = startGuideX + (nextGuideX - startGuideX) * p;
            guide.renderY = startGuideY + (nextGuideY - startGuideY) * p;

            if (!isFinalDespawn) {
              ctx.player.progress = p;
              ctx.player.renderX = startPlayerX + (playerTargetX - startPlayerX) * p;
              ctx.player.renderY = startPlayerY + (playerTargetY - startPlayerY) * p;
            }

            if (p < 1) {
              requestAnimationFrame(animate);
            } else {
              guide.x = nextGuideX;
              guide.y = nextGuideY;
              guide.gridX = nextGuideX;
              guide.gridY = nextGuideY;
              guide.renderX = nextGuideX;
              guide.renderY = nextGuideY;
              guide.isMoving = false;
              guide.progress = 0;

              if (!isFinalDespawn) {
                ctx.player.x = playerTargetX;
                ctx.player.y = playerTargetY;
                ctx.player.gridX = playerTargetX;
                ctx.player.gridY = playerTargetY;
                ctx.player.renderX = playerTargetX;
                ctx.player.renderY = playerTargetY;
                ctx.player.isMoving = false;
                ctx.player.progress = 0;
              }
              resolve();
            }
          };
          requestAnimationFrame(animate);
        });
      }
    };

    // Leg 1: (32, 6) -> Pokemon Center
    await walkLegSteps(GUIDE_GENT_TOUR_LEGS[0].steps);
    guide.direction = GUIDE_GENT_TOUR_LEGS[0].guideEnd.direction;
    ctx.player.direction = GUIDE_GENT_TOUR_LEGS[0].playerEnd.direction;
    ctx.overworldHUD.openDialogue(
      GUIDE_GENT_TOUR_LEGS[0].dialoguePages || [],
      '👴 GUIDE GENT',
      async () => {
        // Leg 2: -> Poke Mart
        await walkLegSteps(GUIDE_GENT_TOUR_LEGS[1].steps);
        guide.direction = GUIDE_GENT_TOUR_LEGS[1].guideEnd.direction;
        ctx.player.direction = GUIDE_GENT_TOUR_LEGS[1].playerEnd.direction;
        ctx.overworldHUD.openDialogue(
          GUIDE_GENT_TOUR_LEGS[1].dialoguePages || [],
          '👴 GUIDE GENT',
          async () => {
            // Leg 3: -> Route 30
            await walkLegSteps(GUIDE_GENT_TOUR_LEGS[2].steps);
            guide.direction = GUIDE_GENT_TOUR_LEGS[2].guideEnd.direction;
            ctx.player.direction = GUIDE_GENT_TOUR_LEGS[2].playerEnd.direction;
            ctx.overworldHUD.openDialogue(
              GUIDE_GENT_TOUR_LEGS[2].dialoguePages || [],
              '👴 GUIDE GENT',
              async () => {
                // Leg 4: -> The Sea
                await walkLegSteps(GUIDE_GENT_TOUR_LEGS[3].steps);
                guide.direction = GUIDE_GENT_TOUR_LEGS[3].guideEnd.direction;
                ctx.player.direction = GUIDE_GENT_TOUR_LEGS[3].playerEnd.direction;
                ctx.overworldHUD.openDialogue(
                  GUIDE_GENT_TOUR_LEGS[3].dialoguePages || [],
                  '👴 GUIDE GENT',
                  async () => {
                    // Leg 5: -> House Porch
                    await walkLegSteps(GUIDE_GENT_TOUR_LEGS[4].steps);
                    guide.direction = GUIDE_GENT_TOUR_LEGS[4].guideEnd.direction;
                    ctx.player.direction = GUIDE_GENT_TOUR_LEGS[4].playerEnd.direction;
                    ctx.overworldHUD.openDialogue(
                      GUIDE_GENT_TOUR_LEGS[4].dialoguePages || [],
                      '👴 GUIDE GENT',
                      async () => {
                        BattleAudio.playOverworldSound('KEY_ITEM');
                        ctx.storyFlags.add('has_map_card');
                        ctx.storyFlags.add('GUIDE_GENT_TOUR_COMPLETED');
                        ctx.saveCurrentGame();
                        ctx.overworldHUD.showToast('🗺️ Received MAP CARD! Town Map unlocked in Pokégear!');

                        // Leg 6: Guide Gent enters house & despawns
                        await walkLegSteps(GUIDE_GENT_TOUR_LEGS[5].steps, true);
                        BattleAudio.playOverworldSound('DOOR_ENTER');

                        if (ctx.npcsByMap.cherrygrove_city) {
                          ctx.npcsByMap.cherrygrove_city = ctx.npcsByMap.cherrygrove_city.filter(
                            (n) => n.id !== 'cg_guide_gent'
                          );
                        }
                        ctx.setCutsceneLocked(false);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  public static healParty(playerParty: PokemonInstance[], playSound: boolean = true): void {
    if (playSound) BattleAudio.playOverworldSound('HEAL_JINGLE');
    for (let i = 0; i < playerParty.length; i++) {
      const pkmn = playerParty[i];
      pkmn.currentHp = pkmn.stats.hp;
      pkmn.status = 'NONE';
      pkmn.isTrapped = false;
      for (let j = 0; j < pkmn.moves.length; j++) {
        pkmn.moves[j].currentPp = pkmn.moves[j].maxPp;
      }
    }
  }

  public static detectChosenStarterSpecies(
    storyFlags: Set<string>,
    playerParty: PokemonInstance[],
    playerBox: PokemonInstance[],
    seenSpecies: Set<string>
  ): 'cyndaquil' | 'totodile' | 'chikorita' | undefined {
    if (storyFlags.has('starter_cyndaquil')) return 'cyndaquil';
    if (storyFlags.has('starter_totodile')) return 'totodile';
    if (storyFlags.has('starter_chikorita')) return 'chikorita';
    const allOwned = [
      ...playerParty.map((p) => p.speciesId),
      ...playerBox.map((p) => p.speciesId),
      ...Array.from(seenSpecies),
    ];
    if (allOwned.some((id) => id === 'totodile' || id === 'croconaw' || id === 'feraligatr')) return 'totodile';
    if (allOwned.some((id) => id === 'chikorita' || id === 'bayleef' || id === 'meganium')) return 'chikorita';
    if (allOwned.some((id) => id === 'cyndaquil' || id === 'quilava' || id === 'typhlosion')) return 'cyndaquil';
    return undefined;
  }
}
