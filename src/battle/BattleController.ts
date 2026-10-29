import type { Direction, PokemonInstance } from '../types/game';
import type { GridEntity } from '../world/GridPhysics';
import { GridPhysics } from '../world/GridPhysics';
import { PokemonFactory } from './PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';
import type { StoryCutsceneContext } from '../world/StoryCutscenes';

export class BattleController {
  public static buildTrainerTeamInstances(trainer: GridEntity): PokemonInstance[] {
    const multiTeam = trainer.trainerTeam || (trainer as any).team;
    if (multiTeam && multiTeam.length > 0) {
      return multiTeam.map((spec: any) => {
        const pkmn = PokemonFactory.create(spec.speciesId, spec.level, spec.moves);
        if (spec.heldItem) pkmn.heldItem = spec.heldItem;
        return pkmn;
      });
    }
    if (trainer.trainerPokemon) {
      const pkmn = PokemonFactory.create(
        trainer.trainerPokemon.speciesId,
        trainer.trainerPokemon.level,
        trainer.trainerPokemon.moves
      );
      if (trainer.trainerPokemon.heldItem) pkmn.heldItem = trainer.trainerPokemon.heldItem;
      return [pkmn];
    }
    return [];
  }

  public static getOppositeDirection(dir: Direction): Direction {
    switch (dir) {
      case 'UP':
        return 'DOWN';
      case 'DOWN':
        return 'UP';
      case 'LEFT':
        return 'RIGHT';
      case 'RIGHT':
        return 'LEFT';
    }
  }

  /**
   * Executes an authentic Gen 2 Line-of-Sight Trainer Encounter:
   * 1. Locks player input & pops bouncy [!] balloon above trainer's head
   * 2. Walks trainer tile-by-tile up to 1 tile away from the player
   * 3. Turns player toward trainer, displays challenge dialogue, and starts Trainer Battle
   */
  public static async runTrainerSightSequence(
    trainer: GridEntity,
    ctx: StoryCutsceneContext
  ): Promise<void> {
    const hasRoster = Boolean(
      trainer.trainerPokemon ||
      (trainer.trainerTeam && trainer.trainerTeam.length > 0) ||
      ((trainer as any).team && (trainer as any).team.length > 0)
    );
    if (!trainer.trainerId || !hasRoster) return;
    ctx.setCutsceneLocked(true);
    ctx.defeatedTrainers.add(trainer.trainerId);
    ctx.player.isMoving = false;
    ctx.player.progress = 0;

    BattleAudio.playOverworldSound('EXCLAMATION');
    await ctx.overworldRenderer.showExclamationBubble(trainer, Math.round(520 / ctx.gameClock.playerSpeed));

    // Walk trainer up to 1 tile away from player
    const delta = GridPhysics.getDirectionDelta(trainer.direction);
    const stepsToWalk = Math.max(
      0,
      Math.abs(ctx.player.x - trainer.x) + Math.abs(ctx.player.y - trainer.y) - 1
    );

    for (let s = 0; s < stepsToWalk; s++) {
      const startX = trainer.x;
      const startY = trainer.y;
      const nextX = startX + delta.dx;
      const nextY = startY + delta.dy;
      trainer.targetX = nextX;
      trainer.targetY = nextY;
      trainer.isMoving = true;
      trainer.progress = 0;

      const stepMs = (GridPhysics.BASE_TRAVERSAL_TIME * 1000) / ctx.gameClock.playerSpeed;
      await new Promise<void>((resolve) => {
        const t0 = performance.now();
        const animateStep = (now: number) => {
          const p = Math.min(1, (now - t0) / stepMs);
          trainer.progress = p;
          trainer.renderX = startX + (nextX - startX) * p;
          trainer.renderY = startY + (nextY - startY) * p;
          if (p < 1) {
            requestAnimationFrame(animateStep);
          } else {
            trainer.x = nextX;
            trainer.y = nextY;
            trainer.renderX = nextX;
            trainer.renderY = nextY;
            trainer.isMoving = false;
            trainer.progress = 0;
            resolve();
          }
        };
        requestAnimationFrame(animateStep);
      });
    }

    ctx.player.direction = BattleController.getOppositeDirection(trainer.direction);
    const dialoguePages =
      trainer.challengePages && trainer.challengePages.length > 0
        ? trainer.challengePages
        : trainer.pages || ['Let us battle!'];

    ctx.overworldHUD.openDialogue(dialoguePages, trainer.speaker, () => {
      ctx.setCutsceneLocked(false);
      const team = BattleController.buildTrainerTeamInstances(trainer);
      if (team.length === 0) return;
      ctx.triggerBattle(team[0], {
        isTrainer: true,
        trainerName: trainer.trainerName || trainer.speaker || 'Trainer',
        trainerTeam: team,
        onVictory: () => {
          ctx.handleTrainerDefeatRewards(trainer);
        },
      });
    });
  }
}
