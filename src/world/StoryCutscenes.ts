/**
 * @fileoverview StoryCutscenes domain module implementation.
 * @module world/StoryCutscenes
 * @role StoryCutscenes Component
 * @exports StoryCutsceneContext, StoryCutscenes
 * @layer world
 * @sections L1-15: Micro-Header & Imports | L16-318: Implementation | L319-637: Handlers & Exports
 */

import type { Direction, PokemonInstance } from '../types/game';
import type { GridEntity } from './GridPhysics';
import { GridPhysics } from './GridPhysics';
import { BattleAudio } from '../audio/BattleAudio';
import type { AudioManager } from '../audio/AudioManager';
import { PokemonFactory } from '../battle/PokemonFactory';
import type { OverworldHUD } from '../ui/OverworldHUD';
import type { OverworldRenderer } from '../render/OverworldRenderer';
import type { MapManager } from './MapManager';
import type { RoamingManager } from './RoamingManager';
import type { MissionManager } from './MissionManager';
import { GUIDE_GENT_TOUR_LEGS, makeNpc, createNpcsByMap } from './npcData';
import { eventBus } from '../core/EventBus';

export interface StoryCutsceneContext {
  player: GridEntity;
  storyFlags: Set<string>;
  defeatedTrainers: Set<string>;
  playerParty: PokemonInstance[];
  rivalName?: string;
  playerName?: string;
  audioManager: AudioManager;
  overworldRenderer: OverworldRenderer;
  overworldHUD: OverworldHUD;
  npcsByMap: Record<string, GridEntity[]>;
  gameClock: { playerSpeed: number; battleSpeed: number };
  mapManager: MapManager;
  roamingManager: RoamingManager;
  missionManager?: MissionManager;
  triggerBattle: (
    initialOpponentPokemon: PokemonInstance,
    options?: {
      isRoamer?: boolean;
      isTrainer?: boolean;
      isGymLeader?: boolean;
      trainerName?: string;
      trainerTeam?: PokemonInstance[];
      onVictory?: () => Promise<void> | void;
      onBattleEnd?: (result: any) => Promise<void> | void;
    }
  ) => void;
  buildTrainerTeamInstances: (entity: GridEntity) => PokemonInstance[];
  handleTrainerDefeatRewards: (entity: GridEntity) => void;
  saveCurrentGame: () => Promise<void> | void;
  setCutsceneLocked: (locked: boolean) => void;
}

