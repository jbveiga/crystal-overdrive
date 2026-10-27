/**
 * @fileoverview Orchestrates battle lifecycle, turn loop execution, exp distribution, and UI state reconciliation.
 * @module battle/BattleSessionController
 * @role Battle Engine Session Orchestrator
 * @exports BattleSessionController
 * @layer battle
 * @sections L1-7: Micro-Header & Types | L8-281: Core Implementation | L282-563: Public Interface & Exports
 */

import type {
  PokemonInstance,
  PokeballId,
  ExpShareMode,
  SpeedMultiplier,
} from '../types/game';
import type { BattleSessionContext, TriggerBattleOptions } from '../types/gameContext';
import { BattleStateMachine, type BattleTurnResult } from './BattleStateMachine';
import { PokemonFactory, type PartyExpAward } from './PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';
import { MapManager } from '../world/MapManager';
import { EvolutionManager } from '../world/EvolutionManager';

export class BattleSessionController {
  /**
   * Orchestrates a complete turn-based battle session (Wild, Trainer, Gym Leader, or 2v2 Stadium).
   * Extracted from src/main.ts to maintain pure domain isolation and agent readability.
   */
  public static async runBattleSession(
    ctx: BattleSessionContext,
    initialOpponentPokemon: PokemonInstance,
    options: TriggerBattleOptions = {}
  ): Promise<void> {
    let opponentPokemon = initialOpponentPokemon;
    const remainingTrainerParty: PokemonInstance[] =
      options.doubleConfig?.isDoubleBattle
        ? []
        : options.trainerTeam && options.trainerTeam.length > 1
        ? options.trainerTeam.slice(1)
        : [];

    ctx.setGameState('BATTLE');
    ctx.overworldHUD.hide();
    ctx.itemfinderHUD.suspend();
    ctx.player.isMoving = false;
    ctx.player.progress = 0;
    ctx.audioManager.playBattleBgm(
      options.isGymLeader ? 'gym_leader' : options.isTrainer ? 'trainer' : 'wild'
    );

    // Record species as SEEN in Pokédex
    ctx.seenSpecies.add(opponentPokemon.speciesId);
    if (options.doubleConfig?.enemyPartner) {
      ctx.seenSpecies.add(options.doubleConfig.enemyPartner.speciesId);
    }

    // Reset temporary trapping flag at the start of a new encounter while keeping persistent HP/Status
    if (ctx.playerParty.length === 0) return;
    opponentPokemon.isTrapped = false;

    let activePlayerPokemon =
      ctx.playerParty.find((p) => !p.isEgg && p.currentHp > 0) ||
      ctx.playerParty.find((p) => !p.isEgg) ||
      ctx.playerParty[0];
    if (activePlayerPokemon.currentHp <= 0) {
      ctx.healPlayerParty();
      activePlayerPokemon = ctx.playerParty.find((p) => !p.isEgg) || ctx.playerParty[0];
    }
    let battleSM = new BattleStateMachine(
      activePlayerPokemon,
      opponentPokemon,
      options.isRoamer,
      options.doubleConfig
    );

    ctx.battleRenderer.setSpeedMultiplier(ctx.gameClock.battleSpeed);
    ctx.battleHUD.updateSpeedDisplay(ctx.gameClock.battleSpeed);

    const caughtSpeciesIds = new Set<string>([
      ...ctx.playerParty.map((p) => p.speciesId),
      ...ctx.playerBox.map((p) => p.speciesId),
    ]);

    await ctx.battleRenderer.startBattle(activePlayerPokemon, opponentPokemon);

    if (options.doubleConfig?.isDoubleBattle) {
      const foePartner = options.doubleConfig.enemyPartner;
      const allyPartner = options.doubleConfig.playerPartner;
      await ctx.battleHUD.showMessage(
        `🏟️ ${options.trainerName || 'Stadium Duo'} challenged you to a 2v2 Double Battle!`
      );
      await ctx.battleHUD.showMessage(
        `${options.trainerName || 'Foe'} sent out ${opponentPokemon.nickname}${
          foePartner ? ` and ${foePartner.nickname}` : ''
        }!`
      );
      if (allyPartner) {
        await ctx.battleHUD.showMessage(
          `Go! ${activePlayerPokemon.nickname} and ${allyPartner.nickname}!`
        );
      }
    } else if (options.isTrainer) {
      await ctx.battleHUD.showMessage(`${options.trainerName} would like to battle!`);
      await ctx.battleHUD.showMessage(`${options.trainerName} sent out ${opponentPokemon.nickname}!`);
    } else if (options.isRoamer) {
      await ctx.battleHUD.showMessage(`⚡ Legendary Beast ${opponentPokemon.nickname} appeared!`);
    } else {
      await ctx.battleHUD.showMessage(`Wild ${opponentPokemon.nickname} appeared!`);
    }

    const bindBattleHudForActiveFoe = () => {
      ctx.battleHUD.initBattle(
        activePlayerPokemon,
        opponentPokemon,
        {
          onMoveSelected: async (moveId: string) => {
            const result = battleSM.executeRound({ type: 'FIGHT', moveId });
            await playTurnEventsAndFinishCheck(result);
          },
          onDoubleMovesSelected: async (
            slot1MoveId: string,
            slot2MoveId?: string,
            slot1Target?: 0 | 1,
            slot2Target?: 0 | 1
          ) => {
            const result = battleSM.executeDoubleRound(
              { type: 'FIGHT', moveId: slot1MoveId, targetSlot: slot1Target ?? 0 },
              slot2MoveId
                ? { type: 'FIGHT', moveId: slot2MoveId, targetSlot: slot2Target ?? 1 }
                : undefined
            );
            await playTurnEventsAndFinishCheck(result);
          },
          onPokemonSelected: async (targetPokemon: PokemonInstance) => {
            const result = battleSM.executeRound({ type: 'SWITCH', switchPokemon: targetPokemon });
            await playTurnEventsAndFinishCheck(result);
          },
          onBagSelected: async (ballId: PokeballId) => {
            if (options.isTrainer) {
              await ctx.battleHUD.showMessage("The trainer blocked the ball! Don't be a thief!");
              ctx.battleHUD.showActionMenu();
              return;
            }

            if (ctx.inventory.balls[ballId] && ctx.inventory.balls[ballId]! > 0) {
              ctx.inventory.balls[ballId]!--;
            }

            const result = battleSM.executeRound({ type: 'BAG', ballId });
            await playTurnEventsAndFinishCheck(result);
          },
          onItemUsed: async (itemId: string, targetPokemon: PokemonInstance) => {
            const underscoreId = itemId.replace(/-/g, '_');
            if ((ctx.inventory.items[itemId] ?? 0) > 0) {
              ctx.inventory.items[itemId]!--;
            } else if ((ctx.inventory.items[underscoreId] ?? 0) > 0) {
              ctx.inventory.items[underscoreId]!--;
            } else if (
              ctx.inventory.berries &&
              (ctx.inventory.berries[itemId as keyof typeof ctx.inventory.berries] ?? 0) > 0
            ) {
              ctx.inventory.berries[itemId as keyof typeof ctx.inventory.berries]!--;
            } else if (
              ctx.inventory.berries &&
              (ctx.inventory.berries[underscoreId as keyof typeof ctx.inventory.berries] ?? 0) > 0
            ) {
              ctx.inventory.berries[underscoreId as keyof typeof ctx.inventory.berries]!--;
            }

            const result = battleSM.executeRound({ type: 'USE_ITEM', itemId, targetPokemon });
            await playTurnEventsAndFinishCheck(result);
          },
          onRunSelected: async () => {
            if (options.isTrainer) {
              await ctx.battleHUD.showMessage("No! There's no running from a Trainer battle!");
              ctx.battleHUD.showActionMenu();
              return;
            }
            const runResult = battleSM.executeRound({ type: 'RUN' });
            if (options.isRoamer) {
              ctx.eventBus.emit('roamer:updated', { roamers: ctx.roamingManager.getAllRoamers() });
            }
            await ctx.battleHUD.showMessage('Got away safely!');
            ctx.mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);
            ctx.battleRenderer.endBattle();
            ctx.battleHUD.hide();
            ctx.setGameState('OVERWORLD');
            ctx.audioManager.restoreOverworldBgm(0.6);
            ctx.overworldHUD.show();
            ctx.itemfinderHUD.resume();
            if (options.onBattleEnd) {
              await options.onBattleEnd(runResult);
            }
          },
          onSpeedToggle: () => {
            return ctx.cycleBattleSpeed();
          },
        },
        ctx.inventory.balls,
        ctx.playerParty,
        caughtSpeciesIds,
        ctx.inventory.items,
        ctx.inventory.berries as Record<string, number | undefined>
      );

      if (options.doubleConfig?.isDoubleBattle || options.doubleConfig?.stadiumRules) {
        ctx.battleHUD.setDoubleBattlePeers(
          battleSM.playerPartner,
          battleSM.enemyPartner,
          options.doubleConfig?.stadiumRules
        );
      } else {
        ctx.battleHUD.setDoubleBattlePeers(undefined, undefined, undefined);
      }
    };

