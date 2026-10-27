/**
 * @fileoverview BoxManagementUI domain module implementation.
 * @module ui/BoxManagementUI
 * @role BoxManagementUI Component
 * @exports BoxManagementCallbacks, SelectedSlot, BoxManagementUI
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-346: Implementation | L347-692: Handlers & Exports
 */

import type { PokemonInstance, PokemonStorageState } from '../types/game';
import { StorageManager, BoxManager } from '../world/StorageManager';
import { BattleAudio } from '../audio/BattleAudio';
import { PokemonFactory } from '../battle/PokemonFactory';
import {
  injectBoxNeoKantoStyles,
  showReleaseConfirmModal,
  renderSelectedPokemonInspector,
  renderStorageGrid,
  renderPartyList,
  getBoxSpeciesFrontSprite,
  getBoxSpeciesIcon,
  type BoxSelectedSlot,
} from './box/BoxStylesAndReleaseModal';

export interface BoxManagementCallbacks {
  onSave?: (party: PokemonInstance[], storage: PokemonStorageState) => void;
  onClose?: (party: PokemonInstance[], storage: PokemonStorageState) => void;
}

export type SelectedSlot = BoxSelectedSlot;

/**
 * Bill's PC — Pokémon Storage System & Box Management Grid
 * Canonical implementation conforming to the Google Stitch "Neo-Kanto Protocol"
 * (TICKET-UI-STITCH-BILLS-PC-01, Screens d8eb7e74d0124480ab824e7622dcfd07 & 90dfda407add4834942c361c38892e6a).
 */