export class StoryCutscenes {
  /**
   * Slowpoke Well B1F: First Team Rocket Grunt Approaches & Blocks Corridor Path
   */
  public static async triggerSlowpokeWellGruntIntercept(
    grunt: GridEntity,
    ctx: StoryCutsceneContext
  ): Promise<void> {
    if (!grunt.trainerId || !grunt.trainerPokemon || ctx.defeatedTrainers.has(grunt.trainerId)) return;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;

    BattleAudio.playOverworldSound('EXCLAMATION');
    await ctx.overworldRenderer.showExclamationBubble(grunt, Math.round(520 / ctx.gameClock.playerSpeed));

    const animateNpcStep = async (entity: GridEntity, nextX: number, nextY: number, dir: Direction) => {
      const startX = entity.x;
      const startY = entity.y;
      entity.direction = dir;
      entity.targetX = nextX;
      entity.targetY = nextY;
      entity.isMoving = true;
      entity.progress = 0;
      const stepMs = (GridPhysics.BASE_TRAVERSAL_TIME * 1000) / ctx.gameClock.playerSpeed;
      await new Promise<void>((resolve) => {
        const t0 = performance.now();
        const animate = (now: number) => {
          const p = Math.min(1, (now - t0) / stepMs);
          entity.progress = p;
          entity.renderX = startX + (nextX - startX) * p;
          entity.renderY = startY + (nextY - startY) * p;
          if (p < 1) {
            requestAnimationFrame(animate);
          } else {
            entity.x = nextX;
            entity.y = nextY;
            entity.gridX = nextX;
            entity.gridY = nextY;
            entity.renderX = nextX;
            entity.renderY = nextY;
            entity.isMoving = false;
            entity.progress = 0;
            resolve();
          }
        };
        requestAnimationFrame(animate);
      });
    };

    while (grunt.x !== ctx.player.x) {
      const stepDir: Direction = ctx.player.x < grunt.x ? 'LEFT' : 'RIGHT';
      const nextX = grunt.x + (stepDir === 'LEFT' ? -1 : 1);
      await animateNpcStep(grunt, nextX, grunt.y, stepDir);
    }

    grunt.direction = 'DOWN';
    const targetY = Math.max(grunt.y, ctx.player.y - 1);
    while (grunt.y < targetY) {
      await animateNpcStep(grunt, grunt.x, grunt.y + 1, 'DOWN');
    }

    ctx.player.direction = 'UP';
    const dialoguePages =
      grunt.challengePages && grunt.challengePages.length > 0
        ? grunt.challengePages
        : grunt.pages || ["ROCKET GRUNT: Hold it right there, brat! You're not getting past me!"];

    ctx.overworldHUD.openDialogue(dialoguePages, grunt.speaker, () => {
      ctx.setCutsceneLocked(false);
      const team = ctx.buildTrainerTeamInstances(grunt);
      if (team.length === 0) return;
      ctx.triggerBattle(team[0], {
        isTrainer: true,
        trainerName: grunt.trainerName || grunt.speaker || 'Rocket Grunt',
        trainerTeam: team,
        onVictory: () => {
          ctx.defeatedTrainers.add(grunt.trainerId!);
          ctx.handleTrainerDefeatRewards(grunt);
          ctx.saveCurrentGame();
        },
      });
    });
  }

