/**
 * @fileoverview BattleBagAndPartySubModal domain module implementation.
 * @module ui/battle/BattleBagAndPartySubModal
 * @role BattleBagAndPartySubModal Component
 * @exports BattleHUDCallbacks, BagAndPartyUIContext, BattleBagAndPartySubModal
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-234: Implementation | L235-469: Handlers & Exports
 */

import type { PokemonInstance, PokeballId } from '../../types/game';
import { EffectivenessHelper } from '../../battle/EffectivenessHelper';
import {
  BATTLE_ITEM_CATALOG,
  type BattleBagTab,
} from './BattleItemCatalogAndStyles';

export interface BattleHUDCallbacks {
  onMoveSelected: (moveId: string) => void;
  onDoubleMovesSelected?: (
    slot1MoveId: string,
    slot2MoveId?: string,
    slot1Target?: 0 | 1,
    slot2Target?: 0 | 1
  ) => void;
  onBagSelected: (ballId: PokeballId) => void;
  onItemUsed?: (itemId: string, targetPokemon: PokemonInstance) => void;
  onPokemonSelected?: (pokemon: PokemonInstance) => void;
  onRunSelected: () => void;
  onSpeedToggle: () => any;
}

export interface BagAndPartyUIContext {
  messageBox: HTMLElement;
  actionMenu: HTMLElement;
  fightMenu: HTMLElement;
  bagMenu: HTMLElement;
  partyMenu: HTMLElement;
  playerParty: PokemonInstance[];
  playerPokemon: PokemonInstance;
  activeBagTab: BattleBagTab;
  setActiveBagTab: (tab: BattleBagTab) => void;
  selectedBagTargetIndex: number;
  setSelectedBagTargetIndex: (idx: number) => void;
  itemsInventory: Record<string, number>;
  berriesInventory: Record<string, number>;
  ballsInventory: Partial<Record<PokeballId, number>>;
  callbacks?: BattleHUDCallbacks;
  showMessage: (text: string) => Promise<void>;
  showActionMenu: () => void;
  isForcedPartySwitch: boolean;
  setIsForcedPartySwitch: (val: boolean) => void;
}

export class BattleBagAndPartySubModal {
  public static getOwnedMedicineCount(
    itemsInventory: Record<string, number>,
    berriesInventory: Record<string, number>,
    itemId: string
  ): number {
    const underscoreId = itemId.replace(/-/g, '_');
    return (
      (itemsInventory[itemId] ?? 0) +
      (underscoreId !== itemId ? (itemsInventory[underscoreId] ?? 0) : 0) +
      (berriesInventory[itemId] ?? 0) +
      (underscoreId !== itemId ? (berriesInventory[underscoreId] ?? 0) : 0)
    );
  }

