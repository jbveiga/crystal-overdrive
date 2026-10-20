import type { PokemonInstance, PokemonType, SpeedMultiplier } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#94a3b8',
  Fire: '#ef4444',
  Water: '#3b82f6',
  Grass: '#22c55e',
  Electric: '#eab308',
  Ice: '#06b6d4',
  Fighting: '#c2410c',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#6366f1',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#78716c',
  Ghost: '#6d28d9',
  Dragon: '#4f46e5',
  Steel: '#64748b',
  Dark: '#334155',
};

const STATUS_COLORS: Record<string, string> = {
  PAR: '#eab308',
  SLP: '#64748b',
  FRZ: '#06b6d4',
  BRN: '#ef4444',
  PSN: '#a855f7',
  TOX: '#9333ea',
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
    this.createUI();
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
      width: 620px;
      max-width: 95vw;
      max-height: 88vh;
      background: rgba(15, 23, 42, 0.97);
      backdrop-filter: blur(16px);
      border: 2px solid rgba(255, 255, 255, 0.22);
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 14px 44px rgba(0, 0, 0, 0.88);
      display: none;
      flex-direction: column;
      gap: 14px;
      z-index: 55;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;

    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.14); padding-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h2 style="font-size: 18px; font-weight: 800; color: #4ade80; margin: 0;">🟢 POKÉMON PARTY</h2>
          <span id="party-count-badge" style="font-size: 12px; font-weight: 700; background: rgba(74, 222, 128, 0.16); color: #4ade80; padding: 3px 8px; border-radius: 6px;">1 / 6</span>
        </div>
        <button id="close-party-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Prompt / Status Banner -->
      <div id="party-prompt-banner" style="
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.28);
        border-radius: 8px;
        padding: 9px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
      ">Choose a POKéMON to view Summary or Switch battle order.</div>

      <!-- Content Area -->
      <div id="party-content-area" style="
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 62vh;
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
      this.bannerEl.style.borderColor = '#facc15';
      this.bannerEl.style.color = '#fef08a';
      this.bannerEl.innerText = `🔄 Move ${this.party[this.switchSourceIndex].nickname} to where? (Click another slot to swap)`;
    } else if (this.selectedIndex !== null && this.party[this.selectedIndex]) {
      this.bannerEl.style.borderColor = '#38bdf8';
      this.bannerEl.style.color = '#e2e8f0';
      this.bannerEl.innerText = `Do what with ${this.party[this.selectedIndex].nickname}?`;
    } else {
      this.bannerEl.style.borderColor = 'rgba(56, 189, 248, 0.28)';
      this.bannerEl.style.color = '#e2e8f0';
      this.bannerEl.innerText = 'Choose a POKéMON to view Summary or Switch battle order.';
    }

    this.contentEl.innerHTML = '';

    if (this.party.length === 0) {
      this.bannerEl.style.borderColor = '#facc15';
      this.bannerEl.style.color = '#fef08a';
      this.bannerEl.innerText = 'No POKéMON in your party yet! Visit PROF. ELM in his LAB to choose a starter!';
      const emptyBox = document.createElement('div');
      emptyBox.style.cssText = `
        padding: 32px 16px;
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
        font-weight: 700;
        background: rgba(15, 23, 42, 0.5);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 10px;
      `;
      emptyBox.innerText = '🔴 Your party is currently empty. Inspect the Poké Balls on Prof. Elm\'s table!';
      this.contentEl.appendChild(emptyBox);
      return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 10px;
    `;

    this.party.forEach((pkmn, idx) => {
      const isLead = idx === 0;
      const isSelected = idx === this.selectedIndex;
      const isSwitchSource = idx === this.switchSourceIndex;
      const hpPct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';

      const card = document.createElement('div');
      card.className = 'party-slot-card';
      card.dataset.slotIndex = String(idx);
      card.style.cssText = `
        background: ${isSwitchSource ? 'rgba(161, 98, 7, 0.28)' : isSelected ? '#1e3a8a' : '#1e293b'};
        border: 2px solid ${
          isSwitchSource ? '#facc15' : isSelected ? '#38bdf8' : isLead ? '#4ade80' : 'rgba(255, 255, 255, 0.12)'
        };
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        cursor: pointer;
        transition: transform 0.1s ease, border-color 0.15s ease;
      `;

      const typeBadgesHtml = pkmn.types
        .map(
          (t) =>
            `<span style="background: ${TYPE_COLORS[t] || '#64748b'}; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">${t.toUpperCase()}</span>`
        )
        .join('');

      const statusHtml =
        pkmn.status && pkmn.status !== 'NONE'
          ? `<span style="background: ${STATUS_COLORS[pkmn.status] || '#64748b'}; color: white; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${pkmn.status}</span>`
          : pkmn.currentHp <= 0
            ? `<span style="background: #dc2626; color: white; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">FNT</span>`
            : '';

      const leadHtml = isLead
        ? `<span style="background: #16a34a; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">★ LEAD</span>`
        : '';

      const isEgg = Boolean(pkmn.isEgg);
      const avatarHtml = isEgg
        ? `<span style="font-size: 28px;" role="img" aria-label="EGG">🥚</span>`
        : `<img src="./assets/sprites/pokemon/${pkmn.speciesId}_front.png" alt="${pkmn.nickname}" style="width: 46px; height: 46px; image-rendering: pixelated; object-fit: contain;" />`;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 52px;
            height: 52px;
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            ${avatarHtml}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                <span style="font-weight: 800; font-size: 14px; color: #f8fafc;">${isEgg ? 'EGG' : pkmn.nickname}</span>
                ${leadHtml}
                ${statusHtml}
              </div>
              <span style="font-size: 12px; font-weight: 800; color: #facc15;">${isEgg ? 'EGG' : `Lv.${pkmn.level}`}</span>
            </div>
            <div style="display: flex; gap: 4px; margin-top: 3px;">${isEgg ? `<span style="background: #f59e0b; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">MYSTERY EGG</span>` : typeBadgesHtml}</div>
            <div style="margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1; font-weight: 700; margin-bottom: 2px;">
                <span>${isEgg ? 'HATCH STEPS' : 'HP'}</span>
                <span>${isEgg ? `${pkmn.eggSteps ?? 0} steps` : `${pkmn.currentHp} / ${pkmn.stats.hp}`}</span>
              </div>
              <div style="width: 100%; height: 7px; background: #0f172a; border-radius: 4px; overflow: hidden; border: 1px solid #334155;">
                <div style="width: ${isEgg ? 100 : hpPct}%; height: 100%; background: ${isEgg ? '#facc15' : hpColor};"></div>
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
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        `;

        const summaryBtn = document.createElement('button');
        summaryBtn.className = 'party-action-summary-btn';
        summaryBtn.style.cssText = `
          flex: 1;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
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
        switchBtn.className = 'party-action-switch-btn';
        switchBtn.style.cssText = `
          flex: 1;
          background: #d97706;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
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
        cancelBtn.className = 'party-action-cancel-btn';
        cancelBtn.style.cssText = `
          background: #475569;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
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
    this.bannerEl.style.borderColor = '#38bdf8';
    this.bannerEl.style.color = '#e2e8f0';
    this.bannerEl.innerText = `📋 POKéMON SUMMARY — ${pkmn.nickname} (Lv. ${pkmn.level})`;

    this.contentEl.innerHTML = '';

    const baseExp = pkmn.level * pkmn.level * pkmn.level;
    const nextExp = pkmn.nextLevelExp ?? (pkmn.level + 1) * (pkmn.level + 1) * (pkmn.level + 1);
    const currentExp = pkmn.exp ?? baseExp;
    const expPct = Math.max(0, Math.min(100, ((currentExp - baseExp) / Math.max(1, nextExp - baseExp)) * 100));

    const typeBadgesHtml = pkmn.types
      .map(
        (t) =>
          `<span style="background: ${TYPE_COLORS[t] || '#64748b'}; color: white; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">${t.toUpperCase()}</span>`
      )
      .join('');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    // Top Overview Row (Sprite + EXP + Status)
    const topCard = document.createElement('div');
    topCard.style.cssText = `
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    `;
    topCard.innerHTML = `
      <div style="
        width: 84px;
        height: 84px;
        background: rgba(15, 23, 42, 0.85);
        border: 2px solid #38bdf8;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <img src="./assets/sprites/pokemon/${pkmn.speciesId}_front.png" alt="${pkmn.nickname}" style="width: 72px; height: 72px; image-rendering: pixelated; object-fit: contain;" />
      </div>
      <div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px; font-weight: 800; color: #f8fafc;">${pkmn.nickname}</span>
            ${typeBadgesHtml}
          </div>
          <span style="font-size: 15px; font-weight: 800; color: #facc15;">Lv. ${pkmn.level}</span>
        </div>
        <div style="font-size: 12px; color: #cbd5e1;">
          <strong>HP:</strong> ${pkmn.currentHp} / ${pkmn.stats.hp} &nbsp;|&nbsp;
          <strong>Status:</strong> ${pkmn.status === 'NONE' ? 'Healthy' : pkmn.status}
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #38bdf8; font-weight: 700; margin-bottom: 3px;">
            <span>EXP. POINTS: ${currentExp}</span>
            <span>NEXT LV: ${Math.max(0, nextExp - currentExp)} EXP</span>
          </div>
          <div style="width: 100%; height: 7px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; overflow: hidden;">
            <div style="width: ${expPct}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8);"></div>
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(topCard);

    // Middle Row: Stats & Moves side by side
    const midGrid = document.createElement('div');
    midGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;';

    // Stats Box
    const statsBox = document.createElement('div');
    statsBox.style.cssText = `
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;
    const statRows: Array<{ label: string; val: number; base: number; color: string }> = [
      { label: 'HP', val: pkmn.stats.hp, base: pkmn.baseStats.hp, color: '#22c55e' },
      { label: 'ATTACK', val: pkmn.stats.attack, base: pkmn.baseStats.attack, color: '#ef4444' },
      { label: 'DEFENSE', val: pkmn.stats.defense, base: pkmn.baseStats.defense, color: '#f59e0b' },
      { label: 'SP. ATK', val: pkmn.stats.spAttack, base: pkmn.baseStats.spAttack, color: '#3b82f6' },
      { label: 'SP. DEF', val: pkmn.stats.spDefense, base: pkmn.baseStats.spDefense, color: '#a855f7' },
      { label: 'SPEED', val: pkmn.stats.speed, base: pkmn.baseStats.speed, color: '#06b6d4' },
    ];

    let statsHtml = `<div style="font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 2px;">📊 COMBAT STATS (CURRENT / BASE)</div>`;
    for (const s of statRows) {
      const barPct = Math.min(100, Math.round((s.base / 130) * 100));
      statsHtml += `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px;">
          <span style="width: 62px; font-weight: 700; color: #cbd5e1;">${s.label}</span>
          <div style="flex: 1; height: 6px; background: #0f172a; border-radius: 3px; overflow: hidden;">
            <div style="width: ${barPct}%; height: 100%; background: ${s.color};"></div>
          </div>
          <span style="width: 58px; text-align: right; font-weight: 800; color: #f8fafc;">${s.val} <span style="color: #64748b; font-size: 10px;">(${s.base})</span></span>
        </div>
      `;
    }
    statsBox.innerHTML = statsHtml;
    midGrid.appendChild(statsBox);

    // Moves Box
    const movesBox = document.createElement('div');
    movesBox.style.cssText = `
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;
    let movesHtml = `<div style="font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 2px;">⚔️ KNOWN MOVES</div>`;
    for (const mSlot of pkmn.moves) {
      const mData = PokemonFactory.getMoveData(mSlot.moveId);
      const tColor = TYPE_COLORS[mData.type] || '#64748b';
      movesHtml += `
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; font-size: 12px; color: #f8fafc;">${mData.name}</span>
              <span style="background: ${tColor}; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">${mData.type.toUpperCase()}</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${mData.category} • Pow: ${mData.power || '—'} • Acc: ${mData.accuracy}%</div>
          </div>
          <span style="font-size: 11px; font-weight: 800; color: #38bdf8;">PP ${mSlot.currentPp}/${mSlot.maxPp}</span>
        </div>
      `;
    }
    movesBox.innerHTML = movesHtml;
    midGrid.appendChild(movesBox);

    wrapper.appendChild(midGrid);

    const backBtn = document.createElement('button');
    backBtn.id = 'summary-back-btn';
    backBtn.style.cssText = `
      background: #334155;
      color: #f8fafc;
      border: none;
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
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