  /**
   * Azalea Town West Gate: Rival Silver Ambush Encounter (Rival Battle 2)
   */
  public static triggerAzaleaRivalAmbush(ctx: StoryCutsceneContext): void {
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.player.direction = 'LEFT';

    const rivalX = Math.max(1, ctx.player.x - 1);
    const rivalY = ctx.player.y;
    const silverNpc = makeNpc(
      'azalea_rival_cutscene',
      rivalX,
      rivalY,
      'RIGHT',
      'silver',
      `❓ RIVAL ${ctx.rivalName || 'SILVER'}`,
      []
    );
    if (!ctx.npcsByMap.azalea_town) ctx.npcsByMap.azalea_town = [];
    ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter((n) => n.id !== 'azalea_rival_cutscene');
    ctx.npcsByMap.azalea_town.push(silverNpc);

    let starterSpeciesId: 'croconaw' | 'bayleef' | 'quilava' = 'croconaw';
    let starterMoves = ['scratch', 'leer', 'rage', 'watergun'];

    if (
      ctx.storyFlags.has('starter_cyndaquil') ||
      ctx.playerParty.some((p) => p.speciesId === 'cyndaquil' || p.speciesId === 'quilava' || p.speciesId === 'typhlosion')
    ) {
      starterSpeciesId = 'croconaw';
      starterMoves = ['scratch', 'leer', 'rage', 'watergun'];
    } else if (
      ctx.storyFlags.has('starter_totodile') ||
      ctx.playerParty.some((p) => p.speciesId === 'totodile' || p.speciesId === 'croconaw' || p.speciesId === 'feraligatr')
    ) {
      starterSpeciesId = 'bayleef';
      starterMoves = ['tackle', 'growl', 'razorleaf', 'reflect'];
    } else {
      starterSpeciesId = 'quilava';
      starterMoves = ['tackle', 'leer', 'smokescreen', 'ember'];
    }

    const rivalTeam = [
      PokemonFactory.create('gastly', 12, ['lick', 'spite', 'meanlook', 'curse']),
      PokemonFactory.create('zubat', 14, ['leechlife', 'supersonic', 'bite']),
      PokemonFactory.create(starterSpeciesId, 16, starterMoves),
    ];

    ctx.audioManager.playBattleBgm('trainer');
    ctx.overworldHUD.openDialogue(
      [
        `${ctx.rivalName || 'SILVER'}: …Tell me something. Is it true that TEAM ROCKET has returned?`,
        "What? You beat them? Hah! Quit lying!",
        "You're not joking? Then let's see how good you really are!",
      ],
      `❓ RIVAL ${ctx.rivalName || 'SILVER'}`,
      () => {
        ctx.triggerBattle(rivalTeam[0], {
          isTrainer: true,
          trainerName: `Rival ${ctx.rivalName || 'Silver'}`,
          trainerTeam: rivalTeam,
          onVictory: () => {
            ctx.storyFlags.add('azalea_rival_defeated');
            ctx.storyFlags.add('EVENT_BEAT_RIVAL_IN_AZALEA');
            ctx.defeatedTrainers.add('rival_azalea');
            ctx.overworldHUD.openDialogue(
              [
                `${ctx.rivalName || 'SILVER'}: …Humph! Useless POKéMON!`,
                'Listen, you. You only won because my POKéMON were weak!',
                "I hate the weak. POKéMON, trainers. It doesn't matter who or what.",
                "I'm going to be strong and wipe out the weak. That goes for TEAM ROCKET too.",
                `Rival ${ctx.rivalName || 'Silver'} glared coldly and strode away!`,
              ],
              `❓ RIVAL ${ctx.rivalName || 'SILVER'}`,
              () => {
                if (ctx.npcsByMap.azalea_town) {
                  ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter(
                    (n) => n.id !== 'azalea_rival_cutscene'
                  );
                }
                ctx.setCutsceneLocked(false);
                ctx.saveCurrentGame();
                ctx.overworldHUD.showToast(`⚔️ Defeated Rival ${ctx.rivalName || 'Silver'}! The way to Ilex Forest is open!`);
              }
            );
          },
          onBattleEnd: (res: any) => {
            if (res.winner !== 'PLAYER') {
              if (ctx.npcsByMap.azalea_town) {
                ctx.npcsByMap.azalea_town = ctx.npcsByMap.azalea_town.filter(
                  (n) => n.id !== 'azalea_rival_cutscene'
                );
              }
              ctx.setCutsceneLocked(false);
            }
          },
        });
      }
    );
  }

