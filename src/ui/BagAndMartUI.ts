import type { PokemonInstance, PokeballId } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';

export interface BagInventory {
  balls: Partial<Record<PokeballId, number>>;
  tms: string[];
  money: number;
  badges: string[];
}

export interface TMDefinition {
  id: string; // e.g. 'TM54'
  moveId: string; // 'falseswipe'
  name: string;
  type: string;
  desc: string;
}

export interface MartBallItem {
  id: PokeballId;
  name: string;
  price: number;
  requiredBadges: number;
  multiplierLabel: string;
  desc: string;
}

export const MART_POKEBALL_CATALOG: MartBallItem[] = [
  {
    id: 'poke-ball',
    name: 'Poké Ball',
    price: 200,
    requiredBadges: 0,
    multiplierLabel: '1.0x',
    desc: 'Standard device for catching wild Pokémon.',
  },
  {
    id: 'great-ball',
    name: 'Great Ball',
    price: 600,
    requiredBadges: 1,
    multiplierLabel: '1.5x',
    desc: 'High-performance Ball with a higher catch rate than a Poké Ball.',
  },
  {
    id: 'net-ball',
    name: 'Net Ball',
    price: 1000,
    requiredBadges: 1,
    multiplierLabel: '3.5x Water/Bug',
    desc: 'Works especially well on Water- and Bug-type Pokémon (ideal for Suicune!).',
  },
  {
    id: 'nest-ball',
    name: 'Nest Ball',
    price: 1000,
    requiredBadges: 1,
    multiplierLabel: 'Up to 4.0x',
    desc: 'Works better the lower the wild Pokémon level is.',
  },
  {
    id: 'ultra-ball',
    name: 'Ultra Ball',
    price: 800,
    requiredBadges: 3,
    multiplierLabel: '2.0x',
    desc: 'Ultra-high performance Ball with double the standard catch rate.',
  },
  {
    id: 'quick-ball',
    name: 'Quick Ball',
    price: 1000,
    requiredBadges: 3,
    multiplierLabel: '5.0x Turn 1',
    desc: 'Provides a 5.0x catch multiplier if thrown on the very first turn of battle!',
  },
  {
    id: 'dusk-ball',
    name: 'Dusk Ball',
    price: 1000,
    requiredBadges: 3,
    multiplierLabel: '3.0x Night/Cave',
    desc: 'Makes it easier to catch wild Pokémon at night or inside dark caves.',
  },
  {
    id: 'timer-ball',
    name: 'Timer Ball',
    price: 1000,
    requiredBadges: 5,
    multiplierLabel: 'Up to 4.0x',
    desc: 'Becomes progressively more effective the more turns are taken in battle.',
  },
  {
    id: 'repeat-ball',
    name: 'Repeat Ball',
    price: 1000,
    requiredBadges: 5,
    multiplierLabel: '3.5x Registered',
    desc: 'Works especially well on Pokémon species that have been caught before.',
  },
  {
    id: 'fast-ball',
    name: 'Fast Ball',
    price: 1000,
    requiredBadges: 5,
    multiplierLabel: '4.0x Speed ≥ 100',
    desc: '4.0x catch rate on Pokémon with Base Speed ≥ 100 (Raikou, Entei & Suicune!).',
  },
  {
    id: 'dream-ball',
    name: 'Dream Ball',
    price: 1200,
    requiredBadges: 8,
    multiplierLabel: '4.0x Asleep',
    desc: '4.0x catch multiplier when the target Pokémon is asleep (SLP).',
  },
];

export const INFINITE_TMS: Record<string, TMDefinition> = {
  TM54: {
    id: 'TM54',
    moveId: 'falseswipe',
    name: 'False Swipe',
    type: 'Normal',
    desc: '40 Power Physical attack that never reduces the target HP below 1.',
  },
  TM73: {
    id: 'TM73',
    moveId: 'thunderwave',
    name: 'Thunder Wave',
    type: 'Electric',
    desc: 'Paralyzes the target (1.5x catch rate, -50% Speed).',
  },
  TM99: {
    id: 'TM99',
    moveId: 'meanlook',
    name: 'Mean Look',
    type: 'Normal',
    desc: 'Locks the target in battle, preventing roaming beasts from fleeing.',
  },
};

