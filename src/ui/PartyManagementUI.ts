import type { PokemonInstance, SpeedMultiplier } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Normal: { bg: '#8A9BA8', text: '#0D1322' },
  Fire: { bg: '#EE4238', text: '#F6F8F3' },
  Water: { bg: '#2A75D3', text: '#F6F8F3' },
  Grass: { bg: '#48C774', text: '#0D1322' },
  Electric: { bg: '#FFD028', text: '#0D1322' },
  Ice: { bg: '#98D8D8', text: '#0D1322' },
  Fighting: { bg: '#C03028', text: '#F6F8F3' },
  Poison: { bg: '#9B51E0', text: '#F6F8F3' },
  Ground: { bg: '#E0C068', text: '#0D1322' },
  Flying: { bg: '#74B9FF', text: '#0D1322' },
  Psychic: { bg: '#F85888', text: '#F6F8F3' },
  Bug: { bg: '#A8B820', text: '#0D1322' },
  Rock: { bg: '#B8A038', text: '#F6F8F3' },
  Ghost: { bg: '#705898', text: '#F6F8F3' },
  Dragon: { bg: '#5E5CE6', text: '#F6F8F3' },
  Steel: { bg: '#8A9BA8', text: '#0D1322' },
  Dark: { bg: '#705746', text: '#F6F8F3' },
  Fairy: { bg: '#EE99AC', text: '#0D1322' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAR: { bg: '#FFD028', text: '#0D1322' },
  SLP: { bg: '#8A9BA8', text: '#0D1322' },
  FRZ: { bg: '#98D8D8', text: '#0D1322' },
  BRN: { bg: '#EE4238', text: '#F6F8F3' },
  PSN: { bg: '#9B51E0', text: '#F6F8F3' },
  TOX: { bg: '#705898', text: '#F6F8F3' },
  FNT: { bg: '#DC2626', text: '#F6F8F3' },
};

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
    if (typeof document === 'undefined') return;
    if (document.getElementById('neo-kanto-party-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-kanto-party-styles';
    style.textContent = `
      .party-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .party-scrollbar::-webkit-scrollbar-track {
        background: #080E1D;
        border-radius: 4px;
      }
      .party-scrollbar::-webkit-scrollbar-thumb {
        background: #22324F;
        border-radius: 4px;
      }
      .party-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #2A75D3;
      }
      .party-tactile-btn {
        transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.12s ease;
      }
      .party-tactile-btn:hover {
        filter: brightness(1.12);
      }
      .party-tactile-btn:active {
        transform: translateY(2px) !important;
        box-shadow: 0 1px 0 0 #070B14 !important;
      }
      @media (max-width: 768px) {
        #party-management-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 14px !important;
        }
        #party-slot-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head?.appendChild(style);
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
    this.bannerEl.style.borderColor = '#2A75D3';
    this.bannerEl.style.color = '#38BDF8';
    this.bannerEl.innerText = `📋 POKéMON SUMMARY — ${pkmn.nickname.toUpperCase()} (Lv. ${pkmn.level})`;

    this.contentEl.innerHTML = '';

    const baseExp = pkmn.level * pkmn.level * pkmn.level;
    const nextExp = pkmn.nextLevelExp ?? (pkmn.level + 1) * (pkmn.level + 1) * (pkmn.level + 1);
    const currentExp = pkmn.exp ?? baseExp;
    const expPct = Math.max(0, Math.min(100, ((currentExp - baseExp) / Math.max(1, nextExp - baseExp)) * 100));

    const typeBadgesHtml = (pkmn.types || [])
      .map((t) => {
        const col = TYPE_COLORS[t] || { bg: '#8A9BA8', text: '#0D1322' };
        return `<span style="background: ${col.bg}; color: ${col.text}; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; box-shadow: 0 2px 0 0 #070B14;">${t.toUpperCase()}</span>`;
      })
      .join('');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    // Top Overview Row (Sprite + EXP + Status)
    const topCard = document.createElement('div');
    topCard.style.cssText = `
      background: #141E33;
      border: 1px solid #22324F;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      box-shadow: 0 4px 0 0 #070B14;
    `;
    topCard.innerHTML = `
      <div style="
        width: 84px;
        height: 84px;
        background: #080E1D;
        border: 2px solid #2A75D3;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 14px rgba(0,0,0,0.8);
      ">
        <img src="./assets/sprites/pokemon/${pkmn.speciesId}_front.png" alt="${pkmn.nickname}" onerror="this.onerror=null; this.src='./assets/sprites/pokemon/unown_front.png';" style="width: 72px; height: 72px; image-rendering: pixelated; object-fit: contain;" />
      </div>
      <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 900; color: #F6F8F3;">${pkmn.nickname.toUpperCase()}</span>
            ${typeBadgesHtml}
          </div>
          <span style="font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 800; color: #FFD028;">Lv. ${pkmn.level}</span>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #94A3B8;">
          <strong style="color: #DDE2F7;">HP:</strong> ${pkmn.currentHp} / ${pkmn.stats.hp} &nbsp;|&nbsp;
          <strong style="color: #DDE2F7;">STATUS:</strong> ${pkmn.status === 'NONE' ? 'HEALTHY' : pkmn.status}
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 10px; color: #38BDF8; font-weight: 700; margin-bottom: 3px;">
            <span>EXP. POINTS: ${currentExp}</span>
            <span>NEXT LV: ${Math.max(0, nextExp - currentExp)} EXP</span>
          </div>
          <div style="width: 100%; height: 6px; background: #080E1D; border: 1px solid #22324F; border-radius: 3px; overflow: hidden;">
            <div style="width: ${expPct}%; height: 100%; background: linear-gradient(90deg, #2A75D3, #38BDF8);"></div>
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(topCard);

    // Middle Row: Stats & Moves side by side
    const midGrid = document.createElement('div');
    midGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;';

    // Stats Box
    const statsBox = document.createElement('div');
    statsBox.style.cssText = `
      background: #141E33;
      border: 1px solid #22324F;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 0 0 #070B14;
    `;
    const statRows: Array<{ label: string; val: number; base: number; color: string }> = [
      { label: 'HP', val: pkmn.stats.hp, base: pkmn.baseStats?.hp ?? pkmn.stats.hp, color: '#48C774' },
      { label: 'ATTACK', val: pkmn.stats.attack, base: pkmn.baseStats?.attack ?? pkmn.stats.attack, color: '#EE4238' },
      { label: 'DEFENSE', val: pkmn.stats.defense, base: pkmn.baseStats?.defense ?? pkmn.stats.defense, color: '#FFD028' },
      { label: 'SP. ATK', val: pkmn.stats.spAttack, base: pkmn.baseStats?.spAttack ?? pkmn.stats.spAttack, color: '#2A75D3' },
      { label: 'SP. DEF', val: pkmn.stats.spDefense, base: pkmn.baseStats?.spDefense ?? pkmn.stats.spDefense, color: '#9B51E0' },
      { label: 'SPEED', val: pkmn.stats.speed, base: pkmn.baseStats?.speed ?? pkmn.stats.speed, color: '#38BDF8' },
    ];

    let statsHtml = `<div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; margin-bottom: 2px;">📊 COMBAT STATS (CURRENT / BASE)</div>`;
    for (const s of statRows) {
      const barPct = Math.min(100, Math.round((s.base / 130) * 100));
      statsHtml += `
        <div style="display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 10px;">
          <span style="width: 62px; font-weight: 700; color: #94A3B8;">${s.label}</span>
          <div style="flex: 1; height: 6px; background: #080E1D; border-radius: 3px; overflow: hidden; border: 1px solid #22324F;">
            <div style="width: ${barPct}%; height: 100%; background: ${s.color};"></div>
          </div>
          <span style="width: 58px; text-align: right; font-weight: 800; color: #F6F8F3;">${s.val} <span style="color: #64748B; font-size: 9px;">(${s.base})</span></span>
        </div>
      `;
    }
    statsBox.innerHTML = statsHtml;
    midGrid.appendChild(statsBox);

    // Moves Box
    const movesBox = document.createElement('div');
    movesBox.style.cssText = `
      background: #141E33;
      border: 1px solid #22324F;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 0 0 #070B14;
    `;
    let movesHtml = `<div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; margin-bottom: 2px;">⚔️ KNOWN MOVES</div>`;
    for (const mSlot of pkmn.moves) {
      const mData = PokemonFactory.getMoveData(mSlot.moveId);
      const tColor = TYPE_COLORS[mData.type] || { bg: '#8A9BA8', text: '#0D1322' };
      movesHtml += `
        <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 0 0 #070B14;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: 'Space Mono', monospace; font-weight: 800; font-size: 12px; color: #F6F8F3;">${mData.name}</span>
              <span style="background: ${tColor.bg}; color: ${tColor.text}; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">${mData.type.toUpperCase()}</span>
            </div>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">${mData.category} • Pow: ${mData.power || '—'} • Acc: ${mData.accuracy}%</div>
          </div>
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #38BDF8;">PP ${mSlot.currentPp}/${mSlot.maxPp}</span>
        </div>
      `;
    }
    movesBox.innerHTML = movesHtml;
    midGrid.appendChild(movesBox);

    wrapper.appendChild(midGrid);

    const backBtn = document.createElement('button');
    backBtn.id = 'summary-back-btn';
    backBtn.className = 'party-tactile-btn';
    backBtn.style.cssText = `
      background: #1E293B;
      color: #F6F8F3;
      border: 1.5px solid #475569;
      border-radius: 8px;
      padding: 10px;
      font-family: 'Space Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 3px 0 0 #070B14;
    `;
    backBtn.innerText = '← BACK TO PARTY LIST';
    backBtn.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.summaryIndex = null;
      this.render();
    });
    wrapper.appendChild(backBtn);

    this.contentEl.appendChild(wrapper);
  }
}