export class BoxManagementUI {
  private container: HTMLElement;
  private rootElement: HTMLDivElement | null = null;
  private party: PokemonInstance[] = [];
  private boxManager!: BoxManager;
  private activeBoxIndex: number = 0;
  private selectedSlot: SelectedSlot = null;
  private isSwapPending: boolean = false;
  private movingSource: SelectedSlot = null;
  private mobileTab: 'box' | 'party' = 'box';
  private callbacks: BoxManagementCallbacks = {};
  private active: boolean = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'modal-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
    injectBoxNeoKantoStyles();
  }

  public isOpen(): boolean {
    return this.active;
  }

  public getActiveBoxIndex(): number {
    return this.activeBoxIndex;
  }

  public getSelectedSlot(): SelectedSlot {
    return this.selectedSlot;
  }

  public isMovePending(): boolean {
    return this.isSwapPending;
  }

  public getMovingSource(): SelectedSlot {
    return this.movingSource;
  }

  public initiateMove(): void {
    if (!this.selectedSlot) {
      this.showToast('⚠️ Select a Pokémon in Box or Party to swap.');
      return;
    }
    const pkmn = this.getPokemonAt(this.selectedSlot.type, this.selectedSlot.slotIndex);
    if (!pkmn) {
      this.showToast('⚠️ Select a Pokémon to move.');
      return;
    }
    this.isSwapPending = true;
    this.movingSource = { ...this.selectedSlot };
    BattleAudio.playMenuSound('CURSOR');
    this.showToast(`⇄ Moving ${pkmn.nickname || pkmn.speciesId.toUpperCase()}. Click destination slot to move/swap.`);
    this.render();
  }

  public cancelMove(): void {
    if (!this.isSwapPending) return;
    this.isSwapPending = false;
    this.movingSource = null;
    BattleAudio.playMenuSound('CANCEL');
    this.render();
  }

  public getMobileTab(): 'box' | 'party' {
    return this.mobileTab;
  }

  public setMobileTab(tab: 'box' | 'party'): void {
    if (this.mobileTab !== tab) {
      this.mobileTab = tab;
      BattleAudio.playMenuSound('CURSOR');
      this.render();
    }
  }

  public open(
    party: PokemonInstance[],
    storageState: PokemonStorageState,
    callbacks: BoxManagementCallbacks = {}
  ): void {
    this.party = party;
    this.boxManager = new BoxManager(storageState);
    this.activeBoxIndex = this.boxManager.getCurrentBoxIndex();
    this.callbacks = callbacks;
    this.selectedSlot = null;
    this.isSwapPending = false;
    this.movingSource = null;
    this.mobileTab = 'box';
    this.active = true;

    BattleAudio.playMenuSound('CONFIRM');
    this.render();
  }

  public close(): void {
    if (!this.active) return;
    this.active = false;
    this.isSwapPending = false;
    this.movingSource = null;

    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }

    BattleAudio.playMenuSound('CANCEL');
    if (this.callbacks.onClose) {
      this.callbacks.onClose(this.party, this.boxManager.getState());
    }
  }

  public changeBox(delta: number): void {
    const nextIndex =
      (this.activeBoxIndex + delta + StorageManager.TOTAL_BOXES) % StorageManager.TOTAL_BOXES;
    this.activeBoxIndex = nextIndex;
    this.boxManager.changeBox(nextIndex);
    if (!this.isSwapPending) {
      this.selectedSlot = null;
    }
    BattleAudio.playMenuSound('CURSOR');
    this.render();
  }

  public setBoxIndex(index: number): void {
    if (index >= 0 && index < StorageManager.TOTAL_BOXES) {
      this.activeBoxIndex = index;
      this.boxManager.changeBox(index);
      if (!this.isSwapPending) {
        this.selectedSlot = null;
      }
      this.render();
    }
  }

  public selectSlot(type: 'box' | 'party', slotIndex: number): void {
    if (this.isSwapPending && this.movingSource) {
      if (
        this.movingSource.type === type &&
        this.movingSource.slotIndex === slotIndex &&
        (type === 'party' || this.movingSource.boxIndex === this.activeBoxIndex)
      ) {
        this.cancelMove();
        return;
      }

      this.executeSwap(this.movingSource, { type, boxIndex: this.activeBoxIndex, slotIndex });
      return;
    }

    const pkmn = this.getPokemonAt(type, slotIndex);
    if (!pkmn) {
      this.selectedSlot = null;
      this.render();
      return;
    }

    this.selectedSlot = { type, boxIndex: this.activeBoxIndex, slotIndex };
    BattleAudio.playMenuSound('CURSOR');
    this.render();
  }

  private getPokemonAt(type: 'box' | 'party', slotIndex: number): PokemonInstance | null {
    if (type === 'party') {
      return this.party[slotIndex] || null;
    }
    const box = this.boxManager.getBox(this.activeBoxIndex);
    return box ? box.pokemon[slotIndex] : null;
  }

  private executeSwap(source: NonNullable<SelectedSlot>, target: NonNullable<SelectedSlot>): void {
    let success = false;
    const sourceBoxIndex = source.boxIndex ?? this.activeBoxIndex;
    const targetBoxIndex = target.boxIndex ?? this.activeBoxIndex;

    // Party to Party swap
    if (source.type === 'party' && target.type === 'party') {
      const temp = this.party[source.slotIndex];
      this.party[source.slotIndex] = this.party[target.slotIndex];
      this.party[target.slotIndex] = temp;
      this.party = this.party.filter((p) => Boolean(p));
      success = true;
    }
    // Box to Box swap (handles intra-box or cross-box)
    else if (source.type === 'box' && target.type === 'box') {
      const sourceBox = this.boxManager.getBox(sourceBoxIndex);
      const targetBox = this.boxManager.getBox(targetBoxIndex);
      if (sourceBox && targetBox) {
        const temp = sourceBox.pokemon[source.slotIndex];
        sourceBox.pokemon[source.slotIndex] = targetBox.pokemon[target.slotIndex];
        targetBox.pokemon[target.slotIndex] = temp;
        success = true;
      }
    }
    // Party to Box
    else if (source.type === 'party' && target.type === 'box') {
      success = this.boxManager.swap(this.party, source.slotIndex, targetBoxIndex, target.slotIndex);
    }
    // Box to Party
    else if (source.type === 'box' && target.type === 'party') {
      success = this.boxManager.swap(this.party, target.slotIndex, sourceBoxIndex, source.slotIndex);
    }

    this.isSwapPending = false;
    this.movingSource = null;

    if (success) {
      BattleAudio.playMenuSound('CONFIRM');
      this.selectedSlot = { type: target.type, boxIndex: target.boxIndex, slotIndex: target.slotIndex };
      if (this.callbacks.onSave) {
        this.callbacks.onSave(this.party, this.boxManager.getState());
      }
    } else {
      BattleAudio.playMenuSound('CANCEL');
      this.showToast('⚠️ Cannot deposit your last conscious Pokémon!');
    }

    this.render();
  }

  public releaseSelected(): void {
    if (!this.selectedSlot || this.selectedSlot.type !== 'box') {
      this.showToast('⚠️ Select a stored Pokémon in the Box to release.');
      return;
    }

    const box = this.boxManager.getBox(this.activeBoxIndex);
    const pkmn = box ? box.pokemon[this.selectedSlot.slotIndex] : null;
    if (!pkmn) return;

    if (StorageManager.PROTECTED_LEGENDARIES.has(pkmn.speciesId.toLowerCase())) {
      BattleAudio.playMenuSound('CANCEL');
      this.showToast(`🛡️ ${pkmn.nickname || pkmn.speciesId.toUpperCase()} is protected and cannot be released!`);
      return;
    }

    showReleaseConfirmModal({
      rootElement: this.rootElement,
      pkmn,
      onConfirm: () => {
        if (!this.selectedSlot || this.selectedSlot.type !== 'box') return;
        const res = this.boxManager.release(this.activeBoxIndex, this.selectedSlot.slotIndex);
        if (res.success) {
          BattleAudio.playMenuSound('SAVE');
          this.showToast(`🍃 ${pkmn.nickname || pkmn.speciesId.toUpperCase()} was released into the wild.`);
          this.selectedSlot = null;
          if (this.callbacks.onSave) {
            this.callbacks.onSave(this.party, this.boxManager.getState());
          }
          this.render();
        } else {
          this.showToast(`⚠️ ${res.reason || 'Could not release Pokémon.'}`);
        }
      },
    });
  }

  private showToast(msg: string): void {
    if (!this.rootElement) return;
    const toast = document.createElement('div');
    toast.className = 'box-toast';
    toast.style.cssText = `
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: #0D1322;
      border: 1.5px solid #2A75D3;
      border-radius: 4px;
      padding: 6px 16px;
      color: #F6F8F3;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8), 0 2px 0 0 #070B14;
      pointer-events: none;
    `;
    toast.innerText = msg;
    this.rootElement.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  public getSpeciesFrontSprite(speciesId: string): string {
    return getBoxSpeciesFrontSprite(speciesId);
  }

  public getSpeciesIcon(speciesId: string): string {
    return getBoxSpeciesIcon(speciesId);
  }

  private render(): void {
    if (this.boundKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }

    if (this.rootElement) {
      this.rootElement.remove();
    }

    const currentBox = this.boxManager.getBox(this.activeBoxIndex) || {
      id: 0,
      name: 'BOX 1',
      pokemon: new Array(20).fill(null),
    };
    const boxCount = StorageManager.getBoxCount(currentBox);
    const selectedPkmn = this.selectedSlot
      ? this.getPokemonAt(this.selectedSlot.type, this.selectedSlot.slotIndex)
      : this.party[0] || currentBox.pokemon.find((p) => p !== null) || null;

    const modal = document.createElement('div');
    modal.id = 'box-management-modal';
    modal.className = 'interactive';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(13, 19, 34, 0.92);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
      padding: 8px;
      pointer-events: auto !important;
    `;

    const containerCard = document.createElement('div');
    containerCard.id = 'box-management-card';
    containerCard.className = 'interactive';
    containerCard.style.cssText = `
      background: #0D1322;
      border: 1.5px solid #22324F;
      border-radius: 4px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 208, 40, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      pointer-events: auto !important;
    `;

    containerCard.innerHTML = `
      <!-- Neo-Kanto Header Console -->
      <div style="
        height: 46px;
        background: #141E33;
        border-bottom: 1.5px solid #22324F;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 16px;">💻</span>
          <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; letter-spacing: 1px; color: #FFD028;">
            BILL'S PC // POKÉMON STORAGE MATRIX
          </span>
          <div style="display: flex; align-items: center; gap: 6px; margin-left: 6px;">
            <span class="nk-pulse-dot"></span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #48C774; letter-spacing: 0.5px;">SYSTEM LINKED</span>
          </div>
        </div>

        <button id="box-close-btn" class="nk-btn" style="padding: 6px 12px; height: 30px;">
          ✕ LOG OFF [ESC]
        </button>
      </div>

      <!-- Segmented Mobile Tabs (< 768px) -->
      <div class="nk-mobile-tabs" style="
        display: flex;
        background: #141E33;
        border-bottom: 1.5px solid #22324F;
        padding: 4px 8px;
        gap: 6px;
      ">
        <button id="mobile-tab-box" class="nk-btn ${this.mobileTab === 'box' ? 'nk-btn-primary' : ''}" style="
          flex: 1;
          height: 38px;
          min-height: 38px;
        ">
          📦 STORAGE BOX (${boxCount}/20)
        </button>
        <button id="mobile-tab-party" class="nk-btn ${this.mobileTab === 'party' ? 'nk-btn-primary' : ''}" style="
          flex: 1;
          height: 38px;
          min-height: 38px;
        ">
          👥 CURRENT PARTY (${this.party.length}/6)
        </button>
      </div>

      <!-- Main Split Area -->
      <div id="box-main-split">

        <!-- Left: Storage Box (60% Desktop, Tabbed Mobile) -->
        <div id="storage-box-section" class="${this.mobileTab !== 'box' ? 'nk-mobile-hidden' : ''}" style="
          display: flex;
          flex-direction: column;
          padding: 12px 14px;
          background: #0D1322;
          gap: 8px;
        ">
          <!-- Box Header & Controls -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #141E33;
            border: 1.5px solid #22324F;
            border-radius: 4px;
            padding: 4px 8px;
          ">
            <button id="box-prev-btn" class="nk-btn" style="
              width: 36px;
              height: 32px;
              font-size: 14px;
            ">◀</button>
            
            <div style="text-align: center;">
              <span id="box-name-label" style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #F6F8F3;">
                ${currentBox.name}
              </span>
              <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #8A9BA8; margin-left: 6px;">
                (${boxCount}/20)
              </span>
            </div>

            <button id="box-next-btn" class="nk-btn" style="
              width: 36px;
              height: 32px;
              font-size: 14px;
            ">▶</button>
          </div>

          <!-- 4x5 Box Grid -->
          <div id="storage-grid" style="
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 6px;
            flex: 1;
            min-height: 0;
          ">
            ${renderStorageGrid(currentBox.pokemon, this.activeBoxIndex, this.selectedSlot, this.isSwapPending, this.movingSource)}
          </div>
        </div>

        <!-- Right: Current Party (40% Desktop, Tabbed Mobile) -->
        <div id="party-section" class="${this.mobileTab !== 'party' ? 'nk-mobile-hidden' : ''}" style="
          display: flex;
          flex-direction: column;
          padding: 12px 14px;
          background: #141E33;
          gap: 6px;
        ">
          <div style="
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            color: #8A9BA8;
            padding-bottom: 4px;
            border-bottom: 1px solid #22324F;
            display: flex;
            justify-content: space-between;
          ">
            <span>👥 ACTIVE PARTY</span>
            <span style="color: #FFD028;">${this.party.length}/6</span>
          </div>

          <div id="party-list" style="
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
            overflow-y: auto;
          ">
            ${renderPartyList(this.party, this.selectedSlot, this.isSwapPending, this.movingSource)}
          </div>
        </div>

      </div>

      <!-- Bottom Inspector & Action Tray -->
      <div id="inspector-section" style="
        min-height: 110px;
        background: #080E1D;
        border-top: 1.5px solid #22324F;
        display: flex;
        align-items: center;
        padding: 8px 14px;
        gap: 14px;
        flex-shrink: 0;
      ">
        ${renderSelectedPokemonInspector(selectedPkmn)}

        <!-- Actions -->
        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap;">
          <button id="box-swap-btn" class="nk-btn ${this.isSwapPending ? 'nk-btn-danger' : 'nk-btn-primary'}" style="
            background: ${this.isSwapPending ? '#EE4238 !important' : '#FFD028 !important'};
            color: ${this.isSwapPending ? '#F6F8F3 !important' : '#0D1322 !important'};
            font-weight: 800;
            font-size: 11px;
            height: 32px;
            padding: 0 12px;
            border: 1px solid ${this.isSwapPending ? '#EE4238' : '#FFD028'} !important;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${this.isSwapPending ? '✕ CANCEL MOVE' : '⇄ MOVE / SWAP'}
          </button>
          <button id="box-summary-btn" class="nk-btn" style="
            background: #141E33;
            border: 1.5px solid #2A75D3;
            color: #F6F8F3;
            font-weight: 700;
            font-size: 11px;
            height: 32px;
            padding: 0 12px;
            border-radius: 4px;
            cursor: pointer;
          ">
            📋 SUMMARY
          </button>
          <div style="width: 1px; height: 22px; background: rgba(100, 116, 139, 0.3); margin: 0 2px;"></div>
          <button id="box-release-btn" class="nk-btn-tertiary" style="
            background: transparent !important;
            color: #64748B !important;
            border: 1px solid rgba(100, 116, 139, 0.3) !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            height: 28px !important;
            padding: 0 10px !important;
            box-shadow: none !important;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease !important;
          ">
            🗑️ Release
          </button>
        </div>
      </div>
    `;

    modal.appendChild(containerCard);
    this.container.appendChild(modal);
    this.rootElement = modal;

    // Attach Event Handlers
    containerCard.querySelector('#box-close-btn')?.addEventListener('click', () => this.close());
    containerCard.querySelector('#box-prev-btn')?.addEventListener('click', () => this.changeBox(-1));
    containerCard.querySelector('#box-next-btn')?.addEventListener('click', () => this.changeBox(1));

    containerCard.querySelector('#box-swap-btn')?.addEventListener('click', () => {
      if (this.isSwapPending) {
        this.cancelMove();
      } else {
        this.initiateMove();
      }
    });

    containerCard.querySelector('#box-summary-btn')?.addEventListener('click', () => {
      if (!this.selectedSlot) {
        this.showToast('⚠️ Select a Pokémon to view summary.');
        return;
      }
      const pkmn = this.getPokemonAt(this.selectedSlot.type, this.selectedSlot.slotIndex);
      if (pkmn) {
        BattleAudio.playMenuSound('CURSOR');
        const moveNames = pkmn.moves
          .map((m) => {
            try {
              return PokemonFactory.getMoveData(m.moveId).name;
            } catch {
              return m.moveId.toUpperCase();
            }
          })
          .join(', ');
        this.showToast(
          `📋 ${pkmn.nickname}: Lv.${pkmn.level} ${pkmn.nature || 'Hardy'} | HP ${pkmn.currentHp}/${pkmn.stats.hp} | Moves: ${moveNames}`
        );
      }
    });

    const releaseBtn = containerCard.querySelector('#box-release-btn') as HTMLElement;
    if (releaseBtn) {
      releaseBtn.addEventListener('mouseenter', () => {
        releaseBtn.style.background = 'rgba(238, 66, 56, 0.15)';
        releaseBtn.style.color = '#EE4238';
        releaseBtn.style.borderColor = '#EE4238';
      });
      releaseBtn.addEventListener('mouseleave', () => {
        releaseBtn.style.background = 'transparent';
        releaseBtn.style.color = '#64748B';
        releaseBtn.style.borderColor = 'rgba(100, 116, 139, 0.3)';
      });
      releaseBtn.addEventListener('click', () => this.releaseSelected());
    }

    // Mobile tabs
    containerCard.querySelector('#mobile-tab-box')?.addEventListener('click', () => {
      this.mobileTab = 'box';
      BattleAudio.playMenuSound('CURSOR');
      this.render();
    });
    containerCard.querySelector('#mobile-tab-party')?.addEventListener('click', () => {
      this.mobileTab = 'party';
      BattleAudio.playMenuSound('CURSOR');
      this.render();
    });

    const boxSlots = containerCard.querySelectorAll('.box-slot');
    boxSlots.forEach((el) => {
      el.addEventListener('click', () => {
        const slotIdx = Number(el.getAttribute('data-slot'));
        this.selectSlot('box', slotIdx);
      });
    });

    const partySlots = containerCard.querySelectorAll('.party-slot');
    partySlots.forEach((el) => {
      el.addEventListener('click', () => {
        const slotIdx = Number(el.getAttribute('data-slot'));
        this.selectSlot('party', slotIdx);
      });
    });

    // Keyboard navigation (Arrow keys + Esc)
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this.isSwapPending) {
          this.cancelMove();
        } else {
          this.close();
        }
      } else if (e.key === 'ArrowLeft') {
        this.changeBox(-1);
      } else if (e.key === 'ArrowRight') {
        this.changeBox(1);
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }
}
