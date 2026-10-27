/**
 * @fileoverview PartyManagementUI domain module implementation.
 * @module ui/PartyManagementUI
 * @role PartyManagementUI Component
 * @exports PartyManagementUI
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-243: Implementation | L244-486: Handlers & Exports
 */

import type { PokemonInstance, SpeedMultiplier } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';
import { EvolutionManager } from '../world/EvolutionManager';
import { EvolutionSceneUI } from './EvolutionSceneUI';
import { TYPE_COLORS, STATUS_COLORS, ensureNeoKantoPartyStyles, renderPartyMemberSummaryHtml } from './styles/partyStylesAndSummary';

export { TYPE_COLORS, STATUS_COLORS };

export class PartyManagementUI {
  private container: HTMLElement;
  private modal!: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private bannerEl!: HTMLDivElement;
  private party: PokemonInstance[];
  private selectedIndex: number | null = null;
  private switchSourceIndex: number | null = null;
  private summaryIndex: number | null = null;
  private speedMultiplier: SpeedMultiplier = 1;
  private onPartyChanged?: () => void;

  constructor(
    containerId: string = 'modal-container',
    party: PokemonInstance[],
    onPartyChanged?: () => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`UI Container #${containerId} not found`);
    this.container = el;
    this.party = party;
    this.onPartyChanged = onPartyChanged;
    this.ensureNeoKantoStyles();
    this.createUI();
  }
  private ensureNeoKantoStyles(): void {
    ensureNeoKantoPartyStyles();
  }
  public setParty(party: PokemonInstance[]): void {
    this.party = party;
  }
  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    if (this.modal) {
      const dur = (0.18 / this.speedMultiplier).toFixed(2);
      this.modal.style.transition = `opacity ${dur}s ease`;
    }
  }
  public isOpen(): boolean {
    return this.modal?.style.display === 'flex';
  }
  public open(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.selectedIndex = null;
    this.switchSourceIndex = null;
    this.summaryIndex = null;
    this.modal.style.display = 'flex';
    this.render();
  }
  public hide(): void {
    this.modal.style.display = 'none';
    this.selectedIndex = null;
    this.switchSourceIndex = null;
    this.summaryIndex = null;
  }
  private createUI(): void {
    const modal = document.createElement('div');
    modal.id = 'party-management-modal';
    modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(860px, 95vw);
      max-height: 90vh;
      background: #0D1322;
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      gap: 12px;
      z-index: 55;
      pointer-events: auto;
      color: #dde2f7;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      box-sizing: border-box;
    `;
    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #48C774; box-shadow: 0 0 8px #48C774;"></span>
          <div>
            <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #48C774; letter-spacing: 1px;">TACTICAL PARTY OS // BATTLE ROSTER</div>
            <h2 style="font-family: 'Space Mono', monospace; margin: 2px 0 0 0; font-size: 20px; font-weight: 900; color: #F6F8F3; letter-spacing: -0.5px;">🟢 DEPLOYABLE SQUAD</h2>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="party-count-badge" style="background: #141E33; border: 1.5px solid #48C774; color: #4ADE80; padding: 5px 12px; border-radius: 6px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; box-shadow: 0 2px 0 0 #070B14;">1 / 6</span>
          <button id="close-party-modal-btn" class="party-tactile-btn" style="background: #1E293B; color: #F6F8F3; border: 1.5px solid #475569; border-radius: 6px; padding: 6px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;">← BACK TO MENU</button>
        </div>
      </div>
      <!-- Prompt / Status Banner -->
      <div id="party-prompt-banner" style="
        background: #141E33;
        border: 1px solid #22324F;
        border-radius: 8px;
        padding: 9px 14px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: #DDE2F7;
        box-shadow: 0 2px 0 0 #070B14;
      ">Choose a POKéMON to view Summary or Switch battle order.</div>
      <!-- Content Area -->
      <div id="party-content-area" class="party-scrollbar" style="
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 64vh;
        overflow-y: auto;
        padding-right: 4px;
      "></div>
    `;
    this.container.appendChild(modal);
    this.modal = modal;
    this.contentEl = modal.querySelector('#party-content-area') as HTMLDivElement;
    this.bannerEl = modal.querySelector('#party-prompt-banner') as HTMLDivElement;

    modal.querySelector('#close-party-modal-btn')!.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.hide();
    });
  }

  public render(): void {
    const countBadge = this.modal.querySelector('#party-count-badge') as HTMLElement;
    if (countBadge) {
      countBadge.innerText = `${this.party.length} / 6`;
    }

    if (this.summaryIndex !== null && this.party[this.summaryIndex]) {
      this.renderSummaryView(this.party[this.summaryIndex]);
      return;
    }

    if (this.switchSourceIndex !== null && this.party[this.switchSourceIndex]) {
      this.bannerEl.style.borderColor = '#FFD028';
      this.bannerEl.style.color = '#FFD028';
      this.bannerEl.innerText = `🔄 Move ${this.party[this.switchSourceIndex].nickname} to where? (Click another slot to swap)`;
    } else if (this.selectedIndex !== null && this.party[this.selectedIndex]) {
      this.bannerEl.style.borderColor = '#2A75D3';
      this.bannerEl.style.color = '#38BDF8';
      this.bannerEl.innerText = `Do what with ${this.party[this.selectedIndex].nickname}?`;
    } else {
      this.bannerEl.style.borderColor = '#22324F';
      this.bannerEl.style.color = '#DDE2F7';
      this.bannerEl.innerText = 'Choose a POKéMON to view Summary or Switch battle order.';
    }

    this.contentEl.innerHTML = '';

    if (this.party.length === 0) {
      this.bannerEl.style.borderColor = '#FFD028';
      this.bannerEl.style.color = '#FFD028';
      this.bannerEl.innerText = 'No POKéMON in your party yet! Visit PROF. ELM in his LAB to choose a starter!';
      const emptyBox = document.createElement('div');
      emptyBox.style.cssText = `
        padding: 32px 16px;
        text-align: center;
        color: #94A3B8;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        background: #141E33;
        border: 1px dashed #22324F;
        border-radius: 10px;
        box-shadow: 0 4px 0 0 #070B14;
      `;
      emptyBox.innerText = '🔴 Your party is currently empty. Inspect the Poké Balls on Prof. Elm\'s table!';
      this.contentEl.appendChild(emptyBox);
      return;
    }

    const grid = document.createElement('div');
    grid.id = 'party-slot-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 10px;
    `;

    this.party.forEach((pkmn, idx) => {
      const isLead = idx === 0;
      const isSelected = idx === this.selectedIndex;
      const isSwitchSource = idx === this.switchSourceIndex;
      const hpPct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = hpPct > 50 ? '#48C774' : hpPct > 20 ? '#FFD028' : '#EE4238';

      const card = document.createElement('div');
      card.className = 'party-slot-card party-tactile-btn';
      card.dataset.slotIndex = String(idx);
      card.style.cssText = `
        background: ${
          isSwitchSource
            ? 'linear-gradient(135deg, rgba(255, 208, 40, 0.18) 0%, #141E33 100%)'
            : isSelected
              ? 'linear-gradient(135deg, rgba(42, 117, 211, 0.25) 0%, #141E33 100%)'
              : '#141E33'
        };
        border: 2px solid ${
          isSwitchSource ? '#FFD028' : isSelected ? '#38BDF8' : isLead ? '#48C774' : '#22324F'
        };
        box-shadow: ${
          isSwitchSource || isSelected
            ? '0 0 12px rgba(255,208,40,0.35), 0 4px 0 0 #070B14'
            : '0 4px 0 0 #070B14'
        };
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      `;

      const typeBadgesHtml = (pkmn.types || [])
        .map((t) => {
          const col = TYPE_COLORS[t] || { bg: '#8A9BA8', text: '#0D1322' };
          return `<span style="background: ${col.bg}; color: ${col.text}; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 0 0 #070B14;">${t.toUpperCase()}</span>`;
        })
        .join('');

      let statusHtml = '';
      if (pkmn.currentHp <= 0) {
        statusHtml = `<span style="background: #DC2626; color: #F6F8F3; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">FNT</span>`;
      } else if (pkmn.status && pkmn.status !== 'NONE') {
        const col = STATUS_COLORS[pkmn.status] || { bg: '#8A9BA8', text: '#0D1322' };
        statusHtml = `<span style="background: ${col.bg}; color: ${col.text}; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${pkmn.status}</span>`;
      }

      const leadHtml = isLead
        ? `<span style="background: #48C774; color: #0D1322; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 0 0 #070B14;">★ LEAD</span>`
        : '';

      const evoCandidate = !pkmn.isEgg
        ? EvolutionManager.canEvolve(pkmn, { trigger: 'LEVEL_UP', level: pkmn.level })
        : null;
      const evoBadgeHtml = evoCandidate
        ? `<span style="background: #A855F7; color: #F6F8F3; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 0 0 #070B14;">✨ EVOLVE READY</span>`
        : '';

      const isEgg = Boolean(pkmn.isEgg);
      const avatarHtml = isEgg
        ? `<span style="font-size: 28px;" role="img" aria-label="EGG">🥚</span>`
        : `<img src="./assets/sprites/pokemon/${pkmn.speciesId}_front.png" alt="${pkmn.nickname}" onerror="this.onerror=null; this.src='./assets/sprites/pokemon/unown_front.png';" style="width: 50px; height: 50px; image-rendering: pixelated; object-fit: contain;" />`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 58px;
            height: 58px;
            background: #080E1D;
            border: 1px solid #22324F;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.6);
          ">
            ${avatarHtml}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-family: 'Space Mono', monospace; font-weight: 900; font-size: 14px; color: #F6F8F3;">${isEgg ? 'EGG' : pkmn.nickname.toUpperCase()}</span>
                ${leadHtml}
                ${statusHtml}
                ${evoBadgeHtml}
              </div>
              <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #FFD028;">${isEgg ? 'EGG' : `Lv.${pkmn.level}`}</span>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 4px;">${isEgg ? `<span style="background: #E0C068; color: #0D1322; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 3px;">MYSTERY EGG</span>` : typeBadgesHtml}</div>
            <div style="margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8; font-weight: 700; margin-bottom: 2px;">
                <span>${isEgg ? 'HATCH STEPS' : 'HP'}</span>
                <span style="color: #F6F8F3;">${isEgg ? `${pkmn.eggSteps ?? 0} steps` : `${pkmn.currentHp} / ${pkmn.stats.hp}`}</span>
              </div>
              <div style="width: 100%; height: 6px; background: #080E1D; border-radius: 3px; overflow: hidden; border: 1px solid #22324F;">
                <div style="width: ${isEgg ? 100 : hpPct}%; height: 100%; background: ${isEgg ? '#FFD028' : hpColor}; transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Sub-action popover buttons when this card is selected
      if (isSelected && this.switchSourceIndex === null) {
        const actionRow = document.createElement('div');
        actionRow.style.cssText = `
          display: flex;
          gap: 6px;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid #22324F;
        `;

        const summaryBtn = document.createElement('button');
        summaryBtn.className = 'party-action-summary-btn party-tactile-btn';
        summaryBtn.style.cssText = `
          flex: 1;
          background: #141E33;
          color: #38BDF8;
          border: 1.5px solid #2A75D3;
          border-radius: 6px;
          padding: 6px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
        `;
        summaryBtn.innerText = '📊 SUMMARY';
        summaryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          BattleAudio.playMenuSound('CONFIRM');
          BattleAudio.playCry(pkmn.speciesId);
          this.summaryIndex = idx;
          this.render();
        });

        const switchBtn = document.createElement('button');
        switchBtn.className = 'party-action-switch-btn party-tactile-btn';
        switchBtn.style.cssText = `
          flex: 1;
          background: #FFD028;
          color: #0D1322;
          border: 1.5px solid #FFD028;
          border-radius: 6px;
          padding: 6px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #705900;
        `;
        switchBtn.innerText = '🔄 SWITCH';
        switchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.party.length < 2) {
            BattleAudio.playMenuSound('CANCEL');
            this.bannerEl.innerText = 'You need at least 2 Pokémon in your party to switch order!';
            return;
          }
          BattleAudio.playMenuSound('CONFIRM');
          this.switchSourceIndex = idx;
          this.selectedIndex = null;
          this.render();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'party-action-cancel-btn party-tactile-btn';
        cancelBtn.style.cssText = `
          background: #1E293B;
          color: #F6F8F3;
          border: 1.5px solid #475569;
          border-radius: 6px;
          padding: 6px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
        `;
        cancelBtn.innerText = 'CANCEL';
        cancelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          BattleAudio.playMenuSound('CANCEL');
          this.selectedIndex = null;
          this.render();
        });

        actionRow.appendChild(summaryBtn);
        if (evoCandidate) {
          const evolveBtn = document.createElement('button');
          evolveBtn.className = 'party-action-evolve-btn party-tactile-btn';
          evolveBtn.style.cssText = `
            flex: 1;
            background: #A855F7;
            color: #F6F8F3;
            border: 1.5px solid #C084FC;
            border-radius: 6px;
            padding: 6px 8px;
            font-family: 'Space Mono', monospace;
            font-size: 10px;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 2px 0 0 #581C87;
          `;
          evolveBtn.innerText = '✨ EVOLVE';
          evolveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            BattleAudio.playMenuSound('CONFIRM');
            this.hide();
            const evoScene = new EvolutionSceneUI(this.container.id || 'modal-container');
            const res = await evoScene.play(pkmn, evoCandidate.targetSpeciesId);
            if (res.evolved) {
              this.onPartyChanged?.();
            }
            this.open();
          });
          actionRow.appendChild(evolveBtn);
        }
        actionRow.appendChild(switchBtn);
        actionRow.appendChild(cancelBtn);
        card.appendChild(actionRow);
      }

      card.addEventListener('click', () => {
        if (this.switchSourceIndex !== null) {
          if (this.switchSourceIndex === idx) {
            BattleAudio.playMenuSound('CANCEL');
            this.switchSourceIndex = null;
            this.render();
            return;
          }
          // Swap the two party members
          const temp = this.party[this.switchSourceIndex];
          this.party[this.switchSourceIndex] = this.party[idx];
          this.party[idx] = temp;
          BattleAudio.playMenuSound('CONFIRM');
          this.switchSourceIndex = null;
          this.selectedIndex = null;
          this.render();
          if (this.onPartyChanged) this.onPartyChanged();
          return;
        }

        BattleAudio.playMenuSound('CURSOR');
        this.selectedIndex = this.selectedIndex === idx ? null : idx;
        this.render();
      });

      grid.appendChild(card);
    });

    this.contentEl.appendChild(grid);
  }

  private renderSummaryView(pkmn: PokemonInstance): void {
    renderPartyMemberSummaryHtml(
      pkmn,
      () => {
        this.summaryIndex = null;
        this.render();
      },
      this.contentEl,
      this.bannerEl
    );
  }
}
