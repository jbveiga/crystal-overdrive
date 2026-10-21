import type { PokemonInstance, PokeballId, MedicineId, SpeedMultiplier } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';

export interface BagInventory {
  balls: Partial<Record<PokeballId, number>>;
  items?: Partial<Record<string, number>>;
  berries?: Partial<Record<string, number>>;
  tms: string[];
  money: number;
  badges: string[];
  keyItems?: string[];
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

export interface MedicineItemDef {
  id: MedicineId;
  name: string;
  price: number;
  badgeLabel: string;
  desc: string;
  icon: string;
}

export const MART_MEDICINE_CATALOG: MedicineItemDef[] = [
  {
    id: 'potion',
    name: 'Potion',
    price: 300,
    badgeLabel: '+20 HP',
    desc: 'A spray-type medicine for wounds. Restores the HP of one Pokémon by 20 points.',
    icon: '🧪',
  },
  {
    id: 'super-potion',
    name: 'Super Potion',
    price: 700,
    badgeLabel: '+50 HP',
    desc: 'A concentrated spray-type medicine. Restores the HP of one Pokémon by 50 points.',
    icon: '⚗️',
  },
  {
    id: 'antidote',
    name: 'Antidote',
    price: 100,
    badgeLabel: 'CURES PSN',
    desc: 'A spray-type medicine that lifts the effects of poison from one Pokémon.',
    icon: '💛',
  },
  {
    id: 'parlyz-heal',
    name: 'Parlyz Heal',
    price: 200,
    badgeLabel: 'CURES PAR',
    desc: 'A spray-type medicine that eliminates paralysis from a single Pokémon.',
    icon: '⚡',
  },
  {
    id: 'awakening',
    name: 'Awakening',
    price: 250,
    badgeLabel: 'WAKES SLP',
    desc: 'A spray-type medicine that awakens a sleeping Pokémon immediately.',
    icon: '🔔',
  },
  {
    id: 'revive',
    name: 'Revive',
    price: 1500,
    badgeLabel: 'REVIVE 50%',
    desc: 'A medicine that revives a fainted Pokémon and restores half its maximum HP.',
    icon: '💎',
  },
];

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

export type BagTabId = 'ITEMS' | 'TMS' | 'BALLS' | 'MART';

const CARD_STYLE = 'background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:12px;';

export class BagAndMartUI {
  private container: HTMLElement;
  private bagModal!: HTMLDivElement;
  private feedbackBanner!: HTMLDivElement;
  private inventory: BagInventory;
  private party: PokemonInstance[];
  private selectedPartyIndex: number = 0;
  private speedMultiplier: SpeedMultiplier = 1;
  private onInventoryChanged?: () => void;
  private onUseItemfinder?: () => void;

  constructor(
    containerId: string = 'modal-container',
    inventory: BagInventory,
    party: PokemonInstance[],
    onInventoryChanged?: () => void,
    onUseItemfinder?: () => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`UI Container #${containerId} not found`);
    this.container = el;
    this.inventory = inventory;
    if (!this.inventory.items) {
      this.inventory.items = {
        potion: 5,
        'super-potion': 2,
        antidote: 3,
        'parlyz-heal': 2,
        awakening: 2,
        revive: 1,
      };
    }
    if (!this.inventory.berries) {
      this.inventory.berries = {};
    }
    this.party = party;
    this.onInventoryChanged = onInventoryChanged;
    this.onUseItemfinder = onUseItemfinder;
    this.createUI();
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    if (this.bagModal) {
      const dur = (0.18 / this.speedMultiplier).toFixed(2);
      this.bagModal.style.transition = `opacity ${dur}s ease`;
    }
  }

  public isOpen(): boolean {
    return this.bagModal?.style.display === 'flex';
  }

