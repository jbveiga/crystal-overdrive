/**
 * @fileoverview BagPartyTargetRenderer domain module implementation.
 * @module ui/bag/BagPartyTargetRenderer
 * @role BagPartyTargetRenderer Component
 * @exports PartySelectorContext, UseStoneContext, UseMedicineContext
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-178: Implementation | L179-356: Handlers & Exports
 */

import type { PokemonInstance } from '../../types/game';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { EvolutionManager } from '../../world/EvolutionManager';
import { EvolutionSceneUI } from '../EvolutionSceneUI';
import { MoveReplacementModalUI } from '../MoveReplacementModalUI';
import {
  EVOLUTION_STONE_CATALOG,
  type BagInventory,
  type EvolutionStoneItemDef,
  type MedicineItemDef,
  type RepelItemDef,
} from './BagItemCatalogs';

export interface PartySelectorContext {
  container: HTMLElement;
  party: PokemonInstance[];
  selectedPartyIndex: number;
  inventory: BagInventory;
  onSelect: (idx: number) => void;
}

export interface UseStoneContext {
  stone: EvolutionStoneItemDef;
  target: PokemonInstance | undefined;
  inventory: BagInventory;
  hideModal: () => void;
  showFeedback: (msg: string, isError?: boolean) => void;
  onInventoryChanged?: () => void;
}

export interface UseMedicineContext {
  med: MedicineItemDef;
  target: PokemonInstance | undefined;
  inventory: BagInventory;
  showFeedback: (msg: string, isError?: boolean) => void;
  onInventoryChanged?: () => void;
  reRender: () => void;
}

export interface UseRepelContext {
  repel: RepelItemDef;
  inventory: BagInventory;
  showFeedback: (msg: string, isError?: boolean) => void;
  onUseRepel?: (steps: number, itemName: string) => void;
  onInventoryChanged?: () => void;
  reRender: () => void;
}

