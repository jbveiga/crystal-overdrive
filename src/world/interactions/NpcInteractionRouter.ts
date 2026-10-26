import type { MapData } from '../../types/game';
import type { GridEntity } from '../GridPhysics';
import type {
  NpcInteractionContext,
  NpcInteractionHandler,
  NpcInteractionRegistration,
} from '../../types/gameContext';

/**
 * NpcInteractionRouter — Constant-Time O(1) NPC Interaction Dispatcher
 *
 * Replaces the monolithic 3,300+ line sequential if/else NPC cascade in main.ts
 * with O(1) Map lookups for registered entity IDs and actions, clean prefix matching,
 * standard trainer battles, and default dialogue fallbacks (HEAL_AND_SAVE / OPEN_MART).
 *
 * Strict Layer Purity: Zero DOM and zero PixiJS imports.
 */
export class NpcInteractionRouter {
  private readonly actionHandlers = new Map<string, NpcInteractionHandler>();
  private readonly idHandlers = new Map<string, NpcInteractionHandler>();
  private readonly prefixHandlers: Array<{ prefix: string; handler: NpcInteractionHandler }> = [];

  constructor(registrations: NpcInteractionRegistration[] = []) {
    this.registerAll(registrations);
  }

  public register(reg: NpcInteractionRegistration): void {
    if (reg.actions) {
      for (const action of reg.actions) {
        this.actionHandlers.set(action, reg.handler);
      }
    }
    if (reg.npcIds) {
      for (const id of reg.npcIds) {
        this.idHandlers.set(id, reg.handler);
      }
    }
    if (reg.idPrefixes) {
      for (const prefix of reg.idPrefixes) {
        this.prefixHandlers.push({ prefix, handler: reg.handler });
      }
    }
  }

  public registerAll(registrations: NpcInteractionRegistration[]): void {
    for (const reg of registrations) {
      this.register(reg);
    }
  }

  /**
   * Dispatches an interaction with the given target NPC.
   * 1. Turns NPC toward player if not mid-step.
   * 2. Checks O(1) idHandlers, then O(1) actionHandlers.
   * 3. Checks prefixHandlers.
   * 4. Falls back to standard TRAINER_BATTLE if applicable.
   * 5. Falls back to default targetNpc.pages dialogue (including HEAL_AND_SAVE / OPEN_MART).
   *
   * Returns true if interaction was consumed, false otherwise.
   */
  public dispatch(
    targetNpc: GridEntity,
    currentMap: MapData,
    ctx: NpcInteractionContext
  ): boolean {
    // 1. Turn NPC toward player if stationary
    if (!targetNpc.isMoving) {
      targetNpc.direction = ctx.getOppositeDirection(ctx.player.direction);
    }

    // 2. O(1) ID-based handler
    const idHandler = this.idHandlers.get(targetNpc.id);
    if (idHandler) {
      const result = idHandler(targetNpc, currentMap, ctx);
      if (result !== false) return true;
    }

    // 3. O(1) Action-based handler
    if (targetNpc.action) {
      const actionHandler = this.actionHandlers.get(targetNpc.action);
      if (actionHandler) {
        const result = actionHandler(targetNpc, currentMap, ctx);
        if (result !== false) return true;
      }
    }

    // 4. Prefix match handler (e.g. b3f_electrode_*, dept_elevator*)
    for (const { prefix, handler } of this.prefixHandlers) {
      if (targetNpc.id.startsWith(prefix)) {
        const result = handler(targetNpc, currentMap, ctx);
        if (result !== false) return true;
      }
    }

    // 5. Standard Trainer Battle fallback
    if (
      targetNpc.action === 'TRAINER_BATTLE' &&
      targetNpc.trainerId &&
      !ctx.defeatedTrainers.has(targetNpc.trainerId) &&
      targetNpc.trainerPokemon
    ) {
      ctx.defeatedTrainers.add(targetNpc.trainerId);
      const pagesToUse =
        targetNpc.challengePages && targetNpc.challengePages.length > 0
          ? targetNpc.challengePages
          : targetNpc.pages || [];
      ctx.openDialogue(pagesToUse, targetNpc.speaker, () => {
        const team = ctx.buildTrainerTeamInstances(targetNpc);
        if (team.length === 0) return;
        ctx.triggerBattle(team[0], {
          isTrainer: true,
          trainerName: targetNpc.trainerName || targetNpc.speaker || 'Trainer',
          trainerTeam: team,
          onVictory: () => {
            ctx.handleTrainerDefeatRewards(targetNpc);
          },
        });
      });
      return true;
    }

    // 6. Generic Dialogue & Pokecenter/Mart fallbacks
    if (targetNpc.pages && targetNpc.pages.length > 0) {
      ctx.openDialogue(targetNpc.pages, targetNpc.speaker, () => {
        if (targetNpc.action === 'HEAL_AND_SAVE') {
          if (currentMap.id.endsWith('_poke_center')) {
            ctx.setLastVisitedPokecenter({ mapId: currentMap.id, x: 3, y: 3 });
            ctx.healPlayerParty(false);
            ctx.saveCurrentGame();
            ctx.playHealingAnimation(ctx.playerParty.length);
          } else {
            ctx.healPlayerParty(false);
            ctx.saveCurrentGame();
            ctx.playFieldRestAnimation();
          }
        } else if (targetNpc.action === 'OPEN_MART') {
          ctx.openMart();
        }
      });
      return true;
    }

    return false;
  }
}
