import type { PokemonInstance, PokemonStorageState } from '../types/game';
import { StorageManager, BoxManager } from '../world/StorageManager';
import { BattleAudio } from '../audio/BattleAudio';

export interface BoxManagementCallbacks {
  onSave?: (party: PokemonInstance[], storage: PokemonStorageState) => void;
  onClose?: (party: PokemonInstance[], storage: PokemonStorageState) => void;
}

type SelectedSlot = {
  type: 'box' | 'party';
  boxIndex?: number;
  slotIndex: number;
} | null;

const TYPE_COLORS: Record<string, string> = {
  normal: '#8A9BA8',
  fire: '#EE4238',
  water: '#2A75D3',
  grass: '#48C774',
  electric: '#FFD028',
  ice: '#06b6d4',
  fighting: '#c2410c',
  poison: '#9B51E0',
  ground: '#d97706',
  flying: '#6366f1',
  psychic: '#ec4899',
  bug: '#84cc16',
  rock: '#78716c',
  ghost: '#9B51E0',
  dragon: '#5E5CE6',
  steel: '#8A9BA8',
  dark: '#334155',
};

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
  private mobileTab: 'box' | 'party' = 'box';
  private callbacks: BoxManagementCallbacks = {};
  private active: boolean = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'modal-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
    this.injectNeoKantoStyles();
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
    this.mobileTab = 'box';
    this.active = true;

    BattleAudio.playMenuSound('CONFIRM');
    this.render();
  }

  public close(): void {
    if (!this.active) return;
    this.active = false;

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
    this.selectedSlot = null;
    BattleAudio.playMenuSound('CURSOR');
    this.render();
  }

  public setBoxIndex(index: number): void {
    if (index >= 0 && index < StorageManager.TOTAL_BOXES) {
      this.activeBoxIndex = index;
      this.boxManager.changeBox(index);
      this.selectedSlot = null;
      this.render();
    }
  }

  public selectSlot(type: 'box' | 'party', slotIndex: number): void {
    // If nothing currently selected: select this slot
    if (!this.selectedSlot) {
      const pkmn = this.getPokemonAt(type, slotIndex);
      if (!pkmn) return; // Don't pick empty slot as source
      this.selectedSlot = { type, boxIndex: this.activeBoxIndex, slotIndex };
      BattleAudio.playMenuSound('CURSOR');
      this.render();
      return;
    }

    // If clicking the same slot: deselect
    if (
      this.selectedSlot.type === type &&
      this.selectedSlot.slotIndex === slotIndex &&
      (type === 'party' || this.selectedSlot.boxIndex === this.activeBoxIndex)
    ) {
      this.selectedSlot = null;
      BattleAudio.playMenuSound('CANCEL');
      this.render();
      return;
    }

    // Execute Move / Swap
    this.executeSwap(this.selectedSlot, { type, boxIndex: this.activeBoxIndex, slotIndex });
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

    // Party to Party swap
    if (source.type === 'party' && target.type === 'party') {
      const temp = this.party[source.slotIndex];
      this.party[source.slotIndex] = this.party[target.slotIndex];
      this.party[target.slotIndex] = temp;
      this.party = this.party.filter((p) => Boolean(p));
      success = true;
    }
    // Box to Box swap (within active box)
    else if (source.type === 'box' && target.type === 'box') {
      const box = this.boxManager.getBox(this.activeBoxIndex);
      if (box) {
        const temp = box.pokemon[source.slotIndex];
        box.pokemon[source.slotIndex] = box.pokemon[target.slotIndex];
        box.pokemon[target.slotIndex] = temp;
        success = true;
      }
    }
    // Party to Box
    else if (source.type === 'party' && target.type === 'box') {
      success = this.boxManager.swap(this.party, source.slotIndex, this.activeBoxIndex, target.slotIndex);
    }
    // Box to Party
    else if (source.type === 'box' && target.type === 'party') {
      success = this.boxManager.swap(this.party, target.slotIndex, this.activeBoxIndex, source.slotIndex);
    }

    if (success) {
      BattleAudio.playMenuSound('CONFIRM');
      this.selectedSlot = null;
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

    const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(
          `Are you sure you want to release ${pkmn.nickname || pkmn.speciesId.toUpperCase()} (Lv. ${pkmn.level})?\n\nBye-bye, ${pkmn.nickname}!`
        )
      : true;

    if (confirmed) {
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
    }
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

  private injectNeoKantoStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('neo-kanto-box-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-kanto-box-styles';
    style.textContent = `
      /* Neo-Kanto Protocol Design Tokens */
      :root {
        --nk-surface-void: #0D1322;
        --nk-surface-lowest: #080E1D;
        --nk-surface-container: #141E33;
        --nk-surface-elevated: #1A2640;
        --nk-primary-volt: #FFD028;
        --nk-secondary-coral: #EE4238;
        --nk-tertiary-cerulean: #2A75D3;
        --nk-text-parchment: #F6F8F3;
        --nk-text-muted: #8A9BA8;
      }

      @keyframes nk-pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 199, 116, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(72, 199, 116, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 199, 116, 0); }
      }
      .nk-pulse-dot {
        width: 7px;
        height: 7px;
        background: #48C774;
        border-radius: 50%;
        animation: nk-pulse 2s infinite;
        display: inline-block;
      }

      .nk-btn {
        background: #141E33;
        color: #F6F8F3;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 4px;
        box-shadow: 0 4px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, border-color 0.12s ease;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .nk-btn:hover {
        background: #1A2640;
        border-color: #FFD028;
      }
      .nk-btn:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 0 #070B14;
      }

      .nk-btn-primary {
        background: #FFD028 !important;
        color: #0D1322 !important;
        border: 1px solid #FFD028 !important;
        box-shadow: 0 4px 0 0 #B28F15 !important;
        font-weight: 800 !important;
      }
      .nk-btn-primary:hover {
        background: #FFE066 !important;
        border-color: #FFE066 !important;
      }
      .nk-btn-primary:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 0 #B28F15 !important;
      }

      .nk-btn-danger {
        background: #EE4238 !important;
        color: #F6F8F3 !important;
        border: 1px solid #EE4238 !important;
        box-shadow: 0 4px 0 0 #9C241D !important;
      }
      .nk-btn-danger:hover {
        background: #FF5A50 !important;
        border-color: #FF5A50 !important;
      }
      .nk-btn-danger:active {
        transform: translateY(3px);
        box-shadow: 0 1px 0 0 #9C241D !important;
      }

      .nk-slot {
        border-radius: 4px;
        transition: transform 0.08s ease, border-color 0.1s ease, box-shadow 0.08s ease;
        user-select: none;
        cursor: pointer;
      }
      .nk-slot:hover {
        border-color: #2A75D3 !important;
      }
      .nk-slot.selected {
        border: 2px solid #FFD028 !important;
        background: rgba(255, 208, 40, 0.18) !important;
        box-shadow: 0 0 14px rgba(255, 208, 40, 0.45) !important;
        transform: translateY(-2px);
      }

      /* Desktop Layout (>= 768px) */
      @media (min-width: 768px) {
        #box-management-card {
          width: min(940px, 96vw) !important;
          height: min(650px, 94vh) !important;
          display: flex !important;
          flex-direction: column !important;
        }
        #box-main-split {
          display: flex !important;
          flex-direction: row !important;
          flex: 1 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        #storage-box-section {
          flex: 1.35 !important;
          border-right: 1.5px solid #22324F !important;
          display: flex !important;
        }
        #party-section {
          flex: 1 !important;
          display: flex !important;
        }
        .nk-mobile-tabs {
          display: none !important;
        }
      }

      /* Mobile Layout (< 768px) */
      @media (max-width: 767px) {
        #box-management-card {
          width: 100vw !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          border-radius: 0 !important;
          border: none !important;
          display: flex !important;
          flex-direction: column !important;
          padding-bottom: env(safe-area-inset-bottom, 8px) !important;
        }
        #box-main-split {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 0 !important;
          overflow-y: auto !important;
        }
        #storage-box-section {
          display: flex !important;
          flex-direction: column !important;
        }
        #storage-box-section.nk-mobile-hidden {
          display: none !important;
        }
        #party-section {
          display: flex !important;
          flex-direction: column !important;
        }
        #party-section.nk-mobile-hidden {
          display: none !important;
        }
        .box-slot {
          min-height: 52px !important;
        }
        .party-slot {
          min-height: 48px !important;
        }
        #inspector-section {
          flex-direction: column !important;
          height: auto !important;
          min-height: 120px !important;
        }
      }
    `;
    document.head?.appendChild(style);
  }

  private render(): void {
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
    `;

    const containerCard = document.createElement('div');
    containerCard.id = 'box-management-card';
    containerCard.style.cssText = `
      background: #0D1322;
      border: 1.5px solid #22324F;
      border-radius: 4px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 208, 40, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
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
            ${currentBox.pokemon
              .map((pkmn, idx) => {
                const isSelected =
                  this.selectedSlot?.type === 'box' && this.selectedSlot.slotIndex === idx;
                return `
                  <div class="box-slot nk-slot ${isSelected ? 'selected' : ''}" data-slot="${idx}" style="
                    background: ${isSelected ? 'rgba(255, 208, 40, 0.18)' : '#080E1D'};
                    border: ${
                      isSelected
                        ? '2px solid #FFD028'
                        : pkmn
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px dashed rgba(78, 93, 108, 0.5)'
                    };
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                  ">
                    ${
                      pkmn
                        ? `
                        <img src="/assets/sprites/pokemon/icons/${pkmn.speciesId}.png" alt="${pkmn.speciesId}" style="
                          width: 38px;
                          height: 38px;
                          object-fit: contain;
                          image-rendering: pixelated;
                        " onerror="this.src='/assets/sprites/pokemon/${pkmn.speciesId}.png'" />
                        <div style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: #8A9BA8; margin-top: -2px;">
                          Lv.${pkmn.level}
                        </div>
                      `
                        : `<span style="color: #4E5D6C; font-family: 'Space Mono', monospace; font-size: 13px;">+</span>`
                    }
                  </div>
                `;
              })
              .join('')}
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
            ${[0, 1, 2, 3, 4, 5]
              .map((idx) => {
                const pkmn = this.party[idx] || null;
                const isSelected =
                  this.selectedSlot?.type === 'party' && this.selectedSlot.slotIndex === idx;
                return `
                  <div class="party-slot nk-slot ${isSelected ? 'selected' : ''}" data-slot="${idx}" style="
                    background: ${isSelected ? 'rgba(255, 208, 40, 0.18)' : '#1A2640'};
                    border: ${
                      isSelected
                        ? '2px solid #FFD028'
                        : pkmn
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px dashed rgba(78, 93, 108, 0.5)'
                    };
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    padding: 4px 10px;
                    gap: 10px;
                    position: relative;
                  ">
                    ${
                      pkmn
                        ? `
                        <img src="/assets/sprites/pokemon/icons/${pkmn.speciesId}.png" alt="${pkmn.speciesId}" style="
                          width: 36px;
                          height: 36px;
                          object-fit: contain;
                          image-rendering: pixelated;
                          flex-shrink: 0;
                        " onerror="this.src='/assets/sprites/pokemon/${pkmn.speciesId}.png'" />
                        <div style="flex: 1; min-width: 0;">
                          <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 12px; font-weight: 800; color: #F6F8F3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              ${pkmn.nickname || pkmn.speciesId.toUpperCase()}
                            </span>
                            <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #FFD028;">
                              Lv.${pkmn.level}
                            </span>
                          </div>
                          <!-- Mini HP Bar -->
                          <div style="
                            height: 4px;
                            background: #080E1D;
                            border-radius: 2px;
                            overflow: hidden;
                            margin-top: 3px;
                          ">
                            <div style="
                              height: 100%;
                              width: ${Math.round((pkmn.currentHp / pkmn.stats.hp) * 100)}%;
                              background: ${pkmn.currentHp / pkmn.stats.hp > 0.5 ? '#48C774' : pkmn.currentHp / pkmn.stats.hp > 0.2 ? '#FFD028' : '#EE4238'};
                            "></div>
                          </div>
                        </div>
                      `
                        : `
                        <div style="color: #4E5D6C; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; width: 100%; text-align: center;">
                          [ EMPTY PARTY SLOT ]
                        </div>
                      `
                    }
                  </div>
                `;
              })
              .join('')}
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
        ${
          selectedPkmn
            ? `
            <img src="/assets/sprites/pokemon/${selectedPkmn.speciesId}.png" alt="${selectedPkmn.speciesId}" style="
              width: 68px;
              height: 68px;
              object-fit: contain;
              image-rendering: pixelated;
              background: #0D1322;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 4px;
              padding: 2px;
              flex-shrink: 0;
            " onerror="this.src='/assets/sprites/pokemon/icons/${selectedPkmn.speciesId}.png'" />

            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 13px; font-weight: 800; color: #F6F8F3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${selectedPkmn.nickname || selectedPkmn.speciesId.toUpperCase()}
                </span>
                <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #FFD028;">
                  Lv. ${selectedPkmn.level}
                </span>
                <div style="display: flex; gap: 4px;">
                  ${selectedPkmn.types
                    .map(
                      (t) => `
                      <span style="
                        font-family: 'Space Mono', monospace;
                        font-size: 9px;
                        font-weight: 700;
                        color: #F6F8F3;
                        background: ${TYPE_COLORS[t.toLowerCase()] || '#8A9BA8'};
                        border-radius: 3px;
                        padding: 1px 5px;
                        text-transform: uppercase;
                      ">${t}</span>
                    `
                    )
                    .join('')}
                </div>
              </div>

              <!-- Base Stats Bar / Telemetry -->
              <div style="
                font-family: 'Space Mono', monospace;
                font-size: 10px;
                color: #8A9BA8;
                margin-top: 4px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px 14px;
              ">
                <span>HP: <strong style="color: #F6F8F3;">${selectedPkmn.currentHp}/${selectedPkmn.stats.hp}</strong></span>
                <span>ATK: <strong style="color: #F6F8F3;">${selectedPkmn.stats.attack}</strong></span>
                <span>DEF: <strong style="color: #F6F8F3;">${selectedPkmn.stats.defense}</strong></span>
                <span>SPA: <strong style="color: #F6F8F3;">${selectedPkmn.stats.spAttack}</strong></span>
                <span>SPD: <strong style="color: #F6F8F3;">${selectedPkmn.stats.spDefense}</strong></span>
                <span>SPE: <strong style="color: #F6F8F3;">${selectedPkmn.stats.speed}</strong></span>
              </div>

              <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #4E5D6C; margin-top: 3px;">
                MOVES: <span style="color: #8A9BA8;">${selectedPkmn.moves.map((m) => m.moveId.toUpperCase()).join(', ')}</span>
              </div>
            </div>
          `
            : `
            <div style="color: #8A9BA8; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; flex: 1;">
              Select a Pokémon to inspect telemetry or execute swap.
            </div>
          `
        }

        <!-- Actions -->
        <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
          <button id="box-release-btn" class="nk-btn nk-btn-danger" style="
            height: 36px;
            padding: 0 12px;
          ">
            🗑️ RELEASE
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
    containerCard.querySelector('#box-release-btn')?.addEventListener('click', () => this.releaseSelected());

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
        this.close();
      } else if (e.key === 'ArrowLeft') {
        this.changeBox(-1);
      } else if (e.key === 'ArrowRight') {
        this.changeBox(1);
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }
}
