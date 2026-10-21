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

/**
 * Modern Unbound-Style Pokémon Storage & Box Management UI (Ticket Sprint 13.5).
 * Split-screen 4x5 box grid + 6 party slots with 1-click swapping, 14 box tabs,
 * bottom inspector card, release safeguards, and responsive mobile tab toggles.
 */
export class BoxManagementUI {
  private container: HTMLElement;
  private rootElement: HTMLDivElement | null = null;
  private party: PokemonInstance[] = [];
  private boxManager!: BoxManager;
  private activeBoxIndex: number = 0;
  private selectedSlot: SelectedSlot = null;
  private callbacks: BoxManagementCallbacks = {};
  private active: boolean = false;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'modal-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
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

    const confirmed = window.confirm(
      `Are you sure you want to release ${pkmn.nickname || pkmn.speciesId.toUpperCase()} (Lv. ${pkmn.level})?\n\nBye-bye, ${pkmn.nickname}!`
    );

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
    const toast = document.createElement('div');
    toast.className = 'box-toast';
    toast.style.cssText = `
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1.5px solid #38bdf8;
      border-radius: 9999px;
      padding: 6px 16px;
      color: #f8fafc;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      z-index: 100;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      pointer-events: none;
    `;
    toast.innerText = msg;
    this.rootElement?.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
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
      background: rgba(2, 6, 23, 0.88);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 12px;
      box-sizing: border-box;
    `;

    const containerCard = document.createElement('div');
    containerCard.id = 'box-management-card';
    containerCard.style.cssText = `
      width: min(880px, 96vw);
      height: min(620px, 94vh);
      background: rgba(15, 23, 42, 0.98);
      border: 2px solid #38bdf8;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    `;

    containerCard.innerHTML = `
      <!-- Top Title Bar -->
      <div style="
        height: 44px;
        background: #0b1329;
        border-bottom: 1.5px solid #1e293b;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">💻</span>
          <span style="font-size: 13px; font-weight: 900; letter-spacing: 1.5px; color: #38bdf8; text-transform: uppercase;">
            BILL'S PC — POKéMON STORAGE SYSTEM
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="box-close-btn" style="
            background: #1e293b;
            color: #94a3b8;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
          ">✕ CLOSE (ESC)</button>
        </div>
      </div>

      <!-- Main Split Area -->
      <div style="display: flex; flex: 1; min-height: 0; overflow: hidden;">
        <!-- Left: Storage Box (60%) -->
        <div id="storage-box-section" style="
          flex: 1.35;
          border-right: 1.5px solid #1e293b;
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          background: rgba(15, 23, 42, 0.65);
        ">
          <!-- Box Header & Controls -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 4px 10px;
          ">
            <button id="box-prev-btn" style="
              background: #1e293b;
              color: #38bdf8;
              border: 1px solid #475569;
              border-radius: 4px;
              width: 32px;
              height: 28px;
              font-weight: 900;
              cursor: pointer;
            ">◀</button>
            
            <div style="text-align: center;">
              <span id="box-name-label" style="font-size: 14px; font-weight: 900; letter-spacing: 1px; color: #f8fafc;">
                ${currentBox.name}
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-left: 6px;">
                (${boxCount}/20)
              </span>
            </div>

            <button id="box-next-btn" style="
              background: #1e293b;
              color: #38bdf8;
              border: 1px solid #475569;
              border-radius: 4px;
              width: 32px;
              height: 28px;
              font-weight: 900;
              cursor: pointer;
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
                  <div class="box-slot ${isSelected ? 'selected' : ''}" data-slot="${idx}" style="
                    background: ${isSelected ? 'rgba(250, 204, 21, 0.2)' : 'rgba(30, 41, 59, 0.7)'};
                    border: ${
                      isSelected
                        ? '2px solid #facc15'
                        : pkmn
                        ? '1.5px solid #475569'
                        : '1.5px dashed rgba(71, 85, 105, 0.45)'
                    };
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    transition: transform 0.12s ease, border-color 0.12s ease;
                    user-select: none;
                  ">
                    ${
                      pkmn
                        ? `
                        <img src="/assets/sprites/pokemon/icons/${pkmn.speciesId}.png" alt="${pkmn.speciesId}" style="
                          width: 36px;
                          height: 36px;
                          object-fit: contain;
                          image-rendering: pixelated;
                        " onerror="this.src='/assets/sprites/pokemon/${pkmn.speciesId}.png'" />
                        <div style="font-size: 9px; font-weight: 800; color: #cbd5e1; margin-top: -2px;">
                          Lv.${pkmn.level}
                        </div>
                      `
                        : `<span style="color: #475569; font-size: 11px;">+</span>`
                    }
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Right: Current Party (40%) -->
        <div id="party-section" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          background: #090e1f;
        ">
          <div style="
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
          ">
            <span>👥 CURRENT PARTY</span>
            <span style="color: #38bdf8;">${this.party.length}/6</span>
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
                  <div class="party-slot ${isSelected ? 'selected' : ''}" data-slot="${idx}" style="
                    background: ${isSelected ? 'rgba(250, 204, 21, 0.2)' : 'rgba(30, 41, 59, 0.7)'};
                    border: ${
                      isSelected
                        ? '2px solid #facc15'
                        : pkmn
                        ? '1.5px solid #334155'
                        : '1.5px dashed rgba(51, 65, 85, 0.5)'
                    };
                    border-radius: 8px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    gap: 10px;
                    cursor: pointer;
                    user-select: none;
                  ">
                    ${
                      pkmn
                        ? `
                        <img src="/assets/sprites/pokemon/icons/${pkmn.speciesId}.png" alt="${pkmn.speciesId}" style="
                          width: 36px;
                          height: 36px;
                          object-fit: contain;
                          image-rendering: pixelated;
                        " onerror="this.src='/assets/sprites/pokemon/${pkmn.speciesId}.png'" />
                        <div style="flex: 1; min-width: 0;">
                          <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 12px; font-weight: 800; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                              ${pkmn.nickname || pkmn.speciesId.toUpperCase()}
                            </span>
                            <span style="font-size: 10px; font-weight: 800; color: #94a3b8;">
                              Lv.${pkmn.level}
                            </span>
                          </div>
                          <!-- Mini HP Bar -->
                          <div style="
                            height: 4px;
                            background: #1e293b;
                            border-radius: 2px;
                            overflow: hidden;
                            margin-top: 3px;
                          ">
                            <div style="
                              height: 100%;
                              width: ${Math.round((pkmn.currentHp / pkmn.stats.hp) * 100)}%;
                              background: ${pkmn.currentHp / pkmn.stats.hp > 0.5 ? '#22c55e' : pkmn.currentHp / pkmn.stats.hp > 0.2 ? '#eab308' : '#ef4444'};
                            "></div>
                          </div>
                        </div>
                      `
                        : `
                        <div style="color: #475569; font-size: 11px; font-weight: 700; width: 100%; text-align: center;">
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