export class BagAndMartUI {
  private container: HTMLElement;
  private bagModal!: HTMLDivElement;
  private feedbackBanner!: HTMLDivElement;
  private inventory: BagInventory;
  private party: PokemonInstance[];
  private onInventoryChanged?: () => void;

  constructor(
    containerId: string = 'modal-container',
    inventory: BagInventory,
    party: PokemonInstance[],
    onInventoryChanged?: () => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`UI Container #${containerId} not found`);
    this.container = el;
    this.inventory = inventory;
    this.party = party;
    this.onInventoryChanged = onInventoryChanged;
    this.createUI();
  }

  private createUI(): void {
    const modal = document.createElement('div');
    modal.id = 'bag-modal';
    modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 540px;
      max-width: 94vw;
      max-height: 86vh;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85);
      display: none;
      flex-direction: column;
      gap: 14px;
      z-index: 50;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;

    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 12px;">
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <h2 style="font-size: 18px; font-weight: 800; color: #38bdf8; margin: 0;">🎒 BAG & POKÉ MART</h2>
          <span id="bag-money" style="font-size: 13px; font-weight: 800; background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(251, 191, 36, 0.3);">$3,000</span>
          <span id="bag-badges" style="font-size: 12px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 6px;">🏅 0 Badges</span>
        </div>
        <button id="close-bag-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Feedback Banner -->
      <div id="bag-feedback-banner" style="
        display: none;
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid #10b981;
        color: #a7f3d0;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
      "></div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 8px;">
        <button id="tab-tms" style="
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 6px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        ">💿 INFINITE TMS</button>
        <button id="tab-balls" style="
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        ">🔴 MY BALLS</button>
        <button id="tab-mart" style="
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        ">🏪 POKÉ MART</button>
      </div>

      <!-- Content Container -->
      <div id="bag-content" style="
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 52vh;
        overflow-y: auto;
        padding-right: 4px;
      "></div>
    `;

    this.container.appendChild(modal);
    this.bagModal = modal;
    this.feedbackBanner = modal.querySelector('#bag-feedback-banner') as HTMLDivElement;

    modal.querySelector('#close-bag-modal-btn')!.addEventListener('click', () => {
      this.hide();
    });

    const tabTms = modal.querySelector('#tab-tms') as HTMLButtonElement;
    const tabBalls = modal.querySelector('#tab-balls') as HTMLButtonElement;
    const tabMart = modal.querySelector('#tab-mart') as HTMLButtonElement;

    tabTms.addEventListener('click', () => this.switchTab('TMS'));
    tabBalls.addEventListener('click', () => this.switchTab('BALLS'));
    tabMart.addEventListener('click', () => this.switchTab('MART'));
  }

  private switchTab(tab: 'TMS' | 'BALLS' | 'MART'): void {
    const tabTms = this.bagModal.querySelector('#tab-tms') as HTMLButtonElement;
    const tabBalls = this.bagModal.querySelector('#tab-balls') as HTMLButtonElement;
    const tabMart = this.bagModal.querySelector('#tab-mart') as HTMLButtonElement;

    const setActive = (btn: HTMLButtonElement, active: boolean) => {
      btn.style.background = active ? '#2563eb' : '#334155';
      btn.style.color = active ? '#ffffff' : '#94a3b8';
    };

    setActive(tabTms, tab === 'TMS');
    setActive(tabBalls, tab === 'BALLS');
    setActive(tabMart, tab === 'MART');

    this.updateHeaderDisplay();
    if (tab === 'TMS') this.renderTMsTab();
    else if (tab === 'BALLS') this.renderBallsTab();
    else this.renderMartTab();
  }

  public open(initialTab: 'TMS' | 'BALLS' | 'MART' = 'TMS'): void {
    this.bagModal.style.display = 'flex';
    this.feedbackBanner.style.display = 'none';
    this.switchTab(initialTab);
  }

  public openMart(): void {
    this.open('MART');
  }

  public hide(): void {
    this.bagModal.style.display = 'none';
  }

  private showFeedback(message: string, isError: boolean = false): void {
    this.feedbackBanner.style.display = 'block';
    this.feedbackBanner.style.background = isError ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    this.feedbackBanner.style.borderColor = isError ? '#ef4444' : '#10b981';
    this.feedbackBanner.style.color = isError ? '#fca5a5' : '#a7f3d0';
    this.feedbackBanner.innerText = message;
  }

  private updateHeaderDisplay(): void {
    const moneyEl = this.bagModal.querySelector('#bag-money') as HTMLElement;
    if (moneyEl) moneyEl.innerText = `$${this.inventory.money.toLocaleString()}`;
    const badgesEl = this.bagModal.querySelector('#bag-badges') as HTMLElement;
    if (badgesEl) badgesEl.innerText = `🏅 ${this.inventory.badges.length} Badges`;
  }

  private renderTMsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const lead = this.party[0];
    if (lead) {
      const movesSummary = lead.moves.map((m) => PokemonFactory.getMoveData(m.moveId).name).join(' • ');
      const partyInfo = document.createElement('div');
      partyInfo.style.cssText = `
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px;
        color: #cbd5e1;
      `;
      partyInfo.innerHTML = `<strong>Active Partner:</strong> ${lead.nickname} (Lv. ${lead.level}) — <span style="color: #38bdf8;">${movesSummary}</span>`;
      container.appendChild(partyInfo);
    }

    const tms = this.inventory.tms;
    if (tms.length === 0) {
      container.innerHTML += `<div style="text-align: center; color: #94a3b8; padding: 20px;">No TMs acquired yet.</div>`;
      return;
    }

    for (const tmId of tms) {
      const tm = INFINITE_TMS[tmId];
      if (!tm) continue;

      const alreadyKnows = lead?.moves.some((m) => m.moveId === tm.moveId) ?? false;

      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      `;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #38bdf8;">${tm.id}</span>
            <span style="font-weight: 700; color: #ffffff;">${tm.name}</span>
            <span style="font-size: 10px; background: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${tm.type.toUpperCase()}</span>
            <span style="font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">INFINITE USE</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${tm.desc}</div>
        </div>
        <button style="
          background: ${alreadyKnows ? '#334155' : '#2563eb'};
          color: ${alreadyKnows ? '#94a3b8' : 'white'};
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: ${alreadyKnows ? 'default' : 'pointer'};
        ">${alreadyKnows ? 'LEARNED ✓' : 'TEACH'}</button>
      `;

      const teachBtn = card.querySelector('button') as HTMLButtonElement;
      if (!alreadyKnows) {
        teachBtn.addEventListener('click', () => {
          this.teachTM(tm);
        });
      }

      container.appendChild(card);
    }
  }

  private renderBallsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const ballEntries = Object.entries(this.inventory.balls).filter(([, count]) => (count ?? 0) > 0) as Array<[PokeballId, number]>;
    if (ballEntries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No Pokéballs in bag. Visit the Poké Mart tab to stock up!</div>`;
      return;
    }

    for (const [ballId, count] of ballEntries) {
      const catalogInfo = MART_POKEBALL_CATALOG.find((b) => b.id === ballId);
      const formattedName = catalogInfo?.name || ballId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const desc = catalogInfo?.desc || 'Guaranteed capture device.';
      const mult = catalogInfo?.multiplierLabel || '255x Guaranteed';

      const card = document.createElement('div');
      card.style.cssText = `
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      card.innerHTML = `
        <div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-weight: 700; color: #ffffff;">🔴 ${formattedName}</span>
            <span style="font-size: 10px; background: #0284c7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${mult}</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${desc}</div>
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">x${count}</div>
      `;

      container.appendChild(card);
    }
  }

  private renderMartTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const currentBadges = this.inventory.badges.length;

    // Badge Progression Control Bar (allows testing 0, 1, 3, 5, 8 badge unlocks per Specification 4.5)
    const badgeBar = document.createElement('div');
    badgeBar.style.cssText = `
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    `;

    badgeBar.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #cbd5e1;">
        🏅 Gym Badges (Unlocks Modern Pokéballs):
      </div>
      <div id="badge-tier-btns" style="display: flex; gap: 6px;"></div>
    `;
    container.appendChild(badgeBar);

    const tierContainer = badgeBar.querySelector('#badge-tier-btns') as HTMLDivElement;
    const badgeTiers = [0, 1, 3, 5, 8];
    for (const tier of badgeTiers) {
      const btn = document.createElement('button');
      const isSelected = currentBadges === tier;
      btn.style.cssText = `
        background: ${isSelected ? '#0d9488' : '#334155'};
        color: ${isSelected ? '#ffffff' : '#94a3b8'};
        border: 1px solid ${isSelected ? '#2dd4bf' : 'transparent'};
        border-radius: 5px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      `;
      btn.innerText = `${tier}`;
      btn.addEventListener('click', () => {
        this.inventory.badges = Array.from({ length: tier }, (_, i) => `Badge_${i + 1}`);
        this.updateHeaderDisplay();
        this.renderMartTab();
        if (this.onInventoryChanged) this.onInventoryChanged();
      });
      tierContainer.appendChild(btn);
    }

    for (const item of MART_POKEBALL_CATALOG) {
      const isUnlocked = currentBadges >= item.requiredBadges;
      const ownedCount = this.inventory.balls[item.id] ?? 0;

      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isUnlocked ? '#1e293b' : 'rgba(15, 23, 42, 0.6)'};
        border: 1px solid ${isUnlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)'};
        border-radius: 8px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        opacity: ${isUnlocked ? '1' : '0.55'};
      `;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #ffffff;">🔴 ${item.name}</span>
            <span style="font-size: 10px; background: #0284c7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${item.multiplierLabel}</span>
            <span style="font-size: 11px; color: #94a3b8;">Owned: x${ownedCount}</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${item.desc}</div>
        </div>
        <div>
          ${
            isUnlocked
              ? `<button class="buy-ball-btn" style="
                  background: #16a34a;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 8px 12px;
                  font-weight: 800;
                  font-size: 12px;
                  cursor: pointer;
                ">BUY $${item.price}</button>`
              : `<span style="
                  font-size: 11px;
                  font-weight: 800;
                  background: #334155;
                  color: #94a3b8;
                  padding: 6px 10px;
                  border-radius: 6px;
                  white-space: nowrap;
                ">🔒 ${item.requiredBadges} BADGE${item.requiredBadges > 1 ? 'S' : ''}</span>`
          }
        </div>
      `;

      if (isUnlocked) {
        const buyBtn = card.querySelector('.buy-ball-btn') as HTMLButtonElement;
        buyBtn.addEventListener('click', () => {
          if (this.inventory.money < item.price) {
            this.showFeedback(`Not enough money to buy ${item.name}! ($${item.price} required)`, true);
            return;
          }
          this.inventory.money -= item.price;
          this.inventory.balls[item.id] = (this.inventory.balls[item.id] ?? 0) + 1;
          this.updateHeaderDisplay();
          this.showFeedback(`Purchased 1x ${item.name}! (Now holding x${this.inventory.balls[item.id]})`);
          this.renderMartTab();
          if (this.onInventoryChanged) this.onInventoryChanged();
        });
      }

      container.appendChild(card);
    }
  }

  /**
   * Teaches an Infinite TM to the active starter/lead Pokémon
   */
  private teachTM(tm: TMDefinition): void {
    const lead = this.party[0];
    if (!lead) return;

    const alreadyKnows = lead.moves.some((m) => m.moveId === tm.moveId);
    if (alreadyKnows) {
      this.showFeedback(`${lead.nickname} already knows ${tm.name}!`, true);
      return;
    }

    const moveData = PokemonFactory.getMoveData(tm.moveId);

    if (lead.moves.length < 4) {
      lead.moves.push({
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      });
      this.showFeedback(`✨ ${lead.nickname} learned ${tm.name}! (TM ${tm.id} remains intact)`);
    } else {
      const replacedMove = lead.moves[3];
      lead.moves[3] = {
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      };
      this.showFeedback(
        `✨ 1, 2, and... Poof! ${lead.nickname} replaced ${replacedMove.moveId.toUpperCase()} with ${tm.name}!`
      );
    }

    this.renderTMsTab();
    if (this.onInventoryChanged) {
      this.onInventoryChanged();
    }
  }
}
