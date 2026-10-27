/**
 * @fileoverview Neo-Kanto stylesheet injection, badge color palettes, and summary inspector for party management.
 * @module ui/styles/partyStylesAndSummary
 * @layer ui
 * @sections L1-5: Micro-Header & Types | L6-133: Core Implementation | L134-266: Public Interface & Exports
 */

import type { PokemonInstance } from '../../types/game';
import { PokemonFactory } from '../../battle/PokemonFactory';
import { BattleAudio } from '../../audio/BattleAudio';

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
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

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAR: { bg: '#FFD028', text: '#0D1322' },
  SLP: { bg: '#8A9BA8', text: '#0D1322' },
  FRZ: { bg: '#98D8D8', text: '#0D1322' },
  BRN: { bg: '#EE4238', text: '#F6F8F3' },
  PSN: { bg: '#9B51E0', text: '#F6F8F3' },
  TOX: { bg: '#705898', text: '#F6F8F3' },
  FNT: { bg: '#DC2626', text: '#F6F8F3' },
};

export function ensureNeoKantoPartyStyles(): void {
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

export function renderPartyMemberSummaryHtml(
  pkmn: PokemonInstance,
  onBack: () => void,
  contentEl: HTMLElement,
  bannerEl: HTMLElement
): void {
  bannerEl.style.borderColor = '#2A75D3';
  bannerEl.style.color = '#38BDF8';
  bannerEl.innerText = `📋 POKéMON SUMMARY — ${pkmn.nickname.toUpperCase()} (Lv. ${pkmn.level})`;

  contentEl.innerHTML = '';

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
    onBack();
  });
  wrapper.appendChild(backBtn);

  contentEl.appendChild(wrapper);
}