  /**
   * Passerby Rival 1 Ambush Encounter (Cherrygrove East Exit)
   */
  public static triggerCherrygroveRivalAmbush(ctx: StoryCutsceneContext): void {
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.player.direction = 'RIGHT';

    const rivalNpc = makeNpc(
      'cherrygrove_rival_cutscene',
      ctx.player.x + 1,
      ctx.player.y,
      'LEFT',
      'silver',
      '❓ PASSERBY BOY',
      []
    );
    if (!ctx.npcsByMap.cherrygrove_city) ctx.npcsByMap.cherrygrove_city = [];
    ctx.npcsByMap.cherrygrove_city = ctx.npcsByMap.cherrygrove_city.filter(
      (n) => n.id !== 'cherrygrove_rival_cutscene'
    );
    ctx.npcsByMap.cherrygrove_city.push(rivalNpc);

    let rivalSpeciesId: 'totodile' | 'chikorita' | 'cyndaquil' = 'totodile';
    let rivalMoves = ['scratch', 'leer'];
    if (ctx.storyFlags.has('starter_cyndaquil') || ctx.playerParty.some((p) => p.speciesId === 'cyndaquil')) {
      rivalSpeciesId = 'totodile';
      rivalMoves = ['scratch', 'leer'];
    } else if (ctx.storyFlags.has('starter_totodile') || ctx.playerParty.some((p) => p.speciesId === 'totodile')) {
      rivalSpeciesId = 'chikorita';
      rivalMoves = ['tackle', 'growl'];
    } else if (ctx.storyFlags.has('starter_chikorita') || ctx.playerParty.some((p) => p.speciesId === 'chikorita')) {
      rivalSpeciesId = 'cyndaquil';
      rivalMoves = ['tackle', 'leer'];
    }

    const rivalPokemon = PokemonFactory.create(rivalSpeciesId, 5, rivalMoves);
    ctx.audioManager.playBattleBgm('trainer');
    ctx.overworldHUD.openDialogue(
      [
        '❓ PASSERBY BOY: <……> <……> <……>',
        'You got a POKéMON at the LAB. What a waste. A wimp like you.',
        '<……> <……> <……>',
        "Don't you get what I'm saying?",
        "Well, I too, have a good POKéMON. I'll show you what I mean!",
      ],
      '❓ PASSERBY BOY',
      () => {
        ctx.triggerBattle(rivalPokemon, {
          isTrainer: true,
          trainerName: 'Passerby ???',
          trainerTeam: [rivalPokemon],
          onVictory: () => {
            ctx.overworldHUD.openDialogue(
              [
                '❓ PASSERBY BOY: Humph. Are you happy you won?',
                '<……> <……> <……>',
                "My name's ???. I'm going to be the world's greatest POKéMON trainer.",
                'Get out of my way!',
                `*BUMP!* The boy shoved past ${ctx.playerName || 'Gold'} and bolted toward Route 29!`,
                'As the boy shoved past, a card slipped from his jacket pocket!',
                `${ctx.playerName || 'Gold'} picked up the dropped TRAINER CARD!`,
                'The name printed on the card reads: SILVER!',
              ],
              '❓ PASSERBY BOY',
              () => {
                if (ctx.npcsByMap.cherrygrove_city) {
                  ctx.npcsByMap.cherrygrove_city = ctx.npcsByMap.cherrygrove_city.filter(
                    (n) => n.id !== 'cherrygrove_rival_cutscene'
                  );
                }
                BattleAudio.playOverworldSound('BUMP');
                BattleAudio.playOverworldSound('KEY_ITEM');
                ctx.storyFlags.add('EVENT_RIVAL_CHERRYGROVE_DEFEATED');
                ctx.defeatedTrainers.add('rival_cherrygrove');
                ctx.setCutsceneLocked(false);
                const freshNpcs = createNpcsByMap();
                if (freshNpcs.elms_lab && ctx.npcsByMap.elms_lab) {
                  const officer = freshNpcs.elms_lab.find((n) => n.id === 'lab_police_officer');
                  if (officer && !ctx.npcsByMap.elms_lab.some((n) => n.id === 'lab_police_officer')) {
                    ctx.npcsByMap.elms_lab.push(officer);
                  }
                }
                ctx.saveCurrentGame();
                ctx.overworldHUD.showToast('Dropped TRAINER CARD acquired! Suspect: SILVER');
              }
            );
          },
          onBattleEnd: (res: any) => {
            if (res.winner !== 'PLAYER') {
              if (ctx.npcsByMap.cherrygrove_city) {
                ctx.npcsByMap.cherrygrove_city = ctx.npcsByMap.cherrygrove_city.filter(
                  (n) => n.id !== 'cherrygrove_rival_cutscene'
                );
              }
              ctx.setCutsceneLocked(false);
            }
          },
        });
      }
    );
  }