  public static showPartyMenu(
    ctx: BagAndPartyUIContext,
    options?: { forcedSwitch?: boolean; onSelected?: (pokemon: PokemonInstance) => void }
  ): void {
    ctx.setIsForcedPartySwitch(Boolean(options?.forcedSwitch));
    ctx.messageBox.style.display = 'none';
    ctx.actionMenu.style.display = 'none';
    ctx.fightMenu.style.display = 'none';
    ctx.bagMenu.style.display = 'none';
    ctx.partyMenu.style.display = 'grid';
    ctx.partyMenu.innerHTML = '';

    for (const pkmn of ctx.playerParty) {
      const isActive = pkmn.uid === ctx.playerPokemon.uid;
      const isFainted = pkmn.currentHp <= 0;
      const isEgg = Boolean(pkmn.isEgg);
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';

      const btn = document.createElement('button');
      btn.style.cssText = `
        background: ${isActive ? '#0D1322' : '#141E33'};
        color: ${isFainted || isEgg ? '#64748b' : 'white'};
        border: 1.5px solid ${isActive ? '#38BDF8' : '#22324F'};
        border-radius: 8px;
        padding: 8px 12px;
        cursor: ${isActive || isFainted || isEgg ? 'default' : 'pointer'};
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        box-shadow: 0 3px 0 0 #070B14;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-weight: 700; font-size: 14px;">${isEgg ? '🥚 EGG' : pkmn.nickname} ${isActive ? '(OUT)' : ''}</span>
          <span style="font-size: 11px; color: #facc15; font-weight: 700;">${isEgg ? 'EGG' : `Lv.${pkmn.level}`}</span>
        </div>
        <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 6px;">
          <div style="width: ${isEgg ? 100 : pct}%; height: 100%; background: ${isEgg ? '#facc15' : hpColor};"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
          <span>${isEgg ? `Steps: ${pkmn.eggSteps ?? 0}` : `HP ${pkmn.currentHp}/${pkmn.stats.hp}`}</span>
          <span>${pkmn.status !== 'NONE' ? pkmn.status : ''}</span>
        </div>
      `;

      btn.addEventListener('click', async () => {
        if (isEgg) {
          await ctx.showMessage("An EGG can't battle!");
          ctx.partyMenu.style.display = 'grid';
          ctx.messageBox.style.display = 'none';
          return;
        }
        if (isActive) {
          await ctx.showMessage(`${pkmn.nickname} is already in battle!`);
          ctx.partyMenu.style.display = 'grid';
          ctx.messageBox.style.display = 'none';
          return;
        }
        if (isFainted) {
          await ctx.showMessage(`${pkmn.nickname} has no energy left to battle!`);
          ctx.partyMenu.style.display = 'grid';
          ctx.messageBox.style.display = 'none';
          return;
        }
        ctx.setIsForcedPartySwitch(false);
        ctx.partyMenu.style.display = 'none';
        ctx.messageBox.style.display = 'flex';
        if (options?.onSelected) {
          options.onSelected(pkmn);
        } else if (ctx.callbacks?.onPokemonSelected) {
          ctx.callbacks.onPokemonSelected(pkmn);
        }
      });

      ctx.partyMenu.appendChild(btn);
    }

    if (!ctx.isForcedPartySwitch) {
      const backBtn = document.createElement('button');
      backBtn.style.cssText = `
        background: #141E33;
        color: white;
        border: 1.5px solid #22324F;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        padding: 8px;
        cursor: pointer;
        grid-column: span 2;
        box-shadow: 0 3px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
      backBtn.addEventListener('click', () => ctx.showActionMenu());
      ctx.partyMenu.appendChild(backBtn);
    }
  }

  public static showBagMenu(ctx: BagAndPartyUIContext, tab?: BattleBagTab): void {
    if (tab) {
      ctx.setActiveBagTab(tab);
    }
    ctx.messageBox.style.display = 'none';
    ctx.actionMenu.style.display = 'none';
    ctx.fightMenu.style.display = 'none';
    ctx.partyMenu.style.display = 'none';
    ctx.bagMenu.style.display = 'grid';
    ctx.bagMenu.innerHTML = '';

    // 1. Category Filter Tabs & Party Target Selector (spans 2 columns)
    const headerBar = document.createElement('div');
    headerBar.style.cssText = `
      grid-column: span 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(13, 19, 34, 0.95);
      border: 1.5px solid #22324F;
      border-radius: 8px;
      padding: 6px 10px;
      box-shadow: 0 3px 0 0 #070B14;
    `;

    const tabRow = document.createElement('div');
    tabRow.style.cssText =
      'display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;';

    const tabsLeft = document.createElement('div');
    tabsLeft.style.cssText = 'display: flex; gap: 6px;';
    const tabDefs: Array<{ id: BattleBagTab; label: string }> = [
      { id: 'ALL', label: '🎒 ALL' },
      { id: 'MEDICINE', label: '🧪 MEDICINE & ITEMS' },
      { id: 'BALLS', label: '🔴 POKé BALLS' },
    ];
    for (const t of tabDefs) {
      const isAct = ctx.activeBagTab === t.id;
      const tBtn = document.createElement('button');
      tBtn.type = 'button';
      tBtn.className = `battle-bag-tab-${t.id.toLowerCase()}`;
      tBtn.style.cssText = `
        background: ${isAct ? '#0284c7' : '#141E33'};
        color: ${isAct ? '#ffffff' : '#94a3b8'};
        border: 1.5px solid ${isAct ? '#38bdf8' : '#22324F'};
        border-radius: 6px;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      tBtn.innerText = t.label;
      tBtn.addEventListener('click', () => this.showBagMenu(ctx, t.id));
      tabsLeft.appendChild(tBtn);
    }
    tabRow.appendChild(tabsLeft);

    // Compact Party Target Selector for Medicine
    if (ctx.activeBagTab !== 'BALLS' && ctx.playerParty.length > 0) {
      const targetWrap = document.createElement('div');
      targetWrap.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-wrap: wrap;';
      const lbl = document.createElement('span');
      lbl.style.cssText =
        "font-size: 10px; font-weight: 800; color: #94a3b8; margin-right: 2px; font-family: 'Space Mono', monospace;";
      lbl.innerText = 'TARGET:';
      targetWrap.appendChild(lbl);

      ctx.playerParty.forEach((pkmn, idx) => {
        if (pkmn.isEgg) return;
        const isSel = idx === ctx.selectedBagTargetIndex;
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'battle-bag-target-btn';
        pBtn.style.cssText = `
          background: ${isSel ? '#065f46' : '#141E33'};
          color: ${isSel ? '#a7f3d0' : '#cbd5e1'};
          border: 1px solid ${isSel ? '#10b981' : '#22324F'};
          border-radius: 5px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
        `;
        const statusSuffix = pkmn.status !== 'NONE' ? ` [${pkmn.status}]` : '';
        pBtn.innerText = `${pkmn.nickname} (${pkmn.currentHp}/${pkmn.stats.hp})${statusSuffix}`;
        pBtn.addEventListener('click', () => {
          ctx.setSelectedBagTargetIndex(idx);
          this.showBagMenu(ctx);
        });
        targetWrap.appendChild(pBtn);
      });
      tabRow.appendChild(targetWrap);
    }

    headerBar.appendChild(tabRow);
    ctx.bagMenu.appendChild(headerBar);

    const targetPkmn = ctx.playerParty[ctx.selectedBagTargetIndex] || ctx.playerPokemon;
    let renderedCount = 0;

    // 2. Render Medicine, Heals, Revives & Battle Items
    if (ctx.activeBagTab === 'ALL' || ctx.activeBagTab === 'MEDICINE') {
      for (const item of BATTLE_ITEM_CATALOG) {
        const count = this.getOwnedMedicineCount(ctx.itemsInventory, ctx.berriesInventory, item.id);
        if (count <= 0) continue;
        renderedCount++;

        const btn = document.createElement('button');
        btn.className = 'battle-bag-item-btn';
        btn.setAttribute('data-item-id', item.id);
        btn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.1s ease;
        `;

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: ${item.color};">
              <span>${item.icon}</span>
              <span>${item.name}</span>
              <span style="font-size: 9px; background: rgba(15, 23, 42, 0.85); color: #a7f3d0; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.4); font-family: 'Space Mono', monospace;">${item.badge}</span>
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #facc15; font-family: 'Space Mono', monospace;">x${count}</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            ${item.desc}
          </div>
        `;

        btn.addEventListener('click', async () => {
          const useTarget = item.kind === 'X_STAT' ? ctx.playerPokemon : targetPkmn;
          if (!useTarget) return;

          if (item.kind === 'HEAL_HP') {
            if (useTarget.currentHp <= 0) {
              await ctx.showMessage(`${useTarget.nickname} has fainted! Use a Revive first.`);
              this.showBagMenu(ctx);
              return;
            }
            if (useTarget.currentHp >= useTarget.stats.hp) {
              await ctx.showMessage(`It won't have any effect! ${useTarget.nickname} is already at full HP.`);
              this.showBagMenu(ctx);
              return;
            }
          } else if (item.kind === 'FULL_RESTORE') {
            if (useTarget.currentHp <= 0) {
              await ctx.showMessage(`${useTarget.nickname} has fainted!`);
              this.showBagMenu(ctx);
              return;
            }
            if (useTarget.currentHp >= useTarget.stats.hp && useTarget.status === 'NONE') {
              await ctx.showMessage(`It won't have any effect on ${useTarget.nickname}!`);
              this.showBagMenu(ctx);
              return;
            }
          } else if (item.kind === 'REVIVE') {
            if (useTarget.currentHp > 0) {
              await ctx.showMessage(`${useTarget.nickname} hasn't fainted!`);
              this.showBagMenu(ctx);
              return;
            }
          } else if (item.kind === 'CURE_STATUS') {
            if (useTarget.currentHp <= 0 || !item.curesStatus?.includes(useTarget.status)) {
              await ctx.showMessage(`It won't have any effect on ${useTarget.nickname}!`);
              this.showBagMenu(ctx);
              return;
            }
          }

          ctx.bagMenu.style.display = 'none';
          ctx.messageBox.style.display = 'flex';
          if (ctx.callbacks?.onItemUsed) {
            ctx.callbacks.onItemUsed(item.id, useTarget);
          }
        });

        ctx.bagMenu.appendChild(btn);
      }
    }

    // 3. Render Pokéballs
    if (ctx.activeBagTab === 'ALL' || ctx.activeBagTab === 'BALLS') {
      const allBallMeta: Array<{ id: PokeballId; name: string; desc: string; color: string }> = [
        { id: 'quick-ball', name: 'Quick Ball', desc: '5.0x catch rate on Turn 1', color: '#0284c7' },
        { id: 'fast-ball', name: 'Fast Ball', desc: '4.0x if Base Speed ≥ 100', color: '#ea580c' },
        { id: 'net-ball', name: 'Net Ball', desc: '3.5x if Water or Bug', color: '#059669' },
        { id: 'dusk-ball', name: 'Dusk Ball', desc: '3.0x at Night or Caves', color: '#7c3aed' },
        { id: 'timer-ball', name: 'Timer Ball', desc: 'Scales up to 4.0x with turns', color: '#dc2626' },
        { id: 'repeat-ball', name: 'Repeat Ball', desc: '3.5x if species registered', color: '#f59e0b' },
        { id: 'nest-ball', name: 'Nest Ball', desc: 'Up to 4.0x on lower levels', color: '#10b981' },
        { id: 'dream-ball', name: 'Dream Ball', desc: '4.0x if target is Asleep (SLP)', color: '#ec4899' },
        { id: 'ultra-ball', name: 'Ultra Ball', desc: '2.0x high catch rate', color: '#ca8a04' },
        { id: 'great-ball', name: 'Great Ball', desc: '1.5x moderate catch rate', color: '#2563eb' },
        { id: 'poke-ball', name: 'Poké Ball', desc: '1.0x standard catch rate', color: '#ef4444' },
        { id: 'master-ball', name: 'Master Ball', desc: '100% Guaranteed capture', color: '#9333ea' },
      ];

      for (const ball of allBallMeta) {
        const count = ctx.ballsInventory[ball.id] ?? 0;
        if (count <= 0) continue;
        renderedCount++;

        const palette = EffectivenessHelper.getPokeballPalette(ball.id);
        const btn = document.createElement('button');
        btn.className = 'battle-bag-ball-btn';
        btn.setAttribute('data-ball-id', ball.id);
        btn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.1s ease;
        `;

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; color: ${ball.color};">
              <img src="${palette.spritePath}" alt="${ball.name}" onerror="this.style.display='none'" style="width: 18px; height: 18px; image-rendering: pixelated;" />
              <span>${ball.name}</span>
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #38bdf8; font-family: 'Space Mono', monospace;">x${count}</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            ${ball.desc}
          </div>
        `;

        btn.addEventListener('click', () => {
          ctx.bagMenu.style.display = 'none';
          ctx.messageBox.style.display = 'flex';
          if (ctx.callbacks?.onBagSelected) {
            ctx.callbacks.onBagSelected(ball.id);
          }
        });

        ctx.bagMenu.appendChild(btn);
      }
    }

    if (renderedCount === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.style.cssText = `
        grid-column: span 2;
        text-align: center;
        color: #94a3b8;
        padding: 12px;
        font-size: 12px;
        background: #0D1322;
        border: 1.5px dashed #22324F;
        border-radius: 8px;
        box-shadow: 0 2px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      emptyBox.innerText = 'No usable items in this category.';
      ctx.bagMenu.appendChild(emptyBox);
    }

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #141E33;
      color: white;
      border: 1.5px solid #22324F;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      padding: 8px;
      cursor: pointer;
      grid-column: span 2;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Space Mono', monospace;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => ctx.showActionMenu());
    ctx.bagMenu.appendChild(backBtn);
  }
}