  private createUI(): void {
    const modal = document.createElement('div');
    modal.id = 'bag-modal';
    modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 580px;
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
      color: #f8fafc;
    `;

    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 12px;">
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <h2 id="bag-modal-title" style="font-size: 18px; font-weight: 800; color: #38bdf8; margin: 0;">🎒 POKéMON BAG</h2>
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
      <div id="bag-tabs-bar" style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="tab-items" style="
          flex: 1;
          padding: 9px 6px;
          border: none;
          border-radius: 6px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        ">🧪 ITEMS</button>
        <button id="tab-tms" style="
          flex: 1;
          padding: 9px 6px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        ">💿 INFINITE TMS</button>
        <button id="tab-balls" style="
          flex: 1;
          padding: 9px 6px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        ">🔴 MY BALLS</button>
        <button id="tab-mart" style="
          flex: 1;
          padding: 9px 6px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 12px;
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
      BattleAudio.playMenuSound('CANCEL');
      this.hide();
    });

    const tabItems = modal.querySelector('#tab-items') as HTMLButtonElement;
    const tabTms = modal.querySelector('#tab-tms') as HTMLButtonElement;
    const tabBalls = modal.querySelector('#tab-balls') as HTMLButtonElement;
    const tabMart = modal.querySelector('#tab-mart') as HTMLButtonElement;

    tabItems.addEventListener('click', () => {
      BattleAudio.playMenuSound('CURSOR');
      this.switchTab('ITEMS');
    });
    tabTms.addEventListener('click', () => {
      BattleAudio.playMenuSound('CURSOR');
      this.switchTab('TMS');
    });
    tabBalls.addEventListener('click', () => {
      BattleAudio.playMenuSound('CURSOR');
      this.switchTab('BALLS');
    });
    tabMart.addEventListener('click', () => {
      BattleAudio.playMenuSound('CURSOR');
      this.switchTab('MART');
    });
  }

  private switchTab(tab: BagTabId): void {
    const tabItems = this.bagModal.querySelector('#tab-items') as HTMLButtonElement;
    const tabTms = this.bagModal.querySelector('#tab-tms') as HTMLButtonElement;
    const tabBalls = this.bagModal.querySelector('#tab-balls') as HTMLButtonElement;
    const tabMart = this.bagModal.querySelector('#tab-mart') as HTMLButtonElement;

    const setActive = (btn: HTMLButtonElement, active: boolean) => {
      btn.style.background = active ? '#2563eb' : '#334155';
      btn.style.color = active ? '#ffffff' : '#94a3b8';
    };

    setActive(tabItems, tab === 'ITEMS');
    setActive(tabTms, tab === 'TMS');
    setActive(tabBalls, tab === 'BALLS');
    setActive(tabMart, tab === 'MART');

    this.updateHeaderDisplay();
    if (tab === 'ITEMS') this.renderItemsTab();
    else if (tab === 'TMS') this.renderTMsTab();
    else if (tab === 'BALLS') this.renderBallsTab();
    else this.renderMartTab();
  }

  public open(initialTab: BagTabId = 'ITEMS'): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.bagModal.style.display = 'flex';
    this.feedbackBanner.style.display = 'none';

    const titleEl = this.bagModal.querySelector('#bag-modal-title') as HTMLElement;
    if (titleEl) titleEl.innerText = '🎒 POKéMON BAG';

    const tabsBar = this.bagModal.querySelector('#bag-tabs-bar') as HTMLElement;
    if (tabsBar) tabsBar.style.display = 'flex';

    const tabMart = this.bagModal.querySelector('#tab-mart') as HTMLElement;
    if (tabMart) tabMart.style.display = 'none';

    const safeTab = initialTab === 'MART' ? 'ITEMS' : initialTab;
    if (this.selectedPartyIndex >= this.party.length) {
      this.selectedPartyIndex = 0;
    }
    this.switchTab(safeTab);
  }

  public openMart(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.bagModal.style.display = 'flex';
    this.feedbackBanner.style.display = 'none';

    const titleEl = this.bagModal.querySelector('#bag-modal-title') as HTMLElement;
    if (titleEl) titleEl.innerText = '🏪 POKé MART';

    const tabsBar = this.bagModal.querySelector('#bag-tabs-bar') as HTMLElement;
    if (tabsBar) tabsBar.style.display = 'none';

    this.updateHeaderDisplay();
    this.renderMartTab();
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

  /**
   * Renders an inline Party Target Selector so the player can pick which party member receives a Usable Item or TM
   */
  private renderPartyTargetSelector(container: HTMLElement, onSelect: () => void): void {
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.28);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;';
    title.innerText = 'Target Party Member (Click to Select):';
    bar.appendChild(title);

    const pillsRow = document.createElement('div');
    pillsRow.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap;';

    this.party.forEach((pkmn, idx) => {
      const isSelected = idx === this.selectedPartyIndex;
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';

      const pill = document.createElement('button');
      pill.style.cssText = `
        background: ${isSelected ? '#1e3a8a' : '#0f172a'};
        border: 1.5px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.14)'};
        border-radius: 6px;
        padding: 6px 10px;
        color: #f8fafc;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 120px;
        text-align: left;
      `;

      const statusBadge =
        pkmn.status !== 'NONE'
          ? `<span style="background: #eab308; color: #0f172a; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px;">${pkmn.status}</span>`
          : '';

      pill.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;">
          <span>${pkmn.nickname}</span>
          ${statusBadge}
          <span style="font-size: 10px; color: #facc15;">Lv.${pkmn.level}</span>
        </div>
        <div style="width: 100%; height: 4px; background: #334155; border-radius: 2px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: ${hpColor};"></div>
        </div>
        <div style="font-size: 10px; color: #cbd5e1;">HP ${pkmn.currentHp}/${pkmn.stats.hp}</div>
      `;