  /**
   * Rival Silver Ambush Encounter (Burned Tower 1F)
   */
  public static triggerBurnedTowerRivalBattle(ctx: StoryCutsceneContext): void {
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.player.direction = 'UP';

    let starterSpeciesId: 'croconaw' | 'bayleef' | 'quilava' = 'croconaw';
    let starterMoves = ['watergun', 'bite', 'rage', 'scaryface'];

    if (
      ctx.storyFlags.has('starter_cyndaquil') ||
      ctx.playerParty.some((p) => p.speciesId === 'cyndaquil' || p.speciesId === 'quilava' || p.speciesId === 'typhlosion')
    ) {
      starterSpeciesId = 'croconaw';
      starterMoves = ['watergun', 'bite', 'rage', 'scaryface'];
    } else if (
      ctx.storyFlags.has('starter_totodile') ||
      ctx.playerParty.some((p) => p.speciesId === 'totodile' || p.speciesId === 'croconaw' || p.speciesId === 'feraligatr')
    ) {
      starterSpeciesId = 'bayleef';
      starterMoves = ['razorleaf', 'poisonpowder', 'reflect', 'tackle'];
    } else {
      starterSpeciesId = 'quilava';
      starterMoves = ['flamewheel', 'ember', 'quickattack', 'smokescreen'];
    }

    const rivalTeam = [
      PokemonFactory.create('haunter', 20, ['nightshade', 'curse', 'spite', 'hypnosis']),
      PokemonFactory.create('magnemite', 18, ['thundershock', 'supersonic', 'sonicboom', 'tackle']),
      PokemonFactory.create('zubat', 20, ['bite', 'confuseray', 'wingattack', 'supersonic']),
      PokemonFactory.create(starterSpeciesId, 22, starterMoves),
    ];

    ctx.audioManager.playBattleBgm('trainer');
    ctx.overworldHUD.openDialogue(
      [
        'SILVER: …Hmph! You followed me all the way to ECRUTEAK?',
        "Don't tell me you're chasing myths about legendary beasts too! Weaklings need legends. I only need supreme power!",
        "Get out of my way! I'll show you what real strength looks like!",
      ],
      '❓ RIVAL SILVER',
      () => {
        ctx.triggerBattle(rivalTeam[0], {
          isTrainer: true,
          trainerName: ctx.rivalName || 'Rival Silver',
          trainerTeam: rivalTeam,
          onVictory: () => {
            ctx.storyFlags.add('EVENT_BEAT_BURNED_TOWER_SILVER');
            ctx.defeatedTrainers.add('silver_burned');
            ctx.audioManager.playSfx('sfx_badge_get');
            BattleAudio.playOverworldSound('KEY_ITEM');
            ctx.overworldHUD.openDialogue(
              [
                "SILVER: …Tch! Why can't I beat you?!",
                'I am training as hard as anyone, but my POKéMON are still lacking something…',
                "…Whatever! I don't need useless legends anyway! Get lost!",
              ],
              '❓ RIVAL SILVER',
              () => {
                ctx.setCutsceneLocked(false);
                ctx.audioManager.restoreOverworldBgm();
                const mapNpcs = ctx.npcsByMap['burned_tower_1f'] || [];
                const silverNpc = mapNpcs.find((n) => n.id === 'silver_burned');
                if (silverNpc) {
                  silverNpc.x = 8;
                  silverNpc.y = 10;
                }
                ctx.saveCurrentGame();
                ctx.overworldHUD.showToast('Rival Silver stepped aside from the Burned Tower hole!');
              }
            );
          },
        });
      }
    );
  }

  /**
   * Rival Silver Confrontation Outside Olivine Gym
   */
  public static triggerOlivineRivalConfrontation(ctx: StoryCutsceneContext): void {
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.audioManager.playBattleBgm('trainer');
    ctx.overworldHUD.openDialogue(
      [
        "RIVAL: …You again?",
        "There's no need to panic. I don't bother with wimps like you.",
        "Speaking of weaklings, the city's GYM LEADER isn't here.",
        "Supposedly taking care of a sick POKéMON at the LIGHTHOUSE.",
        "Humph! Boo-hoo! Just let sick POKéMON go! A POKéMON that can't battle is worthless!",
        "Why don't you go train at the LIGHTHOUSE? Who knows. It may make you a bit less weak!",
      ],
      '🥊 RIVAL SILVER',
      () => {
        ctx.storyFlags.add('EVENT_RIVAL_OLIVINE_CITY');
        ctx.setCutsceneLocked(false);
        ctx.audioManager.restoreOverworldBgm();
        void ctx.saveCurrentGame();
        ctx.overworldHUD.showToast('⚔️ Rival Silver departed for the Lighthouse!');
      }
    );
  }

