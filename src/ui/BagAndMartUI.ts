/**
 * @fileoverview BagAndMartUI domain module implementation.
 * @module ui/BagAndMartUI
 * @role BagAndMartUI Component
 * @exports BagAndMartUI
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-325: Implementation | L326-651: Handlers & Exports
 */

import type { PokemonInstance, SpeedMultiplier } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { EvolutionManager } from '../world/EvolutionManager';
import {
  CARD_STYLE,
  MART_MEDICINE_CATALOG,
  MART_REPEL_CATALOG,
  MART_POKEBALL_CATALOG,
  INFINITE_TMS,
  EVOLUTION_STONE_CATALOG,
  type BagInventory,
  type TMDefinition,
  type MartBallItem,
  type MedicineItemDef,
  type RepelItemDef,
  type EvolutionStoneItemDef,
  type BagTabId,
} from './bag/BagItemCatalogs';
import { BagPartyTargetRenderer } from './bag/BagPartyTargetRenderer';
import { PokeMartRenderer } from './bag/PokeMartRenderer';
import { BagTMTabRenderer } from './bag/BagTMTabRenderer';

// Re-export catalogs and types for 100% backward compatibility
export type {
  BagInventory,
  TMDefinition,
  MartBallItem,
  MedicineItemDef,
  RepelItemDef,
  EvolutionStoneItemDef,
  BagTabId,
};
export {
  MART_MEDICINE_CATALOG,
  MART_REPEL_CATALOG,
  MART_POKEBALL_CATALOG,
  INFINITE_TMS,
  EVOLUTION_STONE_CATALOG,
};

export class BagAndMartUI {
  private container: HTMLElement;
  private bagModal!: HTMLDivElement;
  private feedbackBanner!: HTMLDivElement;
  private inventory: BagInventory;
  private party: PokemonInstance[];
  private selectedPartyIndex: number = 0;
  private activeTeachingTM: TMDefinition | null = null;
  private speedMultiplier: SpeedMultiplier = 1;
  private activeMartId?: string;
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
      this.inventory.items = {};
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

