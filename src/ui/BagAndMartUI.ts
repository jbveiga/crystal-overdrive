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

export const INFINITE_TMS: Record<string, TMDefinition> = {
  TM54: {
    id: 'TM54',
    moveId: 'falseswipe',
    name: 'False Swipe',
    type: 'Normal',
    desc: 'An attack that never reduces the target HP below 1.',
  },
  TM73: {
    id: 'TM73',
    moveId: 'thunderwave',
    name: 'Thunder Wave',
    type: 'Electric',
    desc: 'A weak jolt that paralyzes the target to slow it down.',
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
  private inventory: BagInventory;
  private party: PokemonInstance[];
  private onInventoryChanged?: () => void;

  constructor(
    containerId: string = 'ui-overlay',
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
      width: 480px;
      max-width: 92vw;
      max-height: 85vh;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
      display: none;
      flex-direction: column;
      gap: 16px;
      z-index: 50;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f8fafc;
    `;

    modal.innerHTML = `
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.12); padding-bottom: 12px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <h2 style="font-size: 18px; font-weight: 800; color: #38bdf8;">🎒 BAG & INFINITE TMS</h2>
          <span id="bag-money" style="font-size: 13px; font-weight: 700; color: #fbbf24;">$3,000</span>
        </div>
        <button id="close-bag-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 8px;">
        <button id="tab-tms" style="
          flex: 1;
          padding: 8px;
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
          padding: 8px;
          border: none;
          border-radius: 6px;
          background: #334155;
          color: #94a3b8;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        ">🔴 POKÉBALLS</button>
      </div>

      <!-- Content Container -->
      <div id="bag-content" style="
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 50vh;
        overflow-y: auto;
        padding-right: 4px;
      "></div>
    `;

    this.container.appendChild(modal);
    this.bagModal = modal;

    modal.querySelector('#close-bag-modal-btn')!.addEventListener('click', () => {
      this.hide();
    });

    const tabTms = modal.querySelector('#tab-tms') as HTMLButtonElement;
    const tabBalls = modal.querySelector('#tab-balls') as HTMLButtonElement;

    tabTms.addEventListener('click', () => {
      tabTms.style.background = '#2563eb';
      tabTms.style.color = '#ffffff';
      tabBalls.style.background = '#334155';
      tabBalls.style.color = '#94a3b8';
      this.renderTMsTab();
    });

    tabBalls.addEventListener('click', () => {
      tabBalls.style.background = '#2563eb';
      tabBalls.style.color = '#ffffff';
      tabTms.style.background = '#334155';
      tabTms.style.color = '#94a3b8';
      this.renderBallsTab();
    });
  }

  public open(): void {
    this.bagModal.style.display = 'flex';
    this.updateMoneyDisplay();
    this.renderTMsTab();
  }

  public hide(): void {
    this.bagModal.style.display = 'none';
  }

  private updateMoneyDisplay(): void {
    const el = this.bagModal.querySelector('#bag-money') as HTMLElement;
    if (el) el.innerText = `$${this.inventory.money.toLocaleString()}`;
  }

  private renderTMsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const tms = this.inventory.tms;
    if (tms.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No TMs acquired yet.</div>`;
      return;
    }

    for (const tmId of tms) {
      const tm = INFINITE_TMS[tmId];
      if (!tm) continue;

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
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-weight: 800; color: #38bdf8;">${tm.id}</span>
            <span style="font-weight: 700; color: #ffffff;">${tm.name}</span>
            <span style="font-size: 10px; background: #475569; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${tm.type.toUpperCase()}</span>
            <span style="font-size: 10px; background: #059669; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 800;">INFINITE</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${tm.desc}</div>
        </div>
        <button style="
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        ">TEACH</button>
      `;

      const teachBtn = card.querySelector('button') as HTMLButtonElement;
      teachBtn.addEventListener('click', () => {
        this.teachTM(tm);
      });

      container.appendChild(card);
    }
  }

  private renderBallsTab(): void {
    const container = this.bagModal.querySelector('#bag-content') as HTMLDivElement;
    container.innerHTML = '';

    const ballEntries = Object.entries(this.inventory.balls) as Array<[PokeballId, number]>;
    if (ballEntries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No Pokéballs in bag.</div>`;
      return;
    }

    for (const [ballId, count] of ballEntries) {
      if (count <= 0) continue;

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

      const formattedName = ballId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      card.innerHTML = `
        <div>
          <span style="font-weight: 700; color: #ffffff;">🔴 ${formattedName}</span>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Modern catching utility ball</div>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #38bdf8;">x${count}</div>
      `;

      container.appendChild(card);
    }
  }

  /**
   * Teaches an Infinite TM to the active starter/lead Pokémon
   */
  private teachTM(tm: TMDefinition): void {
    const lead = this.party[0];
    if (!lead) return;

    // Check if already knows move
    const alreadyKnows = lead.moves.some((m) => m.moveId === tm.moveId);
    if (alreadyKnows) {
      alert(`${lead.nickname} already knows ${tm.name}!`);
      return;
    }

    const moveData = PokemonFactory.getMoveData(tm.moveId);

    // If has less than 4 moves, learn immediately
    if (lead.moves.length < 4) {
      lead.moves.push({
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      });
      alert(`✨ ${lead.nickname} learned ${tm.name}!`);
    } else {
      // Replace 4th move
      const replacedMove = lead.moves[3];
      lead.moves[3] = {
        moveId: moveData.id,
        currentPp: moveData.pp,
        maxPp: moveData.pp,
      };
      alert(`✨ 1, 2, and... Poof! ${lead.nickname} forgot ${replacedMove.moveId.toUpperCase()} and learned ${tm.name}!`);
    }

    if (this.onInventoryChanged) {
      this.onInventoryChanged();
    }
  }
}
