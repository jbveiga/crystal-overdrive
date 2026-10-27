/**
 * @fileoverview PokeMartRenderer domain module implementation.
 * @module ui/bag/PokeMartRenderer
 * @role PokeMartRenderer Component
 * @exports MartRendererContext, PokeMartRenderer
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-135: Implementation | L136-270: Handlers & Exports
 */

import type { PokeballId } from '../../types/game';
import { BattleAudio } from '../../audio/BattleAudio';
import {
  CARD_STYLE,
  MART_MEDICINE_CATALOG,
  MART_REPEL_CATALOG,
  MART_POKEBALL_CATALOG,
  type BagInventory,
} from './BagItemCatalogs';

export interface MartRendererContext {
  container: HTMLElement;
  inventory: BagInventory;
  updateHeaderDisplay: () => void;
  showFeedback: (msg: string, isError?: boolean) => void;
  onInventoryChanged?: () => void;
  reRender: () => void;
}

export class PokeMartRenderer {
  public static renderBallsTab(container: HTMLElement, inventory: BagInventory): void {
    container.innerHTML = '';

    const ballEntries = Object.entries(inventory.balls).filter(([, count]) => (count ?? 0) > 0) as Array<
      [PokeballId, number]
    >;
    if (ballEntries.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px; font-family: 'Space Mono', monospace; font-size: 12px; background: #141E33; border: 1px dashed #22324F; border-radius: 10px; box-shadow: 0 3px 0 0 #070B14;">No Pokéballs in bag. Visit a Poké Mart to stock up!</div>`;
      return;
    }

    for (const [ballId, count] of ballEntries) {
      const catalogInfo = MART_POKEBALL_CATALOG.find((b) => b.id === ballId);
      const formattedName =
        catalogInfo?.name || ballId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

  public static renderMartTab(ctx: MartRendererContext): void {
    const { container, inventory, updateHeaderDisplay, showFeedback, onInventoryChanged, reRender } = ctx;
    container.innerHTML = '';

    const currentBadges = inventory.badges.length;

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

    if (!inventory.items) {
      inventory.items = {};
    }

    for (const med of MART_MEDICINE_CATALOG.filter((m) => !m.farmExclusive)) {
      const ownedCount = inventory.items[med.id] ?? 0;
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
        if (inventory.money < med.price) {
          BattleAudio.playMenuSound('CANCEL');
          showFeedback(`Not enough money to buy ${med.name}! ($${med.price} required)`, true);
          return;
        }
        BattleAudio.playMenuSound('CONFIRM');
        inventory.money -= med.price;
        inventory.items![med.id] = (inventory.items![med.id] ?? 0) + 1;
        updateHeaderDisplay();
        showFeedback(`Purchased 1x ${med.name}! (Now holding x${inventory.items![med.id]})`);
        reRender();
        if (onInventoryChanged) onInventoryChanged();
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
      const ownedCount = inventory.items[repel.id] ?? 0;
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
        if (inventory.money < repel.price) {
          BattleAudio.playMenuSound('CANCEL');
          showFeedback(`Not enough money to buy ${repel.name}! ($${repel.price} required)`, true);
          return;
        }
        BattleAudio.playMenuSound('CONFIRM');
        inventory.money -= repel.price;
        inventory.items![repel.id] = (inventory.items![repel.id] ?? 0) + 1;
        updateHeaderDisplay();
        showFeedback(`Purchased 1x ${repel.name}! (Now holding x${inventory.items![repel.id]})`);
        reRender();
        if (onInventoryChanged) onInventoryChanged();
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
      const ownedCount = inventory.balls[item.id] ?? 0;

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
        if (inventory.money < item.price) {
          BattleAudio.playMenuSound('CANCEL');
          showFeedback(`Not enough money to buy ${item.name}! ($${item.price} required)`, true);
          return;
        }
        BattleAudio.playMenuSound('CONFIRM');
        inventory.money -= item.price;
        inventory.balls[item.id] = (inventory.balls[item.id] ?? 0) + 1;
        updateHeaderDisplay();
        showFeedback(`Purchased 1x ${item.name}! (Now holding x${inventory.balls[item.id]})`);
        reRender();
        if (onInventoryChanged) onInventoryChanged();
      });

      container.appendChild(card);
    }
  }
}