  public openMart(martId?: string): void {
    this.activeMartId = martId;
    BattleAudio.playMenuSound('CONFIRM');
    this.bagModal.style.display = 'flex';
    this.feedbackBanner.style.display = 'none';

    const titleEl = this.bagModal.querySelector('#bag-modal-title') as HTMLElement;
    if (titleEl) {
      if (martId === 'goldenrod_dept_store_3f' || martId === 'celadon_dept_store_3f') titleEl.innerText = '🏪 DEPT. STORE 3F (TMS)';
      else if (martId === 'goldenrod_dept_store_4f' || martId === 'celadon_dept_store_4f') titleEl.innerText = '🏪 DEPT. STORE 4F (GIFTS)';
      else if (martId === 'goldenrod_dept_store_5f' || martId === 'celadon_dept_store_5f') titleEl.innerText = '🏪 DEPT. STORE 5F (STONES & VITAMINS)';
      else if (martId === 'goldenrod_dept_store_6f' || martId === 'goldenrod_dept_store_roof' || martId === 'celadon_dept_store_6f') titleEl.innerText = '🥤 VENDING MACHINE';
      else titleEl.innerText = '🏪 POKé MART';
    }

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

  private renderPartyTargetSelector(container: HTMLElement, onSelect: () => void): void {
    BagPartyTargetRenderer.renderPartyTargetSelector({
      container,
      party: this.party,
      selectedPartyIndex: this.selectedPartyIndex,
      inventory: this.inventory,
      onSelect: (idx) => {
        this.selectedPartyIndex = idx;
        onSelect();
      },
    });
  }

  public getOwnedStoneCount(stone: EvolutionStoneItemDef): number {
    return BagPartyTargetRenderer.getOwnedStoneCount(this.inventory, stone);
  }

  public async useEvolutionStoneOnTarget(
    stone: EvolutionStoneItemDef,
    target: PokemonInstance | undefined
  ): Promise<boolean> {
    return BagPartyTargetRenderer.useEvolutionStoneOnTarget({
      stone,
      target,
      inventory: this.inventory,
      hideModal: () => this.hide(),
      showFeedback: (msg, isErr) => this.showFeedback(msg, isErr),
      onInventoryChanged: this.onInventoryChanged,
    });
  }

  public useMedicineOnTarget(med: MedicineItemDef, target: PokemonInstance | undefined): boolean {
    return BagPartyTargetRenderer.useMedicineOnTarget({
      med,
      target,
      inventory: this.inventory,
      showFeedback: (msg, isErr) => this.showFeedback(msg, isErr),
      onInventoryChanged: this.onInventoryChanged,
      reRender: () => this.renderItemsTab(),
    });
  }

  public useRepelItem(repel: RepelItemDef): boolean {
    return BagPartyTargetRenderer.useRepelItem({
      repel,
      inventory: this.inventory,
      showFeedback: (msg, isErr) => this.showFeedback(msg, isErr),
      onUseRepel: this.onUseRepel,
      onInventoryChanged: this.onInventoryChanged,
      reRender: () => this.renderItemsTab(),
    });
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
    const ownedStones = EVOLUTION_STONE_CATALOG.filter((s) => this.getOwnedStoneCount(s) > 0);
    const hasBerries = Object.values(this.inventory.berries || {}).some((c) => (c ?? 0) > 0);
    if (
      ownedItems.length === 0 &&
      ownedRepels.length === 0 &&
      ownedStones.length === 0 &&
      !this.onUseItemfinder &&
      !hasBerries
    ) {
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

    for (const stone of ownedStones) {
      const count = this.getOwnedStoneCount(stone);
      const evoCandidate =
        targetPkmn && !targetPkmn.isEgg
          ? EvolutionManager.canEvolve(targetPkmn, {
              trigger: 'ITEM',
              itemId: stone.altId,
            })
          : null;

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      const compatHtml = evoCandidate
        ? `<span class="stone-compat-badge" data-compat="ABLE" style="font-family: 'Space Mono', monospace; font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">ABLE → ${evoCandidate.targetSpeciesName.toUpperCase()}</span>`
        : `<span class="stone-compat-badge" data-compat="UNABLE" style="font-family: 'Space Mono', monospace; font-size: 10px; background: #475569; color: #94A3B8; padding: 2px 6px; border-radius: 4px; font-weight: 800;">UNABLE</span>`;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${stone.icon} ${stone.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: ${stone.isLinkStone ? '#7C3AED' : '#D97706'}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${stone.badgeLabel}</span>
            ${compatHtml}
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #FFD028;">x${count}</span>
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; line-height: 1.4;">${stone.desc}</div>
        </div>
        <button class="use-stone-btn" style="
          background: ${evoCandidate ? '#059669' : '#334155'};
          color: white;
          border: 1.5px solid ${evoCandidate ? '#34D399' : '#64748B'};
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

      const useBtn = card.querySelector('.use-stone-btn') as HTMLButtonElement;
      useBtn.addEventListener('click', async () => {
        await this.useEvolutionStoneOnTarget(stone, targetPkmn);
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

  public setActiveTeachingTM(tm: TMDefinition | null): void {
    this.activeTeachingTM = tm;
    this.renderTMsTab();
  }

  private async renderTMsTab(): Promise<void> {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    await BagTMTabRenderer.renderTMsTab({
      container,
      party: this.party,
      selectedPartyIndex: this.selectedPartyIndex,
      inventory: this.inventory,
      activeTeachingTM: this.activeTeachingTM,
      setActiveTeachingTM: (tm) => {
        this.activeTeachingTM = tm;
      },
      renderPartyTargetSelector: (c, onSel) => this.renderPartyTargetSelector(c, onSel),
      reRender: () => this.renderTMsTab(),
      teachTM: (tm, pkmn) => this.teachTM(tm, pkmn),
    });
  }

  private renderBallsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    PokeMartRenderer.renderBallsTab(container, this.inventory);
  }

  private renderMartTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    PokeMartRenderer.renderMartTab({
      container,
      inventory: this.inventory,
      updateHeaderDisplay: () => this.updateHeaderDisplay(),
      showFeedback: (msg, isErr) => this.showFeedback(msg, isErr),
      onInventoryChanged: this.onInventoryChanged,
      reRender: () => this.renderMartTab(),
      martId: this.activeMartId,
    });
  }

  public async teachTM(tm: TMDefinition, target: PokemonInstance | undefined = this.party[0]): Promise<void> {
    return BagTMTabRenderer.teachTM({
      modalContainer: this.container,
      tm,
      target,
      showFeedback: (msg, isErr) => this.showFeedback(msg, isErr),
      reRender: () => this.renderTMsTab(),
      onInventoryChanged: this.onInventoryChanged,
    });
  }
}