      <!-- Bottom Inspector & Action Bar -->
      <div style="
        height: 115px;
        background: #080d1a;
        border-top: 1.5px solid #1e293b;
        display: flex;
        align-items: center;
        padding: 8px 16px;
        gap: 16px;
        flex-shrink: 0;
      ">
        ${
          selectedPkmn
            ? `
            <img src="/assets/sprites/pokemon/${selectedPkmn.speciesId}.png" alt="${selectedPkmn.speciesId}" style="
              width: 72px;
              height: 72px;
              object-fit: contain;
              image-rendering: pixelated;
              background: #0f172a;
              border: 1px solid #334155;
              border-radius: 8px;
              padding: 2px;
            " />

            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; font-weight: 900; color: #f8fafc;">
                  ${selectedPkmn.nickname || selectedPkmn.speciesId.toUpperCase()}
                </span>
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8;">
                  Lv. ${selectedPkmn.level}
                </span>
                <span style="font-size: 10px; font-weight: 800; color: #e2e8f0; background: #334155; padding: 1px 6px; border-radius: 4px;">
                  ${selectedPkmn.types.join(' / ').toUpperCase()}
                </span>
              </div>

              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; gap: 12px;">
                <span>HP: <strong style="color: #f8fafc;">${selectedPkmn.currentHp}/${selectedPkmn.stats.hp}</strong></span>
                <span>ATK: <strong style="color: #f8fafc;">${selectedPkmn.stats.attack}</strong></span>
                <span>DEF: <strong style="color: #f8fafc;">${selectedPkmn.stats.defense}</strong></span>
                <span>SPA: <strong style="color: #f8fafc;">${selectedPkmn.stats.spAttack}</strong></span>
                <span>SPD: <strong style="color: #f8fafc;">${selectedPkmn.stats.spDefense}</strong></span>
                <span>SPE: <strong style="color: #f8fafc;">${selectedPkmn.stats.speed}</strong></span>
              </div>

              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                MOVES: ${selectedPkmn.moves.map((m) => m.moveId.toUpperCase()).join(', ')}
              </div>
            </div>
          `
            : `
            <div style="color: #64748b; font-size: 12px; font-weight: 700; flex: 1;">
              Select a Pokémon to inspect stats, moves, or swap position.
            </div>
          `
        }

        <!-- Actions -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="box-release-btn" style="
            background: #ef4444;
            color: #ffffff;
            border: 1px solid #f87171;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.15s ease;
          ">🗑️ RELEASE</button>
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
