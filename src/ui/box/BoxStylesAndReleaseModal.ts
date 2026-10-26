import type { PokemonInstance } from '../../types/game';
import { BattleAudio } from '../../audio/BattleAudio';

export const TYPE_COLORS: Record<string, string> = {
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

export type BoxSelectedSlot = {
  type: 'box' | 'party';
  boxIndex?: number;
  slotIndex: number;
} | null;

export function cleanBoxSpeciesId(speciesId: string): string {
  return (speciesId || 'bulbasaur').toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
}

export function getBoxSpeciesFrontSprite(speciesId: string): string {
  return `./assets/sprites/pokemon/${cleanBoxSpeciesId(speciesId)}_front.png`;
}

export function getBoxSpeciesIcon(speciesId: string): string {
  return `./assets/sprites/pokemon/icons/${cleanBoxSpeciesId(speciesId)}.png`;
}

/**
 * Injects Google Stitch Neo-Kanto styles for Bill's PC Box Management HUD.
 */
export function injectBoxNeoKantoStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('neo-kanto-box-styles')) return;

  const style = document.createElement('style');
  style.id = 'neo-kanto-box-styles';
  style.textContent = `
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

    #box-management-modal, #box-management-card { pointer-events: auto !important; }

    @keyframes nk-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 199, 116, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(72, 199, 116, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 199, 116, 0); }
    }
    .nk-pulse-dot {
      width: 7px; height: 7px; background: #48C774; border-radius: 50%;
      animation: nk-pulse 2s infinite; display: inline-block;
    }

    .nk-btn {
      background: #141E33; color: #F6F8F3; border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 4px; box-shadow: 0 4px 0 0 #070B14; font-family: 'Space Mono', monospace;
      font-size: 11px; font-weight: 700; cursor: pointer; pointer-events: auto !important;
      transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease, border-color 0.12s ease;
      user-select: none; display: inline-flex; align-items: center; justify-content: center;
    }
    .nk-btn:hover { background: #1A2640; border-color: #FFD028; }
    .nk-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 0 #070B14; }

    .nk-btn-primary {
      background: #FFD028 !important; color: #0D1322 !important; border: 1px solid #FFD028 !important;
      box-shadow: 0 4px 0 0 #B28F15 !important; font-weight: 800 !important;
    }
    .nk-btn-primary:hover { background: #FFE066 !important; border-color: #FFE066 !important; }
    .nk-btn-primary:active { transform: translateY(3px); box-shadow: 0 1px 0 0 #B28F15 !important; }

    .nk-btn-danger {
      background: #EE4238 !important; color: #F6F8F3 !important; border: 1px solid #EE4238 !important;
      box-shadow: 0 4px 0 0 #9C241D !important;
    }
    .nk-btn-danger:hover { background: #FF5A50 !important; border-color: #FF5A50 !important; }
    .nk-btn-danger:active { transform: translateY(3px); box-shadow: 0 1px 0 0 #9C241D !important; }

    .nk-slot {
      border-radius: 4px; transition: transform 0.08s ease, border-color 0.1s ease, box-shadow 0.08s ease;
      user-select: none; cursor: pointer; pointer-events: auto !important;
    }
    .nk-slot:hover { border-color: #2A75D3 !important; }
    .nk-slot.selected {
      border: 2px solid #FFD028 !important; background: rgba(255, 208, 40, 0.18) !important;
      box-shadow: 0 0 14px rgba(255, 208, 40, 0.45) !important; transform: translateY(-2px);
    }
    .nk-slot.moving-source {
      border: 2px dashed #FFD028 !important; background: rgba(255, 208, 40, 0.25) !important;
      box-shadow: 0 0 16px rgba(255, 208, 40, 0.6) !important; animation: nk-pulse-glow 1.5s infinite;
    }
    @keyframes nk-pulse-glow {
      0%, 100% { box-shadow: 0 0 8px rgba(255, 208, 40, 0.4); }
      50% { box-shadow: 0 0 20px rgba(255, 208, 40, 0.85); }
    }

    /* Desktop Layout (>= 768px) */
    @media (min-width: 768px) {
      #box-management-card {
        width: min(940px, 96vw) !important; height: min(650px, 94vh) !important;
        display: flex !important; flex-direction: column !important;
      }
      #box-main-split {
        display: flex !important; flex-direction: row !important; flex: 1 !important;
        min-height: 0 !important; overflow: hidden !important;
      }
      #storage-box-section {
        flex: 1.35 !important; border-right: 1.5px solid #22324F !important; display: flex !important;
      }
      #party-section { flex: 1 !important; display: flex !important; }
      .nk-mobile-tabs { display: none !important; }
    }

    /* Mobile Layout (< 768px) */
    @media (max-width: 767px) {
      #box-management-card {
        width: 100vw !important; height: 100dvh !important; max-height: 100dvh !important;
        border-radius: 0 !important; border: none !important; display: flex !important;
        flex-direction: column !important; padding-bottom: env(safe-area-inset-bottom, 8px) !important;
      }
      #box-main-split {
        display: flex !important; flex-direction: column !important; flex: 1 !important;
        min-height: 0 !important; overflow-y: auto !important;
      }
      #storage-box-section { display: flex !important; flex-direction: column !important; }
      #storage-box-section.nk-mobile-hidden { display: none !important; }
      #party-section { display: flex !important; flex-direction: column !important; }
      #party-section.nk-mobile-hidden { display: none !important; }
      .box-slot { min-height: 52px !important; }
      .party-slot { min-height: 48px !important; }
      #inspector-section { flex-direction: column !important; height: auto !important; min-height: 120px !important; }
    }
  `;
  (document.head || document.body)?.appendChild(style);
}

