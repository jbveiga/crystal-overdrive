import { EvolutionManager } from '../../world/EvolutionManager';
import type { EvolutionPhase, StatDeltas } from '../EvolutionSceneUI';

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

export interface RenderEvolutionModalDomParams {
  rootElement: HTMLElement;
  phase: EvolutionPhase;
  targetTypes: readonly string[];
  statDeltas: StatDeltas;
  preEvoSpeciesId: string;
  preEvoName: string;
  targetSpeciesId: string;
  targetSpeciesName: string;
  preSpriteUrl: string;
  targetSpriteUrl: string;
  dialogueText: string;
  oscHz: number;
  cancelAllowed: boolean;
  onCancel: () => void;
  onComplete: () => void;
  onDismissCancel: () => void;
}

/**
 * Renders the Google Stitch Neo-Kanto Metamorphosis DOM tree into the modal root element.
 */
export function renderEvolutionModalDom({
  rootElement,
  phase,
  targetTypes,
  statDeltas,
  preEvoSpeciesId,
  preEvoName,
  targetSpeciesId,
  targetSpeciesName,
  preSpriteUrl,
  targetSpriteUrl,
  dialogueText,
  oscHz,
  cancelAllowed,
  onCancel,
  onComplete,
  onDismissCancel,
}: RenderEvolutionModalDomParams): void {
  const primaryType = (targetTypes[0] || 'Normal').toLowerCase();
  const accentColor = TYPE_COLORS[primaryType] || '#00F5D4';
  const oscPeriodSec = (1 / Math.max(1, oscHz)).toFixed(3);

  const typeBadgesHtml = targetTypes
    .map((t) => {
      const bg = TYPE_COLORS[t.toLowerCase()] || '#8A9BA8';
      return `<span class="nk-evo-type-pill" style="background:${bg}">${t.toUpperCase()}</span>`;
    })
    .join('');

  const statItems = [
    { label: 'HP', val: statDeltas.hp },
    { label: 'ATK', val: statDeltas.attack },
    { label: 'DEF', val: statDeltas.defense },
    { label: 'SPA', val: statDeltas.spAttack },
    { label: 'SPD', val: statDeltas.spDefense },
    { label: 'SPE', val: statDeltas.speed },
  ]
    .map(
      (s) => `
      <div class="nk-evo-stat-chip">
        <span class="nk-evo-stat-label">${s.label}</span>
        <span class="nk-evo-stat-delta">+${s.val}</span>
      </div>
    `
    )
    .join('');

  rootElement.innerHTML = `
    <div class="nk-evo-stage" data-phase="${phase}" style="--evo-accent: ${accentColor}; --evo-period: ${oscPeriodSec}s;">
      <!-- Top Status Header -->
      <header class="nk-evo-header">
        <div class="nk-evo-protocol-tag">
          <span class="nk-evo-led"></span>
          <span>GENETIC METAMORPHOSIS // PHASE: ${phase}</span>
        </div>
        ${
          cancelAllowed
            ? `<button id="evo-cancel-btn" class="nk-evo-cancel-pill" type="button" aria-label="Cancel Evolution">
                <span class="nk-evo-key-badge">B</span>
                <span>CANCEL EVOLUTION</span>
              </button>`
            : `<div class="nk-evo-cancel-pill is-locked" aria-disabled="true">
                <span class="nk-evo-key-badge">B</span>
                <span>${phase === 'CANCELLED' ? 'ABORTED' : 'LOCKED'}</span>
              </div>`
        }
      </header>

      <!-- Central Illuminated Dais & Vertical Light Beam -->
      <main class="nk-evo-arena">
        <div class="nk-evo-light-beam"></div>
        <div class="nk-evo-ember-field">
          <span class="nk-evo-ember e1"></span>
          <span class="nk-evo-ember e2"></span>
          <span class="nk-evo-ember e3"></span>
          <span class="nk-evo-ember e4"></span>
          <span class="nk-evo-ember e5"></span>
          <span class="nk-evo-ember e6"></span>
        </div>

        <div class="nk-evo-sprite-pedestal">
          <div class="nk-evo-aura-ring"></div>
          <div class="nk-evo-whiteout-flash ${phase === 'TRANSFORM' ? 'is-active' : ''}"></div>

          <!-- Base Pre-Evolution Sprite -->
          <img
            id="evo-base-sprite"
            class="nk-evo-sprite nk-evo-sprite-base phase-${phase.toLowerCase()}"
            src="${preSpriteUrl}"
            onerror="if(this.src && !this.src.includes('./assets/')){this.src='./assets/sprites/pokemon/${EvolutionManager.normalizeId(preEvoSpeciesId)}_front.png';}"
            alt="${preEvoName}"
          />

          <!-- Target Evolved Sprite -->
          <img
            id="evo-target-sprite"
            class="nk-evo-sprite nk-evo-sprite-target phase-${phase.toLowerCase()}"
            src="${targetSpriteUrl}"
            onerror="if(this.src && !this.src.includes('./assets/')){this.src='./assets/sprites/pokemon/${EvolutionManager.normalizeId(targetSpeciesId)}_front.png';}"
            alt="${targetSpeciesName}"
          />

          <div class="nk-evo-dais-plate">
            <div class="nk-evo-dais-inner"></div>
          </div>
        </div>

        <!-- Post-Evolution Celebration Inspector Card (Shown on TRIUMPH) -->
        ${
          phase === 'TRIUMPH'
            ? `<section id="evo-celebration-card" class="nk-evo-celebration-card">
                <div class="nk-evo-celebration-top">
                  <div class="nk-evo-species-headline">
                    <span class="nk-evo-evolved-tag">EVOLUTION COMPLETE</span>
                    <h2 class="nk-evo-new-species-name">${targetSpeciesName}</h2>
                  </div>
                  <div class="nk-evo-type-group">${typeBadgesHtml}</div>
                </div>
                <div class="nk-evo-stat-grid">
                  ${statItems}
                </div>
              </section>`
            : ''
        }
      </main>

      <!-- Bottom Typewriter Dialogue Console Plate -->
      <footer class="nk-evo-console">
        <div class="nk-evo-console-plate">
          <div class="nk-evo-dialogue-content">
            <span class="nk-evo-prompt-caret">▶</span>
            <p id="evo-dialogue-text" class="nk-evo-dialogue-text">${dialogueText}</p>
          </div>
          <div class="nk-evo-console-actions">
            ${
              phase === 'TRIUMPH'
                ? `<button id="evo-confirm-btn" class="nk-evo-confirm-btn" type="button">
                    <span>CONTINUE [A / ENTER]</span>
                  </button>`
                : ''
            }
            ${
              phase === 'CANCELLED'
                ? `<button id="evo-dismiss-cancel-btn" class="nk-evo-confirm-btn is-cancel" type="button">
                    <span>CLOSE [A / B]</span>
                  </button>`
                : ''
            }
          </div>
        </div>
      </footer>
    </div>
  `;

  const cancelBtn = rootElement.querySelector('#evo-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onCancel();
    });
  }

  const confirmBtn = rootElement.querySelector('#evo-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onComplete();
    });
  }

  const dismissCancelBtn = rootElement.querySelector('#evo-dismiss-cancel-btn');
  if (dismissCancelBtn) {
    dismissCancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDismissCancel();
    });
  }
}

export { injectNeoKantoEvolutionStyles } from '../styles/evolutionStyles';