export class BagPartyTargetRenderer {
  public static renderPartyTargetSelector(ctx: PartySelectorContext): void {
    const { container, party, selectedPartyIndex, inventory, onSelect } = ctx;
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: #080E1D;
      border: 1.5px solid #22324F;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 3px 0 0 #070B14;
    `;

    const title = document.createElement('div');
    title.style.cssText =
      "font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;";
    title.innerText = 'Target Party Member (Click to Select):';
    bar.appendChild(title);

    const pillsRow = document.createElement('div');
    pillsRow.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

    const ownedStones = EVOLUTION_STONE_CATALOG.filter((s) => this.getOwnedStoneCount(inventory, s) > 0);

    party.forEach((pkmn, idx) => {
      const isSelected = idx === selectedPartyIndex;
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#48C774' : pct > 20 ? '#FFD028' : '#EE4238';

      const pill = document.createElement('button');
      pill.style.cssText = `
        background: ${isSelected ? '#141E33' : '#0D1322'};
        border: 2px solid ${isSelected ? '#38BDF8' : '#22324F'};
        box-shadow: ${isSelected ? '0 0 10px rgba(56, 189, 248, 0.3), 0 3px 0 0 #070B14' : '0 2px 0 0 #070B14'};
        border-radius: 8px;
        padding: 6px 10px;
        color: #F6F8F3;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 124px;
        text-align: left;
        transition: all 0.1s ease;
      `;

      const statusBadge =
        pkmn.status !== 'NONE'
          ? `<span style="background: #EE4238; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; font-family: 'Space Mono', monospace;">${pkmn.status}</span>`
          : '';

      const canAnyOwnedStoneEvolve =
        ownedStones.length > 0 && !pkmn.isEgg
          ? ownedStones.some((s) =>
              EvolutionManager.canEvolve(pkmn, {
                trigger: 'ITEM',
                itemId: s.altId,
              })
            )
          : false;

      const stoneBadge =
        ownedStones.length > 0 && !pkmn.isEgg
          ? `<span class="party-stone-compat-badge" style="background: ${canAnyOwnedStoneEvolve ? '#059669' : '#334155'}; color: ${canAnyOwnedStoneEvolve ? '#FFFFFF' : '#94A3B8'}; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; font-family: 'Space Mono', monospace;">${canAnyOwnedStoneEvolve ? 'ABLE' : 'UNABLE'}</span>`
          : '';

      pill.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 12px; font-weight: 800;">
          <span>${pkmn.nickname}</span>
          ${statusBadge}
          ${stoneBadge}
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #FFD028;">Lv.${pkmn.level}</span>
        </div>
        <div style="width: 100%; height: 5px; background: #080E1D; border-radius: 3px; overflow: hidden; border: 1px solid #22324F;">
          <div style="width: ${pct}%; height: 100%; background: ${hpColor};"></div>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">HP ${pkmn.currentHp}/${pkmn.stats.hp}</div>
      `;

      pill.addEventListener('click', () => {
        BattleAudio.playMenuSound('CURSOR');
        onSelect(idx);
      });

      pillsRow.appendChild(pill);
    });

    bar.appendChild(pillsRow);
    container.appendChild(bar);
  }

  public static getOwnedStoneCount(inventory: BagInventory, stone: EvolutionStoneItemDef): number {
    if (!inventory.items) return 0;
    let count = (inventory.items[stone.id] ?? 0) + (inventory.items[stone.altId] ?? 0);
    if (stone.isLinkStone) {
      count += (inventory.items['linking_cord'] ?? 0) + (inventory.items['linking-cord'] ?? 0);
    }
    return count;
  }

  public static consumeOwnedStone(inventory: BagInventory, stone: EvolutionStoneItemDef): string {
    if (!inventory.items) return stone.id;
    if ((inventory.items[stone.id] ?? 0) > 0) {
      inventory.items[stone.id]!--;
      return stone.id;
    }
    if ((inventory.items[stone.altId] ?? 0) > 0) {
      inventory.items[stone.altId]!--;
      return stone.altId;
    }
    if (stone.isLinkStone) {
      if ((inventory.items['linking_cord'] ?? 0) > 0) {
        inventory.items['linking_cord']!--;
        return 'linking_cord';
      }
      if ((inventory.items['linking-cord'] ?? 0) > 0) {
        inventory.items['linking-cord']!--;
        return 'linking-cord';
      }
    }
    return stone.id;
  }

  public static refundOwnedStone(inventory: BagInventory, key: string): void {
    if (!inventory.items) inventory.items = {};
    inventory.items[key] = (inventory.items[key] ?? 0) + 1;
  }

  public static async useEvolutionStoneOnTarget(ctx: UseStoneContext): Promise<boolean> {
    const { stone, target, inventory, hideModal, showFeedback, onInventoryChanged } = ctx;
    if (!target) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback('Select a party Pokémon first!', true);
      return false;
    }

    if (target.isEgg) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback("An EGG won't evolve from a stone!", true);
      return false;
    }

    const evoCandidate = EvolutionManager.canEvolve(target, {
      trigger: 'ITEM',
      itemId: stone.altId,
    });

    if (!evoCandidate) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback(`It won't have any effect on ${target.nickname}!`, true);
      return false;
    }

    const currentCount = this.getOwnedStoneCount(inventory, stone);
    if (currentCount <= 0) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback(`You don't have any ${stone.name} left!`, true);
      return false;
    }

    const consumedKey = this.consumeOwnedStone(inventory, stone);
    hideModal();

    const evoScene = new EvolutionSceneUI('modal-container');
    const res = await evoScene.play(target, evoCandidate.targetSpeciesId, { mutatePokemon: true });

    if (res.evolved) {
      const targetSpecies = res.newSpeciesId || res.targetSpecies || evoCandidate.targetSpeciesId;
      if (target.speciesId.toLowerCase() !== targetSpecies.toLowerCase()) {
        EvolutionManager.executeEvolution(target, targetSpecies);
      }

      // Check and teach learnset moves at current level
      const evoMoves = await PokemonFactory.getLearnableMovesAtLevel(target.speciesId, target.level);
      for (const moveId of evoMoves) {
        if (target.moves.some((m) => m.moveId === moveId)) continue;
        const moveData = PokemonFactory.getMoveData(moveId);
        if (target.moves.length < 4) {
          target.moves.push({
            moveId: moveData.id,
            currentPp: moveData.pp,
            maxPp: moveData.pp,
          });
        } else {
          const modal = new MoveReplacementModalUI('modal-container');
          const chosenSlot = await modal.open(target, moveData);
          if (chosenSlot !== null && chosenSlot >= 0 && chosenSlot < 4) {
            target.moves[chosenSlot] = {
              moveId: moveData.id,
              currentPp: moveData.pp,
              maxPp: moveData.pp,
            };
          }
        }
      }

      onInventoryChanged?.();
      return true;
    } else {
      // Cancelled via B-button: refund the stone
      this.refundOwnedStone(inventory, consumedKey);
      onInventoryChanged?.();
      return false;
    }
  }

  public static useMedicineOnTarget(ctx: UseMedicineContext): boolean {
    const { med, target, inventory, showFeedback, onInventoryChanged, reRender } = ctx;
    if (!target || !inventory.items) return false;
    const currentCount = inventory.items[med.id] ?? 0;
    if (currentCount <= 0) return false;

    if (med.id === 'potion' || med.id === 'super-potion') {
      if (target.currentHp <= 0) {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`${target.nickname} has fainted! Use a Revive first.`, true);
        return false;
      }
      if (target.currentHp >= target.stats.hp) {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`It won't have any effect! (${target.nickname} is already at full HP)`, true);
        return false;
      }
      const healAmount = med.id === 'potion' ? 20 : 50;
      const before = target.currentHp;
      target.currentHp = Math.min(target.stats.hp, target.currentHp + healAmount);
      const recovered = target.currentHp - before;
      inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      showFeedback(`💖 ${target.nickname}'s HP was restored by ${recovered} point(s)!`);
    } else if (med.id === 'antidote') {
      if (target.status !== 'PSN' && target.status !== 'TOX') {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      showFeedback(`✨ ${target.nickname} was cured of its poisoning!`);
    } else if (med.id === 'parlyz-heal') {
      if (target.status !== 'PAR') {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      showFeedback(`✨ ${target.nickname} was cured of paralysis!`);
    } else if (med.id === 'awakening') {
      if (target.status !== 'SLP') {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      target.sleepTurns = 0;
      inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      showFeedback(`✨ ${target.nickname} woke up!`);
    } else if (med.id === 'revive') {
      if (target.currentHp > 0) {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`${target.nickname} hasn't fainted!`, true);
        return false;
      }
      target.currentHp = Math.max(1, Math.floor(target.stats.hp / 2));
      target.status = 'NONE';
      inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      showFeedback(`💎 ${target.nickname} recovered from fainting!`);
    }

    reRender();
    if (onInventoryChanged) onInventoryChanged();
    return true;
  }

  public static useRepelItem(ctx: UseRepelContext): boolean {
    const { repel, inventory, showFeedback, onUseRepel, onInventoryChanged, reRender } = ctx;
    if (!inventory.items) return false;
    const currentCount = inventory.items[repel.id] ?? 0;
    if (currentCount <= 0) return false;

    inventory.items[repel.id] = currentCount - 1;
    BattleAudio.playMenuSound('CONFIRM');
    showFeedback(`🛡️ Sprayed ${repel.name}! Wild Pokémon warded off for ${repel.steps} steps.`);
    if (onUseRepel) {
      onUseRepel(repel.steps, repel.name);
    }
    reRender();
    if (onInventoryChanged) onInventoryChanged();
    return true;
  }
}
