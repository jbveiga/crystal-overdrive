import type { PokemonInstance, MoveData } from '../../types/game';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';
import { OverworldItemManager } from '../../world/OverworldItemManager';
import { MoveReplacementModalUI } from '../MoveReplacementModalUI';
import {
  CARD_STYLE,
  INFINITE_TMS,
  type TMDefinition,
  type BagInventory,
} from './BagItemCatalogs';

export interface TMTabRenderContext {
  container: HTMLElement;
  party: PokemonInstance[];
  selectedPartyIndex: number;
  inventory: BagInventory;
  activeTeachingTM: TMDefinition | null;
  setActiveTeachingTM: (tm: TMDefinition | null) => void;
  renderPartyTargetSelector: (container: HTMLElement, onSelect: () => void) => void;
  reRender: () => void;
  teachTM: (tm: TMDefinition, pkmn: PokemonInstance) => Promise<void>;
}

export interface TeachTMContext {
  modalContainer: HTMLElement;
  tm: TMDefinition;
  target?: PokemonInstance;
  showFeedback: (msg: string, isError?: boolean) => void;
  reRender: () => void;
  onInventoryChanged?: () => void;
}

export class BagTMTabRenderer {
  public static async renderTMsTab(ctx: TMTabRenderContext): Promise<void> {
    const {
      container,
      party,
      selectedPartyIndex,
      inventory,
      activeTeachingTM,
      setActiveTeachingTM,
      renderPartyTargetSelector,
      reRender,
      teachTM,
    } = ctx;

    container.innerHTML = '';

    if (activeTeachingTM) {
      const tm = activeTeachingTM;
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
        setActiveTeachingTM(null);
        reRender();
      });

      container.appendChild(headerBox);

      const partyListContainer = document.createElement('div');
      partyListContainer.id = 'party-compatibility-list';
      partyListContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 4px;';
      container.appendChild(partyListContainer);

      for (let i = 0; i < party.length; i++) {
        const pkmn = party[i];
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
            await teachTM(tm, pkmn);
          });
        }

        partyListContainer.appendChild(card);
      }
      return;
    }

    renderPartyTargetSelector(container, () => reRender());

    const targetPkmn = party[selectedPartyIndex] || party[0];
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

    const tms = inventory.tms;
    if (tms.length === 0) {
      container.innerHTML += `<div style="text-align: center; color: #94a3b8; padding: 24px; font-family: 'Space Mono', monospace; font-size: 12px; background: #141E33; border: 1px dashed #22324F; border-radius: 10px; box-shadow: 0 3px 0 0 #070B14;">No TMs acquired yet.</div>`;
      return;
    }

    const seenCanonicalIds = new Set<string>();
    for (const tmId of tms) {
      const tm: TMDefinition = INFINITE_TMS[tmId] || {
        id: tmId,
        moveId: tmId.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: OverworldItemManager.formatItemName(tmId),
        type: 'Normal',
        desc: `Teaches ${OverworldItemManager.formatItemName(tmId)} to a compatible Pokémon.`,
      };
      if (seenCanonicalIds.has(tm.id)) continue;
      seenCanonicalIds.add(tm.id);

      const isFieldHM = tm.id.startsWith('HM');
      const fieldBadgeHtml = isFieldHM
        ? `<span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #D97706; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">FIELD READY (NO SLOT NEEDED)</span>`
        : '';

      const card = document.createElement('div');
      card.style.cssText = CARD_STYLE;

      card.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-family: 'Space Mono', monospace; font-weight: 800; color: #38BDF8; font-size: 13px;">${tm.id}</span>
            <span style="font-weight: 800; color: #F6F8F3; font-size: 14px;">${tm.name}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #22324F; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #CBD5E1;">${tm.type.toUpperCase()}</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">INFINITE USE</span>
            ${fieldBadgeHtml}
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
        setActiveTeachingTM(tm);
        reRender();
      });

      container.appendChild(card);
    }
  }

  public static async teachTM(ctx: TeachTMContext): Promise<void> {
    const { modalContainer, tm, target, showFeedback, reRender, onInventoryChanged } = ctx;
    if (!target) return;

    const alreadyKnows = target.moves.some((m) => m.moveId === tm.moveId);
    if (alreadyKnows) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback(`${target.nickname} already knows ${tm.name}!`, true);
      return;
    }

    const canLearn = await PokemonFactory.canLearnMove(target.speciesId, tm.moveId);
    if (!canLearn) {
      BattleAudio.playMenuSound('CANCEL');
      showFeedback(`${target.nickname} cannot learn ${tm.name}!`, true);
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
      showFeedback(`✨ ${target.nickname} learned ${tm.name}! (TM ${tm.id} remains intact)`);
      reRender();
      if (onInventoryChanged) {
        onInventoryChanged();
      }
    } else {
      const modal = new MoveReplacementModalUI(modalContainer);
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
        showFeedback(
          `✨ 1, 2, and... Poof! ${target.nickname} forgot ${replacedName} and learned ${tm.name}!`
        );
        reRender();
        if (onInventoryChanged) {
          onInventoryChanged();
        }
      } else {
        BattleAudio.playMenuSound('CANCEL');
        showFeedback(`${target.nickname} did not learn ${tm.name}.`);
      }
    }
  }
}