  /**
   * Legendary Beasts Awakening Cutscene (Burned Tower B1F)
   */
  public static triggerBeastsAwakeningCutscene(ctx: StoryCutsceneContext): void {
    if (ctx.storyFlags.has('beasts_awakened')) return;
    ctx.setCutsceneLocked(true);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    BattleAudio.playOverworldSound('KEY_ITEM');

    ctx.overworldHUD.openDialogue(
      [
        '⚡ Three legendary beasts stand frozen like statues atop ancient stone pedestals…',
        'As you step forward, their stony skin shatters with radiant celestial energy!',
      ],
      '⚡ LEGENDARY BEASTS',
      () => {
        BattleAudio.playCry('raikou');
        const b1fNpcs = ctx.npcsByMap['burned_tower_b1f'] || [];
        const raikou = b1fNpcs.find((n) => n.id === 'burned_raikou');
        if (raikou) { raikou.x = 6; raikou.y = 8; }

        setTimeout(() => {
          BattleAudio.playCry('entei');
          const entei = (ctx.npcsByMap['burned_tower_b1f'] || []).find((n) => n.id === 'burned_entei');
          if (entei) { entei.x = 14; entei.y = 8; }
        }, 350);

        setTimeout(() => {
          BattleAudio.playCry('suicune');
          const suicune = (ctx.npcsByMap['burned_tower_b1f'] || []).find((n) => n.id === 'beasts');
          if (suicune) { suicune.x = 10; suicune.y = 4; suicune.direction = 'DOWN'; }
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
              if (suicune) { suicune.x = 10; suicune.y = 8; suicune.direction = 'DOWN'; }
              BattleAudio.playOverworldSound('RUSTLE');

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
                        (n) => n.id !== 'beasts' && n.id !== 'burned_raikou' && n.id !== 'burned_entei'
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

    ctx.overworldHUD.openDialogue([
      '🌊 A brilliant azure silhouette leaps gracefully across the breaking waves!',
      'SUICUNE pauses atop the water, turns its majestic crystal crest toward you, and vanishes into the northern sea mist!',
    ], '🌊 SUICUNE', () => {
      ctx.storyFlags.add('EVENT_SAW_SUICUNE_AT_CIANWOOD_CITY');
      ctx.audioManager.playBattleBgm('trainer');

      ctx.overworldHUD.openDialogue([
        "EUSINE: Yo, " + (ctx.playerName || 'trainer') + ". Wasn't that SUICUNE just now?",
        "I only caught a quick glimpse, but I thought I saw SUICUNE running on the waves.",
        "SUICUNE is beautiful and grand. And it races through towns and roads at simply awesome speeds. It's wonderful…",
        "I want to see SUICUNE up close… I've decided.",
        "I'll battle you as a trainer to earn SUICUNE's respect! Come on, " + (ctx.playerName || 'trainer') + ". Let's battle now!",
      ], '🎩 MYSTICALMAN EUSINE', () => {
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
                    "EUSINE: You're amazing, " + (ctx.playerName || 'trainer') + "! No wonder POKéMON gravitate to you. I get it now.",
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

    ctx.overworldHUD.openDialogue([
      '💎 A brilliant azure silhouette dashes past the mountain trees at lightning speed!',
      'SUICUNE bounds effortlessly across the water and leaps over the high mountain cliffs, disappearing to the east!',
    ], '💎 SUICUNE', () => {
      ctx.storyFlags.add('EVENT_SAW_SUICUNE_ON_ROUTE_42');
      ctx.setCutsceneLocked(false);
      void ctx.saveCurrentGame();
      ctx.overworldHUD.showToast?.('💎 Suicune dashed across Route 42 towards the east!');
    });
  }

  /**
   * Authentic Gen 2 Cherrygrove City Guide Gent Scripted Walking Tour
   */
  public static async runGuideGentWalkingTour(guide: GridEntity, ctx: StoryCutsceneContext): Promise<void> {
    return OverworldTrainerSightAndTourController.runGuideGentWalkingTour(guide, ctx);
  }
}
