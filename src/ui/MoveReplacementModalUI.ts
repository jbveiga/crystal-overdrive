import { Dex } from '@pkmn/dex';
import type { PokemonInstance, MoveData } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';

const TYPE_COLORS: Record<string, string> = {
  Normal: '#A8A878',
  Fire: '#EE4238',
  Water: '#38bdf8',
  Electric: '#FFD028',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Steel: '#B8B8D0',
  Dark: '#705848',
};

/**
 * MoveReplacementModalUI — Standalone Neo-Kanto move replacement screen
 * Conforms to Google Stitch specifications and Neo-Kanto Protocol design tokens.
 */
export class MoveReplacementModalUI {
  private container: HTMLElement;
  private rootElement: HTMLElement | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string | HTMLElement = 'modal-container') {
    if (typeof containerId === 'string') {
      let el = document.getElementById(containerId);
      if (!el) {
        el = document.createElement('div');
        el.id = containerId;
        document.body.appendChild(el);
      }
      this.container = el;
    } else {
      this.container = containerId;
    }
  }

  /**
   * Prompts the player to replace one of the 4 known moves with newMove.
   * Resolves to the slot index (0..3) to replace, or null if cancelled.
   */
  public open(pokemon: PokemonInstance, newMove: MoveData): Promise<number | null> {
    return new Promise((resolve) => {
      // Defensive teardown of any previous modal
      this.close();

      const dexMove = Dex.moves.get(newMove.id);
      const desc = dexMove.desc || dexMove.shortDesc || 'No description available.';
      const newTypeColor = TYPE_COLORS[newMove.type] || '#38bdf8';
      const newPwr = newMove.power > 0 ? `${newMove.power}` : '—';
      const newAcc = newMove.accuracy > 0 ? `${newMove.accuracy}%` : '—';

      // Category symbol / icon
      const categoryLabel =
        newMove.category === 'Physical'
          ? 'PHYSICAL ★'
          : newMove.category === 'Special'
            ? 'SPECIAL ✦'
            : 'STATUS ⚙';

      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.id = 'move-replacement-modal';
      backdrop.className = 'interactive';
      backdrop.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(13, 19, 34, 0.94);
        backdrop-filter: blur(14px);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        pointer-events: auto !important;
      `;

      // Modal Card
      const card = document.createElement('div');
      card.id = 'move-replacement-card';
      card.className = 'interactive';
      card.style.cssText = `
        background: #0D1322;
        border: 2px solid #22324F;
        border-radius: 8px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85);
        width: min(640px, 92vw);
        max-height: 92dvh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
        color: #F6F8F3;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        pointer-events: auto !important;
        box-sizing: border-box;
      `;

      // Header HTML
      const headerHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #22324F; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; color: #FFD028; letter-spacing: 0.5px;">
              LEARN NEW MOVE // TACTICAL UPGRADE
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #8A9BA8;">
              ${pokemon.nickname.toUpperCase()} Lv. ${pokemon.level}
            </span>
            <button id="move-replace-close-btn" style="
              background: transparent;
              border: none;
              color: #8A9BA8;
              font-size: 18px;
              font-weight: 700;
              cursor: pointer;
              padding: 2px 6px;
              line-height: 1;
            " title="Cancel">✕</button>
          </div>
        </div>
      `;

      // Hero Card HTML (New Move)
      const heroCardHtml = `
        <div style="
          background: #141E33;
          border: 2px solid #FFD028;
          border-radius: 6px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #FFD028; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">
                NEW MOVE TO LEARN:
              </div>
              <div style="font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 800; color: #F6F8F3;">
                ${newMove.name.toUpperCase()}
              </div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="
                background: ${newTypeColor};
                color: #FFFFFF;
                font-family: 'Space Mono', monospace;
                font-size: 10px;
                font-weight: 800;
                padding: 3px 8px;
                border-radius: 4px;
              ">${newMove.type.toUpperCase()}</span>
              <span style="
                background: #22324F;
                color: #CBD5E1;
                font-family: 'Space Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                padding: 3px 6px;
                border-radius: 4px;
              ">${categoryLabel}</span>
            </div>
          </div>

          <div style="
            display: flex;
            gap: 14px;
            font-family: 'Space Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            color: #CBD5E1;
            padding: 4px 0;
          ">
            <span>PWR: <strong style="color: #FFD028;">${newPwr}</strong></span>
            <span>ACC: <strong style="color: #FFD028;">${newAcc}</strong></span>
            <span>PP: <strong style="color: #FFD028;">${newMove.pp}</strong></span>
          </div>

          <div style="font-size: 12px; color: #94A3B8; line-height: 1.4; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 6px;">
            "${desc}"
          </div>
        </div>
      `;

      // Existing Moves Grid HTML
      const slotsSubtitle = `
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #8A9BA8; letter-spacing: 0.5px;">
          SELECT A MOVE TO FORGET (Click to Replace):
        </div>
      `;

      const slotsContainer = document.createElement('div');
      slotsContainer.id = 'forget-slots-grid';
      slotsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 10px;
      `;

      const slotButtons: HTMLButtonElement[] = [];

      pokemon.moves.forEach((slotMove, index) => {
        let moveData: MoveData;
        try {
          moveData = PokemonFactory.getMoveData(slotMove.moveId);
        } catch {
          moveData = {
            id: slotMove.moveId,
            name: slotMove.moveId.toUpperCase(),
            type: 'Normal',
            category: 'Physical',
            power: 0,
            accuracy: 100,
            pp: slotMove.maxPp,
            priority: 0,
            leavesOneHp: false,
            trapsTarget: false,
          };
        }

        const typeColor = TYPE_COLORS[moveData.type] || '#64748B';
        const pwr = moveData.power > 0 ? `${moveData.power}` : '—';
        const acc = moveData.accuracy > 0 ? `${moveData.accuracy}%` : '—';

        const btn = document.createElement('button');
        btn.className = 'forget-slot-btn interactive';
        btn.setAttribute('data-slot', `${index}`);
        btn.style.cssText = `
          background: #141E33;
          border: 1.5px solid #22324F;
          border-radius: 6px;
          padding: 10px 12px;
          color: #F6F8F3;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
          min-height: 64px;
          min-width: 0;
          transition: all 0.2s ease;
          pointer-events: auto !important;
        `;

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; color: #FFFFFF;">
              [${index + 1}] ${moveData.name.toUpperCase()}
            </span>
            <span style="
              background: ${typeColor};
              color: white;
              font-family: 'Space Mono', monospace;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 3px;
            ">${moveData.type.toUpperCase()}</span>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            color: #8A9BA8;
            margin-top: 2px;
          ">
            <span>PWR: ${pwr} | ACC: ${acc}</span>
            <span style="font-weight: 700; color: #CBD5E1;">PP: ${slotMove.currentPp}/${slotMove.maxPp}</span>
          </div>
        `;

        btn.addEventListener('mouseenter', () => {
          BattleAudio.playMenuSound('CURSOR');
          btn.style.borderColor = '#2A75D3';
          btn.style.background = '#1B2844';
          btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderColor = '#22324F';
          btn.style.background = '#141E33';
          btn.style.transform = 'none';
        });

        btn.addEventListener('click', () => {
          cleanupAndResolve(index);
        });

        slotButtons.push(btn);
        slotsContainer.appendChild(btn);
      });

      // Cancel Button HTML
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancel-replacement-btn';
      cancelBtn.className = 'interactive';
      cancelBtn.style.cssText = `
        background: #141E33;
        color: #8A9BA8;
        border: 1.5px solid #22324F;
        border-radius: 6px;
        padding: 12px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        width: 100%;
        transition: all 0.2s ease;
        pointer-events: auto !important;
        margin-top: 4px;
      `;
      cancelBtn.innerText = `✕ GIVE UP LEARNING ${newMove.name.toUpperCase()} (Keep Old Moves)`;

      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.borderColor = '#4E5D6C';
        cancelBtn.style.color = '#F6F8F3';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.borderColor = '#22324F';
        cancelBtn.style.color = '#8A9BA8';
      });
      cancelBtn.addEventListener('click', () => {
        cleanupAndResolve(null);
      });

      card.innerHTML = headerHtml + heroCardHtml + slotsSubtitle;
      card.appendChild(slotsContainer);
      card.appendChild(cancelBtn);
      backdrop.appendChild(card);
      this.container.appendChild(backdrop);
      this.rootElement = backdrop;

      // Close button handler
      card.querySelector('#move-replace-close-btn')?.addEventListener('click', () => {
        cleanupAndResolve(null);
      });

      let resolved = false;
      let focusedIndex = 0; // 0..3: slots, 4: cancel

      const updateFocus = () => {
        const allFocusables = [...slotButtons, cancelBtn];
        allFocusables.forEach((el, idx) => {
          if (idx === focusedIndex) {
            el.style.borderColor = idx === 4 ? '#FFD028' : '#2A75D3';
            el.style.background = '#1B2844';
          } else {
            el.style.borderColor = '#22324F';
            el.style.background = '#141E33';
          }
        });
      };

      const cleanupAndResolve = (choice: number | null) => {
        if (resolved) return;
        resolved = true;
        this.close();
        resolve(choice);
      };

      // Keyboard Navigation
      this.boundKeyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanupAndResolve(null);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          focusedIndex = (focusedIndex + 1) % 5;
          updateFocus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          focusedIndex = (focusedIndex - 1 + 5) % 5;
          updateFocus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusedIndex < 4) {
            cleanupAndResolve(focusedIndex);
          } else {
            cleanupAndResolve(null);
          }
        }
      };

      window.addEventListener('keydown', this.boundKeyHandler);
    });
  }

  public close(): void {
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.rootElement) {
      if (typeof (this.rootElement as any).remove === 'function') {
        this.rootElement.remove();
      } else if (this.rootElement.parentNode) {
        this.rootElement.parentNode.removeChild(this.rootElement);
      }
      this.rootElement = null;
    }
  }

  public isOpen(): boolean {
    return this.rootElement !== null;
  }
}