export interface ReleaseConfirmModalOptions {
  rootElement: HTMLElement | null;
  pkmn: PokemonInstance;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Displays the Release Confirmation Modal for a stored Pokémon.
 */
export function showReleaseConfirmModal({
  rootElement,
  pkmn,
  onConfirm,
  onCancel,
}: ReleaseConfirmModalOptions): void {
  if (!rootElement) return;

  const prev = rootElement.querySelector('#release-confirm-modal');
  if (prev) {
    if ((prev as any).remove) (prev as any).remove();
    else prev.parentNode?.removeChild(prev);
  }

  const modal = document.createElement('div');
  modal.id = 'release-confirm-modal';
  modal.className = 'interactive';
  modal.style.cssText = `
    position: absolute; inset: 0; background: rgba(13, 19, 34, 0.88); backdrop-filter: blur(8px);
    z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
    pointer-events: auto !important;
  `;

  const card = document.createElement('div');
  card.id = 'release-confirm-card';
  card.className = 'interactive';
  card.style.cssText = `
    background: #0D1322; border: 2px solid #EE4238; border-radius: 8px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9); padding: 20px; width: min(440px, 90vw);
    display: flex; flex-direction: column; gap: 14px; color: #F6F8F3;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    pointer-events: auto !important;
  `;

  const pAny = pkmn as any;
  const genderText = pAny.gender ? ` • ${pAny.gender === 'M' ? 'Male ♂' : 'Female ♀'}` : '';

  card.innerHTML = `
    <div style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; color: #EE4238; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
      ⚠️ RELEASE CONFIRMATION
    </div>
    <div style="font-size: 14px; color: #F6F8F3; font-weight: 700;">
      Are you sure you want to release <span style="color: #FFD028;">${pkmn.nickname || pkmn.speciesId.toUpperCase()}</span>?
      <div style="font-size: 12px; color: #8A9BA8; font-weight: 500; margin-top: 4px;">
        (Level ${pkmn.level}${genderText} • ${pkmn.speciesId.toUpperCase()})
      </div>
    </div>
    <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5; background: rgba(238, 66, 56, 0.1); border-left: 3px solid #EE4238; padding: 8px 12px; border-radius: 4px;">
      "Once released, ${pkmn.nickname || pkmn.speciesId.toUpperCase()} will be gone forever. This action cannot be undone."
    </div>
    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
      <button id="btn-keep-pokemon" style="
        background: #FFD028; color: #0D1322; font-family: 'Space Mono', monospace;
        font-size: 12px; font-weight: 800; padding: 10px 16px; border: none;
        border-radius: 6px; cursor: pointer;
      ">KEEP POKÉMON (Cancel)</button>
      <button id="btn-confirm-release" style="
        background: rgba(238, 66, 56, 0.2); border: 1.5px solid #EE4238; color: #EE4238;
        font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800;
        padding: 10px 16px; border-radius: 6px; cursor: pointer;
      ">YES, RELEASE POKÉMON</button>
    </div>
  `;

  modal.appendChild(card);
  rootElement.appendChild(modal);

  const closeConfirm = () => {
    if ((modal as any).remove) (modal as any).remove();
    else if (modal.parentNode) modal.parentNode.removeChild(modal);
  };

  const keepBtn = card.querySelector('#btn-keep-pokemon') as HTMLButtonElement;
  keepBtn?.focus?.();
  keepBtn?.addEventListener('click', () => {
    BattleAudio.playMenuSound('CANCEL');
    closeConfirm();
    onCancel?.();
  });

  const confirmBtn = card.querySelector('#btn-confirm-release') as HTMLButtonElement;
  confirmBtn?.addEventListener('click', () => {
    closeConfirm();
    onConfirm();
  });
}

/**
 * Renders the 4x5 Pokémon Storage Box Grid HTML.
 */
export function renderStorageGrid(
  pokemonList: (PokemonInstance | null)[],
  activeBoxIndex: number,
  selectedSlot: BoxSelectedSlot,
  isSwapPending: boolean,
  movingSource: BoxSelectedSlot
): string {
  return pokemonList
    .map((pkmn, idx) => {
      const isMovingSource =
        isSwapPending &&
        movingSource?.type === 'box' &&
        movingSource.slotIndex === idx &&
        movingSource.boxIndex === activeBoxIndex;
      const isSelected =
        !isMovingSource &&
        selectedSlot?.type === 'box' &&
        selectedSlot.slotIndex === idx;
      return `
        <div class="box-slot nk-slot ${isSelected ? 'selected' : ''} ${isMovingSource ? 'moving-source' : ''}" data-slot="${idx}" style="
          background: ${
            isMovingSource
              ? 'rgba(255, 208, 40, 0.25)'
              : isSelected
              ? 'rgba(255, 208, 40, 0.18)'
              : '#080E1D'
          };
          border: ${
            isMovingSource
              ? '2px dashed #FFD028'
              : isSelected
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
          pointer-events: auto;
        ">
          ${
            pkmn
              ? `
              <img src="${getBoxSpeciesIcon(pkmn.speciesId)}" alt="${pkmn.speciesId}" style="
                width: 38px;
                height: 38px;
                object-fit: contain;
                image-rendering: pixelated;
              " onerror="this.onerror=null; this.src='${getBoxSpeciesFrontSprite(pkmn.speciesId)}';" />
              <div style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700; color: #8A9BA8; margin-top: -2px;">
                Lv.${pkmn.level}
              </div>
            `
              : `<span style="color: #4E5D6C; font-family: 'Space Mono', monospace; font-size: 13px;">+</span>`
          }
        </div>
      `;
    })
    .join('');
}

/**
 * Renders the 6-slot Active Party List HTML.
 */
export function renderPartyList(
  party: PokemonInstance[],
  selectedSlot: BoxSelectedSlot,
  isSwapPending: boolean,
  movingSource: BoxSelectedSlot
): string {
  return [0, 1, 2, 3, 4, 5]
    .map((idx) => {
      const pkmn = party[idx] || null;
      const isMovingSource =
        isSwapPending &&
        movingSource?.type === 'party' &&
        movingSource.slotIndex === idx;
      const isSelected =
        !isMovingSource &&
        selectedSlot?.type === 'party' &&
        selectedSlot.slotIndex === idx;
      return `
        <div class="party-slot nk-slot ${isSelected ? 'selected' : ''} ${isMovingSource ? 'moving-source' : ''}" data-slot="${idx}" style="
          background: ${
            isMovingSource
              ? 'rgba(255, 208, 40, 0.25)'
              : isSelected
              ? 'rgba(255, 208, 40, 0.18)'
              : '#1A2640'
          };
          border: ${
            isMovingSource
              ? '2px dashed #FFD028'
              : isSelected
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
          pointer-events: auto;
        ">
          ${
            pkmn
              ? `
              <img src="${getBoxSpeciesIcon(pkmn.speciesId)}" alt="${pkmn.speciesId}" style="
                width: 36px;
                height: 36px;
                object-fit: contain;
                image-rendering: pixelated;
                flex-shrink: 0;
              " onerror="this.onerror=null; this.src='${getBoxSpeciesFrontSprite(pkmn.speciesId)}';" />
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-size: 12px; font-weight: 800; color: #F6F8F3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${pkmn.nickname || pkmn.speciesId.toUpperCase()}
                  </span>
                  <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #FFD028;">
                    Lv.${pkmn.level}
                  </span>
                </div>
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
    .join('');
}

/**
 * Renders the Pokémon Detail Inspector panel contents.
 */
export function renderSelectedPokemonInspector(selectedPkmn: PokemonInstance | null): string {
  if (!selectedPkmn) {
    return `
      <div style="color: #8A9BA8; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; flex: 1;">
        Select a Pokémon to inspect telemetry or execute swap.
      </div>
    `;
  }

  return `
    <img id="inspector-front-sprite" src="${getBoxSpeciesFrontSprite(selectedPkmn.speciesId)}" alt="${selectedPkmn.speciesId}" style="
      width: 68px; height: 68px; object-fit: contain; image-rendering: pixelated;
      background: #0D1322; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px;
      padding: 2px; flex-shrink: 0;
    " onerror="this.onerror=null; this.src='${getBoxSpeciesIcon(selectedPkmn.speciesId)}';" />

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
                font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
                color: #F6F8F3; background: ${TYPE_COLORS[t.toLowerCase()] || '#8A9BA8'};
                border-radius: 3px; padding: 1px 5px; text-transform: uppercase;
              ">${t}</span>
            `
            )
            .join('')}
        </div>
      </div>

      <div style="
        font-family: 'Space Mono', monospace; font-size: 10px; color: #8A9BA8;
        margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px 14px;
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
  `;
}