      pill.addEventListener('click', () => {
        BattleAudio.playMenuSound('CURSOR');
        this.selectedPartyIndex = idx;
        onSelect();
      });

      pillsRow.appendChild(pill);
    });

    bar.appendChild(pillsRow);
    container.appendChild(bar);
  }

  private renderItemsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    this.renderPartyTargetSelector(container, () => this.renderItemsTab());

    if (!this.inventory.items) {
      this.inventory.items = {};
    }

    const ownedItems = MART_MEDICINE_CATALOG.filter((m) => (this.inventory.items?.[m.id] ?? 0) > 0);
    const hasBerries = Object.values(this.inventory.berries || {}).some((c) => (c ?? 0) > 0);
    if (ownedItems.length === 0 && !this.onUseItemfinder && !hasBerries) {
      container.innerHTML += `<div style="text-align: center; color: #94a3b8; padding: 20px;">No medicine items in bag. Visit a Poké Mart to stock up!</div>`;
      return;
    }

    const targetPkmn = this.party[this.selectedPartyIndex] || this.party[0];

    for (const med of ownedItems) {
      const count = this.inventory.items[med.id] ?? 0;

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #ffffff;">${med.icon} ${med.name}</span>
            <span style="font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${med.badgeLabel}</span>
            <span style="font-size: 12px; font-weight: 800; color: #38bdf8;">x${count}</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${med.desc}</div>
        </div>
        <button class="use-med-btn" style="
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        ">USE ON ${targetPkmn ? targetPkmn.nickname.toUpperCase() : 'PARTY'}</button>
      `;

      const useBtn = card.querySelector('.use-med-btn') as HTMLButtonElement;
      useBtn.addEventListener('click', () => {
        this.useMedicineOnTarget(med, targetPkmn);
      });

      container.appendChild(card);
    }

    if (this.onUseItemfinder) {
      const finderCard = document.createElement('div');
      finderCard.style.cssText = CARD_STYLE;
      finderCard.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #38bdf8;">📡 ITEMFINDER</span>
            <span style="font-size: 10px; background: #0284c7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">KEY ITEM</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">A high-tech dowsing machine that detects hidden items within 8 paces and casts a live directional radar beam toward their location.</div>
        </div>
        <button class="use-itemfinder-btn" style="
          background: #0284c7;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        ">SCAN NEARBY</button>
      `;
      const scanBtn = finderCard.querySelector('.use-itemfinder-btn') as HTMLButtonElement;
      scanBtn.addEventListener('click', () => {
        this.hide();
        this.onUseItemfinder?.();
      });
      container.appendChild(finderCard);
    }

    const berryEntries = Object.entries(this.inventory.berries || {}).filter(([, c]) => (c ?? 0) > 0);
    for (const [berryId, count] of berryEntries) {
      const berryCard = document.createElement('div');
      berryCard.style.cssText = CARD_STYLE;
      const formattedName = berryId.replace(/[_-]+/g, ' ').toUpperCase();
      berryCard.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #f43f5e;">🍒 ${formattedName}</span>
            <span style="font-size: 10px; background: #be123c; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">BERRY / APRICORN</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">Picked fresh from a fruit-bearing tree in Johto or Kanto.</div>
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #fb7185;">x${count}</div>
      `;
      container.appendChild(berryCard);
    }
  }

  public useMedicineOnTarget(med: MedicineItemDef, target: PokemonInstance | undefined): boolean {
    if (!target || !this.inventory.items) return false;
    const currentCount = this.inventory.items[med.id] ?? 0;
    if (currentCount <= 0) return false;

    if (med.id === 'potion' || med.id === 'super-potion') {
      if (target.currentHp <= 0) {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`${target.nickname} has fainted! Use a Revive first.`, true);
        return false;
      }
      if (target.currentHp >= target.stats.hp) {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`It won't have any effect! (${target.nickname} is already at full HP)`, true);
        return false;
      }
      const healAmount = med.id === 'potion' ? 20 : 50;
      const before = target.currentHp;
      target.currentHp = Math.min(target.stats.hp, target.currentHp + healAmount);
      const recovered = target.currentHp - before;
      this.inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`💖 ${target.nickname}'s HP was restored by ${recovered} point(s)!`);
    } else if (med.id === 'antidote') {
      if (target.status !== 'PSN' && target.status !== 'TOX') {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      this.inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`✨ ${target.nickname} was cured of its poisoning!`);
    } else if (med.id === 'parlyz-heal') {
      if (target.status !== 'PAR') {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      this.inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`✨ ${target.nickname} was cured of paralysis!`);
    } else if (med.id === 'awakening') {
      if (target.status !== 'SLP') {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`It won't have any effect on ${target.nickname}!`, true);
        return false;
      }
      target.status = 'NONE';
      target.sleepTurns = 0;
      this.inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`✨ ${target.nickname} woke up!`);
    } else if (med.id === 'revive') {
      if (target.currentHp > 0) {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`${target.nickname} hasn't fainted!`, true);
        return false;
      }
      target.currentHp = Math.max(1, Math.floor(target.stats.hp / 2));
      target.status = 'NONE';
      this.inventory.items[med.id] = currentCount - 1;
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`💎 ${target.nickname} recovered from fainting!`);
    }

    this.renderItemsTab();
    if (this.onInventoryChanged) this.onInventoryChanged();
    return true;
  }

  private renderTMsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    this.renderPartyTargetSelector(container, () => this.renderTMsTab());

    const targetPkmn = this.party[this.selectedPartyIndex] || this.party[0];
    if (targetPkmn) {
      const movesSummary = targetPkmn.moves.map((m) => PokemonFactory.getMoveData(m.moveId).name).join(' • ');
      const partyInfo = document.createElement('div');
      partyInfo.style.cssText = `
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px;
        color: #cbd5e1;
      `;
      partyInfo.innerHTML = `<strong>Selected Pokémon:</strong> ${targetPkmn.nickname} (Lv. ${targetPkmn.level}) — <span style="color: #38bdf8;">${movesSummary}</span>`;
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

      const alreadyKnows = targetPkmn?.moves.some((m) => m.moveId === tm.moveId) ?? false;

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

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
          this.teachTM(tm, targetPkmn);
        });
      }

      container.appendChild(card);
    }
  }

  private renderBallsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const ballEntries = Object.entries(this.inventory.balls).filter(([, count]) => (count ?? 0) > 0) as Array<
      [PokeballId, number]
    >;
    if (ballEntries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No Pokéballs in bag. Visit a Poké Mart to stock up!</div>`;
      return;
    }

    for (const [ballId, count] of ballEntries) {
      const catalogInfo = MART_POKEBALL_CATALOG.find((b) => b.id === ballId);
      const formattedName = catalogInfo?.name || ballId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const desc = catalogInfo?.desc || 'Guaranteed capture device.';
      const mult = catalogInfo?.multiplierLabel || '255x Guaranteed';

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

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

    // Badge Progression Control Bar
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
        BattleAudio.playMenuSound('CONFIRM');
        this.inventory.badges = Array.from({ length: tier }, (_, i) => `Badge_${i + 1}`);
        this.updateHeaderDisplay();
        this.renderMartTab();
        if (this.onInventoryChanged) this.onInventoryChanged();
      });
      tierContainer.appendChild(btn);
    }

    // Medicine Section Header
    const medHeader = document.createElement('div');
    medHeader.style.cssText = 'font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 4px; letter-spacing: 0.5px;';
    medHeader.innerText = '🧪 MEDICINE & STATUS HEALERS';
    container.appendChild(medHeader);

    if (!this.inventory.items) {
      this.inventory.items = {};
    }

    for (const med of MART_MEDICINE_CATALOG) {
      const ownedCount = this.inventory.items[med.id] ?? 0;
      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #ffffff;">${med.icon} ${med.name}</span>
            <span style="font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${med.badgeLabel}</span>
            <span style="font-size: 11px; color: #94a3b8;">Owned: x${ownedCount}</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 3px;">${med.desc}</div>
        </div>
        <button class="buy-med-btn" style="
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        ">BUY $${med.price}</button>
      `;

      const buyMedBtn = card.querySelector('.buy-med-btn') as HTMLButtonElement;
      buyMedBtn.addEventListener('click', () => {
        if (this.inventory.money < med.price) {
          BattleAudio.playMenuSound('CANCEL');
          this.showFeedback(`Not enough money to buy ${med.name}! ($${med.price} required)`, true);
          return;
        }
        BattleAudio.playMenuSound('CONFIRM');
        this.inventory.money -= med.price;
        this.inventory.items![med.id] = (this.inventory.items![med.id] ?? 0) + 1;
        this.updateHeaderDisplay();
        this.showFeedback(`Purchased 1x ${med.name}! (Now holding x${this.inventory.items![med.id]})`);
        this.renderMartTab();
        if (this.onInventoryChanged) this.onInventoryChanged();
      });

      container.appendChild(card);
    }

    // Pokéball Section Header
    const ballHeader = document.createElement('div');
    ballHeader.style.cssText = 'font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 8px; letter-spacing: 0.5px;';
    ballHeader.innerText = '🔴 SPECIALTY & STANDARD POKÉ BALLS';
    container.appendChild(ballHeader);

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
            BattleAudio.playMenuSound('CANCEL');
            this.showFeedback(`Not enough money to buy ${item.name}! ($${item.price} required)`, true);
            return;
          }
          BattleAudio.playMenuSound('CONFIRM');
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
   * Teaches an Infinite TM to the selected party Pokémon
   */
  private teachTM(tm: TMDefinition, target: PokemonInstance | undefined = this.party[0]): void {
    if (!target) return;

    const alreadyKnows = target.moves.some((m) => m.moveId === tm.moveId);
    if (alreadyKnows) {
      BattleAudio.playMenuSound('CANCEL');
      this.showFeedback(`${target.nickname} already knows ${tm.name}!`, true);
      return;
    }

    const moveData = PokemonFactory.getMoveData(tm.moveId);
    BattleAudio.playMenuSound('HEAL');

    if (target.moves.length < 4) {
      target.moves.push({
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      });
      this.showFeedback(`✨ ${target.nickname} learned ${tm.name}! (TM ${tm.id} remains intact)`);
    } else {
      const replacedMove = target.moves[3];
      target.moves[3] = {
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      };
      this.showFeedback(
        `✨ 1, 2, and... Poof! ${target.nickname} replaced ${replacedMove.moveId.toUpperCase()} with ${tm.name}!`
      );
    }

    this.renderTMsTab();
    if (this.onInventoryChanged) {
      this.onInventoryChanged();
    }
  }
}
