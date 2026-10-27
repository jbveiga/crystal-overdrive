/**
 * @fileoverview BattleMoveMenuAndForgetModal domain module implementation.
 * @module ui/battle/BattleMoveMenuAndForgetModal
 * @role BattleMoveMenuAndForgetModal Component
 * @exports BattleMoveMenuContext, BattleMoveMenuAndForgetModal
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-276: Implementation | L277-553: Handlers & Exports
 */

import type { PokemonInstance, MoveData } from '../../types/game';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { EffectivenessHelper } from '../../battle/EffectivenessHelper';
import { BattleAudio } from '../../audio/BattleAudio';
import {
  TYPE_COLORS,
  MOVE_SHORTCUT_LABELS,
  getCategorySvg,
  getMoveEffectDescription,
} from './BattleItemCatalogAndStyles';
import type { BattleHUDCallbacks } from './BattleBagAndPartySubModal';

export interface BattleMoveMenuContext {
  fightMenu: HTMLElement;
  messageBox: HTMLElement;
  actionMenu: HTMLElement;
  bagMenu: HTMLElement;
  partyMenu: HTMLElement;
  modalContainer: HTMLElement;
  readonly isDoubleBattleMode: boolean;
  readonly activeCommandSlot: 0 | 1;
  setActiveCommandSlot: (slot: 0 | 1) => void;
  readonly pendingSlot1MoveId: string | null;
  setPendingSlot1MoveId: (id: string | null) => void;
  readonly selectedSlot1Target: 0 | 1;
  setSelectedSlot1Target: (t: 0 | 1) => void;
  readonly selectedSlot2Target: 0 | 1;
  setSelectedSlot2Target: (t: 0 | 1) => void;
  readonly playerPokemon: PokemonInstance;
  readonly playerPartner?: PokemonInstance;
  readonly enemyPokemon: PokemonInstance;
  readonly enemyPartner?: PokemonInstance;
  getOrderingCombatant: () => PokemonInstance;
  readonly callbacks?: BattleHUDCallbacks;
  showActionMenu: () => void;
  showFightMenu: () => void;
}

export class BattleMoveMenuAndForgetModal {
  public static selectMoveSlot(ctx: BattleMoveMenuContext, index: number): void {
    const activeBattler = ctx.getOrderingCombatant();
    const moveSlot = activeBattler?.moves[index];
    if (!moveSlot) return;
    const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
    if (moveSlot.currentPp > 0) {
      moveSlot.currentPp--;
    }

    // If 2v2 Double Battle and Slot 1 just chose a move while Partner Slot 2 is conscious:
    if (
      ctx.isDoubleBattleMode &&
      ctx.activeCommandSlot === 0 &&
      ctx.playerPokemon.currentHp > 0 &&
      ctx.playerPartner &&
      ctx.playerPartner.currentHp > 0
    ) {
      ctx.setPendingSlot1MoveId(moveData.id);
      ctx.setActiveCommandSlot(1);
      ctx.showFightMenu();
      return;
    }

    const slot1Move =
      ctx.isDoubleBattleMode && ctx.activeCommandSlot === 1 && ctx.pendingSlot1MoveId
        ? ctx.pendingSlot1MoveId
        : moveData.id;
    const slot2Move =
      ctx.isDoubleBattleMode && ctx.activeCommandSlot === 1 ? moveData.id : undefined;

    ctx.setActiveCommandSlot(0);
    ctx.setPendingSlot1MoveId(null);
    ctx.fightMenu.style.display = 'none';
    ctx.messageBox.style.display = 'flex';

    if (ctx.isDoubleBattleMode && ctx.callbacks?.onDoubleMovesSelected) {
      ctx.callbacks.onDoubleMovesSelected(
        slot1Move,
        slot2Move,
        ctx.selectedSlot1Target,
        ctx.selectedSlot2Target
      );
    } else if (ctx.callbacks?.onMoveSelected) {
      ctx.callbacks.onMoveSelected(slot1Move);
    }
  }