    const playTurnEventsAndFinishCheck = async (result: BattleTurnResult) => {
      let ballGraphic: any = null;

      for (const ev of result.events) {
        if (ev.type === 'MESSAGE') {
          await ctx.battleHUD.showMessage(ev.text);
        } else if (ev.type === 'SWITCH') {
          activePlayerPokemon = ev.newPokemon;
          await ctx.battleRenderer.animateSwitchPlayerPokemon(activePlayerPokemon);
          ctx.battleHUD.setActivePlayerPokemon(activePlayerPokemon);
          ctx.battleHUD.slideInHealthCard(true);
        } else if (ev.type === 'THROW_BALL') {
          ballGraphic = await ctx.battleRenderer.animateThrowBall(ev.ballId);
        } else if (ev.type === 'SHAKE' && ballGraphic) {
          await ctx.battleRenderer.animateShake(ballGraphic, ev.shakes, ev.caught);
        } else if (ev.type === 'ATTACK') {
          const isAllyAttacker =
            ev.attackerId === activePlayerPokemon.uid ||
            ev.attackerId === battleSM.playerPartner?.uid;
          await ctx.battleRenderer.animateAttack(
            isAllyAttacker,
            ev.moveType,
            ev.moveCategory
          );
        } else if (ev.type === 'DAMAGE') {
          const isPlayerTarget =
            ev.targetId === activePlayerPokemon.uid ||
            ev.targetId === battleSM.playerPartner?.uid;
          await ctx.battleRenderer.animateDamage(isPlayerTarget, ev.effectiveness, ev.isCritical);
          ctx.battleHUD.updateHpByUid(ev.targetId, ev.remainingHp);
        } else if (ev.type === 'HEAL') {
          BattleAudio.playMenuSound('HEAL');
          if (ev.targetId === activePlayerPokemon.uid) {
            ctx.battleHUD.updateHp(true, ev.remainingHp, activePlayerPokemon.stats.hp);
          } else {
            ctx.battleHUD.updatePartyDock();
          }
          ctx.battleHUD.updateStatusBadges();
        } else if (ev.type === 'RESIDUAL_DAMAGE') {
          const isPlayerTarget =
            ev.targetId === activePlayerPokemon.uid ||
            ev.targetId === battleSM.playerPartner?.uid;
          await ctx.battleRenderer.animateDamage(isPlayerTarget, 1, false);
          ctx.battleHUD.updateHpByUid(ev.targetId, ev.remainingHp);
        } else if (ev.type === 'STAT_CHANGE') {
          const isPlayerTarget =
            ev.targetId === activePlayerPokemon.uid ||
            ev.targetId === battleSM.playerPartner?.uid;
          await ctx.battleRenderer.animateStatChange(isPlayerTarget, ev.stages > 0);
          ctx.battleHUD.updateStatusBadges();
        } else if (ev.type === 'STATUS') {
          ctx.battleHUD.updateStatusBadges();
        } else if (ev.type === 'FAINT') {
          const isPlayerTarget =
            ev.targetId === activePlayerPokemon.uid ||
            ev.targetId === battleSM.playerPartner?.uid;
          BattleAudio.playCry(
            isPlayerTarget ? activePlayerPokemon.speciesId : opponentPokemon.speciesId,
            true
          );
          if (ev.targetId === activePlayerPokemon.uid || ev.targetId === opponentPokemon.uid) {
            await ctx.battleRenderer.animateFaint(ev.targetId === activePlayerPokemon.uid);
          }
        }
      }

      if (result.isBattleOver) {
        if (result.caught) {
          if (ctx.bugContestManager.state.isActive) {
            await ctx.promptBugContestSpecimenSwap(opponentPokemon);
          }
          if (options.isRoamer) {
            ctx.roamingManager.markCaught(opponentPokemon.speciesId);
            ctx.overworldHUD.hideRoamerAlert();
          }
          if (ctx.playerParty.length < 6) {
            ctx.playerParty.push(opponentPokemon);
          } else {
            const depositRes = ctx.boxManager.deposit(opponentPokemon);
            ctx.setPlayerBox(ctx.boxManager.flatten());
            const targetBox = ctx.boxManager.getBox(depositRes.boxIndex);
            const boxName = targetBox ? targetBox.name : `BOX ${depositRes.boxIndex + 1}`;
            BattleAudio.playOverworldSound('FANFARE');
            await ctx.battleHUD.showMessage("Bill's PC was accessed.");
            await ctx.battleHUD.showMessage(
              `${opponentPokemon.nickname || opponentPokemon.speciesId.toUpperCase()} was transferred to ${boxName}!`
            );
            if (depositRes.rolledOver) {
              await ctx.battleHUD.showMessage(
                `The previous box was full! Automatically stored in ${boxName}!`
              );
            }
            ctx.saveCurrentGame();
          }
        } else if (result.winner === 'PLAYER') {
          if (options.isRoamer) {
            ctx.roamingManager.markDefeated(opponentPokemon.speciesId);
            ctx.overworldHUD.hideRoamerAlert();
          }

          // Award EXP & Check Level-Up across party via Unbound-Style Exp. Share (OFF | ALL | CAPPED)
          const expGained = PokemonFactory.calculateExpGain(opponentPokemon, Boolean(options.isTrainer));
          const expShareMode: ExpShareMode = ctx.gameOptions.expShare || 'CAPPED';
          const expAwards = PokemonFactory.distributePartyExp(
            ctx.playerParty,
            activePlayerPokemon,
            expGained,
            expShareMode,
            ctx.inventory.badges.length
          );

          const processLevelUpAndMoves = async (award: PartyExpAward) => {
            if (!award.leveledUp) return;
            const member = award.pokemon;
            BattleAudio.playBallEvent('LEVEL_UP');
            await ctx.battleHUD.showMessage(
              `🎉 ${member.nickname} grew to Lv. ${award.newLevel}!`
            );

            // Level-Up Learnset Move Learning (Ticket 6.4)
            const learnableMoveIds = await PokemonFactory.getLearnableMovesAtLevel(
              member.speciesId,
              award.newLevel
            );

            for (const newMoveId of learnableMoveIds) {
              const alreadyKnown = member.moves.some((m) => m.moveId === newMoveId);
              if (alreadyKnown) continue;

              const newMoveData = PokemonFactory.getMoveData(newMoveId);

              if (member.moves.length < 4) {
                // Auto-learn if fewer than 4 moves
                member.moves.push({
                  moveId: newMoveData.id,
                  currentPp: newMoveData.pp,
                  maxPp: newMoveData.pp,
                });
                BattleAudio.playBallEvent('LEVEL_UP');
                await ctx.battleHUD.showMessage(
                  `✨ ${member.nickname} learned ${newMoveData.name}!`
                );
              } else {
                // Prompt to forget an existing move or decline
                const chosenIdx = await ctx.battleHUD.promptMoveForget(member, newMoveData);
                if (chosenIdx !== null && chosenIdx >= 0 && chosenIdx < 4) {
                  const forgottenMove = member.moves[chosenIdx];
                  const forgottenData = PokemonFactory.getMoveData(forgottenMove.moveId);
                  member.moves[chosenIdx] = {
                    moveId: newMoveData.id,
                    currentPp: newMoveData.pp,
                    maxPp: newMoveData.pp,
                  };
                  BattleAudio.playBallEvent('LEVEL_UP');
                  await ctx.battleHUD.showMessage(
                    `1, 2, and... Poof! ${member.nickname} forgot ${forgottenData.name} and learned ${newMoveData.name}!`
                  );
                } else {
                  await ctx.battleHUD.showMessage(
                    `${member.nickname} did not learn ${newMoveData.name}.`
                  );
                }
              }
            }
          };

          // 1. Process active battler first
          for (const award of expAwards) {
            if (!award.isActiveBattler) continue;
            const member = award.pokemon;
            if (award.isCapped) {
              await ctx.battleHUD.showMessage(
                `🧢 ${member.nickname} is at the level cap (Lv. ${award.levelCap})! Received 1 EXP.`
              );
            } else {
              await ctx.battleHUD.showMessage(`${member.nickname} gained ${award.expAwarded} EXP. Points!`);
            }
            ctx.battleHUD.updateExp(activePlayerPokemon);
            ctx.battleHUD.updateHp(true, activePlayerPokemon.currentHp, activePlayerPokemon.stats.hp);
            await processLevelUpAndMoves(award);
          }

          // 2. Process benched party members via consolidated summary (Pokémon Unbound style)
          const benchSummary = PokemonFactory.formatBenchExpShareSummary(expAwards);
          if (benchSummary) {
            await ctx.battleHUD.showMessage(benchSummary);
          }

          // 3. Process benched members' level-ups and move learns
          for (const award of expAwards) {
            if (award.isActiveBattler || !award.leveledUp) continue;
            await processLevelUpAndMoves(award);
          }

          // Multi-Pokémon Trainer Team continuation (Ticket 5.5)
          if (options.isTrainer && remainingTrainerParty.length > 0) {
            opponentPokemon = remainingTrainerParty.shift()!;
            opponentPokemon.isTrapped = false;
            ctx.seenSpecies.add(opponentPokemon.speciesId);
            battleSM = new BattleStateMachine(activePlayerPokemon, opponentPokemon, false);
            await ctx.battleHUD.showMessage(`${options.trainerName} sent out ${opponentPokemon.nickname}!`);
            await ctx.battleRenderer.animateSendOutNextPokemon(false, opponentPokemon);
            bindBattleHudForActiveFoe();
            ctx.battleHUD.slideInHealthCard(false);
            return;
          }

          if (options.isTrainer) {
            const fullTrainerTeam = options.trainerTeam || [opponentPokemon];
            const prizeMoney = BattleStateMachine.calculateTrainerPayout(fullTrainerTeam);
            ctx.inventory.money += prizeMoney;
            await ctx.battleHUD.showMessage(`You defeated ${options.trainerName}!`);
            await ctx.battleHUD.showMessage(`You got $${prizeMoney} for winning!`);
          }
        } else if (result.winner === 'ENEMY') {
          const remainingConscious = ctx.playerParty.filter((p) => !p.isEgg && p.currentHp > 0);
          if (remainingConscious.length > 0) {
            await ctx.battleHUD.showMessage(
              `${activePlayerPokemon.nickname} fainted! Choose another POKéMON to send in!`
            );
            ctx.battleHUD.showPartyMenu({
              forcedSwitch: true,
              onSelected: async (nextPokemon: PokemonInstance) => {
                activePlayerPokemon = nextPokemon;
                battleSM.playerPokemon = nextPokemon;
                battleSM.playerPokemon.statStages = PokemonFactory.createDefaultStatStages();
                battleSM.isBattleOver = false;
                await ctx.battleHUD.showMessage(`Go! ${activePlayerPokemon.nickname}!`);
                await ctx.battleRenderer.animateSendOutNextPokemon(true, activePlayerPokemon);
                bindBattleHudForActiveFoe();
                ctx.battleHUD.slideInHealthCard(true);
              },
            });
            return;
          }

          // Whiteout / Blackout sequence (all party Pokémon fainted)
          const fine = Math.min(ctx.inventory.money, Math.max(20, Math.floor(ctx.inventory.money * 0.1)));
          ctx.inventory.money = Math.max(0, ctx.inventory.money - fine);
          await ctx.battleHUD.showMessage(`${ctx.playerName} is out of usable POKéMON!`);
          if (fine > 0) {
            await ctx.battleHUD.showMessage(`${ctx.playerName} paid $${fine} as the prize money…`);
          }
          await ctx.battleHUD.showMessage(
            `${ctx.playerName} blacked out and rushed to the POKéMON CENTER!`
          );

          if (options.isRoamer) {
            ctx.eventBus.emit('roamer:updated', { roamers: ctx.roamingManager.getAllRoamers() });
          }

          ctx.mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);
          ctx.battleRenderer.endBattle();
          ctx.battleHUD.hide();
          ctx.setGameState('OVERWORLD');

          await ctx.respawnAtLastPokecenter();
          return;
        }

        if (options.isRoamer) {
          ctx.eventBus.emit('roamer:updated', { roamers: ctx.roamingManager.getAllRoamers() });
        }
        ctx.mapManager.activateEncounterGracePeriod(MapManager.GRACE_STEPS_DEFAULT);
        ctx.battleRenderer.endBattle();
        ctx.battleHUD.hide();
        ctx.setGameState('OVERWORLD');
        ctx.audioManager.restoreOverworldBgm(0.6);
        ctx.overworldHUD.show();
        ctx.itemfinderHUD.resume();

        // Check and run post-battle Level-Up Evolution sequences for any eligible party Pokémon
        if (result.winner === 'PLAYER') {
          for (const member of ctx.playerParty) {
            if (member.isEgg || member.currentHp <= 0) continue;
            const evoCandidate = EvolutionManager.canEvolve(member, {
              trigger: 'LEVEL_UP',
              level: member.level,
              timeOfDay: ctx.gameClock.getTimeOfDay(),
            });
            if (evoCandidate) {
              const evoResult = await ctx.playEvolutionScene(member, evoCandidate.targetSpeciesId);
              if (evoResult.evolved) {
                const targetSpecies =
                  evoResult.newSpeciesId || evoResult.targetSpecies || evoCandidate.targetSpeciesId;
                if (member.speciesId.toLowerCase() !== targetSpecies.toLowerCase()) {
                  EvolutionManager.executeEvolution(member, targetSpecies);
                }
                ctx.seenSpecies.add(member.speciesId);
                const evoMoves = await PokemonFactory.getLearnableMovesAtLevel(
                  member.speciesId,
                  member.level
                );
                for (const moveId of evoMoves) {
                  if (member.moves.some((m) => m.moveId === moveId)) continue;
                  const moveData = PokemonFactory.getMoveData(moveId);
                  if (member.moves.length < 4) {
                    member.moves.push({
                      moveId: moveData.id,
                      currentPp: moveData.pp,
                      maxPp: moveData.pp,
                    });
                    ctx.overworldHUD.showToast(`✨ ${member.nickname} learned ${moveData.name}!`);
                  } else {
                    const chosenSlot = await ctx.openMoveReplacementModal(member, moveData);
                    if (chosenSlot !== null && chosenSlot >= 0 && chosenSlot < 4) {
                      const replacedMove = member.moves[chosenSlot];
                      let replacedName = replacedMove.moveId.toUpperCase();
                      try {
                        const replacedData = PokemonFactory.getMoveData(replacedMove.moveId);
                        replacedName = replacedData.name;
                      } catch {}
                      member.moves[chosenSlot] = {
                        moveId: moveData.id,
                        currentPp: moveData.pp,
                        maxPp: moveData.pp,
                      };
                      ctx.overworldHUD.showToast(
                        `✨ ${member.nickname} forgot ${replacedName} and learned ${moveData.name}!`
                      );
                    } else {
                      ctx.overworldHUD.showToast(
                        `${member.nickname} did not learn ${moveData.name}.`
                      );
                    }
                  }
                }
              }
            }
          }
        }

        ctx.saveCurrentGame();

        if (options.onBattleEnd) {
          await options.onBattleEnd(result);
        }
        if (result.winner === 'PLAYER' && options.onVictory) {
          await options.onVictory();
        }
      } else {
        ctx.battleHUD.showActionMenu();
      }
    };

    bindBattleHudForActiveFoe();
  }
}
