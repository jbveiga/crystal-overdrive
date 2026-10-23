import type { PokemonInstance, PokeballId, MedicineId, RepelId, SpeedMultiplier, MoveData } from '../types/game';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';
import { OverworldItemManager } from '../world/OverworldItemManager';
import { MoveReplacementModalUI } from './MoveReplacementModalUI';

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

export interface RepelItemDef {
  id: RepelId;
  name: string;
  price: number;
  steps: number;
  badgeLabel: string;
  desc: string;
  icon: string;
}

export const MART_REPEL_CATALOG: RepelItemDef[] = [
  {
    id: 'repel',
    name: 'Repel',
    price: 350,
    steps: 100,
    badgeLabel: '100 STEPS',
    desc: 'An aerosol spray that keeps wild Pokémon away for 100 steps.',
    icon: '🛡️',
  },
  {
    id: 'super-repel',
    name: 'Super Repel',
    price: 500,
    steps: 200,
    badgeLabel: '200 STEPS',
    desc: 'Keeps wild Pokémon away for 200 steps. Lasts twice as long as standard Repel.',
    icon: '🛡️',
  },
  {
    id: 'max-repel',
    name: 'Max Repel',
    price: 700,
    steps: 250,
    badgeLabel: '250 STEPS',
    desc: 'Maximum-strength spray that keeps wild Pokémon away for 250 steps.',
    icon: '🛡️',
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
  HM05: {
    id: 'HM05',
    moveId: 'flash',
    name: 'Flash',
    type: 'Normal',
    desc: "Illuminates dark caves and reduces the target's accuracy in battle.",
  },
  TM31: {
    id: 'TM31',
    moveId: 'mudslap',
    name: 'Mud-Slap',
    type: 'Ground',
    desc: '20 Power Ground attack that inflicts damage and lowers target accuracy.',
  },
  TM49: {
    id: 'TM49',
    moveId: 'furycutter',
    name: 'Fury Cutter',
    type: 'Bug',
    desc: '40 Power Bug attack that doubles in power with consecutive hits.',
  },
  HM01: {
    id: 'HM01',
    moveId: 'cut',
    name: 'Cut',
    type: 'Normal',
    desc: '50 Power Normal attack that cuts down small trees on the overworld.',
  },
};

export type BagTabId = 'ITEMS' | 'TMS' | 'BALLS' | 'MART';

const CARD_STYLE =
  'background:#141E33;border:1.5px solid #22324F;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 3px 0 0 #070B14;';

export class BagAndMartUI {
  private container: HTMLElement;
  private bagModal!: HTMLDivElement;
  private feedbackBanner!: HTMLDivElement;
  private inventory: BagInventory;
  private party: PokemonInstance[];
  private selectedPartyIndex: number = 0;
  private activeTeachingTM: TMDefinition | null = null;
  private speedMultiplier: SpeedMultiplier = 1;
  private onInventoryChanged?: () => void;
  private onUseItemfinder?: () => void;
  private onUseRepel?: (steps: number, itemName: string) => void;

  constructor(
    containerId: string = 'modal-container',
    inventory: BagInventory,
    party: PokemonInstance[],
    onInventoryChanged?: () => void,
    onUseItemfinder?: () => void,
    onUseRepel?: (steps: number, itemName: string) => void
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
    this.onUseRepel = onUseRepel;
    this.createUI();
  }

  public setOnUseRepel(handler: (steps: number, itemName: string) => void): void {
    this.onUseRepel = handler;
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
      width: 620px;
      max-width: 94vw;
      max-height: 88vh;
      background: #0D1322;
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      gap: 12px;
      z-index: 50;
      pointer-events: auto;
      color: #dde2f7;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      box-sizing: border-box;
    `;

    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FFD028; box-shadow: 0 0 8px #FFD028;"></span>
          <div>
            <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #FFD028; letter-spacing: 1px;">TACTICAL INVENTORY // STASH</div>
            <h2 id="bag-modal-title" style="font-family: 'Space Mono', monospace; margin: 2px 0 0 0; font-size: 19px; font-weight: 900; color: #F6F8F3; letter-spacing: -0.5px;">🎒 POKéMON BAG</h2>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span id="bag-money" style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; background: #141E33; color: #FFD028; padding: 5px 10px; border-radius: 6px; border: 1.5px solid #FFD028; box-shadow: 0 2px 0 0 #070B14;">$3,000</span>
          <span id="bag-badges" style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; background: #141E33; color: #38BDF8; padding: 5px 10px; border-radius: 6px; border: 1.5px solid #22324F; box-shadow: 0 2px 0 0 #070B14;">🏅 0 Badges</span>
          <button id="close-bag-modal-btn" style="background: #1E293B; color: #F6F8F3; border: 1.5px solid #475569; border-radius: 6px; padding: 5px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;">✕ CLOSE</button>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div id="bag-feedback-banner" style="
        display: none;
        background: #141E33;
        border: 1.5px solid #10b981;
        color: #a7f3d0;
        padding: 9px 14px;
        border-radius: 8px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 2px 0 0 #070B14;
      "></div>

      <!-- Tab Buttons -->
      <div id="bag-tabs-bar" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="tab-items" style="
          flex: 1;
          padding: 8px 10px;
          border: 1.5px solid #FFD028;
          border-radius: 6px;
          background: #FFD028;
          color: #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 3px 0 0 #070B14;
        ">🧪 ITEMS</button>
        <button id="tab-tms" style="
          flex: 1;
          padding: 8px 10px;
          border: 1.5px solid #22324F;
          border-radius: 6px;
          background: #141E33;
          color: #94a3b8;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
        ">💿 TMS & HMS</button>
        <button id="tab-balls" style="
          flex: 1;
          padding: 8px 10px;
          border: 1.5px solid #22324F;
          border-radius: 6px;
          background: #141E33;
          color: #94a3b8;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
        ">🔴 MY BALLS</button>
        <button id="tab-mart" style="
          flex: 1;
          padding: 8px 10px;
          border: 1.5px solid #22324F;
          border-radius: 6px;
          background: #141E33;
          color: #94a3b8;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
        ">🏪 POKÉ MART</button>
      </div>

      <!-- Content Container -->
      <div id="bag-content" style="
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 56vh;
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
      if (active) {
        btn.style.background = '#FFD028';
        btn.style.color = '#070B14';
        btn.style.borderColor = '#FFD028';
        btn.style.boxShadow = '0 3px 0 0 #070B14';
      } else {
        btn.style.background = '#141E33';
        btn.style.color = '#94a3b8';
        btn.style.borderColor = '#22324F';
        btn.style.boxShadow = '0 2px 0 0 #070B14';
      }
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
    this.feedbackBanner.style.background = isError ? '#1F131D' : '#0B1F1C';
    this.feedbackBanner.style.borderColor = isError ? '#EE4238' : '#10B981';
    this.feedbackBanner.style.color = isError ? '#FCA5A5' : '#A7F3D0';
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
      background: #080E1D;
      border: 1.5px solid #22324F;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 3px 0 0 #070B14;
    `;

    const title = document.createElement('div');
    title.style.cssText =
      "font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;";
    title.innerText = 'Target Party Member (Click to Select):';
    bar.appendChild(title);

    const pillsRow = document.createElement('div');
    pillsRow.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

    this.party.forEach((pkmn, idx) => {
      const isSelected = idx === this.selectedPartyIndex;
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#48C774' : pct > 20 ? '#FFD028' : '#EE4238';

      const pill = document.createElement('button');
      pill.style.cssText = `
        background: ${isSelected ? '#141E33' : '#0D1322'};
        border: 2px solid ${isSelected ? '#38BDF8' : '#22324F'};
        box-shadow: ${isSelected ? '0 0 10px rgba(56, 189, 248, 0.3), 0 3px 0 0 #070B14' : '0 2px 0 0 #070B14'};
        border-radius: 8px;
        padding: 6px 10px;
        color: #F6F8F3;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 124px;
        text-align: left;
        transition: all 0.1s ease;
      `;

      const statusBadge =
        pkmn.status !== 'NONE'
          ? `<span style="background: #EE4238; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; font-family: 'Space Mono', monospace;">${pkmn.status}</span>`
          : '';

      pill.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 12px; font-weight: 800;">
          <span>${pkmn.nickname}</span>
          ${statusBadge}
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #FFD028;">Lv.${pkmn.level}</span>
        </div>
        <div style="width: 100%; height: 5px; background: #080E1D; border-radius: 3px; overflow: hidden; border: 1px solid #22324F;">
          <div style="width: ${pct}%; height: 100%; background: ${hpColor};"></div>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">HP ${pkmn.currentHp}/${pkmn.stats.hp}</div>
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
    const ownedRepels = MART_REPEL_CATALOG.filter((r) => (this.inventory.items?.[r.id] ?? 0) > 0);
    const hasBerries = Object.values(this.inventory.berries || {}).some((c) => (c ?? 0) > 0);
    if (ownedItems.length === 0 && ownedRepels.length === 0 && !this.onUseItemfinder && !hasBerries) {
      container.innerHTML += `<div style="text-align: center; color: #94a3b8; padding: 24px; font-family: 'Space Mono', monospace; font-size: 12px; background: #141E33; border: 1px dashed #22324F; border-radius: 10px; box-shadow: 0 3px 0 0 #070B14;">No medicine items in bag. Visit a Poké Mart to stock up!</div>`;
      return;
    }

    const targetPkmn = this.party[this.selectedPartyIndex] || this.party[0];

    for (const repel of ownedRepels) {
      const count = this.inventory.items[repel.id] ?? 0;
      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;
      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${repel.icon} ${repel.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #0284C7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${repel.badgeLabel}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #FFD028;">x${count}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${repel.desc}</div>
        </div>
        <button class="use-repel-btn" style="
          background: #0284C7;
          color: white;
          border: 1.5px solid #38BDF8;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
        ">SPRAY (${repel.steps} STEPS)</button>
      `;
      const useRepelBtn = card.querySelector('.use-repel-btn') as HTMLButtonElement;
      useRepelBtn.addEventListener('click', () => {
        this.useRepelItem(repel);
      });
      container.appendChild(card);
    }

    for (const med of ownedItems) {
      const count = this.inventory.items[med.id] ?? 0;

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${med.icon} ${med.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${med.badgeLabel}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #FFD028;">x${count}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${med.desc}</div>
        </div>
        <button class="use-med-btn" style="
          background: #16A34A;
          color: white;
          border: 1.5px solid #22C55E;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
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
            <span style="font-weight: 800; color: #38BDF8; font-size: 14px;">📡 ITEMFINDER</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #0284C7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">KEY ITEM</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">A high-tech dowsing machine that detects hidden items within 8 paces and casts a live directional radar beam toward their location.</div>
        </div>
        <button class="use-itemfinder-btn" style="
          background: #0284C7;
          color: white;
          border: 1.5px solid #38BDF8;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
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
            <span style="font-weight: 800; color: #F43F5E; font-size: 14px;">🍒 ${formattedName}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #BE123C; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">BERRY / APRICORN</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Picked fresh from a fruit-bearing tree in Johto or Kanto.</div>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 800; color: #FB7185;">x${count}</div>
      `;
      container.appendChild(berryCard);
    }
  }

  public useRepelItem(repel: RepelItemDef): boolean {
    if (!this.inventory.items) return false;
    const currentCount = this.inventory.items[repel.id] ?? 0;
    if (currentCount <= 0) return false;

    this.inventory.items[repel.id] = currentCount - 1;
    BattleAudio.playMenuSound('CONFIRM');
    this.showFeedback(`🛡️ Sprayed ${repel.name}! Wild Pokémon warded off for ${repel.steps} steps.`);
    if (this.onUseRepel) {
      this.onUseRepel(repel.steps, repel.name);
    }
    this.renderItemsTab();
    if (this.onInventoryChanged) this.onInventoryChanged();
    return true;
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

  public setActiveTeachingTM(tm: TMDefinition | null): void {
    this.activeTeachingTM = tm;
    this.renderTMsTab();
  }

  private async renderTMsTab(): Promise<void> {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    if (this.activeTeachingTM) {
      const tm = this.activeTeachingTM;
      // Party Compatibility View
      const headerBox = document.createElement('div');
      headerBox.style.cssText = `
        background: #080E1D;
        border: 2px solid #38BDF8;
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        box-shadow: 0 4px 0 0 #070B14;
      `;
      headerBox.innerHTML = `
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #38BDF8; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;">
            PARTY COMPATIBILITY // SELECT POKÉMON TO TEACH:
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 8px; margin-top: 2px; font-family: 'Space Mono', monospace;">
            <span>${tm.id}: ${tm.name}</span>
            <span style="font-size: 10px; background: #22324F; padding: 2px 6px; border-radius: 4px; color: #CBD5E1;">${tm.type.toUpperCase()}</span>
            <span style="font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">INFINITE USE</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">${tm.desc}</div>
        </div>
        <button id="btn-back-to-tms" style="
          background: #1E293B;
          color: #F8FAFC;
          border: 1.5px solid #475569;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
        ">← BACK TO TM LIST</button>
      `;

      headerBox.querySelector('#btn-back-to-tms')?.addEventListener('click', () => {
        BattleAudio.playMenuSound('CANCEL');
        this.activeTeachingTM = null;
        this.renderTMsTab();
      });

      container.appendChild(headerBox);

      const partyListContainer = document.createElement('div');
      partyListContainer.id = 'party-compatibility-list';
      partyListContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 4px;';
      container.appendChild(partyListContainer);

      for (let i = 0; i < this.party.length; i++) {
        const pkmn = this.party[i];
        const alreadyKnows = pkmn.moves.some((m) => m.moveId === tm.moveId);
        const canLearn = await PokemonFactory.canLearnMove(pkmn.speciesId, tm.moveId);
        const movesSummary = pkmn.moves
          .map((m) => {
            try {
              return PokemonFactory.getMoveData(m.moveId).name;
            } catch {
              return m.moveId.toUpperCase();
            }
          })
          .join(' • ');

        const card = document.createElement('div');
        card.className = 'party-compat-card';
        card.style.cssText = `
          background: #141E33;
          border: 1.5px solid ${alreadyKnows ? '#38BDF8' : canLearn ? '#22C55E' : '#22324F'};
          box-shadow: 0 3px 0 0 #070B14;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          opacity: ${canLearn || alreadyKnows ? '1' : '0.65'};
        `;

        const badgeHtml = alreadyKnows
          ? `<span class="compat-badge-learned" style="
              background: #0284C7;
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-family: 'Space Mono', monospace;
              font-weight: 800;
              font-size: 11px;
              white-space: nowrap;
              box-shadow: 0 2px 0 0 #070B14;
            ">LEARNED ✓</span>`
          : canLearn
            ? `<button class="teach-pokemon-btn" data-index="${i}" style="
                background: #16A34A;
                color: white;
                border: 1.5px solid #22C55E;
                border-radius: 6px;
                padding: 8px 14px;
                font-family: 'Space Mono', monospace;
                font-weight: 800;
                font-size: 11px;
                cursor: pointer;
                white-space: nowrap;
                box-shadow: 0 3px 0 0 #070B14;
              ">ABLE — TEACH</button>`
            : `<span class="compat-badge-not-able" style="
                background: #1E293B;
                color: #94A3B8;
                border: 1px solid #334155;
                padding: 6px 12px;
                border-radius: 6px;
                font-family: 'Space Mono', monospace;
                font-weight: 700;
                font-size: 11px;
                white-space: nowrap;
              ">NOT ABLE</span>`;

        card.innerHTML = `
          <div style="flex: 1;">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 14px; color: #FFFFFF;">${pkmn.nickname}</span>
              <span style="font-family: 'Space Mono', monospace; font-size: 11px; color: #38BDF8; font-weight: 700;">Lv. ${pkmn.level}</span>
              <span style="font-family: 'Space Mono', monospace; font-size: 11px; color: #CBD5E1;">HP: ${pkmn.currentHp}/${pkmn.stats.hp}</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">
              Moves: <span style="color: #E2E8F0;">${movesSummary}</span>
            </div>
          </div>
          <div>${badgeHtml}</div>
        `;

        if (canLearn && !alreadyKnows) {
          const btn = card.querySelector('.teach-pokemon-btn') as HTMLButtonElement;
          btn?.addEventListener('click', async () => {
            await this.teachTM(tm, pkmn);
          });
        }

        partyListContainer.appendChild(card);
      }
      return;
    }

    this.renderPartyTargetSelector(container, () => this.renderTMsTab());

    const targetPkmn = this.party[this.selectedPartyIndex] || this.party[0];
    if (targetPkmn) {
      const movesSummary = targetPkmn.moves
        .map((m) => {
          try {
            return PokemonFactory.getMoveData(m.moveId).name;
          } catch {
            return m.moveId.toUpperCase();
          }
        })
        .join(' • ');
      const partyInfo = document.createElement('div');
      partyInfo.style.cssText = `
        background: #080E1D;
        border: 1.5px solid #22324F;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12px;
        color: #CBD5E1;
        box-shadow: 0 3px 0 0 #070B14;
      `;
      partyInfo.innerHTML = `<strong>Selected Pokémon:</strong> ${targetPkmn.nickname} (Lv. ${targetPkmn.level}) — <span style="color: #38BDF8; font-family: 'Space Mono', monospace;">${movesSummary}</span>`;
      container.appendChild(partyInfo);
    }

    const tms = this.inventory.tms;
    if (tms.length === 0) {
      container.innerHTML += `<div style="text-align: center; color: #94a3b8; padding: 24px; font-family: 'Space Mono', monospace; font-size: 12px; background: #141E33; border: 1px dashed #22324F; border-radius: 10px; box-shadow: 0 3px 0 0 #070B14;">No TMs acquired yet.</div>`;
      return;
    }

    for (const tmId of tms) {
      const tm: TMDefinition = INFINITE_TMS[tmId] || {
        id: tmId,
        moveId: tmId.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: OverworldItemManager.formatItemName(tmId),
        type: 'Normal',
        desc: `Teaches ${OverworldItemManager.formatItemName(tmId)} to a compatible Pokémon.`,
      };

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-family: 'Space Mono', monospace; font-weight: 800; color: #38BDF8; font-size: 13px;">${tm.id}</span>
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${tm.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #22324F; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #CBD5E1;">${tm.type.toUpperCase()}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">INFINITE USE</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${tm.desc}</div>
        </div>
        <button class="teach-tm-btn" style="
          background: #2563EB;
          color: white;
          border: 1.5px solid #38BDF8;
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
        ">TEACH</button>
      `;

      const teachBtn = card.querySelector('.teach-tm-btn') as HTMLButtonElement;
      teachBtn.addEventListener('click', () => {
        BattleAudio.playMenuSound('CURSOR');
        this.activeTeachingTM = tm;
        this.renderTMsTab();
      });

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
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px; font-family: 'Space Mono', monospace; font-size: 12px; background: #141E33; border: 1px dashed #22324F; border-radius: 10px; box-shadow: 0 3px 0 0 #070B14;">No Pokéballs in bag. Visit a Poké Mart to stock up!</div>`;
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
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">🔴 ${formattedName}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #0284C7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${mult}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${desc}</div>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 800; color: #38BDF8;">x${count}</div>
      `;

      container.appendChild(card);
    }
  }

  private renderMartTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const currentBadges = this.inventory.badges.length;

    // Badge Progression Display
    const badgeBar = document.createElement('div');
    badgeBar.style.cssText = `
      background: #080E1D;
      border: 1.5px solid #22324F;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      box-shadow: 0 3px 0 0 #070B14;
    `;

    badgeBar.innerHTML = `
      <div style="font-size: 12px; font-weight: 700; color: #CBD5E1;">
        🏅 Gym Badges Earned: <strong style="color: #38BDF8; font-family: 'Space Mono', monospace;">${currentBadges} / 8</strong>
      </div>
      <div style="font-size: 11px; color: #94A3B8; font-family: 'Space Mono', monospace;">
        New badges unlock specialty Pokéballs.
      </div>
    `;
    container.appendChild(badgeBar);

    // Medicine Section Header
    const medHeader = document.createElement('div');
    medHeader.style.cssText =
      "font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38BDF8; margin-top: 4px; letter-spacing: 0.5px;";
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
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${med.icon} ${med.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${med.badgeLabel}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 11px; color: #94A3B8;">Owned: x${ownedCount}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${med.desc}</div>
        </div>
        <button class="buy-med-btn" style="
          background: #16A34A;
          color: white;
          border: 1.5px solid #22C55E;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
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

    // Field Repels Section Header
    const repelHeader = document.createElement('div');
    repelHeader.style.cssText =
      "font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38BDF8; margin-top: 8px; letter-spacing: 0.5px;";
    repelHeader.innerText = '🛡️ FIELD REPELS (WARD OFF WILD POKÉMON)';
    container.appendChild(repelHeader);

    for (const repel of MART_REPEL_CATALOG) {
      const ownedCount = this.inventory.items[repel.id] ?? 0;
      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${repel.icon} ${repel.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #0284C7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${repel.badgeLabel}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 11px; color: #94A3B8;">Owned: x${ownedCount}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${repel.desc}</div>
        </div>
        <button class="buy-repel-btn" style="
          background: #16A34A;
          color: white;
          border: 1.5px solid #22C55E;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
        ">BUY $${repel.price}</button>
      `;

      const buyRepelBtn = card.querySelector('.buy-repel-btn') as HTMLButtonElement;
      buyRepelBtn.addEventListener('click', () => {
        if (this.inventory.money < repel.price) {
          BattleAudio.playMenuSound('CANCEL');
          this.showFeedback(`Not enough money to buy ${repel.name}! ($${repel.price} required)`, true);
          return;
        }
        BattleAudio.playMenuSound('CONFIRM');
        this.inventory.money -= repel.price;
        this.inventory.items![repel.id] = (this.inventory.items![repel.id] ?? 0) + 1;
        this.updateHeaderDisplay();
        this.showFeedback(`Purchased 1x ${repel.name}! (Now holding x${this.inventory.items![repel.id]})`);
        this.renderMartTab();
        if (this.onInventoryChanged) this.onInventoryChanged();
      });

      container.appendChild(card);
    }

    // Pokéball Section Header
    const ballHeader = document.createElement('div');
    ballHeader.style.cssText =
      "font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38BDF8; margin-top: 8px; letter-spacing: 0.5px;";
    ballHeader.innerText = '🔴 SPECIALTY & STANDARD POKÉ BALLS';
    container.appendChild(ballHeader);

    // Only render available balls unlocked by badge count (completely hide locked items)
    const availableBalls = MART_POKEBALL_CATALOG.filter((item) => currentBadges >= item.requiredBadges);

    for (const item of availableBalls) {
      const ownedCount = this.inventory.balls[item.id] ?? 0;

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">🔴 ${item.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #0284C7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${item.multiplierLabel}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 11px; color: #94A3B8;">Owned: x${ownedCount}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${item.desc}</div>
        </div>
        <button class="buy-ball-btn" style="
          background: #16A34A;
          color: white;
          border: 1.5px solid #22C55E;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'Space Mono', monospace;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 0 #070B14;
        ">BUY $${item.price}</button>
      `;

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

      container.appendChild(card);
    }
  }

  /**
   * Teaches an Infinite TM to the selected party Pokémon.
   * If the Pokémon has 4 moves, opens MoveReplacementModalUI to choose which move to forget.
   */
  public async teachTM(tm: TMDefinition, target: PokemonInstance | undefined = this.party[0]): Promise<void> {
    if (!target) return;

    const alreadyKnows = target.moves.some((m) => m.moveId === tm.moveId);
    if (alreadyKnows) {
      BattleAudio.playMenuSound('CANCEL');
      this.showFeedback(`${target.nickname} already knows ${tm.name}!`, true);
      return;
    }

    const canLearn = await PokemonFactory.canLearnMove(target.speciesId, tm.moveId);
    if (!canLearn) {
      BattleAudio.playMenuSound('CANCEL');
      this.showFeedback(`${target.nickname} cannot learn ${tm.name}!`, true);
      return;
    }

    let moveData: MoveData;
    try {
      moveData = PokemonFactory.getMoveData(tm.moveId);
    } catch {
      moveData = {
        id: tm.moveId,
        name: tm.name,
        type: tm.type as any,
        category: 'Physical',
        power: 50,
        accuracy: 100,
        pp: 20,
        priority: 0,
        leavesOneHp: false,
        trapsTarget: false,
      };
    }

    if (target.moves.length < 4) {
      target.moves.push({
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      });
      BattleAudio.playMenuSound('HEAL');
      this.showFeedback(`✨ ${target.nickname} learned ${tm.name}! (TM ${tm.id} remains intact)`);
      this.renderTMsTab();
      if (this.onInventoryChanged) {
        this.onInventoryChanged();
      }
    } else {
      const modal = new MoveReplacementModalUI(this.container);
      const chosenSlot = await modal.open(target, moveData);

      if (chosenSlot !== null && chosenSlot >= 0 && chosenSlot < 4) {
        const replacedMove = target.moves[chosenSlot];
        let replacedName = replacedMove.moveId.toUpperCase();
        try {
          replacedName = PokemonFactory.getMoveData(replacedMove.moveId).name.toUpperCase();
        } catch {}

        target.moves[chosenSlot] = {
          moveId: moveData.id,
          currentPp: moveData.pp,
          maxPp: moveData.pp,
        };
        BattleAudio.playMenuSound('HEAL');
        this.showFeedback(
          `✨ 1, 2, and... Poof! ${target.nickname} forgot ${replacedName} and learned ${tm.name}!`
        );
        this.renderTMsTab();
        if (this.onInventoryChanged) {
          this.onInventoryChanged();
        }
      } else {
        BattleAudio.playMenuSound('CANCEL');
        this.showFeedback(`${target.nickname} did not learn ${tm.name}.`);
      }
    }
  }
}