  public static showFightMenu(ctx: BattleMoveMenuContext): void {
    ctx.messageBox.style.display = 'none';
    ctx.actionMenu.style.display = 'none';
    ctx.bagMenu.style.display = 'none';
    ctx.partyMenu.style.display = 'none';
    ctx.fightMenu.style.display = 'grid';
    ctx.fightMenu.innerHTML = '';

    if (
      ctx.isDoubleBattleMode &&
      ctx.playerPokemon.currentHp <= 0 &&
      ctx.playerPartner &&
      ctx.playerPartner.currentHp > 0
    ) {
      ctx.setActiveCommandSlot(1);
    }

    const activeBattler = ctx.getOrderingCombatant();
    const currentTargetSlot =
      ctx.activeCommandSlot === 1 ? ctx.selectedSlot2Target : ctx.selectedSlot1Target;
    const activeTargetFoe =
      currentTargetSlot === 1 && ctx.enemyPartner && ctx.enemyPartner.currentHp > 0
        ? ctx.enemyPartner
        : ctx.enemyPokemon;

    // 2v2 Double Battle Command & Target Selector Bar
    if (ctx.isDoubleBattleMode) {
      const targetBar = document.createElement('div');
      targetBar.id = 'double-battle-target-bar';
      targetBar.style.cssText = `
        grid-column: span 2;
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid #facc15;
        border-radius: 6px;
        padding: 5px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      `;
      const slotLabel = ctx.activeCommandSlot === 0 ? 'ALLY 1' : 'ALLY 2';
      targetBar.innerHTML = `
        <div style="font-weight: 800; color: #facc15;">
          🎯 ${slotLabel}: ${activeBattler.nickname.toUpperCase()}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: #94a3b8; font-weight: 700;">TARGET:</span>
          <button id="target-foe-0-btn" type="button" style="
            background: ${currentTargetSlot === 0 ? '#2563eb' : '#0f172a'};
            color: white;
            border: 1px solid ${currentTargetSlot === 0 ? '#60a5fa' : '#334155'};
            border-radius: 4px;
            padding: 2px 7px;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          ">FOE 1: ${ctx.enemyPokemon.nickname}</button>
          ${
            ctx.enemyPartner && ctx.enemyPartner.currentHp > 0
              ? `<button id="target-foe-1-btn" type="button" style="
                  background: ${currentTargetSlot === 1 ? '#2563eb' : '#0f172a'};
                  color: white;
                  border: 1px solid ${currentTargetSlot === 1 ? '#60a5fa' : '#334155'};
                  border-radius: 4px;
                  padding: 2px 7px;
                  font-size: 10px;
                  font-weight: 800;
                  cursor: pointer;
                ">FOE 2: ${ctx.enemyPartner.nickname}</button>`
              : ''
          }
        </div>
      `;
      ctx.fightMenu.appendChild(targetBar);

      const foe0Btn = targetBar.querySelector('#target-foe-0-btn');
      const foe1Btn = targetBar.querySelector('#target-foe-1-btn');
      foe0Btn?.addEventListener('click', () => {
        if (ctx.activeCommandSlot === 1) ctx.setSelectedSlot2Target(0);
        else ctx.setSelectedSlot1Target(0);
        ctx.showFightMenu();
      });
      foe1Btn?.addEventListener('click', () => {
        if (ctx.activeCommandSlot === 1) ctx.setSelectedSlot2Target(1);
        else ctx.setSelectedSlot1Target(1);
        ctx.showFightMenu();
      });
    }

    // Tactical Move Tooltip Preview Bar (spans both columns)
    const tooltipBar = document.createElement('div');
    tooltipBar.id = 'battle-move-tooltip';
    tooltipBar.style.cssText = `
      grid-column: span 2;
      background: rgba(13, 19, 34, 0.95);
      border: 1.5px solid #22324F;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      min-height: 28px;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    const renderTooltipForMove = (moveData: MoveData, currentPp: number, maxPp: number) => {
      const pwrStr = moveData.power > 0 ? `${moveData.power}` : '—';
      const accStr = moveData.accuracy > 0 ? `${moveData.accuracy}%` : '—';
      const effectText = getMoveEffectDescription(moveData);
      const typeColor = TYPE_COLORS[moveData.type] || '#64748b';
      tooltipBar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-weight: 800; color: #38bdf8;">${moveData.name}</span>
          <span style="background: ${typeColor}; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">${moveData.type.toUpperCase()}</span>
          <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">${moveData.category} · PWR ${pwrStr} · ACC ${accStr} · PP ${currentPp}/${maxPp}</span>
        </div>
        <div class="move-tooltip-effect" style="font-size: 11px; color: #f8fafc; font-weight: 600;">${effectText}</div>
      `;
    };

    if (activeBattler.moves.length > 0) {
      const firstSlot = activeBattler.moves[0];
      renderTooltipForMove(
        PokemonFactory.getMoveData(firstSlot.moveId),
        firstSlot.currentPp,
        firstSlot.maxPp
      );
    } else {
      tooltipBar.innerText = 'Select a move to preview its power, accuracy, and tactical effect.';
    }
    ctx.fightMenu.appendChild(tooltipBar);

    activeBattler.moves.forEach((moveSlot, idx) => {
      const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
      const badge = EffectivenessHelper.evaluate(moveData, activeTargetFoe);
      const pill = EffectivenessHelper.getPillStyle(badge.multiplier, moveData.category === 'Status');

      const btn = document.createElement('button');
      btn.id = `move-btn-${idx}`;
      btn.className = 'battle-move-btn';
      btn.style.cssText = `
        background: #141E33;
        color: white;
        border: 1.5px solid #22324F;
        border-radius: 8px;
        padding: 9px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        min-width: 0 !important;
        box-shadow: 0 3px 0 0 #070B14;
        transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.08s ease;
      `;

      const typeColor = TYPE_COLORS[moveData.type] || '#64748b';
      const categorySvg = getCategorySvg(moveData.category);
      const shortcutHint = MOVE_SHORTCUT_LABELS[idx] || `${idx + 1}`;
      const pwrStr = moveData.power > 0 ? `${moveData.power}` : '—';
      const accStr = moveData.accuracy > 0 ? `${moveData.accuracy}%` : '—';
      const effectDesc = getMoveEffectDescription(moveData);

      btn.title = `${moveData.name} (${moveData.type.toUpperCase()}) | Category: ${moveData.category} | PWR: ${pwrStr} | ACC: ${accStr}% | PP: ${moveSlot.currentPp}/${moveSlot.maxPp} | ${effectDesc}`;
      btn.setAttribute('aria-label', btn.title);

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; background: #0f172a; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px;">[${shortcutHint}]</span>
            <span class="move-btn-name" style="font-weight: 800; font-size: 15px;">${moveData.name}</span>
          </div>
          <span style="display: flex; align-items: center;">${categorySvg}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 6px; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 800; background: ${typeColor}; color: white; padding: 2px 6px; border-radius: 4px;">${moveData.type.toUpperCase()}</span>
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1;">PP ${moveSlot.currentPp}/${moveSlot.maxPp}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">PWR ${pwrStr}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">ACC ${accStr}</span>
          </div>
          <span class="${pill.pulse ? 'crystal-ultra-pill' : ''}" style="
            background: ${pill.background};
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
            text-decoration: ${pill.strikethrough ? 'line-through' : 'none'};
            white-space: nowrap;
          ">${pill.label}</span>
        </div>
      `;

      btn.addEventListener('mouseenter', () => {
        renderTooltipForMove(moveData, moveSlot.currentPp, moveSlot.maxPp);
      });
      btn.addEventListener('focus', () => {
        renderTooltipForMove(moveData, moveSlot.currentPp, moveSlot.maxPp);
      });
      btn.addEventListener('click', () => {
        this.selectMoveSlot(ctx, idx);
      });

      ctx.fightMenu.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #141E33;
      color: #cbd5e1;
      border: 1.5px solid #22324F;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      padding: 6px;
      cursor: pointer;
      grid-column: span 2;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Space Mono', monospace;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => ctx.showActionMenu());
    ctx.fightMenu.appendChild(backBtn);
  }

  public static promptMoveForget(
    container: HTMLElement,
    messageBox: HTMLElement | null,
    pokemon: PokemonInstance,
    newMove: MoveData
  ): Promise<number | null> {
    return new Promise((resolve) => {
      const prevMessageDisplay = messageBox ? messageBox.style.display : 'flex';
      if (messageBox) {
        messageBox.style.display = 'none';
      }

      const backdrop = document.createElement('div');
      backdrop.id = 'move-learn-backdrop';
      backdrop.className = 'interactive';
      backdrop.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.65);
        pointer-events: auto;
        z-index: 95;
      `;
      backdrop.style.pointerEvents = 'auto';

      const modal = document.createElement('div');
      modal.id = 'move-learn-modal';
      modal.className = 'interactive';
      modal.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 480px;
        max-width: 92vw;
        max-height: 85dvh;
        overflow-y: auto;
        background: #0D1322;
        border: 2px solid #38BDF8;
        border-radius: 12px;
        padding: 18px;
        box-shadow: 0 8px 0 0 #070B14;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 100;
        pointer-events: auto;
        color: #f8fafc;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;
      modal.style.pointerEvents = 'auto';

      const newTypeColor = TYPE_COLORS[newMove.type] || '#64748b';
      const newPwr = newMove.power > 0 ? newMove.power : '—';
      const newAcc = newMove.accuracy > 0 ? `${newMove.accuracy}%` : '—';

      modal.innerHTML = `
        <div style="font-weight: 800; font-size: 16px; color: #38bdf8; font-family: 'Space Mono', monospace;">
          ✨ LEARN A NEW MOVE?
        </div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
          <strong>${pokemon.nickname}</strong> wants to learn <strong>${newMove.name}</strong>, but already knows 4 moves! Select an existing move to replace, or cancel to keep current moves.
        </div>
        <div style="background: #141E33; border: 1.5px solid ${newTypeColor}; border-radius: 8px; box-shadow: 0 3px 0 0 #070B14; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; font-weight: 800; background: ${newTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${newMove.type.toUpperCase()}</span>
            <strong style="font-size: 14px; color: #f8fafc;">${newMove.name}</strong>
            <span style="font-size: 11px; color: #94a3b8; margin-left: 6px;">[${newMove.category.toUpperCase()}]</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #cbd5e1; font-family: 'Space Mono', monospace;">
            PWR: ${newPwr} | ACC: ${newAcc} | PP: ${newMove.pp}
          </div>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-family: 'Space Mono', monospace;">Existing Moves:</div>
        <div id="forget-slots-container" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <button id="cancel-learn-btn" style="
          margin-top: 6px;
          background: #141E33;
          color: #f8fafc;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">✕ Keep Existing Moves (Don't Learn)</button>
      `;

      let resolved = false;
      let cursorIndex = 0; // 0..3 = move slots, 4 = cancel
      const slotButtons: HTMLButtonElement[] = [];

      const cleanupAndResolve = (choice: number | null) => {
        if (resolved) return;
        resolved = true;
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', onKeyDown);
        }
        if ((backdrop as any).remove) {
          backdrop.remove();
        } else if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
        if ((modal as any).remove) {
          modal.remove();
        } else if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (messageBox) {
          messageBox.style.display = prevMessageDisplay || 'flex';
        }
        resolve(choice);
      };

      const slotsContainer = modal.querySelector('#forget-slots-container') as HTMLDivElement;
      pokemon.moves.forEach((slot, idx) => {
        const slotData = PokemonFactory.getMoveData(slot.moveId);
        const slotTypeColor = TYPE_COLORS[slotData.type] || '#64748b';
        const slotPwr = slotData.power > 0 ? slotData.power : '—';
        const slotAcc = slotData.accuracy > 0 ? `${slotData.accuracy}%` : '—';

        const slotBtn = document.createElement('button');
        slotBtn.id = `forget-slot-btn-${idx}`;
        slotBtn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease;
        `;
        slotBtn.innerHTML = `
          <div>
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-right: 4px; font-family: 'Space Mono', monospace;">[${idx + 1}]</span>
            <span style="font-size: 10px; font-weight: 800; background: ${slotTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${slotData.type.toUpperCase()}</span>
            <strong style="font-size: 13px;">Forget ${slotData.name}</strong>
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600; font-family: 'Space Mono', monospace;">
            PWR: ${slotPwr} | ACC: ${slotAcc} | PP: ${slot.currentPp}/${slot.maxPp}
          </div>
        `;
        slotBtn.addEventListener('mouseenter', () => {
          cursorIndex = idx;
          slotBtn.style.borderColor = '#ef4444';
          slotBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        });
        slotBtn.addEventListener('mouseleave', () => {
          slotBtn.style.borderColor = '#22324F';
          slotBtn.style.background = '#141E33';
        });
        slotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(idx);
        });
        slotsContainer.appendChild(slotBtn);
        slotButtons.push(slotBtn);
      });

      const cancelBtn = modal.querySelector('#cancel-learn-btn') as HTMLButtonElement;
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        BattleAudio.playMenuSound('CANCEL');
        cleanupAndResolve(null);
      });

      const onKeyDown = (e: KeyboardEvent) => {
        if (resolved) return;
        if (e.code === 'Digit1' && pokemon.moves[0]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(0);
        } else if (e.code === 'Digit2' && pokemon.moves[1]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(1);
        } else if (e.code === 'Digit3' && pokemon.moves[2]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(2);
        } else if (e.code === 'Digit4' && pokemon.moves[3]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(3);
        } else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          BattleAudio.playMenuSound('CANCEL');
          cleanupAndResolve(null);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          cursorIndex = (cursorIndex + 1) % (slotButtons.length + 1);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          cursorIndex = (cursorIndex - 1 + slotButtons.length + 1) % (slotButtons.length + 1);
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          e.preventDefault();
          if (cursorIndex < slotButtons.length) {
            BattleAudio.playMenuSound('CONFIRM');
            cleanupAndResolve(cursorIndex);
          } else {
            BattleAudio.playMenuSound('CANCEL');
            cleanupAndResolve(null);
          }
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
      }

      container.appendChild(backdrop);
      container.appendChild(modal);
    });
  }
}
